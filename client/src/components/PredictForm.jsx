// src/components/PredictForm.jsx
import { useState } from "react";
import { predictStudent } from "../services/api";
import "./PredictForm.css";

const INITIAL = {
  studentName: "", studentId: "", schoolName: "", assessedBy: "", notes: "",
  gender: 1, grade: 5, age: 11, caste: 0, religion: 0,
  attendance_pct: 75, grade_score: 60, failed_grade: 0,
  bpl_status: 0, annual_income: 100000, child_labour: 0, mid_day_meal: 1,
  distance_km: 2, has_transport: 1,
  father_education: 1, mother_education: 1,
  num_siblings: 2, single_parent: 0, harvest_absenteeism: 0,
};

const RISK_CONFIG = {
  HIGH:   { color: "#ef4444", bg: "#fef2f2", emoji: "🔴", label: "HIGH RISK" },
  MEDIUM: { color: "#f59e0b", bg: "#fffbeb", emoji: "🟡", label: "MEDIUM RISK" },
  LOW:    { color: "#10b981", bg: "#f0fdf4", emoji: "🟢", label: "LOW RISK"  },
};

// Fields that must always be sent as numbers to the ML model
const NUMERIC_FIELDS = [
  "gender", "grade", "age", "caste", "religion",
  "attendance_pct", "grade_score", "failed_grade",
  "bpl_status", "annual_income", "child_labour", "mid_day_meal",
  "distance_km", "has_transport", "father_education", "mother_education",
  "num_siblings", "single_parent", "harvest_absenteeism",
];

export default function PredictForm({ onNewPrediction }) {
  const [form,    setForm]    = useState(INITIAL);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // ✅ Fixed: checks field NAME not input type
  // select → type is "select-one", range → type is "range", both were missed before
  const handle = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: NUMERIC_FIELDS.includes(name) ? Number(value) : value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await predictStudent(form);
      setResult(data.prediction.result);
      onNewPrediction?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setForm(INITIAL); setResult(null); setError(""); };

  const risk = result ? RISK_CONFIG[result.risk_level] : null;

  return (
    <div className="pf-wrapper">
      <div className="pf-card">
        <div className="pf-header">
          <span className="pf-icon">🏫</span>
          <div>
            <h2>Student Dropout Assessment</h2>
            <p>Fill in student details to predict dropout risk</p>
          </div>
        </div>

        <form onSubmit={submit} className="pf-form">

          {/* ── Identity ── */}
          <section className="pf-section">
            <h3 className="pf-section-title">📋 Student Identity</h3>
            <div className="pf-grid pf-grid-3">
              <label>Student Name *
                <input name="studentName" value={form.studentName}
                  onChange={handle} required placeholder="e.g. Sunita Devi" />
              </label>
              <label>Student ID
                <input name="studentId" value={form.studentId}
                  onChange={handle} placeholder="e.g. STU2024001" />
              </label>
              <label>School Name
                <input name="schoolName" value={form.schoolName}
                  onChange={handle} placeholder="e.g. GPS Rampur" />
              </label>
            </div>
          </section>

          {/* ── Demographics ── */}
          <section className="pf-section">
            <h3 className="pf-section-title">👤 Demographics</h3>
            <div className="pf-grid pf-grid-3">
              <label>Gender
                <select name="gender" value={form.gender} onChange={handle}>
                  <option value={1}>Male</option>
                  <option value={0}>Female</option>
                </select>
              </label>
              <label>Class / Grade
                <select name="grade" value={form.grade} onChange={handle}>
                  {[1,2,3,4,5,6,7,8].map(g => (
                    <option key={g} value={g}>Class {g}</option>
                  ))}
                </select>
              </label>
              <label>Age
                <input type="number" name="age" value={form.age}
                  onChange={handle} min={5} max={20} />
              </label>
              <label>Caste Category
                <select name="caste" value={form.caste} onChange={handle}>
                  <option value={0}>General</option>
                  <option value={1}>OBC</option>
                  <option value={2}>SC</option>
                  <option value={3}>ST</option>
                </select>
              </label>
              <label>Religion
                <select name="religion" value={form.religion} onChange={handle}>
                  <option value={0}>Hindu</option>
                  <option value={1}>Muslim</option>
                  <option value={2}>Christian</option>
                  <option value={3}>Other</option>
                </select>
              </label>
            </div>
          </section>

          {/* ── Academics ── */}
          <section className="pf-section">
            <h3 className="pf-section-title">📚 Attendance & Academics</h3>
            <div className="pf-grid pf-grid-3">
              <label>Attendance %
                <div className="pf-range-wrap">
                  <input type="range" name="attendance_pct"
                    value={form.attendance_pct} onChange={handle} min={0} max={100} />
                  <span className="pf-range-val">{form.attendance_pct}%</span>
                </div>
              </label>
              <label>Grade Score (0–100)
                <div className="pf-range-wrap">
                  <input type="range" name="grade_score"
                    value={form.grade_score} onChange={handle} min={0} max={100} />
                  <span className="pf-range-val">{form.grade_score}</span>
                </div>
              </label>
              <label>Failed / Repeated a Grade?
                <div className="pf-toggle-row">
                  {["No", "Yes"].map((lbl, i) => (
                    <button type="button" key={i}
                      className={`pf-toggle ${form.failed_grade === i ? "active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, failed_grade: i }))}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </section>

          {/* ── Socioeconomic ── */}
          <section className="pf-section">
            <h3 className="pf-section-title">💰 Socioeconomic</h3>
            <div className="pf-grid pf-grid-3">
              <label>BPL Status
                <div className="pf-toggle-row">
                  {["Non-BPL", "BPL"].map((lbl, i) => (
                    <button type="button" key={i}
                      className={`pf-toggle ${form.bpl_status === i ? "active warn" : ""}`}
                      onClick={() => setForm(f => ({ ...f, bpl_status: i }))}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </label>
              <label>Annual Family Income (₹)
                <input type="number" name="annual_income" value={form.annual_income}
                  onChange={handle} min={0} step={1000} />
              </label>
              <label>Child Labour?
                <div className="pf-toggle-row">
                  {["No", "Yes"].map((lbl, i) => (
                    <button type="button" key={i}
                      className={`pf-toggle ${form.child_labour === i ? "active warn" : ""}`}
                      onClick={() => setForm(f => ({ ...f, child_labour: i }))}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </label>
              <label>Gets Mid-Day Meal?
                <div className="pf-toggle-row">
                  {["No", "Yes"].map((lbl, i) => (
                    <button type="button" key={i}
                      className={`pf-toggle ${form.mid_day_meal === i ? "active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, mid_day_meal: i }))}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </section>

          {/* ── Distance ── */}
          <section className="pf-section">
            <h3 className="pf-section-title">🚌 Distance & Transport</h3>
            <div className="pf-grid pf-grid-2">
              <label>Distance to School (km)
                <div className="pf-range-wrap">
                  <input type="range" name="distance_km"
                    value={form.distance_km} onChange={handle} min={0.5} max={25} step={0.5} />
                  <span className="pf-range-val">{form.distance_km} km</span>
                </div>
              </label>
              <label>Has Transport Facility?
                <div className="pf-toggle-row">
                  {["No", "Yes"].map((lbl, i) => (
                    <button type="button" key={i}
                      className={`pf-toggle ${form.has_transport === i ? "active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, has_transport: i }))}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </section>

          {/* ── Family ── */}
          <section className="pf-section">
            <h3 className="pf-section-title">👨‍👩‍👧 Family Background</h3>
            <div className="pf-grid pf-grid-3">
              <label>Father's Education
                <select name="father_education" value={form.father_education} onChange={handle}>
                  <option value={0}>Illiterate</option>
                  <option value={1}>Primary</option>
                  <option value={2}>Secondary</option>
                  <option value={3}>Graduate</option>
                </select>
              </label>
              <label>Mother's Education
                <select name="mother_education" value={form.mother_education} onChange={handle}>
                  <option value={0}>Illiterate</option>
                  <option value={1}>Primary</option>
                  <option value={2}>Secondary</option>
                  <option value={3}>Graduate</option>
                </select>
              </label>
              <label>Number of Siblings
                <input type="number" name="num_siblings" value={form.num_siblings}
                  onChange={handle} min={0} max={15} />
              </label>
              <label>Single Parent Household?
                <div className="pf-toggle-row">
                  {["No", "Yes"].map((lbl, i) => (
                    <button type="button" key={i}
                      className={`pf-toggle ${form.single_parent === i ? "active warn" : ""}`}
                      onClick={() => setForm(f => ({ ...f, single_parent: i }))}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </label>
              <label>Harvest Season Absenteeism?
                <div className="pf-toggle-row">
                  {["No", "Yes"].map((lbl, i) => (
                    <button type="button" key={i}
                      className={`pf-toggle ${form.harvest_absenteeism === i ? "active warn" : ""}`}
                      onClick={() => setForm(f => ({ ...f, harvest_absenteeism: i }))}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </section>

          {/* ── Notes ── */}
          <section className="pf-section">
            <h3 className="pf-section-title">🗒️ Assessment Notes</h3>
            <div className="pf-grid pf-grid-2">
              <label>Assessed By
                <input name="assessedBy" value={form.assessedBy}
                  onChange={handle} placeholder="Teacher / Admin name" />
              </label>
              <label>Notes
                <input name="notes" value={form.notes}
                  onChange={handle} placeholder="Optional observations..." />
              </label>
            </div>
          </section>

          {error && <div className="pf-error">⚠️ {error}</div>}

          <div className="pf-actions">
            <button type="button" className="pf-btn-reset" onClick={reset}>Reset</button>
            <button type="submit" className="pf-btn-submit" disabled={loading}>
              {loading ? "Analyzing..." : "🔍 Predict Dropout Risk"}
            </button>
          </div>
        </form>

        {/* ── Result panel ── */}
        {result && risk && (
          <div className="pf-result" style={{ background: risk.bg, borderColor: risk.color }}>
            <div className="pf-result-top">
              <span className="pf-result-emoji">{risk.emoji}</span>
              <div>
                <div className="pf-result-label" style={{ color: risk.color }}>
                  {risk.label}
                </div>
                <div className="pf-result-prob" style={{ color: risk.color }}>
                  {result.probability_pct}% dropout probability
                </div>
              </div>
            </div>

            {result.risk_flags?.length > 0 && (
              <div className="pf-flags">
                <strong>Key Risk Factors:</strong>
                <ul>
                  {result.risk_flags.map((f, i) => (
                    <li key={i}>⚠️ {f}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="pf-saved-note">✅ Saved to database</p>
          </div>
        )}
      </div>
    </div>
  );
}