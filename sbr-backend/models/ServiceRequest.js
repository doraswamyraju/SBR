const mongoose = require('mongoose');

const LocationPointSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ServiceRequestSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please add a customer ID']
    },
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    serviceType: {
      type: String,
      required: [true, 'Please specify the service type']
    },
    description: {
      type: String
    },
    customerAddress: {
      type: String,
      required: [true, 'Please add the customer address']
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    createdBy: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN'],
      default: 'CUSTOMER'
    },
    acceptedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    beforeImageUrl: {
      type: String
    },
    afterImageUrl: {
      type: String
    },
    paymentAmount: {
      type: Number,
      default: 0.0
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending'
    },
    paymentMethod: {
      type: String
    },
    paymentTimestamp: {
      type: Date
    },
    locationPath: {
      type: [LocationPointSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
