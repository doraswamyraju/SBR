const express = require('express');
const {
  submitLead,
  getLeads,
  updateLead,
  deleteLead
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public submission route
router.post('/submit', submitLead);

// Protected Admin routes
router.use(protect);
router.use(authorize('ADMIN', 'admin'));

router.route('/')
  .get(getLeads);

router.route('/:id')
  .put(updateLead)
  .delete(deleteLead);

module.exports = router;

