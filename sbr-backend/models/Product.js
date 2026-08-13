const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  subtitle: {
    type: String,
    default: ''
  },
  tagline: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  features: [{
    type: String
  }],
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  faqs: [{
    q: { type: String, required: true },
    a: { type: String, required: true }
  }],

  // Pricing & Referral Commission Matrix
  basePrice: {
    type: Number,
    required: true,
    default: 0
  },
  mrp: {
    type: Number,
    default: 0
  },
  commissionType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed'
  },
  commissionValue: {
    type: Number,
    required: true,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
