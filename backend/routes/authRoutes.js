const express = require('express');
const router = express.Router();
const {
    registerRider,
    registerDriver,
    login,
    getMe,
    updateDriverStatus,
    getOnlineDrivers
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { requireDriver, requireRider } = require('../middleware/roleMiddleware');

// Public routes
router.post('/register-rider', registerRider);
router.post('/register-driver', registerDriver);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.patch('/driver-status', protect, requireDriver, updateDriverStatus);
router.get('/drivers/online', protect, requireRider, getOnlineDrivers);

module.exports = router;
