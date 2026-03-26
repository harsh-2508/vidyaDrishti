"""
============================================================
  Dropout Prediction — Python Flask Microservice
  Runs on: http://localhost:5001
  Called by: Express backend
============================================================
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# ── Load model & scaler once at startup ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model  = joblib.load(os.path.join(BASE_DIR, "dropout_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "dropout_scaler.pkl"))

FEATURE_NAMES = [
    "gender", "grade", "age", "caste", "religion",
    "attendance_pct", "grade_score", "failed_grade",
    "bpl_status", "annual_income", "child_labour", "mid_day_meal",
    "distance_km", "has_transport",
    "father_education", "mother_education",
    "num_siblings", "single_parent", "harvest_absenteeism",
    "parent_edu_avg", "income_per_head", "risk_score",
]

def build_risk_flags(data):
    flags = []
    if data["attendance_pct"] < 60:
        flags.append(f"Low attendance ({data['attendance_pct']}%)")
    if data["grade_score"] < 40:
        flags.append(f"Low grade score ({data['grade_score']}/100)")
    if data["distance_km"] > 5:
        flags.append(f"Far from school ({data['distance_km']} km)")
    if data["bpl_status"] == 1:
        flags.append("Below Poverty Line household")
    if data["child_labour"] == 1:
        flags.append("Engaged in child labour")
    if data["failed_grade"] == 1:
        flags.append("Has failed or repeated a grade")
    if data["harvest_absenteeism"] == 1:
        flags.append("Absent during harvest season")
    if data["single_parent"] == 1:
        flags.append("Single parent household")
    if data["num_siblings"] > 3:
        flags.append(f"Large family ({data['num_siblings']} siblings)")
    if data["father_education"] == 0:
        flags.append("Father is illiterate")
    if data["mother_education"] == 0:
        flags.append("Mother is illiterate")
    if data["gender"] == 0 and data["grade"] > 5:
        flags.append("Girl student in upper grades")
    return flags


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "dropout_predictor_v1"})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        body = request.get_json()
        if not body:
            return jsonify({"error": "No JSON body provided"}), 400

        # Feature engineering
        body["parent_edu_avg"]  = (body["father_education"] + body["mother_education"]) / 2
        body["income_per_head"] = body["annual_income"] / (body["num_siblings"] + 1)
        body["risk_score"]      = (
            (100 - body["attendance_pct"]) / 100 * 0.4
            + (100 - body["grade_score"])  / 100 * 0.2
            + body["bpl_status"]           * 0.2
            + body["child_labour"]         * 0.2
        )

        row    = pd.DataFrame([body])[FEATURE_NAMES]
        row_sc = scaler.transform(row)

        prediction   = int(model.predict(row_sc)[0])
        probability  = float(model.predict_proba(row_sc)[0][1])

        if probability >= 0.70:
            risk_level = "HIGH"
        elif probability >= 0.40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return jsonify({
            "prediction":   prediction,           # 0 or 1
            "probability":  round(probability, 4),
            "probability_pct": round(probability * 100, 1),
            "risk_level":   risk_level,
            "risk_flags":   build_risk_flags(body),
            "will_dropout": prediction == 1,
        })

    except KeyError as e:
        return jsonify({"error": f"Missing field: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    """Predict for multiple students at once"""
    try:
        students = request.get_json()
        if not isinstance(students, list):
            return jsonify({"error": "Expected a JSON array of students"}), 400

        results = []
        for s in students:
            s["parent_edu_avg"]  = (s["father_education"] + s["mother_education"]) / 2
            s["income_per_head"] = s["annual_income"] / (s["num_siblings"] + 1)
            s["risk_score"]      = (
                (100 - s["attendance_pct"]) / 100 * 0.4
                + (100 - s["grade_score"])  / 100 * 0.2
                + s["bpl_status"]           * 0.2
                + s["child_labour"]         * 0.2
            )
            row    = pd.DataFrame([s])[FEATURE_NAMES]
            row_sc = scaler.transform(row)
            prob   = float(model.predict_proba(row_sc)[0][1])
            results.append({
                "student_id":      s.get("student_id", None),
                "probability_pct": round(prob * 100, 1),
                "risk_level":      "HIGH" if prob >= 0.70 else "MEDIUM" if prob >= 0.40 else "LOW",
                "will_dropout":    prob >= 0.5,
            })

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# if __name__ == "__main__":
#     print("🚀  Flask ML API running on http://localhost:5001")
#     app.run(port=5001, debug=True)

if __name__ == "__main__":
    # Get port from environment variable, default to 5001 for local testing
    port = int(os.environ.get("PORT", 5001))
    print(f"🚀 Flask ML API running on port {port}")
    # Host="0.0.0.0" is REQUIRED for cloud deployment
    app.run(host="0.0.0.0", port=port, debug=False)