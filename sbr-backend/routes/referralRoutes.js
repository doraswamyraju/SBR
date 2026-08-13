const express = require('express');
const {
  getMyReferralData,

  submitReferral,
  getAdminReferrals,
  updateReferralStatus,
  requestPayoutClaim,
  getAdminClaims,
  updateClaimStatus
} = require('../controllers/referralController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Customer Protected Routes
router.get('/my-referrals', protect, getMyReferralData);
router.post('/submit', protect, submitReferral);
router.post('/claim-payout', protect, requestPayoutClaim);

// Admin Protected Routes
router.get('/admin/all', protect, admin, getAdminReferrals);
router.put('/admin/:id/status', protect, admin, updateReferralStatus);
router.get('/admin/claims', protect, admin, getAdminClaims);
router.put('/admin/claims/:id/status', protect, admin, updateClaimStatus);

module.exports = router;

