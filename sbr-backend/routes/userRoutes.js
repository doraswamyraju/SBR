const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUser,
  updateAgentCoordinates,
  deleteUser,
  updateFcmToken
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
  .get(authorize('ADMIN'), getAllUsers);

router.put('/profile', updateProfile);
router.post('/fcm-token', updateFcmToken);
router.put('/agent/location', authorize('AGENT'), updateAgentCoordinates);

router.route('/:id')
  .get(getUserById)
  .put(authorize('ADMIN'), updateUser)
  .delete(authorize('ADMIN'), deleteUser);

module.exports = router;

