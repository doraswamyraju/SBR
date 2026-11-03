const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide customer name'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide contact phone number'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    productOrService: {
      type: String,
      trim: true,
      default: 'General Inquiry'
    },
    source: {
      type: String,
      enum: ['Hero Quote Form', 'Discount Popup', 'Product Page Quote', 'Contact Form', 'Footer Quote', 'Blog Inquiry', 'Other'],
      default: 'Other'
    },
    referralCode: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Closed'],
      default: 'New'
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Lead', LeadSchema);

