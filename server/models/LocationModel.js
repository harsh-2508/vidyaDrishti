// models/LocationModel.js
// const mongoose = require('mongoose');
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true, // e.g., "Room 301B"
  },
  building: {
    type: String, // e.g., "Engineering Block"
  },
  latitude: {
    type: Number,
    required: true, // Center latitude of the room
  },
  longitude: {
    type: Number,
    required: true, // Center longitude of the room
  },
  radius: {
    type: Number,
    required: true, // The geofence radius in meters (e.g., 20)
  },
});

const Location = mongoose.model('Location', locationSchema);
export default Location;