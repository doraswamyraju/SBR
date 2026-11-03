const Lead = require('../models/Lead');
const User = require('../models/User');
const Product = require('../models/Product');
const Referral = require('../models/Referral');
const { sendNotificationToUser } = require('../utils/notificationHelper');

// @desc    Submit a lead from public website forms
// @route   POST /api/leads/submit
// @access  Public
exports.submitLead = async (req, res) => {
  try {
    const {
      name,
      customerName,
      firstName,
      phone,
      email,
      address,
      product,
      serviceType,
      productOrService,
      source,
      notes,
      message,
      referralCode
    } = req.body;

    const finalName = name || customerName || firstName || 'Website Visitor';
    const finalPhone = (phone || '').toString().trim();
    const finalEmail = (email || '').toString().trim();
    const finalAddress = (address || '').toString().trim();
    const finalProduct = product || serviceType || productOrService || 'General Inquiry';
    const finalNotes = notes || message || '';
    const finalSource = source || 'Other';

    if (!finalPhone && !finalEmail) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least a phone number or email address.'
      });
    }

    const lead = await Lead.create({
      name: finalName,
      phone: finalPhone,
      email: finalEmail,
      address: finalAddress,
      productOrService: finalProduct,
      source: finalSource,
      notes: finalNotes,
      referralCode: (referralCode || '').trim().toUpperCase(),
      status: 'New'
    });

    // Check if referral code is attached and record reward lead if valid
    if (referralCode && referralCode.trim() !== '') {
      try {
        const cleanCode = referralCode.trim().toUpperCase();
        const referrerUser = await User.findOne({ referralCode: cleanCode });
        if (referrerUser) {
          const prod = await Product.findOne({ name: { $regex: finalProduct, $options: 'i' } });
          let reward = 500;
          if (prod) {
            if (prod.commissionType === 'percentage') {
              reward = Math.round((prod.basePrice * prod.commissionValue) / 100);
            } else {
              reward = prod.commissionValue || 500;
            }
          }

          await Referral.create({
            referrerId: referrerUser._id,
            referralCode: cleanCode,
            refereeName: finalName,
            refereePhone: finalPhone || 'Not provided',
            productId: prod ? prod._id : null,
            productName: prod ? prod.name : finalProduct,
            rewardAmount: reward,
            notes: `Form submission via [${finalSource}] with referral code: ${cleanCode}`,
            status: 'Pending'
          });
        }
      } catch (refErr) {
        console.error('Error auto-creating referral record for lead:', refErr);
      }
    }

    // Notify all active Admin accounts
    try {
      const admins = await User.find({ role: 'ADMIN' });
      admins.forEach(admin => {
        sendNotificationToUser(admin._id, {
          title: `New Lead: ${finalName}`,
          body: `Source: ${finalSource} | Phone: ${finalPhone || 'N/A'} | Product: ${finalProduct}`
        });
      });
    } catch (notifErr) {
      console.error('Error notifying admins about lead:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your information has been received. Our team will contact you shortly.',
      data: lead
    });
  } catch (error) {
    console.error('submitLead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all submitted leads (Admin only)
// @route   GET /api/leads
// @access  Private (ADMIN)
exports.getLeads = async (req, res) => {
  try {
    const { status, source, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (source && source !== 'All') {
      query.source = source;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { productOrService: regex },
        { notes: regex },
        { address: regex }
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (error) {
    console.error('getLeads error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update a lead status or admin notes
// @route   PUT /api/leads/:id
// @access  Private (ADMIN)
exports.updateLead = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    if (status) lead.status = status;
    if (adminNotes !== undefined) lead.adminNotes = adminNotes;

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    console.error('updateLead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Private (ADMIN)
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    await lead.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('deleteLead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

