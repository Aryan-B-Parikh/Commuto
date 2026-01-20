const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    destination: {
        type: String,
        required: [true, 'Please provide a destination'],
        trim: true
    },
    pickupLocation: {
        type: String,
        required: [true, 'Please provide a pickup location'],
        trim: true
    },
    departureTime: {
        type: Date,
        required: [true, 'Please provide departure time']
    },
    totalFare: {
        type: Number,
        required: [true, 'Please provide total fare'],
        min: [0, 'Fare cannot be negative']
    },
    maxSeats: {
        type: Number,
        required: [true, 'Please provide maximum seats'],
        min: [1, 'At least 1 seat required'],
        max: [10, 'Maximum 10 seats allowed']
    },
    passengers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    farePerPerson: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['open', 'full', 'ongoing', 'completed', 'cancelled'],
        default: 'open'
    },
    otp: {
        type: String,
        select: false
    },
    otpVerified: {
        type: Boolean,
        default: false
    },
    vehicleLocation: {
        lat: {
            type: Number,
            default: null
        },
        lng: {
            type: Number,
            default: null
        }
    },
    distance: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate fare per person before saving
rideSchema.pre('save', function (next) {
    const totalPassengers = this.passengers.length + 1; // +1 for creator
    this.farePerPerson = Math.ceil(this.totalFare / totalPassengers);

    // Update status if full
    if (this.passengers.length >= this.maxSeats) {
        this.status = 'full';
    }

    next();
});

// Virtual for available seats
rideSchema.virtual('availableSeats').get(function () {
    return this.maxSeats - this.passengers.length;
});

// Ensure virtuals are included in JSON
rideSchema.set('toJSON', { virtuals: true });
rideSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ride', rideSchema);
