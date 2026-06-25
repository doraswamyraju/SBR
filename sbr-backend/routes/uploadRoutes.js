const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a file' });
    }

    // Build public URL using BASE_URL env variable, or proxy headers, or request fallbacks
    let baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      baseUrl = `${protocol}://${host}`;
    }
    const fileUrl = `${baseUrl}/${process.env.UPLOAD_PATH || 'uploads'}/${req.file.filename}`;

    res.status(200).json({
      success: true,
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
