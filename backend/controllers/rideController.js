const Ride = require('../models/Ride');
const User = require('../models/User');
const Bill = require('../models/Bill');
const { generateOTP, verifyOTP } = require('../utils/otpGenerator');
const { calculateFarePerPerson } = require('../utils/fareCalculator');

/**
 * @desc    Create a new ride
 * @route   POST /api/rides
 * @access  Private
 */
const createRide = async (req, res) => {
    try {
        const { destination, pickupLocation, departureTime, totalFare, maxSeats } = req.body;

        // Generate OTP for ride verification
        const otp = generateOTP();

        const ride = await Ride.create({
            creator: req.user._id,
            destination,
            pickupLocation,
            departureTime,
            totalFare,
            maxSeats,
            farePerPerson: totalFare, // Initially only creator
            otp
        });

        // Add ride to user's created rides
        await User.findByIdAndUpdate(req.user._id, {
            $push: { ridesCreated: ride._id }
        });

        // Return ride with OTP (only for creator)
        const rideWithOtp = await Ride.findById(ride._id)
            .select('+otp')
            .populate('creator', 'name email phone');

        res.status(201).json({
            success: true,
            data: rideWithOtp
        });
    } catch (error) {
        console.error('Create ride error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating ride'
        });
    }
};

/**
 * @desc    Get all available rides
 * @route   GET /api/rides
 * @access  Private
 */
const getRides = async (req, res) => {
    try {
        const { status, destination } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        } else {
            query.status = { $in: ['open', 'full'] };
        }

        if (destination) {
            query.destination = { $regex: destination, $options: 'i' };
        }

        const rides = await Ride.find(query)
            .populate('creator', 'name email phone')
            .populate('passengers', 'name email')
            .sort({ departureTime: 1 });

        res.json({
            success: true,
            count: rides.length,
            data: rides
        });
    } catch (error) {
        console.error('Get rides error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching rides'
        });
    }
};

/**
 * @desc    Get single ride
 * @route   GET /api/rides/:id
 * @access  Private
 */
const getRide = async (req, res) => {
    try {
        let ride = await Ride.findById(req.params.id)
            .populate('creator', 'name email phone')
            .populate('passengers', 'name email phone');

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        // If user is creator, include OTP
        if (ride.creator._id.toString() === req.user._id.toString()) {
            ride = await Ride.findById(req.params.id)
                .select('+otp')
                .populate('creator', 'name email phone')
                .populate('passengers', 'name email phone');
        }

        res.json({
            success: true,
            data: ride
        });
    } catch (error) {
        console.error('Get ride error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching ride'
        });
    }
};

/**
 * @desc    Join a ride
 * @route   POST /api/rides/:id/join
 * @access  Private
 */
const joinRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        // Check if ride is open
        if (ride.status !== 'open') {
            return res.status(400).json({
                success: false,
                message: 'Ride is not available for joining'
            });
        }

        // Check if user is already in ride
        if (ride.passengers.includes(req.user._id) ||
            ride.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You are already part of this ride'
            });
        }

        // Check if seats available
        if (ride.passengers.length >= ride.maxSeats) {
            return res.status(400).json({
                success: false,
                message: 'No seats available'
            });
        }

        // Add passenger
        ride.passengers.push(req.user._id);
        await ride.save();

        // Add ride to user's joined rides
        await User.findByIdAndUpdate(req.user._id, {
            $push: { ridesJoined: ride._id }
        });

        const updatedRide = await Ride.findById(req.params.id)
            .populate('creator', 'name email phone')
            .populate('passengers', 'name email phone');

        res.json({
            success: true,
            data: updatedRide
        });
    } catch (error) {
        console.error('Join ride error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error joining ride'
        });
    }
};

/**
 * @desc    Leave a ride
 * @route   POST /api/rides/:id/leave
 * @access  Private
 */
const leaveRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        // Check if user is a passenger
        const passengerIndex = ride.passengers.indexOf(req.user._id);
        if (passengerIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'You are not a passenger in this ride'
            });
        }

        // Can't leave ongoing ride
        if (ride.status === 'ongoing') {
            return res.status(400).json({
                success: false,
                message: 'Cannot leave an ongoing ride'
            });
        }

        // Remove passenger
        ride.passengers.splice(passengerIndex, 1);

        // Update status if was full
        if (ride.status === 'full') {
            ride.status = 'open';
        }

        await ride.save();

        // Remove from user's joined rides
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { ridesJoined: ride._id }
        });

        const updatedRide = await Ride.findById(req.params.id)
            .populate('creator', 'name email phone')
            .populate('passengers', 'name email phone');

        res.json({
            success: true,
            data: updatedRide
        });
    } catch (error) {
        console.error('Leave ride error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error leaving ride'
        });
    }
};

/**
 * @desc    Verify OTP and start ride
 * @route   POST /api/rides/:id/verify-otp
 * @access  Private
 */
const verifyRideOTP = async (req, res) => {
    try {
        const { otp } = req.body;

        const ride = await Ride.findById(req.params.id).select('+otp');

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        // Only creator can verify OTP to start ride
        if (ride.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only ride creator can start the ride'
            });
        }

        // Verify OTP
        if (!verifyOTP(otp, ride.otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Start ride
        ride.otpVerified = true;
        ride.status = 'ongoing';
        await ride.save();

        const updatedRide = await Ride.findById(req.params.id)
            .populate('creator', 'name email phone')
            .populate('passengers', 'name email phone');

        res.json({
            success: true,
            message: 'Ride started successfully',
            data: updatedRide
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error verifying OTP'
        });
    }
};

/**
 * @desc    Update vehicle location
 * @route   PATCH /api/rides/:id/location
 * @access  Private
 */
const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        // Only creator can update location
        if (ride.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only ride creator can update location'
            });
        }

        ride.vehicleLocation = { lat, lng };
        await ride.save();

        res.json({
            success: true,
            data: {
                vehicleLocation: ride.vehicleLocation
            }
        });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating location'
        });
    }
};

/**
 * @desc    Complete ride and generate bill
 * @route   PATCH /api/rides/:id/complete
 * @access  Private
 */
const completeRide = async (req, res) => {
    try {
        const { distance } = req.body;

        const ride = await Ride.findById(req.params.id)
            .populate('creator', 'name email')
            .populate('passengers', 'name email');

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        // Only creator can complete ride
        if (ride.creator._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only ride creator can complete the ride'
            });
        }

        // Must be ongoing
        if (ride.status !== 'ongoing') {
            return res.status(400).json({
                success: false,
                message: 'Ride must be ongoing to complete'
            });
        }

        // Complete ride
        ride.status = 'completed';
        ride.distance = distance || 0;
        await ride.save();

        // Generate bill
        const totalPassengers = ride.passengers.length + 1;
        const farePerPerson = calculateFarePerPerson(ride.totalFare, totalPassengers);

        const bill = await Bill.create({
            ride: ride._id,
            rideId: ride._id.toString().slice(-8).toUpperCase(),
            distance: distance || 0,
            totalFare: ride.totalFare,
            destination: ride.destination,
            pickupLocation: ride.pickupLocation,
            creator: {
                user: ride.creator._id,
                name: ride.creator.name,
                email: ride.creator.email,
                amount: farePerPerson
            },
            passengers: ride.passengers.map(p => ({
                user: p._id,
                name: p.name,
                email: p.email,
                amount: farePerPerson
            }))
        });

        res.json({
            success: true,
            message: 'Ride completed',
            data: {
                ride,
                bill
            }
        });
    } catch (error) {
        console.error('Complete ride error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error completing ride'
        });
    }
};

/**
 * @desc    Cancel ride
 * @route   PATCH /api/rides/:id/cancel
 * @access  Private
 */
const cancelRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }

        // Only creator can cancel
        if (ride.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only ride creator can cancel the ride'
            });
        }

        // Can't cancel ongoing or completed rides
        if (ride.status === 'ongoing' || ride.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel an ongoing or completed ride'
            });
        }

        ride.status = 'cancelled';
        await ride.save();

        res.json({
            success: true,
            message: 'Ride cancelled',
            data: ride
        });
    } catch (error) {
        console.error('Cancel ride error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cancelling ride'
        });
    }
};

/**
 * @desc    Get user's rides
 * @route   GET /api/rides/my-rides
 * @access  Private
 */
const getMyRides = async (req, res) => {
    try {
        const createdRides = await Ride.find({ creator: req.user._id })
            .populate('passengers', 'name email')
            .sort({ createdAt: -1 });

        const joinedRides = await Ride.find({ passengers: req.user._id })
            .populate('creator', 'name email phone')
            .populate('passengers', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                created: createdRides,
                joined: joinedRides
            }
        });
    } catch (error) {
        console.error('Get my rides error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching your rides'
        });
    }
};

module.exports = {
    createRide,
    getRides,
    getRide,
    joinRide,
    leaveRide,
    verifyRideOTP,
    updateLocation,
    completeRide,
    cancelRide,
    getMyRides
};
