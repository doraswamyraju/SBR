const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Product = require('../models/Product');
const { sendNotificationToUser, sendNotificationToRole } = require('../utils/notificationHelper');
const { emitSocketEvent } = require('../utils/socketHelper');
const {
  sendReviewEmail,
  sendTicketConfirmationEmail,
  sendAgentAssignedEmail,
  sendServiceCompletedInvoiceEmail
} = require('../utils/emailHelper');


// @desc    Create a new service request
// @route   POST /api/requests
// @access  Private (Customer or Admin)
exports.createRequest = async (req, res) => {
  try {
    const { serviceType, description, customerAddress, latitude, longitude } = req.body;

    const requestData = {
      customerId: req.user.role === 'ADMIN' ? req.body.customerId : req.user.id,
      serviceType,
      description,
      customerAddress,
      latitude,
      longitude,
      createdBy: req.user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'
    };

    if (!requestData.customerId) {
      return res.status(400).json({ success: false, error: 'Please specify customer ID' });
    }

    let request = await ServiceRequest.create(requestData);
    request = await ServiceRequest.findById(request._id)
      .populate('customerId', 'name email role phone address photoUrl isRecurring nextServiceDate')
      .populate('assignedAgentId', 'name email role phone specialization location status rating completedJobs');

    // Notify Admins and Store In-Charges about new request
    await sendNotificationToRole(['ADMIN', 'STORE_INCHARGE'], {
      title: 'New Service Request',
      body: `A new request for ${serviceType} at ${customerAddress} has been submitted.`,
      data: {
        requestId: String(request._id),
        type: 'REQUEST_CREATED'
      }
    });

    // Send confirmation email to Customer
    if (request.customerId && request.customerId.email) {
      sendTicketConfirmationEmail(request.customerId.email, request.customerId.name, request);
    }

    // Broadcast real-time Socket.IO events to Admin and Store In-Charge
    emitSocketEvent('role:ADMIN', 'request:created', request);
    emitSocketEvent('role:STORE_INCHARGE', 'request:created', request);

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

    // Auto-populate timestamps and payment amount if paying or completing
    if (req.body.paymentStatus === 'Paid' || req.body.status === 'Completed') {
      if (!req.body.paymentTimestamp) req.body.paymentTimestamp = new Date();
      if (!req.body.completedAt) req.body.completedAt = new Date();
      if ((req.body.finalAmount !== undefined && req.body.finalAmount !== null) && (!req.body.paymentAmount || req.body.paymentAmount === 0)) {
        req.body.paymentAmount = req.body.finalAmount;
      }
    }

    request = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('customerId', 'name email role phone address photoUrl isRecurring nextServiceDate')
      .populate('assignedAgentId', 'name email role phone specialization location status rating completedJobs');

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

    const existingRequest = await ServiceRequest.findById(req.params.id);
    if (!existingRequest) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    const previousAgentId = existingRequest.assignedAgentId;
    if (previousAgentId && previousAgentId.toString() !== agentId) {
      sendNotificationToUser(previousAgentId, {
        title: 'Service Request Unassigned',
        body: `You have been unassigned from service request #${existingRequest._id}`
      });
    }

    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { assignedAgentId: agentId, status: 'Assigned' },
      { new: true }
    )
      .populate('customerId', 'name email role phone address photoUrl isRecurring nextServiceDate')
      .populate('assignedAgentId', 'name email role phone specialization location status rating completedJobs');

    // Notify Agent
    sendNotificationToUser(agentId, {
      title: 'New Service Request Assigned',
      body: `You have been assigned to service request #${String(request._id).slice(-6).toUpperCase()}`,
      data: {
        requestId: String(request._id),
        type: 'REQUEST_ASSIGNED'
      }
    });

    // Notify Customer
    if (request.customerId) {
      const customerUserId = request.customerId._id || request.customerId;
      sendNotificationToUser(customerUserId, {
        title: 'Technician Assigned',
        body: `${agent.name} has been assigned to your service request #${String(request._id).slice(-6).toUpperCase()}.`,
        data: {
          requestId: String(request._id),
          type: 'REQUEST_ASSIGNED'
        }
      });

      // Send email to customer
      if (request.customerId.email) {
        sendAgentAssignedEmail(
          request.customerId.email,
          request.customerId.name,
          agent.name,
          agent.phone,
          request
        );
      }
    }

    // Broadcast real-time Socket.IO events
    emitSocketEvent(`request:${request._id}`, 'request:status:update', {
      requestId: String(request._id),
      status: 'Assigned',
      assignedAgentId: agentId,
      agentName: agent.name
    });
    emitSocketEvent(`agent:${agentId}`, 'request:assigned', request);
    emitSocketEvent('role:ADMIN', 'request:assigned', request);
    emitSocketEvent('role:STORE_INCHARGE', 'request:assigned', request);

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
      const AgentInventory = require('../models/AgentInventory');
      
      // If agent explicitly provided components during assessment
      let componentsToCheck = [];
      if (Array.isArray(req.body.requiredComponents)) {
        componentsToCheck = req.body.requiredComponents;
        updates.requiredComponents = componentsToCheck.map(c => ({
          posProductId: c.posProductId || null,
          productId: c.productId || null,
          name: c.name || c.productName,
          sku: c.sku || '',
          quantity: Number(c.quantity) || 1,
          unitPrice: Number(c.unitPrice || c.price) || 0
        }));
        // Compute inventoryTotal
        updates.inventoryTotal = updates.requiredComponents.reduce(
          (sum, it) => sum + (it.quantity * it.unitPrice), 0
        );
      } else if (request.requiredComponents && request.requiredComponents.length > 0) {
        componentsToCheck = request.requiredComponents;
      }

      if (componentsToCheck.length > 0) {
        const missingComponents = [];
        for (const comp of componentsToCheck) {
          const reqQty = Number(comp.quantity) || 1;
          let invQuery = { agentId: req.user._id };
          if (comp.posProductId) invQuery.posProductId = comp.posProductId;
          else invQuery.productName = comp.name || comp.productName;

          const invItem = await AgentInventory.findOne(invQuery);
          const availableQty = invItem ? invItem.quantity : 0;

          if (availableQty < reqQty) {
            missingComponents.push({
              posProductId: comp.posProductId,
              name: comp.name || comp.productName,
              sku: comp.sku || '',
              requiredQuantity: reqQty,
              availableQuantity: availableQty,
              shortageQuantity: reqQty - availableQty
            });
          }
        }

        if (missingComponents.length > 0) {
          return res.status(400).json({
            success: false,
            stockShortage: true,
            message: 'Insufficient van kit inventory to accept this service request. Please raise an indent to Store In-Charge.',
            missingComponents
          });
        }
      }
      updates.acceptedAt = Date.now();
    } else if (status === 'Completed') {
      updates.completedAt = Date.now();
      if (requestReview === true || requestReview === 'true') {
        updates.requestReview = true;
      }

      // If updated parts list is supplied upon completion
      if (Array.isArray(req.body.requiredComponents)) {
        updates.requiredComponents = req.body.requiredComponents.map(c => ({
          posProductId: c.posProductId || null,
          productId: c.productId || null,
          name: c.name || c.productName,
          sku: c.sku || '',
          quantity: Number(c.quantity) || 1,
          unitPrice: Number(c.unitPrice || c.price) || 0
        }));
        updates.inventoryTotal = updates.requiredComponents.reduce(
          (sum, it) => sum + (it.quantity * it.unitPrice), 0
        );
      }

      // Deduct final components from AgentInventory
      const componentsToDeduct = updates.requiredComponents || request.requiredComponents;
      if (componentsToDeduct && componentsToDeduct.length > 0) {
        try {
          const AgentInventory = require('../models/AgentInventory');
          for (const comp of componentsToDeduct) {
            const usedQty = Number(comp.quantity) || 1;
            let invQuery = { agentId: request.assignedAgentId };
            if (comp.posProductId) invQuery.posProductId = comp.posProductId;
            else invQuery.productName = comp.name;

            await AgentInventory.findOneAndUpdate(
              invQuery,
              { $inc: { quantity: -usedQty }, lastUpdated: new Date() }
            );
          }
        } catch (invErr) {
          console.error('Error deducting agent inventory on job completion:', invErr);
        }
      }
    }

    request = await ServiceRequest.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('customerId', 'name email role phone address photoUrl isRecurring nextServiceDate')
      .populate('assignedAgentId', 'name email role phone specialization location status rating completedJobs');

    // Resolve role-tailored push notification for Customer
    let customerNotifTitle = 'Service Request Update';
    let customerNotifBody = `Your service request #${String(request._id).slice(-6).toUpperCase()} is now: ${status}`;

    if (status === 'Accepted') {
      customerNotifTitle = 'Technician En Route';
      customerNotifBody = `${request.assignedAgentId?.name || 'Your technician'} has accepted the request and is heading to your location.`;
    } else if (status === 'In Progress') {
      customerNotifTitle = 'Service In Progress';
      customerNotifBody = `Work has begun on your service request #${String(request._id).slice(-6).toUpperCase()}.`;
    } else if (status === 'Completed') {
      customerNotifTitle = 'Service Completed';
      customerNotifBody = `Your service request #${String(request._id).slice(-6).toUpperCase()} has been successfully completed!`;
    }

    const customerUserId = request.customerId?._id || request.customerId;
    if (customerUserId) {
      sendNotificationToUser(customerUserId, {
        title: customerNotifTitle,
        body: customerNotifBody,
        data: {
          requestId: String(request._id),
          type: `STATUS_${status.toUpperCase().replace(/\s+/g, '_')}`
        }
      });
    }

    // Broadcast real-time Socket.IO event
    emitSocketEvent(`request:${request._id}`, 'request:status:update', {
      requestId: String(request._id),
      status,
      timestamp: Date.now()
    });
    emitSocketEvent('role:ADMIN', 'request:status:update', {
      requestId: String(request._id),
      status,
      agentId: request.assignedAgentId?._id
    });
    emitSocketEvent('role:STORE_INCHARGE', 'request:status:update', {
      requestId: String(request._id),
      status,
      agentId: request.assignedAgentId?._id
    });

    // Notify Admins and Store In-Charge when request is Completed
    if (status === 'Completed') {
      await sendNotificationToRole(['ADMIN', 'STORE_INCHARGE'], {
        title: 'Service Request Completed',
        body: `Ticket #${String(request._id).slice(-6).toUpperCase()} completed by ${request.assignedAgentId?.name || 'Agent'}.`,
        data: {
          requestId: String(request._id),
          type: 'REQUEST_COMPLETED'
        }
      });
    }

    // If completed, send invoice receipt & Google review email to Customer
    if (status === 'Completed') {
      const customer = await User.findById(customerUserId);
      if (customer) {
        let reviewUrl = 'https://g.page/r/CbdJS-IzWTe2EBE/review';
        try {
          const Settings = require('../models/Settings');
          const setting = await Settings.findOne({ key: 'reviewUrl' });
          if (setting && setting.value) {
            reviewUrl = setting.value;
          }
        } catch (err) {
          console.error('Error fetching review URL from settings:', err.message);
        }

        if (customer.email) {
          await sendServiceCompletedInvoiceEmail(customer.email, customer.name, request, reviewUrl);
        }
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
    )
      .populate('customerId', 'name email role phone address photoUrl isRecurring nextServiceDate')
      .populate('assignedAgentId', 'name email role phone specialization location status rating completedJobs');

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
    const { amount, method, inventoryTotal, serviceCharge, discount, discountRemarks, requiredComponents } = req.body;
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

    const payUpdates = {
      paymentAmount: Number(amount) || 0,
      finalAmount: Number(amount) || 0,
      paymentMethod: method,
      paymentStatus: 'Paid',
      paymentTimestamp: Date.now()
    };

    if (Array.isArray(requiredComponents)) {
      payUpdates.requiredComponents = requiredComponents.map(c => ({
        posProductId: c.posProductId || null,
        productId: c.productId || null,
        name: c.name || c.productName,
        sku: c.sku || '',
        quantity: Number(c.quantity) || 1,
        unitPrice: Number(c.unitPrice || c.price) || 0
      }));
      payUpdates.inventoryTotal = payUpdates.requiredComponents.reduce(
        (sum, it) => sum + (it.quantity * it.unitPrice), 0
      );
    } else if (inventoryTotal !== undefined) {
      payUpdates.inventoryTotal = Number(inventoryTotal) || 0;
    }

    if (serviceCharge !== undefined) payUpdates.serviceCharge = Number(serviceCharge) || 0;
    if (discount !== undefined) payUpdates.discount = Number(discount) || 0;
    if (discountRemarks !== undefined) payUpdates.discountRemarks = discountRemarks || '';

    request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      payUpdates,
      { new: true }
    )
      .populate('customerId', 'name email role phone address photoUrl isRecurring nextServiceDate')
      .populate('assignedAgentId', 'name email role phone specialization location status rating completedJobs');

    // Notify Admins about payment collection
    const admins = await User.find({ role: 'ADMIN' });
    admins.forEach(admin => {
      sendNotificationToUser(admin._id, {
        title: 'Payment Collected',
        body: `Agent ${request.assignedAgentId?.name || 'Agent'} collected ₹${amount} via ${method} for request #${request._id}`
      });
    });

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

// @desc    Public website quote/service booking request (with optional Referral Code)
// @route   POST /api/requests/book OR POST /api/service-requests/book
// @access  Public
exports.bookPublicRequest = async (req, res) => {
  try {
    const { customerName, name, phone, address, serviceType, description, referralCode } = req.body;

    const finalName = customerName || name || 'Website Lead';
    const finalPhone = phone || '';
    const finalAddress = address || 'Tirupati';
    const finalServiceType = serviceType || 'Solar Water Heaters';

    if (!finalPhone) {
      return res.status(400).json({ success: false, error: 'Please provide contact phone number.' });
    }

    // Find or create customer account
    let customerUser = await User.findOne({ phone: finalPhone });
    if (!customerUser) {
      const tempEmail = `lead_${Date.now()}@sriddha.com`;
      customerUser = await User.create({
        name: finalName,
        email: tempEmail,
        password: `sbr${Math.floor(100000 + Math.random() * 900000)}`,
        phone: finalPhone,
        address: finalAddress,
        role: 'CUSTOMER'
      });
    }

    // Create Service Request
    const request = await ServiceRequest.create({
      customerId: customerUser._id,
      serviceType: finalServiceType,
      description: description || `Requesting quote for ${finalServiceType}`,
      customerAddress: finalAddress,
      createdBy: 'CUSTOMER'
    });

    // Check if referral code is provided
    if (referralCode && referralCode.trim() !== '') {
      const cleanCode = referralCode.trim().toUpperCase();
      const referrerUser = await User.findOne({ referralCode: cleanCode });

      if (referrerUser) {
        // Calculate reward amount using Product commission rules
        const prod = await Product.findOne({ name: { $regex: finalServiceType, $options: 'i' } });
        let reward = 500;
        if (prod) {
          if (prod.commissionType === 'percentage') {
            reward = Math.round((prod.basePrice * prod.commissionValue) / 100);
          } else {
            reward = prod.commissionValue || 500;
          }
        }

        // Create Referral lead record for referrer
        await Referral.create({
          referrerId: referrerUser._id,
          referralCode: cleanCode,
          refereeName: finalName,
          refereePhone: finalPhone,
          productId: prod ? prod._id : null,
          productName: prod ? prod.name : finalServiceType,
          rewardAmount: reward,
          notes: `Public website booking form lead with referral code: ${cleanCode}`,
          status: 'Pending'
        });
      }
    }

    // Notify Admins
    const admins = await User.find({ role: 'ADMIN' });
    admins.forEach(admin => {
      sendNotificationToUser(admin._id, {
        title: 'New Website Service Booking',
        body: `Booking received from ${finalName} (${finalPhone}) for ${finalServiceType}`
      });
    });

    res.status(201).json({
      success: true,
      message: 'Request received! SBR team will contact you shortly.',
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

