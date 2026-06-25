const express = require('express');
const { getSettings, updateSetting } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, authorize('ADMIN'), updateSetting);

module.exports = router;
