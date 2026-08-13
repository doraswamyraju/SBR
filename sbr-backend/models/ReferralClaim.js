const mongoose = require('mongoose');

const referralClaimSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [500, 'Minimum claim amount is ₹500']
  },
  payoutMethod: {
    type: String,
    enum: ['UPI', 'Bank Transfer'],
    default: 'UPI'
  },
  payoutDetails: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
    default: 'Pending'
  },
  transactionRef: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('ReferralClaim', referralClaimSchema);
