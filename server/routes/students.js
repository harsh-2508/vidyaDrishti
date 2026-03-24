// routes/students.js  — ES Module version
import express    from "express";
import Prediction from "../models/Prediction.js";

const router = express.Router();

// GET /api/students — all unique students with their latest prediction
router.get("/", async (req, res) => {
  try {
    const students = await Prediction.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id:             "$studentName",
          latestRisk:      { $first: "$result.risk_level" },
          latestProb:      { $first: "$result.probability_pct" },
          school:          { $first: "$schoolName" },
          grade:           { $first: "$input.grade" },
          assessmentCount: { $sum: 1 },
          lastAssessed:    { $first: "$createdAt" },
          predictionId:    { $first: "$_id" },
        },
      },
      { $sort: { latestProb: -1 } },
    ]);
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
