const Visitor = require('../models/Visitor');

exports.getVisitors = async (req, res, next) => {
  try {
    const visitors = await Visitor.find();
    res.status(200).json({ success: true, count: visitors.length, data: visitors });
  } catch (error) {
    next(error);
  }
};

exports.getVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      res.status(404);
      throw new Error(`Visitor not found with id of ${req.params.id}`);
    }
    res.status(200).json({ success: true, data: visitor });
  } catch (error) {
    next(error);
  }
};

exports.createVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.create(req.body);
    res.status(201).json({ success: true, data: visitor });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updateVisitor = async (req, res, next) => {
  try {
    let visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      res.status(404);
      throw new Error(`Visitor not found with id of ${req.params.id}`);
    }
    visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: visitor });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.deleteVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      res.status(404);
      throw new Error(`Visitor not found with id of ${req.params.id}`);
    }
    await visitor.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
