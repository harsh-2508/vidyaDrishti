import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  classId: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
  type: { type: String, enum: ["SOS", "Dropout_Risk", "Low_Focus"], required: true },
  message: String,
  status: { type: String, enum: ["Active", "Resolved"], default: "Active" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Alert", alertSchema);