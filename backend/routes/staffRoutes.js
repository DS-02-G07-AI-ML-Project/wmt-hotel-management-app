const express = require('express');
const {
  getStaffMembers,
  getStaffMember,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getStaffMembers).post(protect, authorize('admin', 'staff'), createStaffMember);
router
  .route('/:id')
  .get(getStaffMember)
  .put(protect, authorize('admin', 'staff'), updateStaffMember)
  .delete(protect, authorize('admin'), deleteStaffMember);

module.exports = router;
