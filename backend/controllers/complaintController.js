const Complaint = require('../models/Complaint');

exports.getComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find().populate('room', 'roomNumber type');
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    next(error);
  }
};

exports.getComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('room');
    if (!complaint) {
      res.status(404);
      throw new Error(`Complaint not found with id of ${req.params.id}`);
    }
    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

exports.createComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.create(req.body);
    const populated = await Complaint.findById(complaint._id).populate('room', 'roomNumber');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.updateComplaint = async (req, res, next) => {
  try {
    let complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.status(404);
      throw new Error(`Complaint not found with id of ${req.params.id}`);
    }
    complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('room', 'roomNumber');
    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

exports.deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.status(404);
      throw new Error(`Complaint not found with id of ${req.params.id}`);
    }
    await complaint.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
