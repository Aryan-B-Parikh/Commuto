const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

// Validation rules
const createRideValidation = [
    body('destination')
        .trim()
        .notEmpty()
        .withMessage('Destination is required'),
    body('pickupLocation')
        .trim()
        .notEmpty()
        .withMessage('Pickup location is required'),
    body('departureTime')
        .notEmpty()
        .withMessage('Departure time is required')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('totalFare')
        .notEmpty()
        .withMessage('Total fare is required')
        .isNumeric()
        .withMessage('Fare must be a number')
        .custom(value => value >= 0)
        .withMessage('Fare cannot be negative'),
    body('maxSeats')
        .notEmpty()
        .withMessage('Maximum seats is required')
        .isInt({ min: 1, max: 10 })
        .withMessage('Seats must be between 1 and 10')
];

const otpValidation = [
    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
];

const locationValidation = [
    body('lat')
        .notEmpty()
        .withMessage('Latitude is required')
        .isNumeric()
        .withMessage('Latitude must be a number'),
    body('lng')
        .notEmpty()
        .withMessage('Longitude is required')
        .isNumeric()
        .withMessage('Longitude must be a number')
];

// All routes are protected
router.use(protect);

// Routes
router.route('/')
    .get(getRides)
    .post(createRideValidation, validate, createRide);

router.get('/my-rides', getMyRides);

router.route('/:id')
    .get(getRide);

router.post('/:id/join', joinRide);
router.post('/:id/leave', leaveRide);
router.post('/:id/verify-otp', otpValidation, validate, verifyRideOTP);
router.patch('/:id/location', locationValidation, validate, updateLocation);
router.patch('/:id/complete', completeRide);
router.patch('/:id/cancel', cancelRide);

module.exports = router;
