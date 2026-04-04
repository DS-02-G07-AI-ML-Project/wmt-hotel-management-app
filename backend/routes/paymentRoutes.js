const express = require('express');
const {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getPayments).post(protect, authorize('admin', 'staff'), createPayment);
router
  .route('/:id')
  .get(getPayment)
  .put(protect, authorize('admin', 'staff'), updatePayment)
  .delete(protect, authorize('admin', 'staff'), deletePayment);

module.exports = router;
