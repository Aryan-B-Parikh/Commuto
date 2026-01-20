const Bill = require('../models/Bill');

/**
 * @desc    Get bill for a ride
 * @route   GET /api/bills/:rideId
 * @access  Private
 */
const getBill = async (req, res) => {
    try {
        const bill = await Bill.findOne({ ride: req.params.rideId })
            .populate('ride');

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        res.json({
            success: true,
            data: bill
        });
    } catch (error) {
        console.error('Get bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching bill'
        });
    }
};

/**
 * @desc    Get user's bills
 * @route   GET /api/bills
 * @access  Private
 */
const getMyBills = async (req, res) => {
    try {
        // Find bills where user is creator or passenger
        const bills = await Bill.find({
            $or: [
                { 'creator.user': req.user._id },
                { 'passengers.user': req.user._id }
            ]
        }).sort({ completedAt: -1 });

        res.json({
            success: true,
            count: bills.length,
            data: bills
        });
    } catch (error) {
        console.error('Get my bills error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching bills'
        });
    }
};

module.exports = {
    getBill,
    getMyBills
};
