import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import "./StudentDashboard.css";
import * as faceapi from "face-api.js";
import { Link } from "react-router-dom"; // <--- ADD THIS

import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaChartBar,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaCamera,
  FaSync,
  FaTimes,
  FaCalendarAlt,
  FaChalkboardTeacher,
} from "react-icons/fa";

const StudentDashboard = () => {
  const { user, logout } = useAuth();

  // --- State for Attendance Process ---
  const [attendanceClass, setAttendanceClass] = useState(null); // The class selected for check-in
  const [step, setStep] = useState(1); // 1: Location, 2: Camera, 3: Success
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [locationData, setLocationData] = useState(null);

  // --- State for Data & History Modal ---
  const [stats, setStats] = useState(null); // Holds the list of enrolled classes
  const [selectedCourseHistory, setSelectedCourseHistory] = useState(null); // The course clicked for history
  const [courseHistory, setCourseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- Camera Refs ---
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // --- 1. Fetch Dashboard Stats (Enrolled Classes) on Load ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/attendance/stats");
        setStats(response.data.data);
      } catch (error) {
        console.error("Error fetching stats", error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
    };
    loadModels();
  }, []);

  // --- 2. Handle Class Selection for Check-In ---
  const handleClassSelect = (e) => {
    const classId = e.target.value;
    if (!classId) {
      setAttendanceClass(null);
      return;
    }
    // Find the full class object from stats
    const selected = stats.courses.find((c) => c.classId === classId);
    setAttendanceClass(selected);

    // Reset steps
    setStep(1);
    setMessage({ text: "", type: "" });
  };

  // --- 3. Step 1: Get Location ---
  const handleLocationCheck = () => {
    setLoading(true);
    setMessage({ text: "Getting GPS location...", type: "loading" });

    if (!navigator.geolocation) {
      setMessage({ text: "Geolocation not supported", type: "error" });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationData({ latitude, longitude });
        setMessage({
          text: "Location Verified! Proceed to Face Verification.",
          type: "success",
        });
        setLoading(false);
        setTimeout(() => setStep(2), 1500);
      },
      (error) => {
        setMessage({ text: "Unable to retrieve location.", type: "error" });
        setLoading(false);
      }
    );
  };

  // --- 4. Step 2: Camera Logic ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // 1. Set state to true FIRST so React renders the <video> tag
      setCameraActive(true);

      // 2. Wait a tiny bit for the DOM to update, then attach stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Camera access denied", type: "error" });
    }
  };

  const captureAndVerify = async () => {
    if (!attendanceClass || !videoRef.current) return;
    setLoading(true);
    setMessage({ text: "Verifying face...", type: "loading" });

    try {
      // A. DETECT LIVE FACE
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error("No face detected! Look at camera.");
      }

      // B. GET STORED FACE FROM USER PROFILE
      // (You might need to update AuthContext to ensure user.faceDescriptor is loaded)
      if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
        throw new Error("Face ID not set up. Go to Profile to register.");
      }

      // C. COMPARE FACES (Euclidean Distance)
      // 0.0 is exact match, 0.6 is typical threshold
      const storedDescriptor = new Float32Array(user.faceDescriptor);
      const distance = faceapi.euclideanDistance(
        detection.descriptor,
        storedDescriptor
      );

      if (distance > 0.5) {
        // 0.5 is a strict threshold for security
        throw new Error("Face verification failed. Not recognized.");
      }

      // D. IF MATCH, PROCEED TO API
      const response = await api.post("/attendance/check-in", {
        classId: attendanceClass.classId,
        studentLat: locationData.latitude,
        studentLon: locationData.longitude,
      });

      // Stop Camera
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);

      setStep(3);
      setMessage({ text: response.data.message, type: "success" });
      fetchStats(); // Refresh UI
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- 5. History Modal Logic ---
  const handleHistoryClick = async (course) => {
    setSelectedCourseHistory(course);
    setLoadingHistory(true);
    setCourseHistory([]);

    try {
      const response = await api.get(`/attendance/history/${course.classId}`);
      setCourseHistory(response.data.data.records);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeModal = () => {
    setSelectedCourseHistory(null);
  };

  // Helpers
  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  const formatTime = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--";

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Attendance</h2>
          <p style={{ opacity: 0.8, fontSize: "14px" }}>Student Portal</p>
        </div>
        <nav className="sidebar-nav">
          {/* Dashboard Link (Active) */}
          <Link
            to="/check-in"
            className="nav-item active"
            style={{ textDecoration: "none" }}
          >
            <FaChartBar className="nav-icon" /> Dashboard
          </Link>

          {/* Profile Link - NOW WORKING */}
          <Link
            to="/profile"
            className="nav-item"
            style={{ textDecoration: "none" }}
          >
            <FaUser className="nav-icon" /> Profile
          </Link>

          {/* Settings (Placeholder) */}
          <button className="nav-item">
            <FaCog className="nav-icon" /> Settings
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="nav-item"
            style={{
              marginTop: "auto",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <FaSignOutAlt className="nav-icon" /> Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <div>
            <h1>Welcome, {user?.name || "Student"}!</h1>
            <p style={{ color: "#7f8c8d" }}>Computer Science Department</p>
          </div>
          <div className="user-info">
            <span>{user?.name}</span>
            <div className="user-avatar">{getInitials(user?.name)}</div>
          </div>
        </header>

        {/* --- SECTION 1: ATTENDANCE PORTAL (Mark Attendance) --- */}
        <div className="attendance-portal">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            <h2 style={{ color: "#2c3e50", margin: 0 }}>Mark Attendance</h2>
            <span
              style={{
                background: "#d4edda",
                color: "#155724",
                padding: "5px 15px",
                borderRadius: "20px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              Portal Active
            </span>
          </div>

          {/* CLASS SELECTOR */}
          <div style={{ marginBottom: "25px", textAlign: "center" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "600",
                color: "#555",
              }}
            >
              Select Class to Check In:
            </label>
            <select
              className="class-selector-dropdown"
              onChange={handleClassSelect}
              style={{
                padding: "10px",
                width: "100%",
                maxWidth: "400px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "16px",
              }}
            >
              <option value="">-- Select a Course --</option>
              {stats?.courses?.map((course) => (
                <option key={course.classId} value={course.classId}>
                  {course.className} ({course.classCode})
                </option>
              ))}
            </select>
          </div>

          {/* ATTENDANCE STEPS (Only show if class is selected) */}
          {attendanceClass ? (
            <>
              <div className="attendance-steps">
                <div
                  className={`step ${step >= 1 ? "active" : ""} ${
                    step > 1 ? "completed" : ""
                  }`}
                >
                  <div className="step-icon">1</div>
                  <span>Location</span>
                </div>
                <div
                  className={`step ${step >= 2 ? "active" : ""} ${
                    step > 2 ? "completed" : ""
                  }`}
                >
                  <div className="step-icon">2</div>
                  <span>Face Verify</span>
                </div>
                <div
                  className={`step ${step >= 3 ? "active" : ""} ${
                    step > 3 ? "completed" : ""
                  }`}
                >
                  <div className="step-icon">3</div>
                  <span>Done</span>
                </div>
              </div>

              <div className="attendance-action">
                {message.text && (
                  <div className={`message-box ${message.type}`}>
                    {message.type === "loading" && (
                      <FaSync
                        className="fa-spin"
                        style={{ marginRight: "8px" }}
                      />
                    )}
                    {message.text}
                  </div>
                )}

                {/* STEP 1: Location */}
                {step === 1 && (
                  <>
                    <FaMapMarkerAlt
                      size={50}
                      color="#3498db"
                      style={{ marginBottom: "15px" }}
                    />
                    <h3>Verify Location for {attendanceClass.classCode}</h3>
                    <button
                      className="btn-attendance"
                      onClick={handleLocationCheck}
                      disabled={loading}
                    >
                      {loading ? "Checking..." : "Check Location"}
                    </button>
                  </>
                )}

                {/* STEP 2: Camera */}
                {step === 2 && (
                  <>
                    {!cameraActive ? (
                      <>
                        <FaCamera
                          size={50}
                          color="#3498db"
                          style={{ marginBottom: "15px" }}
                        />
                        <h3>Face Verification</h3>
                        <button
                          className="btn-attendance"
                          onClick={startCamera}
                        >
                          Start Camera
                        </button>
                      </>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <div className="camera-container">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                          ></video>
                        </div>
                        <button
                          className="btn-attendance"
                          onClick={captureAndVerify}
                          disabled={loading}
                        >
                          {loading ? "Verifying..." : "Verify & Mark Present"}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* STEP 3: Success */}
                {step === 3 && (
                  <>
                    <FaCheckCircle
                      size={60}
                      color="#27ae60"
                      style={{ marginBottom: "15px" }}
                    />
                    <h3 style={{ color: "#27ae60" }}>Marked Present!</h3>
                    <p>Attendance recorded for {attendanceClass.className}.</p>
                    <button
                      className="btn-attendance"
                      onClick={() => {
                        setStep(1);
                        setMessage({ text: "", type: "" });
                        setAttendanceClass(null);
                      }} // Reset
                      style={{ background: "#7f8c8d" }}
                    >
                      Mark Another Class
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#95a5a6",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <FaChalkboardTeacher
                size={40}
                style={{ marginBottom: "10px", opacity: 0.5 }}
              />
              <p>
                Please select a class from the dropdown above to begin
                attendance.
              </p>
            </div>
          )}
        </div>

        {/* --- SECTION 2: VIEW ATTENDANCE (History) --- */}
        <div className="attendance-overview">
          <div className="overall-attendance">
            <h3>Overall Attendance</h3>
            <div className="circle-progress">
              <span>{stats?.overall?.percentage || 0}%</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                marginTop: "20px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "24px",
                    fontWeight: "bold",
                  }}
                >
                  {stats?.overall?.present || 0}
                </span>
                <span style={{ color: "#7f8c8d" }}>Present</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "24px",
                    fontWeight: "bold",
                  }}
                >
                  {stats?.overall?.absent || 0}
                </span>
                <span style={{ color: "#7f8c8d" }}>Absent</span>
              </div>
            </div>
          </div>

          <div className="course-attendance">
            <h3>My Courses (Click to View History)</h3>
            {stats?.courses?.map((course) => (
              <div
                key={course.classId}
                className="course-item"
                onClick={() => handleHistoryClick(course)}
                style={{
                  cursor: "pointer",
                  padding: "15px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <strong>{course.className}</strong>
                  <span
                    style={{
                      color: course.percentage >= 75 ? "#27ae60" : "#e67e22",
                      fontWeight: "bold",
                    }}
                  >
                    {course.percentage}%
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "#ecf0f1",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      width: `${course.percentage}%`,
                      height: "100%",
                      background:
                        course.percentage >= 75 ? "#27ae60" : "#e67e22",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {(!stats?.courses || stats.courses.length === 0) && (
              <p style={{ color: "#999" }}>
                You are not enrolled in any classes.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL: VIEW HISTORY --- */}
      {selectedCourseHistory && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedCourseHistory.className} - History</h3>
              <button className="close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <div className="history-list">
              {loadingHistory ? (
                <p style={{ textAlign: "center", padding: "20px" }}>
                  Loading history...
                </p>
              ) : (
                <>
                  {courseHistory.length > 0 ? (
                    courseHistory.map((record) => (
                      <div key={record._id} className="history-item">
                        <div className="history-date">
                          <span className="date-text">
                            {formatDate(record.date)}
                          </span>
                          <span className="time-text">
                            {formatTime(record.checkInTime)}
                          </span>
                        </div>
                        <span
                          className={`status-badge status-${record.status}`}
                        >
                          {record.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#7f8c8d",
                      }}
                    >
                      <FaCalendarAlt
                        size={30}
                        style={{ marginBottom: "10px" }}
                      />
                      <p>No attendance records found.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
