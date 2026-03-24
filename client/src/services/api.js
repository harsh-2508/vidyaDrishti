// src/services/api.js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Reads JWT token your app already stores
const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Dropout Prediction ──────────────────────────────────

export async function predictStudent(data) {
  const res = await fetch(`${BASE}/predictions`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Prediction failed");
  }
  return res.json();
}

export async function getAllPredictions(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE}/predictions?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch predictions");
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${BASE}/predictions/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function deletePrediction(id) {
  const res = await fetch(`${BASE}/predictions/${id}`, {
    method:  "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}