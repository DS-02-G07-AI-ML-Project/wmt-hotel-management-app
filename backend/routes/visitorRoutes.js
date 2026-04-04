const express = require('express');
const {
  getVisitors,
  getVisitor,
  createVisitor,
  updateVisitor,
  deleteVisitor,
} = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getVisitors).post(protect, authorize('admin', 'staff'), createVisitor);
router
  .route('/:id')
  .get(getVisitor)
  .put(protect, authorize('admin', 'staff'), updateVisitor)
  .delete(protect, authorize('admin', 'staff'), deleteVisitor);

module.exports = router;
