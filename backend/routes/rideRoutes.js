const express = require('express');
const router = express.Router();
const {
    createRideRequest,
    getAvailableRides,
    getRideById,
    submitBid,
    counterBid,
    acceptBid,
    rejectBid,
    startRide,
    updateLocation,
    completeRide,
    cancelRide,
    getMyRides
} = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');
const { requireRider, requireDriver } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// Rider routes
router.post('/request', requireRider, createRideRequest);
router.get('/my-rides', getMyRides);
router.post('/:id/counter', requireRider, counterBid);
router.post('/:id/accept-bid', requireRider, acceptBid);
router.post('/:id/reject-bid', requireRider, rejectBid);

// Driver routes
router.get('/available', requireDriver, getAvailableRides);
router.post('/:id/bid', requireDriver, submitBid);
router.post('/:id/start', requireDriver, startRide);
router.patch('/:id/location', requireDriver, updateLocation);
router.post('/:id/complete', requireDriver, completeRide);

// Shared routes
router.get('/:id', getRideById);
router.post('/:id/cancel', cancelRide);

module.exports = router;
