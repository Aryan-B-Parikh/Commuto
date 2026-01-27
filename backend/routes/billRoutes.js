const express = require('express');
const router = express.Router();
const { getBillByRideId, getBillHistory } = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.get('/history', getBillHistory);
router.get('/:rideId', getBillByRideId);

module.exports = router;
