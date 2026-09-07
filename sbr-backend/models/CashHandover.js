const mongoose = require('mongoose');

const CashHandoverSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the agent submitting cash']
    },
    storeInchargeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    date: {
      type: String, // Stored as YYYY-MM-DD for straightforward daily grouping
      required: true
    },
    totalCollectedCash: {
      type: Number,
      required: [true, 'Please specify the total collected cash amount'],
      min: [0, 'Cash amount cannot be negative']
    },
    completedRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceRequest'
      }
    ],
    denominations: {
      type: Map,
      of: Number,
      default: {}
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'ACKNOWLEDGED', 'DISCREPANCY'],
      default: 'SUBMITTED'
    },
    acknowledgedAmount: {
      type: Number,
      default: null
    },
    discrepancyAmount: {
      type: Number,
      default: 0
    },
    agentNotes: {
      type: String,
      default: ''
    },
    inchargeNotes: {
      type: String,
      default: ''
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    acknowledgedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

CashHandoverSchema.index({ agentId: 1, date: 1 });
CashHandoverSchema.index({ status: 1 });

module.exports = mongoose.model('CashHandover', CashHandoverSchema);
