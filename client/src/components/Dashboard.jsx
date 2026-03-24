// src/components/Dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { getAllPredictions, getStats, deletePrediction } from "../services/api";
import "./Dashboard.css";

const RISK_BADGE = {
  HIGH:   "badge-high",
  MEDIUM: "badge-medium",
  LOW:    "badge-low",
};

export default function Dashboard({ refresh }) {
  const [predictions, setPredictions] = useState([]);
  const [stats,       setStats]       = useState(null);
  const [filter,      setFilter]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [pData, sData] = await Promise.all([getAllPredictions(), getStats()]);
      setPredictions(pData?.predictions ?? []);
      setStats(sData ?? null);
    } catch (e) {
      setError("Could not load data. Make sure the backend and Flask ML service are running.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refresh]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this prediction?")) return;
    try {
      await deletePrediction(id);
      load();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  const filtered = predictions.filter((p) =>
    p.studentName?.toLowerCase().includes(filter.toLowerCase()) ||
    p.schoolName?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="dash-wrapper">

      {/* Stats bar */}
      {stats && (
        <div className="dash-stats-bar">
          <StatCard num={stats.total}              label="Total Assessed" color="#3b82f6" />
          <StatCard num={stats.highRisk}           label="High Risk"      color="#ef4444" />
          <StatCard num={stats.mediumRisk}         label="Medium Risk"    color="#f59e0b" />
          <StatCard num={stats.lowRisk}            label="Low Risk"       color="#10b981" />
          <StatCard num={`${stats.avgProbability}%`} label="Avg Risk"     color="#8b5cf6" />
        </div>
      )}

      {/* Table */}
      <div className="dash-table-wrap">
        <div className="dash-toolbar">
          <h3>All Assessments</h3>
          <input
            className="dash-search"
            placeholder="Search by name or school..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="dash-refresh" onClick={load}>↻ Refresh</button>
        </div>

        {loading && <div className="dash-state">Loading assessments...</div>}

        {!loading && error && (
          <div className="dash-state dash-error">⚠️ {error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="dash-state">
            No assessments yet. Go to <strong>New Assessment</strong> to add one.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>School</th>
                <th>Grade</th>
                <th>Probability</th>
                <th>Risk</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td className="td-name">
                    {p.studentName}
                    {p.studentId && <span className="td-id">#{p.studentId}</span>}
                  </td>
                  <td>{p.schoolName || "—"}</td>
                  <td>Class {p.input?.grade ?? "—"}</td>
                  <td>
                    <div className="prob-bar-wrap">
                      <div
                        className="prob-bar"
                        style={{
                          width: `${Math.min(p.result?.probability_pct ?? 0, 100)}%`,
                          background:
                            p.result?.risk_level === "HIGH"   ? "#ef4444" :
                            p.result?.risk_level === "MEDIUM" ? "#f59e0b" : "#10b981",
                        }}
                      />
                      <span>{p.result?.probability_pct ?? "—"}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${RISK_BADGE[p.result?.risk_level] ?? ""}`}>
                      {p.result?.risk_level ?? "—"}
                    </span>
                  </td>
                  <td>
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td>
                    <button className="btn-del" onClick={() => handleDelete(p._id)}>
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ num, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-num" style={{ color }}>{num}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}