const Referral = require('../models/Referral');
const User = require('../models/User');
const Product = require('../models/Product');
const ReferralClaim = require('../models/ReferralClaim');

// Helper to generate unique referral code
const generateReferralCode = (name) => {
  const prefix = name ? name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'SBR') : 'SBR';
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `SBR-${prefix}${randNum}`;
};

// @desc    Get current user's referral code, stats, submitted referrals & payout claims
// @route   GET /api/referrals/my-referrals
// @access  Private
exports.getMyReferralData = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Auto-generate referral code if not present
    if (!user.referralCode) {
      let code = generateReferralCode(user.name);
      let existing = await User.findOne({ referralCode: code });
      while (existing) {
        code = generateReferralCode(user.name);
        existing = await User.findOne({ referralCode: code });
      }
      user.referralCode = code;
      await user.save();
    }

    const referrals = await Referral.find({ referrerId: req.user._id }).sort({ createdAt: -1 });
    const claims = await ReferralClaim.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const totalInvited = referrals.length;
    const convertedCount = referrals.filter(r => r.status === 'Purchased' || r.status === 'Reward Credited').length;
    
    const totalEarnings = user.totalReferralEarnings || 0;
    const claimedEarnings = user.claimedEarnings || 0;
    
    // Sum pending claims
    const pendingClaimsAmount = claims
      .filter(c => c.status === 'Pending' || c.status === 'Approved')
      .reduce((sum, c) => sum + c.amount, 0);

    const availableBalance = Math.max(0, totalEarnings - claimedEarnings - pendingClaimsAmount);

    let pendingEarnings = 0;
    referrals.forEach(r => {
      if (r.status === 'Purchased' || r.status === 'Pending' || r.status === 'Contacted') {
        pendingEarnings += (r.rewardAmount || 0);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode,
        totalInvited,
        convertedCount,
        totalEarnings,
        claimedEarnings,
        availableBalance,
        pendingEarnings,
        referrals,
        claims
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// @desc    Submit a new friend referral
// @route   POST /api/referrals/submit
// @access  Private
exports.submitReferral = async (req, res) => {
  try {
    const { refereeName, refereePhone, productId, productName, notes } = req.body;

    if (!refereeName || !refereePhone || !productName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide referee name, phone number, and product interest.' 
      });
    }

    const user = await User.findById(req.user._id);

    // Calculate estimated reward from product commission rule if product exists
    let calculatedReward = 500; // default baseline reward
    let foundProduct = null;

    if (productId) {
      foundProduct = await Product.findById(productId);
    } else if (productName) {
      foundProduct = await Product.findOne({ name: { $regex: productName, $options: 'i' } });
    }

    if (foundProduct) {
      if (foundProduct.commissionType === 'percentage') {
        calculatedReward = Math.round((foundProduct.basePrice * foundProduct.commissionValue) / 100);
      } else {
        calculatedReward = foundProduct.commissionValue || 500;
      }
    }

    const referral = await Referral.create({
      referrerId: req.user._id,
      referralCode: user.referralCode || 'SBR-GENERAL',
      refereeName,
      refereePhone,
      productId: foundProduct ? foundProduct._id : null,
      productName: foundProduct ? foundProduct.name : productName,
      rewardAmount: calculatedReward,
      notes: notes || '',
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      data: referral
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all referrals for Admin panel
// @route   GET /api/referrals/admin/all
// @access  Private/Admin
exports.getAdminReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate('referrerId', 'name email phone referralCode')
      .populate('productId', 'name basePrice commissionType commissionValue')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: referrals.length,
      data: referrals
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update referral status and reward details (Admin)
// @route   PUT /api/referrals/admin/:id/status
// @access  Private/Admin
exports.updateReferralStatus = async (req, res) => {
  try {
    const { status, purchaseAmount, rewardAmount, notes } = req.body;

    let referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({ success: false, error: 'Referral lead not found' });
    }

    const prevStatus = referral.status;

    if (status) referral.status = status;
    if (notes !== undefined) referral.notes = notes;
    if (purchaseAmount !== undefined) referral.purchaseAmount = Number(purchaseAmount);

    // Re-calculate reward if purchaseAmount provided and product has percentage rule
    if (rewardAmount !== undefined && rewardAmount !== '') {
      referral.rewardAmount = Number(rewardAmount);
    } else if (purchaseAmount > 0 && referral.productId) {
      const prod = await Product.findById(referral.productId);
      if (prod && prod.commissionType === 'percentage') {
        referral.rewardAmount = Math.round((purchaseAmount * prod.commissionValue) / 100);
      }
    }

    await referral.save();

    // If status transitioned to 'Reward Credited', credit user's totalReferralEarnings
    if (status === 'Reward Credited' && prevStatus !== 'Reward Credited') {
      await User.findByIdAndUpdate(referral.referrerId, {
        $inc: { totalReferralEarnings: referral.rewardAmount }
      });
    }

    res.status(200).json({
      success: true,
      data: referral
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Customer submits a payout claim request
// @route   POST /api/referrals/claim-payout
// @access  Private
exports.requestPayoutClaim = async (req, res) => {
  try {
    const { amount, payoutMethod, payoutDetails } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 500) {
      return res.status(400).json({ success: false, error: 'Minimum claim amount is ₹500.' });
    }

    if (!payoutDetails || payoutDetails.trim() === '') {
      return res.status(400).json({ success: false, error: 'Please provide UPI ID or Bank Transfer details.' });
    }

    const user = await User.findById(req.user._id);

    // Calculate current available balance
    const claims = await ReferralClaim.find({ userId: req.user._id });
    const pendingClaimsAmount = claims
      .filter(c => c.status === 'Pending' || c.status === 'Approved')
      .reduce((sum, c) => sum + c.amount, 0);

    const availableBalance = Math.max(0, (user.totalReferralEarnings || 0) - (user.claimedEarnings || 0) - pendingClaimsAmount);

    if (numAmount > availableBalance) {
      return res.status(400).json({
        success: false,
        error: `Insufficient earnings balance. Available for claim: ₹${availableBalance.toLocaleString()}`
      });
    }

    const newClaim = await ReferralClaim.create({
      userId: req.user._id,
      userName: user.name,
      userPhone: user.phone || 'N/A',
      amount: numAmount,
      payoutMethod: payoutMethod || 'UPI',
      payoutDetails: payoutDetails.trim(),
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Payout claim request submitted successfully!',
      data: newClaim
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all payout claim requests (Admin)
// @route   GET /api/referrals/admin/claims
// @access  Private/Admin
exports.getAdminClaims = async (req, res) => {
  try {
    const claims = await ReferralClaim.find()
      .populate('userId', 'name email phone totalReferralEarnings claimedEarnings')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: claims.length,
      data: claims
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update claim status and record transaction reference (Admin)
// @route   PUT /api/referrals/admin/claims/:id/status
// @access  Private/Admin
exports.updateClaimStatus = async (req, res) => {
  try {
    const { status, transactionRef, adminNotes } = req.body;

    const claim = await ReferralClaim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim request not found' });
    }

    const prevStatus = claim.status;

    if (status) claim.status = status;
    if (transactionRef !== undefined) claim.transactionRef = transactionRef;
    if (adminNotes !== undefined) claim.adminNotes = adminNotes;

    await claim.save();

    // When status changes to 'Paid', increment user's claimedEarnings
    if (status === 'Paid' && prevStatus !== 'Paid') {
      await User.findByIdAndUpdate(claim.userId, {
        $inc: { claimedEarnings: claim.amount }
      });
    }

    res.status(200).json({
      success: true,
      data: claim
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

