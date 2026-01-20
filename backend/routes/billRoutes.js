const express = require('express');
const { getBill, getMyBills } = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getMyBills);
router.get('/:rideId', getBill);

module.exports = router;
