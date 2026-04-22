const Review = require('../models/Review');

exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('room', 'roomNumber type')
      .populate('experience', 'title category');
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
};

exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name email')
      .populate('room', 'roomNumber type')
      .populate('experience', 'title category');
    if (!review) {
      res.status(404);
      throw new Error(`Review not found with id of ${req.params.id}`);
    }
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const review = await Review.create(req.body);
    const populated = await Review.findById(review._id)
      .populate('user', 'name email')
      .populate('room', 'roomNumber type')
      .populate('experience', 'title category');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      throw new Error(`Review not found with id of ${req.params.id}`);
    }
    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('user', 'name email')
      .populate('room', 'roomNumber type')
      .populate('experience', 'title category');
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      throw new Error(`Review not found with id of ${req.params.id}`);
    }
    await review.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
