import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import "./TeacherDashboard.css";
import PredictForm      from "./PredictForm.jsx";
import DropoutDashboard from "./Dashboard.jsx";
import {
  FaUserCheck, FaPlusCircle, FaCalendarAlt, FaRupeeSign,
  FaSignOutAlt, FaSync, FaEdit, FaMapMarkerAlt, FaLightbulb,
  FaQuestionCircle, FaListOl, FaPrint,
} from "react-icons/fa";

const TeacherDashboard = () => {
  const { user, logout } = useAuth();

  const [activeTab,       setActiveTab]       = useState("live");
  const [classes,         setClasses]         = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [attendanceReport,setAttendanceReport] = useState(null);
  const [loadingReport,   setLoadingReport]   = useState(false);
  const [showHistoryModal,setShowHistoryModal] = useState(false);
  const [historyData,     setHistoryData]     = useState(null);
  const [loadingHistory,  setLoadingHistory]  = useState(false);
  const [newClass, setNewClass] = useState({
    className: "", classCode: "", roomName: "",
    latitude: "", longitude: "", radius: 25,
  });
  const [locating, setLocating] = useState(false);
  const [schedule, setSchedule] = useState({
    day: "Wednesday", startTime: "", endTime: "", room: "",
  });
  const [financeForm, setFinanceForm] = useState({
    title: "", category: "Infrastructure", amount: "", urgency: "Medium", description: "",
  });
  const [budgetRequests,    setBudgetRequests]    = useState([]);
  const [shikshaTab,        setShikshaTab]        = useState("materials");

  // ── Dropout sub-tab: "assess" | "records" ──
  const [dropoutView,       setDropoutView]       = useState("assess");
  const [dropoutRefresh,    setDropoutRefresh]    = useState(0);

  const [riskData,          setRiskData]          = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [sosAlerts,         setSosAlerts]         = useState([]);
  const [questionTopic,     setQuestionTopic]     = useState("");
  const [generatedQuestions,setGeneratedQuestions]= useState([]);
  const [loadingGen,        setLoadingGen]        = useState(false);
  const [planTopic,         setPlanTopic]         = useState("");
  const [planDuration,      setPlanDuration]      = useState(3);
  const [generatedPlan,     setGeneratedPlan]     = useState([]);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => {
    if (activeTab === "live"    && selectedClassId) fetchReport();
    if (activeTab === "finance")                    fetchBudgetRequests();
  }, [selectedClassId, activeTab]);

  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes/my-classes");
      setClasses(res.data.data.classes);
      if (res.data.data.classes.length > 0 && !selectedClassId)
        setSelectedClassId(res.data.data.classes[0]._id);
    } catch (err) { console.error(err); }
  };

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const res = await api.get(`/attendance/report/${selectedClassId}?date=${new Date().toISOString()}`);
      setAttendanceReport(res.data.data.records);
    } catch (err) { console.error(err); }
    finally { setLoadingReport(false); }
  };

  const fetchBudgetRequests = async () => {
    try {
      const res = await api.get("/finance");
      setBudgetRequests(res.data.data.requests);
    } catch (err) { console.error("Finance fetch failed", err); }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return alert("Select a class first");
    try {
      const currentClass = classes.find((c) => c._id === selectedClassId);
      const newSchedule  = [...(currentClass.schedule || []), schedule];
      await api.patch(`/classes/${selectedClassId}`, { schedule: newSchedule });
      alert("Timetable Updated!");
      fetchClasses();
    } catch (err) { alert("Failed to update timetable"); }
  };

  const handleOpenHistory = async (studentId) => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/attendance/student-history?classId=${selectedClassId}&studentId=${studentId}`);
      setHistoryData(res.data.data);
    } catch (err) { alert("Failed to load history"); setShowHistoryModal(false); }
    finally { setLoadingHistory(false); }
  };

  const handleHistoryStatusChange = async (recordId, newStatus) => {
    try {
      await api.patch("/attendance/update", { recordId, status: newStatus });
      setHistoryData((prev) => ({
        ...prev,
        history: prev.history.map((rec) =>
          rec._id === recordId ? { ...rec, status: newStatus } : rec
        ),
        summary: {
          ...prev.summary,
          present: newStatus === "present" ? prev.summary.present + 1 : prev.summary.present - 1,
          absent:  newStatus === "absent"  ? prev.summary.absent  + 1 : prev.summary.absent  - 1,
        },
      }));
    } catch (err) { alert("Failed to update status"); }
  };

  const handleGetLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) { alert("Geolocation not supported"); setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewClass((prev) => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocating(false);
      },
      () => { alert("Ensure GPS is on."); setLocating(false); }
    );
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.post("/classes", newClass);
      alert("Class Created Successfully!");
      setNewClass({ className: "", classCode: "", roomName: "", latitude: "", longitude: "", radius: 25 });
      fetchClasses();
      setActiveTab("timetable");
    } catch (err) { alert(err.response?.data?.message || "Failed to create class"); }
  };

  const handleCreateFinanceRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post("/finance", financeForm);
      alert("Demand Raised Successfully!");
      setFinanceForm({ title: "", category: "Infrastructure", amount: "", urgency: "Medium", description: "" });
      fetchBudgetRequests();
    } catch (err) { alert("Failed to raise demand"); }
  };

  const toggleStatus = async (id) => {
    try { await api.patch(`/finance/${id}/toggle`); fetchBudgetRequests(); } catch (err) {}
  };

  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    setLoadingGen(true);
    try {
      const res = await api.post("/shiksha/generate-questions", { topic: questionTopic });
      setGeneratedQuestions(res.data.data);
    } catch (err) { alert("Failed to generate questions. Check API Key."); }
    finally { setLoadingGen(false); }
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    setLoadingGen(true);
    try {
      const res = await api.post("/shiksha/generate-plan", { chapterName: planTopic, duration: planDuration });
      setGeneratedPlan(res.data.data);
    } catch (err) { alert("Failed to generate plan. Check API Key."); }
    finally { setLoadingGen(false); }
  };

  const getStats = () => {
    if (!attendanceReport) return { total: 0, present: 0, absent: 0 };
    const total   = attendanceReport.length;
    const present = attendanceReport.filter((r) => r.status === "present").length;
    return { total, present, absent: total - present };
  };
  const stats = getStats();

  return (
    <div className="teacher-dashboard">
      <div className="teacher-sidebar">
        <h2>VidyaDrishti</h2>
        <button className={`sidebar-btn ${activeTab === "live"      ? "active" : ""}`} onClick={() => setActiveTab("live")}><FaUserCheck /> Live Monitor</button>
        <button className={`sidebar-btn ${activeTab === "create"    ? "active" : ""}`} onClick={() => setActiveTab("create")}><FaPlusCircle /> Create Class</button>
        <button className={`sidebar-btn ${activeTab === "timetable" ? "active" : ""}`} onClick={() => setActiveTab("timetable")}><FaCalendarAlt /> Timetable</button>
        <button className={`sidebar-btn ${activeTab === "finance"   ? "active" : ""}`} onClick={() => setActiveTab("finance")}><FaRupeeSign /> Gram Nidhi</button>
        <button className={`sidebar-btn ${activeTab === "shiksha"   ? "active" : ""}`} onClick={() => setActiveTab("shiksha")}><FaLightbulb /> ShikshaSaathi</button>
        <div style={{ marginTop: "auto" }}>
          <button className="sidebar-btn" onClick={logout}><FaSignOutAlt /> Logout</button>
        </div>
      </div>

      <div className="dashboard-content">

        {/* === TAB 1: LIVE MONITOR === */}
        {activeTab === "live" && (
          <div>
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between" }}>
              <h1>Live Monitor</h1>
              <select className="form-input" style={{ width: "200px" }} value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.className}</option>)}
              </select>
            </div>
            <div className="stats-cards">
              <div className="stat-card"><span className="stat-number" style={{ color: "#3498db" }}>{stats.total}</span><span>Total</span></div>
              <div className="stat-card"><span className="stat-number" style={{ color: "#27ae60" }}>{stats.present}</span><span>Present</span></div>
              <div className="stat-card"><span className="stat-number" style={{ color: "#e74c3c" }}>{stats.absent}</span><span>Absent</span></div>
            </div>
            <div className="student-list">
              {loadingReport ? <p style={{ padding: "20px" }}>Loading...</p> : (
                attendanceReport?.map((record) => (
                  <div key={record.student._id} className="student-row">
                    <div style={{ flex: 1 }}>
                      <strong>{record.student.name}</strong>
                      <div style={{ fontSize: "12px", color: "#777" }}>{record.student.email}</div>
                    </div>
                    <span className={`status-badge status-${record.status}`}>{record.status.toUpperCase()}</span>
                    <button onClick={() => handleOpenHistory(record.student._id)} className="btn-secondary"
                      style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", padding: "5px 10px", marginLeft: "15px" }}>
                      <FaEdit /> Edit / History
                    </button>
                  </div>
                ))
              )}
            </div>
            <button onClick={fetchReport} className="btn-secondary" style={{ marginTop: "20px" }}>
              <FaSync /> Refresh List
            </button>
          </div>
        )}

        {/* === TAB 2: CREATE CLASS === */}
        {activeTab === "create" && (
          <div className="form-card">
            <h3>Create New Class</h3>
            <form onSubmit={handleCreateClass}>
              <div className="form-group"><label>Class Name</label><input className="form-input" value={newClass.className} onChange={(e) => setNewClass({ ...newClass, className: e.target.value })} required /></div>
              <div className="form-group"><label>Class Code</label><input className="form-input" value={newClass.classCode} onChange={(e) => setNewClass({ ...newClass, classCode: e.target.value })} required /></div>
              <div className="form-group"><label>Room Name</label><input className="form-input" value={newClass.roomName} onChange={(e) => setNewClass({ ...newClass, roomName: e.target.value })} required /></div>
              <div className="form-group" style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px" }}>
                <label><FaMapMarkerAlt /> Geofence Location</label>
                <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
                  <input className="form-input" placeholder="Lat" value={newClass.latitude} readOnly />
                  <input className="form-input" placeholder="Lon" value={newClass.longitude} readOnly />
                </div>
                <button type="button" className="btn-secondary" onClick={handleGetLocation} disabled={locating}>{locating ? "..." : "Get GPS"}</button>
              </div>
              <div className="form-group"><label>Radius (m)</label><input type="number" className="form-input" value={newClass.radius} onChange={(e) => setNewClass({ ...newClass, radius: e.target.value })} /></div>
              <button type="submit" className="btn-primary" style={{ width: "100%" }}>Create Class</button>
            </form>
          </div>
        )}

        {/* === TAB 3: TIMETABLE === */}
        {activeTab === "timetable" && (
          <div>
            <h1 className="section-header">Manage Timetables</h1>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: "bold" }}>Select Class to Edit: </label>
              <select className="form-input" style={{ width: "300px", display: "inline-block", marginLeft: "10px" }}
                value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                <option value="">-- Choose Class --</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.className}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
              <div className="form-card" style={{ flex: 1, minWidth: "300px" }}>
                <h3>Add New Time Slot</h3>
                <form onSubmit={handleAddSchedule}>
                  <div className="form-group">
                    <label>Day</label>
                    <select className="form-input" value={schedule.day} onChange={(e) => setSchedule({ ...schedule, day: e.target.value })}>
                      {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Start Time</label><input type="time" className="form-input" value={schedule.startTime} onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })} required /></div>
                  <div className="form-group"><label>End Time</label><input type="time" className="form-input" value={schedule.endTime} onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })} required /></div>
                  <div className="form-group"><label>Room</label><input className="form-input" value={schedule.room} onChange={(e) => setSchedule({ ...schedule, room: e.target.value })} placeholder="Room 101" /></div>
                  <button type="submit" className="btn-primary">Add to Schedule</button>
                </form>
              </div>
              <div style={{ flex: 1, minWidth: "300px" }}>
                <h3>Current Schedule</h3>
                {selectedClassId && classes.find((c) => c._id === selectedClassId)?.schedule?.length > 0
                  ? classes.find((c) => c._id === selectedClassId).schedule.map((slot, idx) => (
                      <div key={idx} className="schedule-item">
                        <div><strong>{slot.day}</strong><div style={{ fontSize: "13px" }}>{slot.startTime} - {slot.endTime}</div></div>
                        <div style={{ fontWeight: "bold", color: "#7f8c8d" }}>{slot.room}</div>
                      </div>
                    ))
                  : <p style={{ color: "#999" }}>No schedule added yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* === TAB 4: FINANCE === */}
        {activeTab === "finance" && (
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div className="form-card" style={{ flex: 1, minWidth: "300px" }}>
              <h3>Raise Demand</h3>
              <form onSubmit={handleCreateFinanceRequest}>
                <div className="form-group"><label>Title</label><input className="form-input" value={financeForm.title} onChange={(e) => setFinanceForm({ ...financeForm, title: e.target.value })} required /></div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={financeForm.category} onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })}>
                    {["Infrastructure","Mid-Day Meal","Books/Stationery","Staff Salary","Medical","Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Amount</label><input className="form-input" type="number" value={financeForm.amount} onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })} required /></div>
                <div className="form-group">
                  <label>Urgency</label>
                  <select className="form-input" value={financeForm.urgency} onChange={(e) => setFinanceForm({ ...financeForm, urgency: e.target.value })}>
                    {["Low","Medium","Critical"].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ width: "100%" }}>Submit</button>
              </form>
            </div>
            <div style={{ flex: 1.5, minWidth: "300px" }}>
              <h3>History</h3>
              {budgetRequests.map((req) => (
                <div key={req._id} style={{ padding: "15px", background: "white", marginBottom: "10px", borderRadius: "8px", border: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{req.title}</div>
                    <div style={{ fontSize: "12px", color: "#777" }}>{req.category} • {req.urgency}</div>
                    <div style={{ fontWeight: "bold", color: "#27ae60" }}>₹{req.amount}</div>
                  </div>
                  <div onClick={() => toggleStatus(req._id)} style={{ cursor: "pointer", padding: "5px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "bold", background: req.status === "Approved" ? "#d4edda" : req.status === "Funds Released" ? "#cce5ff" : "#fff3cd", color: req.status === "Approved" ? "#155724" : req.status === "Funds Released" ? "#004085" : "#856404" }}>
                    {req.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === TAB 5: SHIKSHA SAATHI === */}
        {activeTab === "shiksha" && (
          <div>
            <h1 className="section-header">
              <FaLightbulb style={{ color: "#f1c40f" }} /> ShikshaSaathi (Smart Classroom)
            </h1>

            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
              <button onClick={() => setShikshaTab("materials")} className={`btn-secondary ${shikshaTab === "materials" ? "active" : ""}`}>Study Materials</button>
              <button onClick={() => setShikshaTab("risk")}      className={`btn-secondary ${shikshaTab === "risk"      ? "active" : ""}`}>🎯 Dropout Radar</button>
              <button onClick={() => setShikshaTab("sos")}       className={`btn-secondary ${shikshaTab === "sos"       ? "active" : ""}`}>Classroom SOS</button>
              <button onClick={() => setShikshaTab("questions")} className={`btn-secondary ${shikshaTab === "questions" ? "active" : ""}`}><FaQuestionCircle /> Question Gen</button>
              <button onClick={() => setShikshaTab("planner")}   className={`btn-secondary ${shikshaTab === "planner"   ? "active" : ""}`}><FaListOl /> Planner</button>
            </div>

            {/* 1. STUDY MATERIALS */}
            {shikshaTab === "materials" && (
              <div className="form-card">
                <h3>Upload Smart Content</h3>
                <p style={{ fontSize: "12px", color: "#777" }}>AI will recommend these to weak students automatically.</p>
                <form onSubmit={(e) => { e.preventDefault(); alert("Material Uploaded & AI Tagged!"); }}>
                  <input className="form-input" placeholder="Title (e.g. Geometry Basics)" required />
                  <input className="form-input" placeholder="Link (YouTube/PDF)" required />
                  <select className="form-input"><option>Video</option><option>Note</option><option>Quiz</option></select>
                  <select className="form-input"><option>Easy (Remedial)</option><option>Medium</option><option>Hard (Advanced)</option></select>
                  <button className="btn-primary">Upload & AI Analyze</button>
                </form>
              </div>
            )}

            {/* ── 2. DROPOUT RADAR — now powered by ML model ── */}
            {shikshaTab === "risk" && (
              <div>
                {/* Toggle between Assess and Records */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  <button
                    className={`btn-secondary ${dropoutView === "assess" ? "active" : ""}`}
                    onClick={() => setDropoutView("assess")}
                  >
                    ➕ New Assessment
                  </button>
                  <button
                    className={`btn-secondary ${dropoutView === "records" ? "active" : ""}`}
                    onClick={() => setDropoutView("records")}
                  >
                    📊 All Records
                  </button>
                </div>

                {/* PredictForm — calls ML model, saves to DB */}
                {dropoutView === "assess" && (
                  <PredictForm
                    onNewPrediction={() => {
                      setDropoutRefresh((r) => r + 1); // auto-refresh records
                    }}
                  />
                )}

                {/* DropoutDashboard — shows all saved predictions */}
                {dropoutView === "records" && (
                  <DropoutDashboard refresh={dropoutRefresh} />
                )}
              </div>
            )}

            {/* 3. SOS ALERTS */}
            {shikshaTab === "sos" && (
              <div>
                <h3>Live Help Requests</h3>
                <div style={{ background: "#fdedec", color: "#e74c3c", padding: "15px", borderRadius: "8px", border: "1px solid #e74c3c", marginBottom: "10px" }}>
                  <strong>🚨 Rahul Singh</strong> in <em>Physics 101</em>
                  <p>"I don't understand the last formula."</p>
                  <button style={{ background: "white", border: "1px solid #e74c3c", color: "#e74c3c", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>Mark Resolved</button>
                </div>
              </div>
            )}

            {/* 4. QUESTION GENERATOR */}
            {shikshaTab === "questions" && (
              <div style={{ display: "flex", gap: "20px" }}>
                <div className="form-card" style={{ flex: 1 }}>
                  <h3>Generate Quiz / Exam</h3>
                  <form onSubmit={handleGenerateQuestions}>
                    <div className="form-group"><label>Topic / Chapter</label><input className="form-input" value={questionTopic} onChange={(e) => setQuestionTopic(e.target.value)} placeholder="e.g. Newton's Laws" required /></div>
                    <div className="form-group"><label>Difficulty</label><select className="form-input"><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                    <button className="btn-primary" disabled={loadingGen}>{loadingGen ? "Generating..." : "Generate Questions"}</button>
                  </form>
                </div>
                <div style={{ flex: 1.5, background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h3>Output</h3>
                    {generatedQuestions.length > 0 && <button className="btn-secondary" style={{ fontSize: "12px" }}><FaPrint /> Print</button>}
                  </div>
                  {generatedQuestions.length === 0 ? <p style={{ color: "#999" }}>Questions will appear here...</p> : (
                    <ul style={{ paddingLeft: "20px" }}>
                      {generatedQuestions.map((q) => (
                        <li key={q.id} style={{ marginBottom: "15px" }}>
                          <strong>{q.text}</strong>
                          {q.type === "MCQ" && (
                            <div style={{ marginTop: "5px", fontSize: "13px", color: "#555" }}>
                              {q.options.map((opt, i) => <span key={i} style={{ marginRight: "10px", background: "#eee", padding: "2px 8px", borderRadius: "4px" }}>{opt}</span>)}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* 5. LESSON PLANNER */}
            {shikshaTab === "planner" && (
              <div style={{ display: "flex", gap: "20px" }}>
                <div className="form-card" style={{ flex: 1 }}>
                  <h3>Create Chapter Plan</h3>
                  <form onSubmit={handleGeneratePlan}>
                    <div className="form-group"><label>Chapter Name</label><input className="form-input" value={planTopic} onChange={(e) => setPlanTopic(e.target.value)} placeholder="e.g. Thermodynamics" required /></div>
                    <div className="form-group"><label>Duration (Days)</label><input type="number" className="form-input" value={planDuration} onChange={(e) => setPlanDuration(e.target.value)} required /></div>
                    <button className="btn-primary" disabled={loadingGen}>{loadingGen ? "Planning..." : "Create Plan"}</button>
                  </form>
                </div>
                <div style={{ flex: 1.5, background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                  <h3>Suggested Timeline</h3>
                  {generatedPlan.length === 0 ? <p style={{ color: "#999" }}>Plan will appear here...</p> : (
                    <div className="timeline">
                      {generatedPlan.map((day, i) => (
                        <div key={i} style={{ padding: "15px", borderLeft: "4px solid #3498db", background: "#f8f9fa", marginBottom: "10px", marginLeft: "10px" }}>
                          <div style={{ fontWeight: "bold", color: "#2c3e50" }}>{day.day}: {day.topic}</div>
                          <div style={{ fontSize: "13px", margin: "5px 0" }}>Activity: {day.activity}</div>
                          <div style={{ fontSize: "12px", color: "#777" }}>Homework: {day.homework}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === HISTORY MODAL === */}
        {showHistoryModal && (
          <div className="modal-overlay">
            <div className="modal-content-large">
              <div className="modal-header-bar">
                <h2>Attendance Detail</h2>
                <button className="close-btn" onClick={() => setShowHistoryModal(false)}>Close</button>
              </div>
              <div className="modal-body">
                {loadingHistory ? <p>Loading History...</p> : (
                  historyData && (
                    <>
                      <table className="summary-table">
                        <thead><tr><th>Class Group</th><th>Course Detail</th><th>Class Detail</th><th>Student Detail</th><th>Attendance Status</th></tr></thead>
                        <tbody>
                          <tr>
                            <td>General</td>
                            <td>{historyData.classDetails.classCode}<br />{historyData.classDetails.className}</td>
                            <td>{historyData.classDetails.roomName}<br />(Radius: {historyData.classDetails.radius}m)</td>
                            <td>{historyData.studentDetails.name}<br />{historyData.studentDetails.email}</td>
                            <td>Present: {historyData.summary.present}<br />Absent: {historyData.summary.absent}<br />Total: {historyData.summary.total}<br /><span className="percentage-text">{historyData.summary.percentage}%</span></td>
                          </tr>
                        </tbody>
                      </table>
                      <table className="detail-table">
                        <thead><tr><th>Sl.No.</th><th>Date</th><th>Day</th><th>Check-In Time</th><th>Status (Click to Edit)</th></tr></thead>
                        <tbody>
                          {historyData.history.map((record, index) => {
                            const dateObj = new Date(record.date);
                            const days    = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
                            return (
                              <tr key={record._id}>
                                <td>{index + 1}</td>
                                <td>{dateObj.toLocaleDateString()}</td>
                                <td>{days[dateObj.getDay()]}</td>
                                <td>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                                <td>
                                  <select className={`status-select ${record.status}`} value={record.status} onChange={(e) => handleHistoryStatusChange(record._id, e.target.value)}>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                          {historyData.history.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No records found</td></tr>}
                        </tbody>
                      </table>
                    </>
                  )
                )}
              </div>
              <div style={{ padding: "10px", textAlign: "right", borderTop: "1px solid #ddd" }}>
                <button className="close-btn" onClick={() => setShowHistoryModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
