const User = require('../models/User');

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
    });
};

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400);
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            res.status(400);
            return next(new Error('Please provide an email and password'));
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            res.status(401);
            return next(new Error('Invalid credentials'));
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            res.status(401);
            return next(new Error('Invalid credentials'));
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        // user is already available in req due to the protect middleware
        const user = await User.findById(req.user.id);
        
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        next(err);
    }
};
