const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_sbr_2026_dev');

    // Attach user to req.user
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User associated with token no longer exists' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Not authorized as an admin'
    });
  }
};

// POS System or JWT Authenticated Middleware
const posOrProtect = async (req, res, next) => {
  const syncToken = req.headers['x-pos-sync-token'];
  if (syncToken === 'sbr_pos_sms_sync_secret_2026') {
    req.user = {
      _id: null,
      role: 'STORE_INCHARGE',
      name: 'Central POS Admin'
    };
    return next();
  }
  return protect(req, res, next);
};

module.exports = { protect, authorize, admin, posOrProtect };

