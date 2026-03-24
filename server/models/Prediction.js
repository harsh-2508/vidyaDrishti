// models/Prediction.js  — ES Module version
import mongoose from "mongoose";

const PredictionSchema = new mongoose.Schema(
  {
    // Student identity
    studentName:  { type: String, required: true, trim: true },
    studentId:    { type: String, trim: true },
    schoolName:   { type: String, trim: true },

    // Input features sent to the ML model
    input: {
      gender:               { type: Number, required: true },   // 0=Female, 1=Male
      grade:                { type: Number, required: true },
      age:                  { type: Number, required: true },
      caste:                { type: Number, required: true },   // 0=General,1=OBC,2=SC,3=ST
      religion:             { type: Number },
      attendance_pct:       { type: Number, required: true },
      grade_score:          { type: Number, required: true },
      failed_grade:         { type: Number, default: 0 },
      bpl_status:           { type: Number, default: 0 },
      annual_income:        { type: Number, required: true },
      child_labour:         { type: Number, default: 0 },
      mid_day_meal:         { type: Number, default: 1 },
      distance_km:          { type: Number, required: true },
      has_transport:        { type: Number, default: 1 },
      father_education:     { type: Number, required: true },
      mother_education:     { type: Number, required: true },
      num_siblings:         { type: Number, default: 0 },
      single_parent:        { type: Number, default: 0 },
      harvest_absenteeism:  { type: Number, default: 0 },
    },

    // ML prediction result
    result: {
      probability_pct:  { type: Number, required: true },
      risk_level:       { type: String, enum: ["LOW", "MEDIUM", "HIGH"] },
      will_dropout:     { type: Boolean },
      risk_flags:       [{ type: String }],
    },

    // Who ran the assessment
    assessedBy: { type: String },
    notes:      { type: String },
  },
  { timestamps: true }
);

const Prediction = mongoose.model("Prediction", PredictionSchema);
export default Prediction;
