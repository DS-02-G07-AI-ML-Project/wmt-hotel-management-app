const Payment = require('../models/Payment');

exports.getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find().populate('booking', 'guestName checkIn checkOut status');
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    next(error);
  }
};

exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('booking');
    if (!payment) {
      res.status(404);
      throw new Error(`Payment not found with id of ${req.params.id}`);
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

exports.createPayment = async (req, res, next) => {
  try {
    const payment = await Payment.create(req.body);
    const populated = await Payment.findById(payment._id).populate('booking', 'guestName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updatePayment = async (req, res, next) => {
  try {
    let payment = await Payment.findById(req.params.id);
    if (!payment) {
      res.status(404);
      throw new Error(`Payment not found with id of ${req.params.id}`);
    }
    payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('booking', 'guestName');
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      res.status(404);
      throw new Error(`Payment not found with id of ${req.params.id}`);
    }
    await payment.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
