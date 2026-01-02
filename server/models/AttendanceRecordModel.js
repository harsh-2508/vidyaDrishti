import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  // ... existing fields ...
  student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
  checkInTime: { type: Date },
  
  // Verification flags
  geofenceCheck: { type: Boolean, default: false },
  cameraCheck: { type: Boolean, default: false },

  // --- NEW FIELD ---
  focusScore: { type: Number, default: 100 }, // Percentage (0-100)
  attentionLogs: [{ // Optional: Store timestamp of when they were distracted
    time: Date,
    status: String // 'distracted', 'drowsy'
  }]
});

// Ensure one record per student per class per day
attendanceRecordSchema.index({ student: 1, class: 1, date: 1 }, { unique: true });

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
export default AttendanceRecord;