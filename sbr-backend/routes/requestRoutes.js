const express = require('express');
const {
  createRequest,

  getRequests,
  getRequestById,
  updateRequest,
  assignRequest,
  updateRequestStatus,
  updateRequestImage,
  updatePaymentDetails,
  appendAgentLocation,
  deleteRequest,
  bookPublicRequest
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public booking routes
router.post('/book', bookPublicRequest);
router.post('/public-book', bookPublicRequest);

router.use(protect); // Subsequent routes require authentication


router.route('/')
  .post(createRequest)
  .get(getRequests);

router.route('/:id')
  .get(getRequestById)
  .put(updateRequest)
  .delete(authorize('ADMIN'), deleteRequest);

router.put('/:id/assign', authorize('STORE_INCHARGE', 'ADMIN', 'admin'), assignRequest);
router.put('/:id/status', authorize('STORE_INCHARGE', 'AGENT', 'ADMIN', 'admin'), updateRequestStatus);
router.put('/:id/image', authorize('AGENT', 'ADMIN', 'admin'), updateRequestImage);
router.put('/:id/payment', authorize('STORE_INCHARGE', 'AGENT', 'ADMIN', 'admin'), updatePaymentDetails);
router.post('/:id/location', authorize('AGENT'), appendAgentLocation);

module.exports = router;
