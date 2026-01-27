const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register a new rider
// @route   POST /api/auth/register-rider
// @access  Public
exports.registerRider = async (req, res) => {
    try {
        const { name, email, password, contactNumber } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create rider
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                contactNumber,
                role: 'RIDER'
            },
            select: {
                id: true,
                name: true,
                email: true,
                contactNumber: true,
                role: true,
                createdAt: true
            }
        });

        // Generate token
        const token = generateToken(user.id, user.role);

        res.status(201).json({
            success: true,
            message: 'Rider registered successfully',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        console.error('Register Rider Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering rider',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Register a new driver
// @route   POST /api/auth/register-driver
// @access  Public
exports.registerDriver = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            contactNumber,
            driverLicenseNumber,
            licenseExpiryDate,
            vehicleModel,
            vehicleColor,
            vehiclePlateNumber
        } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        // Validate driver-specific required fields
        if (!driverLicenseNumber || !vehicleModel || !vehiclePlateNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please provide license number, vehicle model and plate number'
            });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create driver
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                contactNumber,
                role: 'DRIVER',
                driverLicenseNumber,
                licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
                vehicleModel,
                vehicleColor,
                vehiclePlateNumber,
                isOnline: false
            },
            select: {
                id: true,
                name: true,
                email: true,
                contactNumber: true,
                role: true,
                driverLicenseNumber: true,
                licenseExpiryDate: true,
                vehicleModel: true,
                vehicleColor: true,
                vehiclePlateNumber: true,
                isOnline: true,
                createdAt: true
            }
        });

        // Generate token
        const token = generateToken(user.id, user.role);

        res.status(201).json({
            success: true,
            message: 'Driver registered successfully',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        console.error('Register Driver Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering driver',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Login user (rider or driver)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user with password
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user.id, user.role);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                contactNumber: true,
                role: true,
                driverLicenseNumber: true,
                licenseExpiryDate: true,
                vehicleModel: true,
                vehicleColor: true,
                vehiclePlateNumber: true,
                isOnline: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get Me Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update driver online status
// @route   PATCH /api/auth/driver-status
// @access  Private (Drivers only)
exports.updateDriverStatus = async (req, res) => {
    try {
        const { isOnline } = req.body;

        if (req.user.role !== 'DRIVER') {
            return res.status(403).json({
                success: false,
                message: 'Only drivers can update online status'
            });
        }

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { isOnline: Boolean(isOnline) },
            select: {
                id: true,
                name: true,
                isOnline: true
            }
        });

        res.json({
            success: true,
            message: `Driver is now ${user.isOnline ? 'online' : 'offline'}`,
            data: user
        });
    } catch (error) {
        console.error('Update Driver Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating driver status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get online drivers
// @route   GET /api/auth/drivers/online
// @access  Private (Riders only)
exports.getOnlineDrivers = async (req, res) => {
    try {
        const drivers = await prisma.user.findMany({
            where: {
                role: 'DRIVER',
                isOnline: true
            },
            select: {
                id: true,
                name: true,
                vehicleModel: true,
                vehicleColor: true,
                vehiclePlateNumber: true
            }
        });

        res.json({
            success: true,
            count: drivers.length,
            data: drivers
        });
    } catch (error) {
        console.error('Get Online Drivers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching online drivers',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
