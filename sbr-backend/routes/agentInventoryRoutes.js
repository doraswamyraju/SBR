const express = require('express');
const {
  getMyInventory,
  getAgentInventory,
  getAllAgentInventories,
  transferStockToAgent,
  createIndent,
  getPendingIndents,
  getAllIndents,
  getMyIndents,
  dispatchIndent,
  rejectIndent,
  getPosSummary
} = require('../controllers/agentInventoryController');
const { protect, authorize, posOrProtect } = require('../middleware/authMiddleware');

const router = express.Router();

// POS Integration route (Supports x-pos-sync-token header or JWT)
router.get('/pos-summary', getPosSummary);

// Agent Inventory routes
router.get('/my-stock', protect, authorize('AGENT', 'ADMIN', 'admin'), getMyInventory);
router.get('/agent/:agentId', posOrProtect, authorize('STORE_INCHARGE', 'ADMIN', 'admin'), getAgentInventory);
router.get('/all', posOrProtect, authorize('STORE_INCHARGE', 'ADMIN', 'admin'), getAllAgentInventories);
router.post('/transfer', posOrProtect, authorize('STORE_INCHARGE', 'ADMIN', 'admin'), transferStockToAgent);

// Agent Indent routes (Support direct mount /api/indents or prefix /api/agent-inventory/indents)
router.post(['/create', '/indents/create'], protect, authorize('AGENT', 'ADMIN', 'admin'), createIndent);
router.get(['/pending', '/indents/pending'], posOrProtect, authorize('STORE_INCHARGE', 'ADMIN', 'admin'), getPendingIndents);
router.get(['/all-indents', '/indents/all'], posOrProtect, authorize('STORE_INCHARGE', 'ADMIN', 'admin'), getAllIndents);
router.get(['/my-indents', '/indents/my-indents'], protect, authorize('AGENT', 'ADMIN', 'admin'), getMyIndents);
router.post(['/:id/dispatch', '/indents/:id/dispatch'], posOrProtect, authorize('STORE_INCHARGE', 'ADMIN', 'admin'), dispatchIndent);
router.post(['/:id/reject', '/indents/:id/reject'], posOrProtect, authorize('STORE_INCHARGE', 'ADMIN', 'admin'), rejectIndent);

module.exports = router;
