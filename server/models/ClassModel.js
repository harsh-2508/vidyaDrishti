import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, 'Class name is required']
  },
  classCode: {
    type: String,
    unique: true,
    required: [true, 'Class code is required']
  },
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Class must belong to a teacher']
  },
  roomName: {
    type: String,
    required: true
  },
  // ⚠️ THIS WAS THE ISSUE. IT MUST BE A GEOJSON OBJECT, NOT AN ID.
  location: {
    type: {
      type: String,
      enum: ['Point'], 
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  radius: {
    type: Number,
    default: 25 // meters
  },
  schedule: [
    {
      day: String,
      startTime: String,
      endTime: String,
      room: String
    }
  ],
  students: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a Geospatial Index so we can search "Near Me"
classSchema.index({ location: '2dsphere' });

const Class = mongoose.model('Class', classSchema);
export default Class;