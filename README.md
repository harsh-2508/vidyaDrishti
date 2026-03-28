# 👁️ VidyaDrishti (विद्या-दृष्टि)
> **Empowering Rural India: AI-Driven Governance & Quality Assurance for Village Schools.**

## 🇮🇳 The Problem
In many remote villages across India, the infrastructure for education exists, but the *delivery* is compromised.
- **Ghost Teachers:** Teachers mark attendance but are physically absent.
- **Engagement Gap:** Classes happen, but teaching doesn't.
- **Resource Misuse:** Students are sometimes diverted to perform household chores for staff instead of learning.
- **Financial Leaks:** Funds meant for school development are often unaccounted for.

## 💡 The Solution
**VidyaDrishti** is not just an attendance app; it is a **digital guardian** for rural classrooms. It uses Geofencing, Biometrics, and Computer Vision to ensure accountability, protect student rights, and predict dropout risks.

## 🌟 Key Features

### 1. 📍 Proof of Presence (Anti-Ghost Teacher)
- **Geo-Fenced Attendance:** Teachers cannot mark attendance from home. They must be within the school radius.
- **Face Verification:** Eliminates proxy attendance using `face-api.js` client-side biometric checks.
- **Time-Locked:** Attendance is only accepted during specific school hours.

### 2. 🧠 Classroom Analytics (Quality Assurance)
- **Focus Detection (AI):** Using Computer Vision (TensorFlow/MediaPipe) to analyze the collective gaze and posture of the class. Are students looking at the board, or are they disengaged?
- **Activity Recognition:** Detects anomaly actions.
    - *Is the teacher standing near the board?* (Teaching)
    - *Is the teacher sitting idle for long periods?* (Low Engagement)
    - *Are students performing repetitive manual labor actions?* (Chore Detection Alert).

### 3. 💰 Fin-Track (School Budgeting)
- **Demand Generation:** Headmasters can digitally raise demands for books, mid-day meals, and repairs.
- **Budget Transparency:** Track inflow and outflow of government grants.

### 4. 🔮 Dropout Prediction Engine
- **Early Warning System:** An ML model that analyzes:
    - Chronic Absenteeism trends.
    - Financial background data.
    - Academic performance decline.
- **Intervention:** Alerts district administration to intervene *before* a student drops out.

## 🛠️ Tech Stack
- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas) with Geospatial Queries
- **AI/ML:** - `face-api.js` (Face Recognition)
    - `TensorFlow.js` / `MediaPipe` (Pose Estimation & Focus Detection)
    - Python/Scikit-Learn (Dropout Prediction Model)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account

