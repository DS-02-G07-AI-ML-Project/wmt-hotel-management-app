const express = require('express');
const {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getComplaints).post(protect, authorize('admin', 'staff'), createComplaint);
router
  .route('/:id')
  .get(getComplaint)
  .put(protect, authorize('admin', 'staff'), updateComplaint)
  .delete(protect, authorize('admin', 'staff'), deleteComplaint);

module.exports = router;
