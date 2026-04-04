const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    idNumber: { type: String, default: '', trim: true },
    phone: { type: String, trim: true, default: '' },
    purpose: { type: String, default: '', trim: true },
    hostName: { type: String, default: '', trim: true },
    checkIn: { type: Date, required: true, default: Date.now },
    checkOut: { type: Date, default: null },
    badgeNumber: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['On Premises', 'Checked Out'],
      default: 'On Premises',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visitor', visitorSchema);
