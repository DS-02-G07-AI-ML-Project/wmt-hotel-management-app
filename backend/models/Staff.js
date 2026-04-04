const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    position: { type: String, required: true, trim: true },
    department: { type: String, default: 'General', trim: true },
    hireDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Terminated'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
