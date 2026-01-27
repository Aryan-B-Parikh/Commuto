// Role-based access control middleware

// Require user to be a RIDER
exports.requireRider = (req, res, next) => {
    if (req.user.role !== 'RIDER') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Riders only.'
        });
    }
    next();
};

// Require user to be a DRIVER
exports.requireDriver = (req, res, next) => {
    if (req.user.role !== 'DRIVER') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Drivers only.'
        });
    }
    next();
};

// Flexible role check - accepts array of allowed roles
exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        next();
    };
};
