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
  deleteRequest
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
  .post(createRequest)
  .get(getRequests);

router.route('/:id')
  .get(getRequestById)
  .put(updateRequest)
  .delete(authorize('ADMIN'), deleteRequest);

router.put('/:id/assign', authorize('ADMIN'), assignRequest);
router.put('/:id/status', authorize('AGENT', 'ADMIN'), updateRequestStatus);
router.put('/:id/image', authorize('AGENT', 'ADMIN'), updateRequestImage);
router.put('/:id/payment', authorize('AGENT', 'ADMIN'), updatePaymentDetails);
router.post('/:id/location', authorize('AGENT'), appendAgentLocation);

module.exports = router;
