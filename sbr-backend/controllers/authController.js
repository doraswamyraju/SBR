const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecretjwtkey_sbr_2026_dev',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, specialization, location } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user base data
    const userData = {
      name,
      email,
      password,
      role: role || 'CUSTOMER',
      phone
    };

    // Add role-specific details if provided
    if (role === 'CUSTOMER') {
      if (address) userData.address = address;
    } else if (role === 'AGENT') {
      if (specialization) userData.specialization = specialization;
      if (location) userData.location = location;
      userData.status = 'Offline';
    }

    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Check for user (include password in selection explicitly)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Optional: Add new FCM token to user if it's provided and not already in array
    if (fcmToken) {
      if (!user.fcmTokens.includes(fcmToken)) {
        user.fcmTokens.push(fcmToken);
        await user.save();
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        latitude: user.latitude,
        longitude: user.longitude,
        addresses: user.addresses || [],
        photoUrl: user.photoUrl,
        isRecurring: user.isRecurring,
        nextServiceDate: user.nextServiceDate,
        specialization: user.specialization,
        location: user.location,
        status: user.status,
        rating: user.rating,
        completedJobs: user.completedJobs,
        currentLat: user.currentLat,
        currentLng: user.currentLng
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Logout / Remove FCM Token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    
    // Remove the client's FCM token on logout to prevent notifications sending to the device
    if (fcmToken && req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.fcmTokens = user.fcmTokens.filter(token => token !== fcmToken);
        await user.save();
      }
    }

    res.status(200).json({ success: true, data: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
