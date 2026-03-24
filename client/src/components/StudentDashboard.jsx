import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import "./StudentDashboard.css";
import * as faceapi from "face-api.js";
import { Link } from "react-router-dom";
import FocusMonitor from "./FocusMonitor";
import { FaUser, FaChartBar, FaSignOutAlt, FaPlus } from "react-icons/fa";

const StudentDashboard = () => {
  const { user, logout } = useAuth();

  const [attendanceClass, setAttendanceClass] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [locationData, setLocationData] = useState(null);
  const [isLiveSession, setIsLiveSession] = useState(false);
  const [stats, setStats] = useState(null);

  // --- JOIN CLASS STATE ---
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const currentFocusData = useRef({ score: 100, status: "Focused" });

  // Fetch Enrolled Classes
  const fetchStats = async () => {
    try {
      const response = await api.get("/attendance/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats", error);
    }
  };

  useEffect(() => {
    fetchStats();
    loadModels();
  }, []);

  const loadModels = async () => {
    const MODEL_URL = "/models";
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  };

  // --- NEW: JOIN CLASS HANDLER ---
  const handleJoinClass = async (e) => {
    e.preventDefault();
    setJoining(true);
    try {
      await api.post("/classes/join", { classCode: joinCode });
      alert("Success! You have joined the class.");
      setJoinCode("");
      fetchStats(); // Refresh dropdown
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join class");
    } finally {
      setJoining(false);
    }
  };

  const handleClassSelect = (e) => {
    const classId = e.target.value;
    if (!classId) return setAttendanceClass(null);
    const selected = stats.courses.find((c) => c.classId === classId);
    setAttendanceClass(selected);
    setStep(1);
    setMessage({ text: "", type: "" });
  };

  // ... (Keep handleLocationCheck, startCamera, captureAndVerify, handleEndSession exactly as before)
  const handleLocationCheck = () => {
    setLoading(true);
    setMessage({ text: "Getting GPS...", type: "loading" });
    if (!navigator.geolocation) {
      setMessage({ text: "No GPS", type: "error" });
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationData({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setMessage({ text: "Location Verified!", type: "success" });
        setLoading(false);
        setTimeout(() => setStep(2), 1000);
      },
      () => {
        setMessage({ text: "GPS Error", type: "error" });
        setLoading(false);
      },
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      setMessage({ text: "Camera denied", type: "error" });
    }
  };

  const captureAndVerify = async () => {
    if (!attendanceClass || !videoRef.current) return;
    setLoading(true);
    setMessage({ text: "Verifying...", type: "loading" });
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) throw new Error("No face detected!");
      const distance = faceapi.euclideanDistance(
        detection.descriptor,
        new Float32Array(user.faceDescriptor),
      );
      if (distance > 0.5) throw new Error("Face mismatch.");

      const response = await api.post("/attendance/check-in", {
        classId: attendanceClass.classId,
        studentLat: locationData.latitude,
        studentLon: locationData.longitude,
      });

      if (videoRef.current.srcObject)
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
      setStep(3);
      setMessage({ text: response.data.message, type: "success" });
      setTimeout(() => {
        setIsLiveSession(true);
      }, 1500);
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    try {
      await api.patch("/attendance/focus", {
        classId: attendanceClass.classId,
        score: currentFocusData.current.score,
      });
      setIsLiveSession(false);
      setAttendanceClass(null);
      setStep(1);
    } catch (err) {}
  };

  return isLiveSession ? (
    <div
      className="attendance-portal"
      style={{ textAlign: "center", marginTop: "50px" }}
    >
      <h2>Live Class: {attendanceClass?.className}</h2>
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
      >
        <FocusMonitor
          onFocusUpdate={(data) => {
            currentFocusData.current = data;
          }}
        />
      </div>
      <button
        className="btn-attendance"
        onClick={handleEndSession}
        style={{ marginTop: "20px", background: "#e74c3c" }}
      >
        End Session
      </button>
    </div>
  ) : (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Attendance</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/check-in" className="nav-item active">
            <FaChartBar /> Dashboard
          </Link>
          <Link to="/profile" className="nav-item">
            <FaUser /> Profile
          </Link>
          <button
            onClick={logout}
            className="nav-item"
            style={{ marginTop: "auto" }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </nav>
      </div>

      <div className="main-content">
        <header className="header">
          <h1>Welcome, {user?.name}!</h1>
        </header>

        {/* --- JOIN CLASS SECTION --- */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "20px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "16px" }}>Join Class:</h3>
          <input
            placeholder="Enter Class Code (e.g. PHY101)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              flex: 1,
            }}
          />
          <button
            onClick={handleJoinClass}
            disabled={joining}
            className="btn-attendance"
            style={{ margin: 0, padding: "8px 20px", fontSize: "14px" }}
          >
            {joining ? "Joining..." : "Join"}
          </button>
        </div>

        <div className="attendance-portal">
          <div style={{ marginBottom: "25px", textAlign: "center" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "bold",
              }}
            >
              Select Class for Attendance:
            </label>
            <select
              className="class-selector-dropdown"
              onChange={handleClassSelect}
              style={{ padding: "10px", width: "100%", maxWidth: "400px" }}
            >
              <option value="">-- Select a Course --</option>
              {stats?.courses?.map((course) => (
                <option key={course.classId} value={course.classId}>
                  {course.className}
                </option>
              ))}
            </select>
          </div>

          {attendanceClass && (
            <>
              <div className="attendance-steps">
                <div className={`step ${step >= 1 ? "active" : ""}`}>
                  1. Location
                </div>
                <div className={`step ${step >= 2 ? "active" : ""}`}>
                  2. Face
                </div>
                <div className={`step ${step >= 3 ? "active" : ""}`}>
                  3. Done
                </div>
              </div>
              <div className="attendance-action">
                {message.text && (
                  <div className={`message-box ${message.type}`}>
                    {message.text}
                  </div>
                )}
                {step === 1 && (
                  <button
                    className="btn-attendance"
                    onClick={handleLocationCheck}
                    disabled={loading}
                  >
                    {loading ? "Checking..." : "Check Location"}
                  </button>
                )}
                {step === 2 &&
                  (!cameraActive ? (
                    <button className="btn-attendance" onClick={startCamera}>
                      Start Camera
                    </button>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: "300px",
                          borderRadius: "10px",
                          transform: "scaleX(-1)",
                        }}
                      ></video>
                      <button
                        className="btn-attendance"
                        onClick={captureAndVerify}
                        disabled={loading}
                      >
                        {loading ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  ))}
                {step === 3 && <h3 style={{ color: "#27ae60" }}>Success!</h3>}
              </div>
            </>
          )}
        </div>

        <div className="attendance-portal" style={{ textAlign: "center" }}>
          <h2>Live Class: {attendanceClass?.className}</h2>

          {/* SOS BUTTON */}
          <button
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "25px",
              fontSize: "16px",
              fontWeight: "bold",
              margin: "20px",
              cursor: "pointer",
              animation: "pulse 2s infinite",
            }}
            onClick={async () => {
              await api.post("/shiksha/sos", {
                classId: attendanceClass.classId,
                message: "I am confused!",
              });
              alert("Teacher Notified! Help is on the way.");
            }}
          >
            ✋ SOS: I don't understand
          </button>

          {/* AI TRANSLATION TOGGLE */}
          <div style={{ margin: "20px" }}>
            <label>🔊 Audio Language: </label>
            <select style={{ padding: "5px" }}>
              <option>English</option>
              <option>Hindi (AI)</option>
              <option>Tamil (AI)</option>
            </select>
          </div>

          {/* ... Focus Monitor & End Session Button ... */}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
