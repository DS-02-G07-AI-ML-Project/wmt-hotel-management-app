const express = require('express');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getBookings).post(protect, authorize('admin', 'staff'), createBooking);
router
  .route('/:id')
  .get(getBooking)
  .put(protect, authorize('admin', 'staff'), updateBooking)
  .delete(protect, authorize('admin', 'staff'), deleteBooking);

module.exports = router;
