const crypto = require('crypto');
const User = require('../models/User');

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const PASSWORD_REQUIREMENTS = [
    { regex: /.{6,}/, message: 'Password must be at least 6 characters' },
    { regex: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
    { regex: /\d/, message: 'Password must contain at least one number' },
    {
        regex: /[!@#$%^&*]/,
        message: 'Password must contain at least one special character (!@#$%^&*)',
    },
];

const isValidEmail = (email) => EMAIL_REGEX.test(email);

const getPasswordStrengthError = (password) => {
    for (const requirement of PASSWORD_REQUIREMENTS) {
        if (!requirement.regex.test(password)) {
            return requirement.message;
        }
    }
    return null;
};

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
        const { firstName, lastName, email, phone, password, name } = req.body;
        
        // Support both "name" (combined) and "firstName"/"lastName" (separate)
        let fullName = name;
        if (!name && (firstName || lastName)) {
            fullName = `${firstName} ${lastName}`.trim();
        }

        // Check for required fields
        if (!fullName || !email || !password) {
            res.status(400);
            throw new Error('Please add all required fields');
        }

        // Validate password strength
        const passwordError = getPasswordStrengthError(password);
        if (passwordError) {
            res.status(400);
            throw new Error(passwordError);
        }

        // Check if user exists
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        // Create user
        const user = await User.create({
            name: fullName,
            email: normalizedEmail,
            phone: phone || '',
            password,
        });

        if (user) {
            sendTokenResponse(user, 201, res);
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (err) {
        console.error('[register]', err.message);
        res.status(res.statusCode === 200 ? 400 : res.statusCode);
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
            throw new Error('Please provide an email and password');
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            res.status(401);
            throw new Error('Invalid credentials');
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid credentials');
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
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    try {
        console.log('Incoming User Update Body:', req.body);
        const { name, email, phone, role } = req.body;

        // Ensure role is valid if provided
        if (role && !['admin', 'customer'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role. Must be admin or customer.' 
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, role },
            { 
                new: true, 
                runValidators: true,
                // Do not run validators on password if not provided
            }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user,
        });
    } catch (err) {
        console.error('User update error:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.matchPassword(currentPassword))) {
            res.status(401);
            throw new Error('Current password is incorrect');
        }

        user.password = newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Delete own account
// @route   DELETE /api/users/me
// @access  Private
exports.deleteOwnAccount = async (req, res, next) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail) {
            res.status(400);
            throw new Error('Please provide an email');
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            res.status(404);
            throw new Error('No account found');
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetToken = resetToken;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset initiated' });
    } catch (err) {
        next(err);
    }
};

// @desc    Reset password (supports both token-based and direct reset)
// @route   POST /api/users/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, newPassword, confirmPassword, token } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        // Validate required fields (email and password always required)
        if (!normalizedEmail || !newPassword || !confirmPassword) {
            res.status(400);
            throw new Error('Email, new password, and confirm password are all required');
        }

        // Validate email format
        if (!isValidEmail(normalizedEmail)) {
            res.status(400);
            throw new Error('Please add a valid email');
        }

        // Validate password strength
        const passwordError = getPasswordStrengthError(newPassword);
        if (passwordError) {
            res.status(400);
            throw new Error(passwordError);
        }

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            res.status(400);
            throw new Error('Passwords do not match');
        }

        // Find user
        const user = await User.findOne({ email: normalizedEmail }).select('+password +resetToken');
        if (!user) {
            res.status(404);
            throw new Error('No account found');
        }

        // If token is provided, validate it
        if (token && user.resetToken !== token) {
            res.status(401);
            throw new Error('Invalid or expired reset token');
        }

        // Check if new password is same as old password
        const isSamePassword = await user.matchPassword(newPassword);
        if (isSamePassword) {
            res.status(400);
            throw new Error('The new password cannot be the same as your old password');
        }

        // Update password and clear reset token
        user.password = newPassword;
        user.resetToken = null;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error('[resetPassword]', err.message);
        res.status(res.statusCode === 200 ? 400 : res.statusCode);
        next(err);
    }
};

// @desc    Check if email exists
// @route   GET /api/users/check-email
// @access  Public
exports.checkEmailExists = async (req, res, next) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(200).json({ exists: false });
        }
        
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        const exists = !!user;
        
        res.status(200).json({ exists });
    } catch (err) {
        console.error('[checkEmailExists]', err.message);
        // On error, return false to allow user to proceed
        res.status(200).json({ exists: false });
    }
};

// ADMIN ONLY CONTROLLERS
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
