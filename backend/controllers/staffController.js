const Staff = require('../models/Staff');

exports.getStaffMembers = async (req, res, next) => {
  try {
    const staff = await Staff.find();
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    next(error);
  }
};

exports.getStaffMember = async (req, res, next) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) {
      res.status(404);
      throw new Error(`Staff member not found with id of ${req.params.id}`);
    }
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

exports.createStaffMember = async (req, res, next) => {
  try {
    const member = await Staff.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updateStaffMember = async (req, res, next) => {
  try {
    let member = await Staff.findById(req.params.id);
    if (!member) {
      res.status(404);
      throw new Error(`Staff member not found with id of ${req.params.id}`);
    }
    member = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.deleteStaffMember = async (req, res, next) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) {
      res.status(404);
      throw new Error(`Staff member not found with id of ${req.params.id}`);
    }
    await member.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
