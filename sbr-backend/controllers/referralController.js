const Referral = require('../models/Referral');
const User = require('../models/User');
const Product = require('../models/Product');

// Helper to generate unique referral code
const generateReferralCode = (name) => {
  const prefix = name ? name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'SBR') : 'SBR';
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `SBR-${prefix}${randNum}`;
};

// @desc    Get current user's referral code, stats, and submitted referrals
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
      // Ensure code is unique
      let existing = await User.findOne({ referralCode: code });
      while (existing) {
        code = generateReferralCode(user.name);
        existing = await User.findOne({ referralCode: code });
      }
      user.referralCode = code;
      await user.save();
    }

    const referrals = await Referral.find({ referrerId: req.user._id }).sort({ createdAt: -1 });

    const totalInvited = referrals.length;
    const convertedCount = referrals.filter(r => r.status === 'Purchased' || r.status === 'Reward Credited').length;
    
    let totalEarnings = user.totalReferralEarnings || 0;
    let pendingEarnings = 0;

    referrals.forEach(r => {
      if (r.status === 'Reward Credited') {
        // Included in totalEarnings
      } else if (r.status === 'Purchased' || r.status === 'Pending' || r.status === 'Contacted') {
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
        pendingEarnings,
        referrals
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
