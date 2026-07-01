const express = require('express');
const router = express.Router();
const { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);

// Protected routes (Admin only)
router.post('/', protect, authorize('ADMIN'), createBlog);
router.put('/:id', protect, authorize('ADMIN'), updateBlog);
router.delete('/:id', protect, authorize('ADMIN'), deleteBlog);

module.exports = router;
