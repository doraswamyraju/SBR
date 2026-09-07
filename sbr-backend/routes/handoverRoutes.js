const express = require('express');
const {
  getAgentDailySummary,
  submitHandover,
  getPendingHandovers,
  getAllHandovers,
  getMySubmissions,
  acknowledgeHandover
} = require('../controllers/handoverController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Agent routes
router.get('/agent-daily-summary', protect, authorize('AGENT', 'ADMIN', 'admin'), getAgentDailySummary);
router.post('/submit', protect, authorize('AGENT', 'ADMIN', 'admin'), submitHandover);
router.get('/my-submissions', protect, authorize('AGENT', 'ADMIN', 'admin'), getMySubmissions);

// Store In-Charge & Admin routes
router.get('/pending', protect, authorize('STORE_INCHARGE', 'ADMIN', 'admin'), getPendingHandovers);
router.get('/all', protect, authorize('STORE_INCHARGE', 'ADMIN', 'admin'), getAllHandovers);
router.post('/:id/acknowledge', protect, authorize('STORE_INCHARGE', 'ADMIN', 'admin'), acknowledgeHandover);

module.exports = router;
