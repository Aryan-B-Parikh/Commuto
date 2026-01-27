const prisma = require('../utils/prisma');
const { generateOTP } = require('../utils/otpGenerator');

// @desc    Create a new ride request
// @route   POST /api/rides/request
// @access  Private (Riders only)
exports.createRideRequest = async (req, res) => {
    try {
        const {
            originAddress,
            originLat,
            originLng,
            destAddress,
            destLat,
            destLng,
            specificDriverId
        } = req.body;

        // Validate required fields
        if (!originAddress || !originLat || !originLng || !destAddress || !destLat || !destLng) {
            return res.status(400).json({
                success: false,
                message: 'Please provide origin and destination details'
            });
        }

        // If specific driver, verify they exist and are online
        if (specificDriverId) {
            const driver = await prisma.user.findUnique({
                where: { id: specificDriverId }
            });

            if (!driver || driver.role !== 'DRIVER') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid driver specified'
                });
            }
        }

        // Create ride request
        const rideRequest = await prisma.rideRequest.create({
            data: {
                riderId: req.user.id,
                specificDriverId: specificDriverId || null,
                originAddress,
                originLat: parseFloat(originLat),
                originLng: parseFloat(originLng),
                destAddress,
                destLat: parseFloat(destLat),
                destLng: parseFloat(destLng),
                status: 'PENDING'
            },
            include: {
                rider: {
                    select: {
                        id: true,
                        name: true,
                        contactNumber: true
                    }
                },
                specificDriver: {
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

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            if (specificDriverId) {
                // Direct booking - send only to specific driver
                io.to(`driver-${specificDriverId}`).emit('direct-ride-request', rideRequest);
            } else {
                // Open market - broadcast to all online drivers
                io.to('online-drivers').emit('new-ride-request', rideRequest);
            }
        }

        res.status(201).json({
            success: true,
            message: specificDriverId ? 'Direct ride request sent to driver' : 'Ride request created and broadcast to drivers',
            data: rideRequest
        });
    } catch (error) {
        console.error('Create Ride Request Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating ride request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get available ride requests for drivers
// @route   GET /api/rides/available
// @access  Private (Drivers only)
exports.getAvailableRides = async (req, res) => {
    try {
        const rides = await prisma.rideRequest.findMany({
            where: {
                status: { in: ['PENDING', 'NEGOTIATING'] },
                OR: [
                    { specificDriverId: null }, // Open market rides
                    { specificDriverId: req.user.id } // Direct requests for this driver
                ]
            },
            include: {
                rider: {
                    select: {
                        id: true,
                        name: true,
                        contactNumber: true
                    }
                },
                bids: {
                    where: { driverId: req.user.id },
                    select: {
                        id: true,
                        offeredFare: true,
                        status: true,
                        counterFare: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            count: rides.length,
            data: rides
        });
    } catch (error) {
        console.error('Get Available Rides Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available rides'
        });
    }
};

// @desc    Get ride by ID
// @route   GET /api/rides/:id
// @access  Private
exports.getRideById = async (req, res) => {
    try {
        const ride = await prisma.rideRequest.findUnique({
            where: { id: req.params.id },
            include: {
                rider: {
                    select: {
                        id: true,
                        name: true,
                        contactNumber: true
                    }
                },
                specificDriver: {
                    select: {
                        id: true,
                        name: true,
                        vehicleModel: true,
                        vehicleColor: true,
                        vehiclePlateNumber: true,
                        contactNumber: true
                    }
                },
                bids: {
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
                    },
                    orderBy: { createdAt: 'desc' }
                },
                bill: true
            }
        });

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        // Check access - rider, assigned driver, or driver with a bid
        const isRider = ride.riderId === req.user.id;
        const isAssignedDriver = ride.assignedDriverId === req.user.id;
        const isSpecificDriver = ride.specificDriverId === req.user.id;
        const hasBid = ride.bids.some(bid => bid.driverId === req.user.id);

        if (!isRider && !isAssignedDriver && !isSpecificDriver && !hasBid && req.user.role === 'DRIVER') {
            // Allow drivers to view open pending rides
            if (ride.status !== 'PENDING' && ride.status !== 'NEGOTIATING') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        res.json({
            success: true,
            data: ride
        });
    } catch (error) {
        console.error('Get Ride By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching ride'
        });
    }
};

// @desc    Submit a bid on a ride
// @route   POST /api/rides/:id/bid
// @access  Private (Drivers only)
exports.submitBid = async (req, res) => {
    try {
        const { offeredFare } = req.body;
        const rideId = req.params.id;

        if (!offeredFare || offeredFare <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid fare amount'
            });
        }

        // Get the ride
        const ride = await prisma.rideRequest.findUnique({
            where: { id: rideId }
        });

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        if (ride.status !== 'PENDING' && ride.status !== 'NEGOTIATING') {
            return res.status(400).json({
                success: false,
                message: 'Cannot bid on this ride'
            });
        }

        // Check if driver already has a bid
        const existingBid = await prisma.rideBid.findUnique({
            where: {
                rideRequestId_driverId: {
                    rideRequestId: rideId,
                    driverId: req.user.id
                }
            }
        });

        let bid;
        if (existingBid) {
            // Update existing bid
            bid = await prisma.rideBid.update({
                where: { id: existingBid.id },
                data: {
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
        } else {
            // Create new bid
            bid = await prisma.rideBid.create({
                data: {
                    rideRequestId: rideId,
                    driverId: req.user.id,
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

        // Update ride status to NEGOTIATING
        await prisma.rideRequest.update({
            where: { id: rideId },
            data: { status: 'NEGOTIATING' }
        });

        // Emit socket event to rider
        const io = req.app.get('io');
        if (io) {
            io.to(`ride-${rideId}`).emit('receive-bid', {
                rideId,
                bid
            });
        }

        res.status(201).json({
            success: true,
            message: 'Bid submitted successfully',
            data: bid
        });
    } catch (error) {
        console.error('Submit Bid Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting bid',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Counter-offer on a bid
// @route   POST /api/rides/:id/counter
// @access  Private (Riders only)
exports.counterBid = async (req, res) => {
    try {
        const { bidId, counterFare } = req.body;
        const rideId = req.params.id;

        if (!bidId || !counterFare || counterFare <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide bid ID and counter fare'
            });
        }

        // Verify ride ownership
        const ride = await prisma.rideRequest.findUnique({
            where: { id: rideId }
        });

        if (!ride || ride.riderId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update bid with counter offer
        const bid = await prisma.rideBid.update({
            where: { id: bidId },
            data: {
                counterFare: parseFloat(counterFare),
                status: 'COUNTERED'
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Emit socket event to driver
        const io = req.app.get('io');
        if (io) {
            io.to(`driver-${bid.driverId}`).emit('counter-offer', {
                rideId,
                bid,
                counterFare
            });
        }

        res.json({
            success: true,
            message: 'Counter offer sent',
            data: bid
        });
    } catch (error) {
        console.error('Counter Bid Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending counter offer'
        });
    }
};

// @desc    Accept a bid
// @route   POST /api/rides/:id/accept-bid
// @access  Private (Riders only)
exports.acceptBid = async (req, res) => {
    try {
        const { bidId } = req.body;
        const rideId = req.params.id;

        if (!bidId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide bid ID'
            });
        }

        // Verify ride ownership
        const ride = await prisma.rideRequest.findUnique({
            where: { id: rideId },
            include: { bids: true }
        });

        if (!ride || ride.riderId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (ride.status === 'CONFIRMED' || ride.status === 'ONGOING') {
            return res.status(400).json({
                success: false,
                message: 'Ride already confirmed'
            });
        }

        // Get the bid
        const bid = await prisma.rideBid.findUnique({
            where: { id: bidId },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        vehicleModel: true,
                        vehicleColor: true,
                        vehiclePlateNumber: true,
                        contactNumber: true
                    }
                }
            }
        });

        if (!bid || bid.rideRequestId !== rideId) {
            return res.status(404).json({
                success: false,
                message: 'Bid not found'
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Update the accepted bid and reject others
        await prisma.$transaction([
            // Accept this bid
            prisma.rideBid.update({
                where: { id: bidId },
                data: { status: 'ACCEPTED' }
            }),
            // Reject other bids for this ride
            prisma.rideBid.updateMany({
                where: {
                    rideRequestId: rideId,
                    id: { not: bidId }
                },
                data: { status: 'REJECTED' }
            }),
            // Update ride status
            prisma.rideRequest.update({
                where: { id: rideId },
                data: {
                    status: 'CONFIRMED',
                    assignedDriverId: bid.driverId,
                    finalFare: bid.counterFare || bid.offeredFare,
                    otp
                }
            })
        ]);

        // Fetch updated ride
        const updatedRide = await prisma.rideRequest.findUnique({
            where: { id: rideId },
            include: {
                rider: {
                    select: { id: true, name: true, contactNumber: true }
                }
            }
        });

        // Emit socket events
        const io = req.app.get('io');
        if (io) {
            // Notify accepted driver
            io.to(`driver-${bid.driverId}`).emit('bid-accepted', {
                rideId,
                ride: updatedRide,
                message: 'Your bid has been accepted!'
            });

            // Notify rejected drivers
            ride.bids
                .filter(b => b.id !== bidId)
                .forEach(b => {
                    io.to(`driver-${b.driverId}`).emit('bid-rejected', {
                        rideId,
                        message: 'Another driver was selected'
                    });
                });
        }

        res.json({
            success: true,
            message: 'Bid accepted! Ride confirmed.',
            data: {
                ride: updatedRide,
                driver: bid.driver,
                fare: bid.counterFare || bid.offeredFare,
                otp // Send OTP to rider
            }
        });
    } catch (error) {
        console.error('Accept Bid Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error accepting bid'
        });
    }
};

// @desc    Reject a bid
// @route   POST /api/rides/:id/reject-bid
// @access  Private (Riders only)
exports.rejectBid = async (req, res) => {
    try {
        const { bidId } = req.body;
        const rideId = req.params.id;

        // Verify ride ownership
        const ride = await prisma.rideRequest.findUnique({
            where: { id: rideId }
        });

        if (!ride || ride.riderId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Reject the bid
        const bid = await prisma.rideBid.update({
            where: { id: bidId },
            data: { status: 'REJECTED' }
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`driver-${bid.driverId}`).emit('bid-rejected', {
                rideId,
                bidId,
                message: 'Your bid was rejected'
            });
        }

        res.json({
            success: true,
            message: 'Bid rejected',
            data: bid
        });
    } catch (error) {
        console.error('Reject Bid Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting bid'
        });
    }
};

// @desc    Start ride with OTP verification
// @route   POST /api/rides/:id/start
// @access  Private (Drivers only)
exports.startRide = async (req, res) => {
    try {
        const { otp } = req.body;
        const rideId = req.params.id;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide OTP'
            });
        }

        // Get ride with OTP
        const ride = await prisma.rideRequest.findUnique({
            where: { id: rideId }
        });

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        // Verify driver
        if (ride.assignedDriverId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to start this ride'
            });
        }

        if (ride.status !== 'CONFIRMED') {
            return res.status(400).json({
                success: false,
                message: 'Ride is not in confirmed state'
            });
        }

        // Verify OTP
        if (ride.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Update ride status
        const updatedRide = await prisma.rideRequest.update({
            where: { id: rideId },
            data: {
                status: 'ONGOING',
                otpVerified: true
            },
            include: {
                rider: {
                    select: { id: true, name: true }
                }
            }
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`ride-${rideId}`).emit('ride-started', {
                rideId,
                message: 'Ride has started!'
            });
        }

        res.json({
            success: true,
            message: 'Ride started successfully',
            data: updatedRide
        });
    } catch (error) {
        console.error('Start Ride Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting ride'
        });
    }
};

// @desc    Update vehicle location
// @route   PATCH /api/rides/:id/location
// @access  Private (Drivers only)
exports.updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const rideId = req.params.id;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Please provide location coordinates'
            });
        }

        const ride = await prisma.rideRequest.findUnique({
            where: { id: rideId }
        });

        if (!ride || ride.assignedDriverId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update location
        const updatedRide = await prisma.rideRequest.update({
            where: { id: rideId },
            data: {
                vehicleLat: parseFloat(lat),
                vehicleLng: parseFloat(lng)
            }
        });

        // Emit socket event for live tracking
        const io = req.app.get('io');
        if (io) {
            io.to(`ride-${rideId}`).emit('location-update', {
                rideId,
                lat: updatedRide.vehicleLat,
                lng: updatedRide.vehicleLng
            });
        }

        res.json({
            success: true,
            data: {
                lat: updatedRide.vehicleLat,
                lng: updatedRide.vehicleLng
            }
        });
    } catch (error) {
        console.error('Update Location Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating location'
        });
    }
};

// @desc    Complete ride and generate bill
// @route   POST /api/rides/:id/complete
// @access  Private (Drivers only)
exports.completeRide = async (req, res) => {
    try {
        const { distance } = req.body;
        const rideId = req.params.id;

        const ride = await prisma.rideRequest.findUnique({
            where: { id: rideId }
        });

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        if (ride.assignedDriverId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (ride.status !== 'ONGOING') {
            return res.status(400).json({
                success: false,
                message: 'Ride must be ongoing to complete'
            });
        }

        // Calculate duration (time since OTP was verified)
        const durationMs = Date.now() - ride.updatedAt.getTime();
        const durationMinutes = Math.ceil(durationMs / 60000);

        // Update ride and create bill in transaction
        const [updatedRide, bill] = await prisma.$transaction([
            prisma.rideRequest.update({
                where: { id: rideId },
                data: {
                    status: 'COMPLETED',
                    distance: distance ? parseFloat(distance) : null
                },
                include: {
                    rider: {
                        select: { id: true, name: true, email: true }
                    }
                }
            }),
            prisma.bill.create({
                data: {
                    rideRequestId: rideId,
                    fare: ride.finalFare,
                    distance: distance ? parseFloat(distance) : 0,
                    duration: durationMinutes
                }
            })
        ]);

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`ride-${rideId}`).emit('ride-completed', {
                rideId,
                bill,
                message: 'Ride completed!'
            });
        }

        res.json({
            success: true,
            message: 'Ride completed successfully',
            data: {
                ride: updatedRide,
                bill
            }
        });
    } catch (error) {
        console.error('Complete Ride Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing ride'
        });
    }
};

// @desc    Cancel a ride request
// @route   POST /api/rides/:id/cancel
// @access  Private (Rider who created it or assigned driver)
exports.cancelRide = async (req, res) => {
    try {
        const rideId = req.params.id;

        const ride = await prisma.rideRequest.findUnique({
            where: { id: rideId }
        });

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        // Check if user can cancel
        const isRider = ride.riderId === req.user.id;
        const isDriver = ride.assignedDriverId === req.user.id;

        if (!isRider && !isDriver) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel this ride'
            });
        }

        // Update ride status
        const updatedRide = await prisma.rideRequest.update({
            where: { id: rideId },
            data: { status: 'CANCELLED' }
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`ride-${rideId}`).emit('ride-cancelled', {
                rideId,
                cancelledBy: req.user.role,
                message: `Ride cancelled by ${req.user.role.toLowerCase()}`
            });
        }

        res.json({
            success: true,
            message: 'Ride cancelled',
            data: updatedRide
        });
    } catch (error) {
        console.error('Cancel Ride Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling ride'
        });
    }
};

// @desc    Get rider's ride history
// @route   GET /api/rides/my-rides
// @access  Private
exports.getMyRides = async (req, res) => {
    try {
        const whereClause = req.user.role === 'RIDER'
            ? { riderId: req.user.id }
            : { assignedDriverId: req.user.id };

        const rides = await prisma.rideRequest.findMany({
            where: whereClause,
            include: {
                rider: {
                    select: { id: true, name: true }
                },
                bids: {
                    where: { status: 'ACCEPTED' },
                    include: {
                        driver: {
                            select: {
                                id: true,
                                name: true,
                                vehicleModel: true,
                                vehiclePlateNumber: true
                            }
                        }
                    }
                },
                bill: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            count: rides.length,
            data: rides
        });
    } catch (error) {
        console.error('Get My Rides Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rides'
        });
    }
};
