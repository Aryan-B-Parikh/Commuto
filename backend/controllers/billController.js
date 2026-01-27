const prisma = require('../utils/prisma');

// @desc    Get bill by ride ID
// @route   GET /api/bills/:rideId
// @access  Private
exports.getBillByRideId = async (req, res) => {
    try {
        const { rideId } = req.params;

        const bill = await prisma.bill.findUnique({
            where: { rideRequestId: rideId },
            include: {
                rideRequest: {
                    include: {
                        rider: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                contactNumber: true
                            }
                        }
                    }
                }
            }
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        // Verify access
        const ride = bill.rideRequest;
        if (ride.riderId !== req.user.id && ride.assignedDriverId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get driver info
        let driverInfo = null;
        if (ride.assignedDriverId) {
            driverInfo = await prisma.user.findUnique({
                where: { id: ride.assignedDriverId },
                select: {
                    id: true,
                    name: true,
                    vehicleModel: true,
                    vehicleColor: true,
                    vehiclePlateNumber: true
                }
            });
        }

        res.json({
            success: true,
            data: {
                bill,
                rider: ride.rider,
                driver: driverInfo,
                ride: {
                    id: ride.id,
                    originAddress: ride.originAddress,
                    destAddress: ride.destAddress,
                    createdAt: ride.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Get Bill Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bill'
        });
    }
};

// @desc    Get user's bill history
// @route   GET /api/bills/history
// @access  Private
exports.getBillHistory = async (req, res) => {
    try {
        const whereClause = req.user.role === 'RIDER'
            ? { rideRequest: { riderId: req.user.id } }
            : { rideRequest: { assignedDriverId: req.user.id } };

        const bills = await prisma.bill.findMany({
            where: whereClause,
            include: {
                rideRequest: {
                    select: {
                        id: true,
                        originAddress: true,
                        destAddress: true,
                        status: true,
                        createdAt: true,
                        rider: {
                            select: { id: true, name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate totals
        const totalEarnings = bills.reduce((sum, bill) => sum + bill.fare, 0);
        const totalDistance = bills.reduce((sum, bill) => sum + (bill.distance || 0), 0);

        res.json({
            success: true,
            count: bills.length,
            summary: {
                totalFare: totalEarnings,
                totalDistance,
                totalRides: bills.length
            },
            data: bills
        });
    } catch (error) {
        console.error('Get Bill History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bill history'
        });
    }
};
