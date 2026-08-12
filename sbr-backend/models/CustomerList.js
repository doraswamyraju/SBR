const mongoose = require('mongoose');

const CustomerListSchema = new mongoose.Schema(
  {
    sNo: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      required: [true, 'Please add customer name']
    },
    address: {
      type: String,
      default: ''
    },
    model: {
      type: String,
      default: ''
    },
    purchaseDate: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Add index for fast multi-field searching
CustomerListSchema.index({ name: 'text', address: 'text', model: 'text', sNo: 'text' });

module.exports = mongoose.model('CustomerList', CustomerListSchema);
