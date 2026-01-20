const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true
    },
    rideId: {
        type: String,
        required: true
    },
    distance: {
        type: Number,
        default: 0
    },
    totalFare: {
        type: Number,
        required: true
    },
    passengers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        email: String,
        amount: Number
    }],
    creator: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        email: String,
        amount: Number
    },
    destination: String,
    pickupLocation: String,
    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Bill', billSchema);
