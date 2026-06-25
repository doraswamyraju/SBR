const Settings = require('../models/Settings');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.find();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.status(200).json({ success: true, data: settingsMap });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update setting
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, error: 'Please provide setting key and value' });
    }

    let setting = await Settings.findOne({ key });
    if (setting) {
      setting.value = value;
      await setting.save();
    } else {
      setting = await Settings.create({ key, value });
    }

    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
