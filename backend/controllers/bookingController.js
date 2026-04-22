const Booking = require('../models/Booking');

exports.getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('room', 'roomNumber type status')
      .populate('user', 'name email role');
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('user', 'name email role phone');
    if (!booking) {
      res.status(404);
      throw new Error(`Booking not found with id of ${req.params.id}`);
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const booking = await Booking.create(req.body);
    const populated = await Booking.findById(booking._id)
      .populate('room', 'roomNumber type')
      .populate('user', 'name email role');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error(`Booking not found with id of ${req.params.id}`);
    }
    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('room', 'roomNumber type')
      .populate('user', 'name email role');
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error(`Booking not found with id of ${req.params.id}`);
    }
    await booking.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
