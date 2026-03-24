// routes/predictions.js  — ES Module version
import express    from "express";
import axios      from "axios";
import Prediction from "../models/Prediction.js";

const router    = express.Router();
const FLASK_URL = process.env.FLASK_URL || "http://localhost:5001";

// POST /api/predictions  — predict + save to MongoDB
router.post("/", async (req, res) => {
  try {
    const { studentName, studentId, schoolName, assessedBy, notes, ...inputData } = req.body;

    // Call Python Flask ML API
    const flaskRes = await axios.post(`${FLASK_URL}/predict`, inputData);
    const result   = flaskRes.data;

    // Save to MongoDB
    const doc = await Prediction.create({
      studentName,
      studentId,
      schoolName,
      input:  inputData,
      result: {
        probability_pct: result.probability_pct,
        risk_level:      result.risk_level,
        will_dropout:    result.will_dropout,
        risk_flags:      result.risk_flags,
      },
      assessedBy,
      notes,
    });

    res.status(201).json({ success: true, prediction: doc });

  } catch (err) {
    console.error("Prediction error:", err.message);
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "ML service unavailable. Make sure flask_api.py is running on port 5001.",
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predictions  — list all (latest first)
router.get("/", async (req, res) => {
  try {
    const { school, risk, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (school) filter.schoolName              = new RegExp(school, "i");
    if (risk)   filter["result.risk_level"]    = risk.toUpperCase();

    const predictions = await Prediction.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Prediction.countDocuments(filter);
    res.json({ success: true, total, predictions });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predictions/stats  — dashboard summary numbers
router.get("/stats", async (req, res) => {
  try {
    const total      = await Prediction.countDocuments();
    const highRisk   = await Prediction.countDocuments({ "result.risk_level": "HIGH" });
    const mediumRisk = await Prediction.countDocuments({ "result.risk_level": "MEDIUM" });
    const lowRisk    = await Prediction.countDocuments({ "result.risk_level": "LOW" });

    const avgProb = await Prediction.aggregate([
      { $group: { _id: null, avg: { $avg: "$result.probability_pct" } } },
    ]);

    res.json({
      total,
      highRisk,
      mediumRisk,
      lowRisk,
      avgProbability: avgProb[0]?.avg?.toFixed(1) ?? 0,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predictions/:id
router.get("/:id", async (req, res) => {
  try {
    const doc = await Prediction.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, prediction: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/predictions/:id
router.delete("/:id", async (req, res) => {
  try {
    await Prediction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
