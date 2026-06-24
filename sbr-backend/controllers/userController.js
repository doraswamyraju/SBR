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
      const customerFields = ['address', 'photoUrl', 'isRecurring', 'nextServiceDate'];
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

// @desc    Update single user (Admin specific update)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
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
