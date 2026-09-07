const CashHandover = require('../models/CashHandover');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

// Helper to get formatted date string YYYY-MM-DD in local time
const getTodayString = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get agent's daily cash collection summary
// @route   GET /api/handovers/agent-daily-summary
// @access  Private (Agent)
exports.getAgentDailySummary = async (req, res) => {
  try {
    const agentId = req.user._id;
    const targetDateStr = req.query.date || getTodayString();

    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

    // Find completed requests by this agent on the target date with Cash payment
    const completedRequests = await ServiceRequest.find({
      assignedAgentId: agentId,
      status: 'Completed',
      paymentStatus: 'Paid',
      paymentMethod: { $regex: /^cash$/i },
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    }).select('_id serviceType customerAddress paymentAmount paymentMethod completedAt');

    const totalCash = completedRequests.reduce((sum, req) => sum + (Number(req.paymentAmount) || 0), 0);

    // Check if an existing handover has already been submitted for this date
    const existingHandover = await CashHandover.findOne({
      agentId,
      date: targetDateStr
    }).populate('storeInchargeId', 'name phone email');

    res.status(200).json({
      success: true,
      data: {
        date: targetDateStr,
        totalCash,
        requestCount: completedRequests.length,
        completedRequests,
        alreadySubmitted: !!existingHandover,
        handoverStatus: existingHandover ? existingHandover.status : 'NOT_SUBMITTED',
        existingHandover
      }
    });
  } catch (error) {
    console.error('getAgentDailySummary Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Agent submits End-of-Day (EOD) cash collection
// @route   POST /api/handovers/submit
// @access  Private (Agent)
exports.submitHandover = async (req, res) => {
  try {
    const agentId = req.user._id;
    let { date, totalCollectedCash, completedRequestIds, denominations, agentNotes } = req.body;

    const targetDate = date || getTodayString();
    const amount = Number(totalCollectedCash);

    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({ success: false, error: 'Valid collected cash amount is required.' });
    }

    // Check if there is an existing handover
    let existing = await CashHandover.findOne({ agentId, date: targetDate });

    if (existing && existing.status === 'ACKNOWLEDGED') {
      return res.status(400).json({
        success: false,
        error: 'Cash handover for this date has already been acknowledged and finalized.'
      });
    }

    if (existing && existing.status === 'SUBMITTED') {
      // Update existing pending submission
      existing.totalCollectedCash = amount;
      existing.completedRequests = completedRequestIds || existing.completedRequests;
      existing.denominations = denominations || existing.denominations;
      existing.agentNotes = agentNotes !== undefined ? agentNotes : existing.agentNotes;
      existing.submittedAt = new Date();

      await existing.save();

      return res.status(200).json({
        success: true,
        message: 'Cash handover submission updated successfully.',
        data: existing
      });
    }

    const newHandover = await CashHandover.create({
      agentId,
      date: targetDate,
      totalCollectedCash: amount,
      completedRequests: completedRequestIds || [],
      denominations: denominations || {},
      agentNotes: agentNotes || '',
      status: 'SUBMITTED',
      submittedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Cash handover submitted successfully to Store In-Charge.',
      data: newHandover
    });
  } catch (error) {
    console.error('submitHandover Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get pending handovers for Store In-Charge / Admin verification
// @route   GET /api/handovers/pending
// @access  Private (STORE_INCHARGE, ADMIN)
exports.getPendingHandovers = async (req, res) => {
  try {
    const handovers = await CashHandover.find({ status: 'SUBMITTED' })
      .populate('agentId', 'name email phone')
      .populate('completedRequests', 'serviceType customerAddress paymentAmount completedAt')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: handovers.length,
      data: handovers
    });
  } catch (error) {
    console.error('getPendingHandovers Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all handovers with filter options
// @route   GET /api/handovers/all
// @access  Private (STORE_INCHARGE, ADMIN)
exports.getAllHandovers = async (req, res) => {
  try {
    const { status, date, agentId } = req.query;
    let query = {};

    if (status) query.status = status;
    if (date) query.date = date;
    if (agentId) query.agentId = agentId;

    const handovers = await CashHandover.find(query)
      .populate('agentId', 'name email phone')
      .populate('storeInchargeId', 'name email phone')
      .populate('completedRequests', 'serviceType customerAddress paymentAmount completedAt')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: handovers.length,
      data: handovers
    });
  } catch (error) {
    console.error('getAllHandovers Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Agent views their own cash handover history
// @route   GET /api/handovers/my-submissions
// @access  Private (Agent)
exports.getMySubmissions = async (req, res) => {
  try {
    const handovers = await CashHandover.find({ agentId: req.user._id })
      .populate('storeInchargeId', 'name phone')
      .populate('completedRequests', 'serviceType customerAddress paymentAmount completedAt')
      .sort({ date: -1, submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: handovers.length,
      data: handovers
    });
  } catch (error) {
    console.error('getMySubmissions Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Store In-Charge acknowledges & verifies cash handover
// @route   POST /api/handovers/:id/acknowledge
// @access  Private (STORE_INCHARGE, ADMIN)
exports.acknowledgeHandover = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedAmount, inchargeNotes } = req.body;

    const handover = await CashHandover.findById(id).populate('agentId', 'name email phone');
    if (!handover) {
      return res.status(404).json({ success: false, error: 'Cash handover record not found.' });
    }

    const actualReceived = receivedAmount !== undefined ? Number(receivedAmount) : handover.totalCollectedCash;
    if (isNaN(actualReceived) || actualReceived < 0) {
      return res.status(400).json({ success: false, error: 'Valid received amount is required.' });
    }

    const discrepancy = Number((handover.totalCollectedCash - actualReceived).toFixed(2));

    handover.storeInchargeId = req.user._id;
    handover.acknowledgedAmount = actualReceived;
    handover.discrepancyAmount = discrepancy;
    handover.inchargeNotes = inchargeNotes || '';
    handover.acknowledgedAt = new Date();

    if (discrepancy !== 0) {
      handover.status = 'DISCREPANCY';
    } else {
      handover.status = 'ACKNOWLEDGED';
    }

    await handover.save();

    res.status(200).json({
      success: true,
      message: discrepancy !== 0
        ? `Handover recorded with a discrepancy of ₹${Math.abs(discrepancy)} (${discrepancy > 0 ? 'Shortage' : 'Excess'}).`
        : 'Cash handover verified and acknowledged successfully.',
      data: handover
    });
  } catch (error) {
    console.error('acknowledgeHandover Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
