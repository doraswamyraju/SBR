const express = require('express');
const {
  getMyReferralData,
  submitReferral,
  getAdminReferrals,
  updateReferralStatus
} = require('../controllers/referralController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Customer Protected Routes
router.get('/my-referrals', protect, getMyReferralData);
router.post('/submit', protect, submitReferral);

// Admin Protected Routes
router.get('/admin/all', protect, admin, getAdminReferrals);
router.put('/admin/:id/status', protect, admin, updateReferralStatus);

module.exports = router;
