const express = require('express');
const {
  register,
  login,
  getMe,
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
  deleteOwnAccount,
  forgotPassword,
  resetPassword,
  checkEmailExists,
} = require('../controllers/userController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);
router.get('/check-email', checkEmailExists);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.delete('/me', protect, deleteOwnAccount);
router.route('/').get(protect, authorize('admin'), getUsers).post(protect, authorize('admin'), createUser);
router
  .route('/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
