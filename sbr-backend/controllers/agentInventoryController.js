const AgentInventory = require('../models/AgentInventory');
const AgentIndent = require('../models/AgentIndent');
const Product = require('../models/Product');
const User = require('../models/User');

// ==========================================
// 1. AGENT INVENTORY (VAN / KIT STOCK)
// ==========================================

// @desc    Get logged in agent's van stock
// @route   GET /api/agent-inventory/my-stock
// @access  Private (Agent)
exports.getMyInventory = async (req, res) => {
  try {
    const items = await AgentInventory.find({ agentId: req.user._id }).sort({ productName: 1 });
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('getMyInventory Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get specific agent's inventory
// @route   GET /api/agent-inventory/agent/:agentId
// @access  Private (STORE_INCHARGE, ADMIN)
exports.getAgentInventory = async (req, res) => {
  try {
    const items = await AgentInventory.find({ agentId: req.params.agentId })
      .populate('agentId', 'name email phone')
      .sort({ productName: 1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('getAgentInventory Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all agents' inventories summary
// @route   GET /api/agent-inventory/all
// @access  Private (STORE_INCHARGE, ADMIN)
exports.getAllAgentInventories = async (req, res) => {
  try {
    const items = await AgentInventory.find()
      .populate('agentId', 'name email phone')
      .sort({ agentId: 1, productName: 1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('getAllAgentInventories Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Directly transfer stock from Central Store to Agent Van
// @route   POST /api/agent-inventory/transfer
// @access  Private (STORE_INCHARGE, ADMIN)
exports.transferStockToAgent = async (req, res) => {
  try {
    const { agentId, posProductId, productId, productName, sku, category, quantity, minThreshold } = req.body;

    const qty = Number(quantity);
    if (!agentId || !productName || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: 'Valid agent, product name, and quantity (> 0) required.' });
    }

    // Check if agent exists
    const agent = await User.findById(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found.' });
    }

    // Upsert into AgentInventory
    let query = { agentId };
    if (posProductId) query.posProductId = posProductId;
    else query.productName = productName;

    let item = await AgentInventory.findOne(query);

    if (item) {
      item.quantity += qty;
      if (sku) item.sku = sku;
      if (posProductId) item.posProductId = posProductId;
      if (productId) item.productId = productId;
      if (category) item.category = category;
      if (minThreshold !== undefined) item.minThreshold = Number(minThreshold);
      item.lastUpdated = new Date();
      await item.save();
    } else {
      item = await AgentInventory.create({
        agentId,
        posProductId: posProductId || null,
        productId: productId || null,
        productName,
        sku: sku || '',
        category: category || 'General Spares',
        quantity: qty,
        minThreshold: Number(minThreshold) || 1,
        lastUpdated: new Date()
      });
    }

    // Optionally decrement Central Product stockLevel if matched
    if (posProductId || productId) {
      const prodQuery = posProductId ? { posProductId } : { _id: productId };
      await Product.findOneAndUpdate(prodQuery, { $inc: { stockLevel: -qty } });
    }

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${qty} unit(s) of "${productName}" to ${agent.name}'s van kit.`,
      data: item
    });
  } catch (error) {
    console.error('transferStockToAgent Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 2. AGENT INDENTS (PARTS REQUISITIONS)
// ==========================================

// @desc    Agent raises an indent for required parts
// @route   POST /api/indents/create
// @access  Private (Agent, Admin)
exports.createIndent = async (req, res) => {
  try {
    const agentId = req.user._id;
    const { serviceRequestId, items, agentRemarks } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one spare part item is required for an indent.' });
    }

    const formattedItems = items.map(it => ({
      posProductId: it.posProductId || null,
      productId: it.productId || null,
      productName: it.productName || it.name,
      sku: it.sku || '',
      requestedQuantity: Number(it.requestedQuantity || it.quantity || 1),
      dispatchedQuantity: 0
    }));

    const newIndent = await AgentIndent.create({
      agentId,
      serviceRequestId: serviceRequestId || null,
      items: formattedItems,
      agentRemarks: agentRemarks || '',
      status: 'REQUESTED',
      requestedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Indent request submitted to Store In-Charge.',
      data: newIndent
    });
  } catch (error) {
    console.error('createIndent Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get pending indents for Store In-Charge review
// @route   GET /api/indents/pending
// @access  Private (STORE_INCHARGE, ADMIN)
exports.getPendingIndents = async (req, res) => {
  try {
    const indents = await AgentIndent.find({ status: 'REQUESTED' })
      .populate('agentId', 'name email phone')
      .populate('serviceRequestId', 'serviceType customerAddress status')
      .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      count: indents.length,
      data: indents
    });
  } catch (error) {
    console.error('getPendingIndents Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all indents with optional status filter
// @route   GET /api/indents/all
// @access  Private (STORE_INCHARGE, ADMIN)
exports.getAllIndents = async (req, res) => {
  try {
    const { status, agentId } = req.query;
    let query = {};
    if (status) query.status = status;
    if (agentId) query.agentId = agentId;

    const indents = await AgentIndent.find(query)
      .populate('agentId', 'name email phone')
      .populate('storeInchargeId', 'name email phone')
      .populate('serviceRequestId', 'serviceType customerAddress status')
      .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      count: indents.length,
      data: indents
    });
  } catch (error) {
    console.error('getAllIndents Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Agent views their own raised indents
// @route   GET /api/indents/my-indents
// @access  Private (Agent)
exports.getMyIndents = async (req, res) => {
  try {
    const indents = await AgentIndent.find({ agentId: req.user._id })
      .populate('storeInchargeId', 'name phone')
      .populate('serviceRequestId', 'serviceType customerAddress status')
      .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      count: indents.length,
      data: indents
    });
  } catch (error) {
    console.error('getMyIndents Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Store In-Charge approves and dispatches items for an indent
// @route   POST /api/indents/:id/dispatch
// @access  Private (STORE_INCHARGE, ADMIN)
exports.dispatchIndent = async (req, res) => {
  try {
    const { id } = req.params;
    const { inchargeRemarks, itemQuantities } = req.body;

    const indent = await AgentIndent.findById(id).populate('agentId', 'name email phone');
    if (!indent) {
      return res.status(404).json({ success: false, error: 'Indent record not found.' });
    }

    if (indent.status === 'DISPATCHED') {
      return res.status(400).json({ success: false, error: 'This indent has already been dispatched.' });
    }

    // Process each item: update dispatchedQuantity and credit agent's AgentInventory
    for (let i = 0; i < indent.items.length; i++) {
      const item = indent.items[i];
      let dispatchQty = item.requestedQuantity;

      // Allow override from request body if specific quantities given
      if (itemQuantities && itemQuantities[item.productName] !== undefined) {
        dispatchQty = Number(itemQuantities[item.productName]);
      } else if (itemQuantities && item.posProductId && itemQuantities[item.posProductId] !== undefined) {
        dispatchQty = Number(itemQuantities[item.posProductId]);
      }

      item.dispatchedQuantity = dispatchQty;

      if (dispatchQty > 0) {
        // Increment AgentInventory
        let invQuery = { agentId: indent.agentId._id };
        if (item.posProductId) invQuery.posProductId = item.posProductId;
        else invQuery.productName = item.productName;

        let agentInv = await AgentInventory.findOne(invQuery);
        if (agentInv) {
          agentInv.quantity += dispatchQty;
          agentInv.lastUpdated = new Date();
          await agentInv.save();
        } else {
          await AgentInventory.create({
            agentId: indent.agentId._id,
            posProductId: item.posProductId || null,
            productId: item.productId || null,
            productName: item.productName,
            sku: item.sku || '',
            quantity: dispatchQty,
            minThreshold: 1,
            lastUpdated: new Date()
          });
        }

        // Decrement central Product stock
        if (item.posProductId || item.productId) {
          const prodQuery = item.posProductId ? { posProductId: item.posProductId } : { _id: item.productId };
          await Product.findOneAndUpdate(prodQuery, { $inc: { stockLevel: -dispatchQty } });
        }
      }
    }

    indent.status = 'DISPATCHED';
    indent.storeInchargeId = req.user._id;
    indent.inchargeRemarks = inchargeRemarks || '';
    indent.dispatchedAt = new Date();

    await indent.save();

    res.status(200).json({
      success: true,
      message: `Indent dispatched and agent's kit inventory updated successfully.`,
      data: indent
    });
  } catch (error) {
    console.error('dispatchIndent Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Store In-Charge rejects an indent
// @route   POST /api/indents/:id/reject
// @access  Private (STORE_INCHARGE, ADMIN)
exports.rejectIndent = async (req, res) => {
  try {
    const { id } = req.params;
    const { inchargeRemarks } = req.body;

    const indent = await AgentIndent.findById(id);
    if (!indent) {
      return res.status(404).json({ success: false, error: 'Indent record not found.' });
    }

    indent.status = 'REJECTED';
    indent.storeInchargeId = req.user._id;
    indent.inchargeRemarks = inchargeRemarks || '';
    await indent.save();

    res.status(200).json({
      success: true,
      message: 'Indent request rejected.',
      data: indent
    });
  } catch (error) {
    console.error('rejectIndent Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
