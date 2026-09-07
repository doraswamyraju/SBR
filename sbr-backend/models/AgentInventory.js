const mongoose = require('mongoose');

const AgentInventorySchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    posProductId: {
      type: Number,
      index: true,
      default: null
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      default: 'General Spares'
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity cannot be negative']
    },
    minThreshold: {
      type: Number,
      default: 1
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure 1 entry per agent per product
AgentInventorySchema.index({ agentId: 1, posProductId: 1 }, { unique: true, sparse: true });
AgentInventorySchema.index({ agentId: 1, productName: 1 });

module.exports = mongoose.model('AgentInventory', AgentInventorySchema);
