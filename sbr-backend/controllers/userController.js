const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fieldsToUpdate = {};
    
    // Allowed general update fields
    const allowedFields = ['name', 'phone'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) fieldsToUpdate[field] = req.body[field];
    });

    // Allowed customer update fields
    if (req.user.role === 'CUSTOMER') {
      const customerFields = ['address', 'photoUrl', 'isRecurring', 'nextServiceDate', 'latitude', 'longitude', 'addresses'];
      customerFields.forEach(field => {
        if (req.body[field] !== undefined) fieldsToUpdate[field] = req.body[field];
      });
    }

    // Allowed agent update fields
    if (req.user.role === 'AGENT') {
      const agentFields = ['specialization', 'location', 'status', 'isAvailable'];
      agentFields.forEach(field => {
        if (req.body[field] !== undefined) fieldsToUpdate[field] = req.body[field];
      });
    }

    const user = await User.findByIdAndUpdate(userId, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailHelper');

// @desc    Update single user (Admin specific update)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { name, email, phone, role, status, specialization, location, address, isRecurring, password } = req.body;

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (specialization !== undefined) user.specialization = specialization;
    if (location !== undefined) user.location = location;
    if (address !== undefined) user.address = address;
    if (isRecurring !== undefined) user.isRecurring = isRecurring;

    if (password && password.trim().length >= 6) {
      user.password = password; // pre-save hook will hash it
    }

    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reset password via Email
// @route   POST /api/users/:id/reset-password-email
// @access  Private/Admin
exports.resetPasswordEmail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate secure 8-character temporary password
    const tempPassword = 'SBR@' + crypto.randomBytes(3).toString('hex').toUpperCase();

    user.password = tempPassword; // Will be hashed by UserSchema.pre('save')
    await user.save();

    // Send email to user
    await sendPasswordResetEmail(user.email, user.name, tempPassword, user.role);

    res.status(200).json({
      success: true,
      message: `Password reset email successfully sent to ${user.email}.`,
      tempPassword: tempPassword
    });
  } catch (error) {
    console.error('resetPasswordEmail error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Manual Password Reset by Admin
// @route   POST /api/users/:id/manual-password
// @access  Private/Admin
exports.manualPasswordReset = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.password = password.trim(); // Will be hashed by pre-save
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password for ${user.name} has been updated successfully.`
    });
  } catch (error) {
    console.error('manualPasswordReset error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update agent coordinates
// @route   PUT /api/users/agent/location
// @access  Private (Agent only)
exports.updateAgentCoordinates = async (req, res) => {
  try {
    if (req.user.role !== 'AGENT') {
      return res.status(403).json({ success: false, error: 'Only agents can update live location coordinates' });
    }

    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Please provide both latitude and longitude' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { currentLat: latitude, currentLng: longitude },
      { new: true }
    );

    res.status(200).json({ success: true, data: { currentLat: user.currentLat, currentLng: user.currentLng } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update FCM Token
// @route   POST /api/users/fcm-token
// @access  Private
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ success: false, error: 'Please provide FCM token' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    res.status(200).json({ success: true, data: user.fcmTokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete own profile (Account Deletion)
// @route   DELETE /api/users/profile
// @access  Private
exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'Account successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

