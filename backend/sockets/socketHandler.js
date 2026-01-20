const Ride = require('../models/Ride');

/**
 * Socket.io event handler
 * @param {object} io - Socket.io server instance
 */
const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join a ride room for real-time updates
        socket.on('join-ride-room', (rideId) => {
            socket.join(`ride-${rideId}`);
            console.log(`User ${socket.id} joined room: ride-${rideId}`);
        });

        // Leave a ride room
        socket.on('leave-ride-room', (rideId) => {
            socket.leave(`ride-${rideId}`);
            console.log(`User ${socket.id} left room: ride-${rideId}`);
        });

        // Driver sends location update
        socket.on('location-update', async (data) => {
            const { rideId, lat, lng } = data;

            try {
                // Update ride location in database
                await Ride.findByIdAndUpdate(rideId, {
                    vehicleLocation: { lat, lng }
                });

                // Broadcast location to all users in the ride room
                io.to(`ride-${rideId}`).emit('location-broadcast', {
                    rideId,
                    lat,
                    lng,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('Location update error:', error);
            }
        });

        // Broadcast ride update to room
        socket.on('ride-update', async (rideId) => {
            try {
                const ride = await Ride.findById(rideId)
                    .populate('creator', 'name email phone')
                    .populate('passengers', 'name email phone');

                if (ride) {
                    io.to(`ride-${rideId}`).emit('ride-updated', ride);
                }
            } catch (error) {
                console.error('Ride update broadcast error:', error);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};

/**
 * Emit ride update to specific room
 * @param {object} io - Socket.io server instance
 * @param {string} rideId - Ride ID
 * @param {object} ride - Updated ride data
 */
const emitRideUpdate = (io, rideId, ride) => {
    io.to(`ride-${rideId}`).emit('ride-updated', ride);
};

module.exports = {
    socketHandler,
    emitRideUpdate
};
