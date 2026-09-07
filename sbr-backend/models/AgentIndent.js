const mongoose = require('mongoose');

const IndentItemSchema = new mongoose.Schema(
  {
    posProductId: {
      type: Number,
      default: null
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    productName: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      default: ''
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    dispatchedQuantity: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const AgentIndentSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      default: null
    },
    items: [IndentItemSchema],
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'DISPATCHED', 'REJECTED'],
      default: 'REQUESTED',
      index: true
    },
    storeInchargeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    agentRemarks: {
      type: String,
      default: ''
    },
    inchargeRemarks: {
      type: String,
      default: ''
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    dispatchedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AgentIndent', AgentIndentSchema);
