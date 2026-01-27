const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const socketHandler = (io) => {
    // Track online drivers
    const onlineDrivers = new Map(); // socketId -> userId
    const driverSockets = new Map(); // userId -> socketId

    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    name: true,
                    role: true
                }
            });

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.user.name} (${socket.user.role})`);

        // Join user's personal room
        socket.join(`user-${socket.user.id}`);

        // ****** DRIVER EVENTS ******

        // Driver goes online
        socket.on('driver-online', async () => {
            if (socket.user.role !== 'DRIVER') return;

            try {
                // Update database
                await prisma.user.update({
                    where: { id: socket.user.id },
                    data: { isOnline: true }
                });

                // Track in memory
                onlineDrivers.set(socket.id, socket.user.id);
                driverSockets.set(socket.user.id, socket.id);

                // Join online drivers room
                socket.join('online-drivers');
                socket.join(`driver-${socket.user.id}`);

                console.log(`🟢 Driver online: ${socket.user.name}`);

                socket.emit('status-update', {
                    isOnline: true,
                    message: 'You are now online and can receive ride requests'
                });
            } catch (error) {
                console.error('Driver online error:', error);
            }
        });

        // Driver goes offline
        socket.on('driver-offline', async () => {
            if (socket.user.role !== 'DRIVER') return;

            try {
                await prisma.user.update({
                    where: { id: socket.user.id },
                    data: { isOnline: false }
                });

                onlineDrivers.delete(socket.id);
                driverSockets.delete(socket.user.id);
                socket.leave('online-drivers');

                console.log(`🔴 Driver offline: ${socket.user.name}`);

                socket.emit('status-update', {
                    isOnline: false,
                    message: 'You are now offline'
                });
            } catch (error) {
                console.error('Driver offline error:', error);
            }
        });

        // ****** RIDE ROOM EVENTS ******

        // Join a specific ride room (for real-time updates)
        socket.on('join-ride-room', (rideId) => {
            socket.join(`ride-${rideId}`);
            console.log(`📍 ${socket.user.name} joined ride room: ${rideId}`);
        });

        // Leave a ride room
        socket.on('leave-ride-room', (rideId) => {
            socket.leave(`ride-${rideId}`);
            console.log(`📍 ${socket.user.name} left ride room: ${rideId}`);
        });

        // ****** BIDDING EVENTS (Real-time from client) ******

        // Driver submits bid via socket (alternative to REST)
        socket.on('submit-bid', async ({ rideId, offeredFare }) => {
            if (socket.user.role !== 'DRIVER') return;

            try {
                const existingBid = await prisma.rideBid.findUnique({
                    where: {
                        rideRequestId_driverId: {
                            rideRequestId: rideId,
                            driverId: socket.user.id
                        }
                    }
                });

                let bid;
                if (existingBid) {
                    bid = await prisma.rideBid.update({
                        where: { id: existingBid.id },
                        data: { offeredFare: parseFloat(offeredFare), status: 'PENDING' },
                        include: {
                            driver: {
                                select: {
                                    id: true,
                                    name: true,
                                    vehicleModel: true,
                                    vehicleColor: true,
                                    vehiclePlateNumber: true
                                }
                            }
                        }
                    });
                } else {
                    bid = await prisma.rideBid.create({
                        data: {
                            rideRequestId: rideId,
                            driverId: socket.user.id,
                            offeredFare: parseFloat(offeredFare),
                            status: 'PENDING'
                        },
                        include: {
                            driver: {
                                select: {
                                    id: true,
                                    name: true,
                                    vehicleModel: true,
                                    vehicleColor: true,
                                    vehiclePlateNumber: true
                                }
                            }
                        }
                    });
                }

                // Update ride status
                await prisma.rideRequest.update({
                    where: { id: rideId },
                    data: { status: 'NEGOTIATING' }
                });

                // Notify rider
                io.to(`ride-${rideId}`).emit('receive-bid', { rideId, bid });

                // Confirm to driver
                socket.emit('bid-submitted', { success: true, bid });

            } catch (error) {
                console.error('Submit bid socket error:', error);
                socket.emit('bid-error', { message: 'Failed to submit bid' });
            }
        });

        // ****** LIVE TRACKING EVENTS ******

        // Driver sends location update
        socket.on('location-update', async ({ rideId, lat, lng }) => {
            if (socket.user.role !== 'DRIVER') return;

            try {
                // Update database
                await prisma.rideRequest.update({
                    where: { id: rideId },
                    data: {
                        vehicleLat: parseFloat(lat),
                        vehicleLng: parseFloat(lng)
                    }
                });

                // Broadcast to ride room (rider will receive this)
                io.to(`ride-${rideId}`).emit('location-broadcast', {
                    rideId,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Location update error:', error);
            }
        });

        // ****** DISCONNECT ******

        socket.on('disconnect', async () => {
            console.log(`🔌 User disconnected: ${socket.user.name}`);

            // If driver, mark as offline
            if (socket.user.role === 'DRIVER' && onlineDrivers.has(socket.id)) {
                try {
                    await prisma.user.update({
                        where: { id: socket.user.id },
                        data: { isOnline: false }
                    });
                    onlineDrivers.delete(socket.id);
                    driverSockets.delete(socket.user.id);
                } catch (error) {
                    console.error('Disconnect cleanup error:', error);
                }
            }
        });
    });

    // Helper to broadcast to a specific driver
    io.sendToDriver = (driverId, event, data) => {
        io.to(`driver-${driverId}`).emit(event, data);
    };

    // Helper to broadcast to all online drivers
    io.broadcastToDrivers = (event, data) => {
        io.to('online-drivers').emit(event, data);
    };

    return io;
};

module.exports = { socketHandler };
