// models/AttendanceRecordModel.js

import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  class: {
    type: mongoose.Schema.ObjectId,
    ref: 'Class',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'absent',
  },
  checkInTime: {
    type: Date,
  },
  geofenceCheck: {
    type: Boolean,
    default: false,
  },
  cameraCheck: {
    type: Boolean,
    default: false,
  },
});

const AttendanceRecord = mongoose.model(
  'AttendanceRecord',
  attendanceRecordSchema
);

// Use 'export default' instead of 'module.exports'
export default AttendanceRecord;