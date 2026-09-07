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
  sku: {
    type: String,
    trim: true,
    sparse: true
  },
  posProductId: {
    type: Number,
    index: true,
    sparse: true
  },
  stockLevel: {
    type: Number,
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 0
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    default: 'https://placehold.co/400x300/00529B/FFFFFF?text=SBR+Product'
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
