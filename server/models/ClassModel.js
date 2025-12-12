import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
  },
  classCode: {
    type: String,
    required: true,
    unique: true,
  },
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  students: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  location: {
    type: mongoose.Schema.ObjectId,
    ref: 'Location',
    required: true,
  },
  // --- NEW: Schedule Field ---
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: { type: String, required: true }, // e.g., "10:00"
    endTime: { type: String, required: true },   // e.g., "11:00"
    room: { type: String } // e.g., "Lab 4"
  }]
});

const Class = mongoose.model('Class', classSchema);
export default Class;