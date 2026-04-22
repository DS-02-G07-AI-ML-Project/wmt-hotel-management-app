const express = require('express');
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getReviews).post(protect, authorize('admin', 'customer'), createReview);
router
  .route('/:id')
  .get(getReview)
  .put(protect, authorize('admin', 'customer'), updateReview)
  .delete(protect, authorize('admin'), deleteReview);

module.exports = router;
