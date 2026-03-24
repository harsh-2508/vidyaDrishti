import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  link: { type: String, required: true }, // URL to PDF/Video
  type: { type: String, enum: ["PDF", "Video", "Note", "Quiz"], default: "Note" },
  classId: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
  uploadedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
  
  // AI Personalization Tags
  difficultyLevel: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  tags: [String], // e.g., ["Math", "Geometry", "Remedial"]
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Resource", resourceSchema);