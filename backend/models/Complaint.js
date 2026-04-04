const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Maintenance', 'Service', 'Noise', 'Other'],
      default: 'Other',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    reportedBy: { type: String, default: 'Guest', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
