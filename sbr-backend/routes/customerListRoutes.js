const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  getCustomerList,
  uploadCustomerList,
  addCustomerRecord,
  deleteCustomerRecord,
  clearCustomerList
} = require('../controllers/customerListController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for customer list Excel/CSV files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'customer-list-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const docFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.xlsx', '.xls', '.csv'].includes(ext) || file.mimetype.includes('csv') || file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet')) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed!'), false);
  }
};

const docUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: docFileFilter
});

router.use(protect); // All routes require logged in user

router.get('/', getCustomerList); // Accessible to CUSTOMER, AGENT, ADMIN

router.post('/upload', authorize('ADMIN'), docUpload.single('file'), uploadCustomerList);
router.post('/', authorize('ADMIN'), addCustomerRecord);
router.delete('/clear', authorize('ADMIN'), clearCustomerList);
router.delete('/:id', authorize('ADMIN'), deleteCustomerRecord);

module.exports = router;
