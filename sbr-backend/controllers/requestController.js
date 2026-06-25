const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const { sendNotificationToUser } = require('../utils/notificationHelper');

// @desc    Create a new service request
// @route   POST /api/requests
// @access  Private (Customer or Admin)
exports.createRequest = async (req, res) => {
  try {
    const { serviceType, description, customerAddress } = req.body;

    const requestData = {
      customerId: req.user.role === 'ADMIN' ? req.body.customerId : req.user.id,
      serviceType,
      description,
      customerAddress,
      createdBy: req.user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'
    };

    if (!requestData.customerId) {
      return res.status(400).json({ success: false, error: 'Please specify customer ID' });
    }

    const request = await ServiceRequest.create(requestData);

    // Notify Admins about new request
    const admins = await User.find({ role: 'ADMIN' });
    admins.forEach(admin => {
      sendNotificationToUser(admin._id, {
        title: 'New Service Request',
        body: `A new request for ${serviceType} has been submitted.`
      });
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get list of service requests (Filtered by User Role)
// @route   GET /api/requests
// @access  Private
exports.getRequests = async (req, res) => {
  try {
    let query = {};

    // Filters based on User role
    if (req.user.role === 'CUSTOMER') {
      query.customerId = req.user.id;
    } else if (req.user.role === 'AGENT') {
      query.assignedAgentId = req.user.id;
    }

    // Optional query parameter filtering
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    const requests = await ServiceRequest.find(query)
      .populate('customerId', 'name email phone role')
      .populate('assignedAgentId', 'name email phone role currentLat currentLng')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single service request details
// @route   GET /api/requests/:id
// @access  Private
exports.getRequestById = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customerId', 'name email phone role')
      .populate('assignedAgentId', 'name email phone role currentLat currentLng');

    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    // Verify access permission
    if (req.user.role === 'CUSTOMER' && request.customerId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this request' });
    }
    if (req.user.role === 'AGENT' && request.assignedAgentId && request.assignedAgentId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this request' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update a service request
// @route   PUT /api/requests/:id
// @access  Private
exports.updateRequest = async (req, res) => {
  try {
    let request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    // Check ownership
    if (req.user.role === 'CUSTOMER' && request.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to modify this request' });
    }

    request = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Assign request to agent
// @route   PUT /api/requests/:id/assign
// @access  Private/Admin
exports.assignRequest = async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) {
      return res.status(400).json({ success: false, error: 'Please provide agentId' });
    }

    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'AGENT') {
      return res.status(400).json({ success: false, error: 'Invalid agent ID specified' });
    }

    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { assignedAgentId: agentId, status: 'Assigned' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    // Notify Agent
    sendNotificationToUser(agentId, {
      title: 'New Service Request Assigned',
      body: `You have been assigned to service request #${request._id}`
    });

    // Notify Customer
    sendNotificationToUser(request.customerId, {
      title: 'Agent Assigned to Your Request',
      body: `${agent.name} has been assigned to your request.`
    });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update service request status
// @route   PUT /api/requests/:id/status
// @access  Private (Agent or Admin)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status, requestReview } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Please provide request status' });
    }

    let request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    // Verify authorized agent assignment
    if (req.user.role === 'AGENT' && request.assignedAgentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to change this request status' });
    }

    const updates = { status };
    if (status === 'Accepted') {
      updates.acceptedAt = Date.now();
    } else if (status === 'Completed') {
      updates.completedAt = Date.now();
    }

    request = await ServiceRequest.findByIdAndUpdate(req.params.id, updates, { new: true });

    // Notify Customer of status update
    sendNotificationToUser(request.customerId, {
      title: 'Service Request Status Updated',
      body: `Your service request is now: ${status}`
    });

    // If completed and requestReview is chosen, send review mail + push notification
    if (status === 'Completed' && (requestReview === true || requestReview === 'true')) {
      const customer = await User.findById(request.customerId);
      if (customer) {
        // Send email
        if (customer.email) {
          const { sendReviewEmail } = require('../utils/emailHelper');
          await sendReviewEmail(customer.email, customer.name, request.serviceType);
        }
        // Send review request notification
        sendNotificationToUser(request.customerId, {
          title: 'Share Your Feedback',
          body: 'Thank you for choosing Sri Balaji Renewables! Tap to review us on Google.',
          data: {
            type: 'review_request',
            url: 'https://g.page/r/CbdJS-IzWTe2EBE/review'
          }
        });
      }
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update service request image (before/after image URL)
// @route   PUT /api/requests/:id/image
// @access  Private (Agent or Admin)
exports.updateRequestImage = async (req, res) => {
  try {
    const { imageUrl, imageType } = req.body; // imageType: 'before' or 'after'
    if (!imageUrl || !imageType) {
      return res.status(400).json({ success: false, error: 'Please provide imageUrl and imageType' });
    }

    let request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    // Verify assignment
    if (req.user.role === 'AGENT' && request.assignedAgentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update images for this request' });
    }

    const fieldToUpdate = imageType === 'before' ? 'beforeImageUrl' : 'afterImageUrl';
    request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { [fieldToUpdate]: imageUrl },
      { new: true }
    );

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update service request payment details
// @route   PUT /api/requests/:id/payment
// @access  Private (Agent or Admin)
exports.updatePaymentDetails = async (req, res) => {
  try {
    const { amount, method } = req.body;
    if (amount === undefined || !method) {
      return res.status(400).json({ success: false, error: 'Please provide payment amount and method' });
    }

    let request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    // Verify assignment
    if (req.user.role === 'AGENT' && request.assignedAgentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to record payment for this request' });
    }

    request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      {
        paymentAmount: amount,
        paymentMethod: method,
        paymentStatus: 'Paid',
        paymentTimestamp: Date.now()
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Append agent live location coordinates to route tracking path
// @route   POST /api/requests/:id/location
// @access  Private (Agent only)
exports.appendAgentLocation = async (req, res) => {
  try {
    if (req.user.role !== 'AGENT') {
      return res.status(403).json({ success: false, error: 'Only agents can submit request tracking locations' });
    }

    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Please provide both latitude and longitude' });
    }

    let request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    if (request.assignedAgentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized agent for this tracking session' });
    }

    // Append to locationPath list
    request.locationPath.push({
      latitude,
      longitude,
      timestamp: Date.now()
    });

    await request.save();

    // Sync agent profile live coordinates
    await User.findByIdAndUpdate(req.user.id, {
      currentLat: latitude,
      currentLng: longitude
    });

    res.status(200).json({ success: true, data: request.locationPath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete service request
// @route   DELETE /api/requests/:id
// @access  Private/Admin
exports.deleteRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    await request.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
