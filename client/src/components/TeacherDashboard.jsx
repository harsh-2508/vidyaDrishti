import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import './TeacherDashboard.css';
import { 
  FaChalkboardTeacher, FaPlusCircle, FaCalendarAlt, FaUserCheck, 
  FaMapMarkerAlt, FaSync, FaSignOutAlt 
} from 'react-icons/fa';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  
  // --- Tabs State ---
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'create', 'timetable'
  
  // --- Data State ---
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // --- Live Monitor State ---
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // --- Create Class Form State ---
  const [newClass, setNewClass] = useState({
    className: '', classCode: '', roomName: '', latitude: '', longitude: '', radius: 25
  });
  const [locating, setLocating] = useState(false);

  // --- Timetable Form State ---
  const [schedule, setSchedule] = useState({
    day: 'Monday', startTime: '', endTime: '', room: ''
  });

  // 1. Fetch Classes on Load
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes/my-classes');
      setClasses(res.data.data.classes);
      if (res.data.data.classes.length > 0 && !selectedClassId) {
        setSelectedClassId(res.data.data.classes[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Fetch Live Attendance Report
  useEffect(() => {
    if (activeTab === 'live' && selectedClassId) {
      fetchReport();
    }
  }, [selectedClassId, activeTab]);

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      // Get report for TODAY
      const res = await api.get(`/attendance/report/${selectedClassId}?date=${new Date().toISOString()}`);
      setAttendanceReport(res.data.data.records);
    } catch (err) {
      console.error("Report fetch failed", err);
    } finally {
      setLoadingReport(false);
    }
  };

  // 3. Create Class Logic
  const handleGetLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewClass(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
        setLocating(false);
      },
      (err) => {
        alert("Could not get location. Ensure GPS is on.");
        setLocating(false);
      }
    );
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', newClass);
      alert("Class Created Successfully!");
      setNewClass({ className: '', classCode: '', roomName: '', latitude: '', longitude: '', radius: 25 });
      fetchClasses(); // Refresh list
      setActiveTab('timetable'); // Go to add schedule
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create class");
    }
  };

  // 4. Add Timetable Logic
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return alert("Select a class first");

    try {
      // First, get the current class to find existing schedule
      const currentClass = classes.find(c => c._id === selectedClassId);
      const newSchedule = [...(currentClass.schedule || []), schedule];

      // Send update
      await api.patch(`/classes/${selectedClassId}`, { schedule: newSchedule });
      
      alert("Timetable Updated!");
      fetchClasses(); // Refresh to show new schedule
    } catch (err) {
      alert("Failed to update timetable");
    }
  };

  // --- RENDER HELPERS ---
  const getStats = () => {
    if (!attendanceReport) return { total: 0, present: 0, absent: 0 };
    const total = attendanceReport.length;
    const present = attendanceReport.filter(r => r.status === 'present').length;
    return { total, present, absent: total - present };
  };

  const stats = getStats();

  return (
    <div className="teacher-dashboard">
      {/* --- SIDEBAR --- */}
      <div className="teacher-sidebar">
        <h2>VidyaDrishti</h2>
        <button 
          className={`sidebar-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          <FaUserCheck /> Live Monitor
        </button>
        <button 
          className={`sidebar-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <FaPlusCircle /> Create Class
        </button>
        <button 
          className={`sidebar-btn ${activeTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setActiveTab('timetable')}
        >
          <FaCalendarAlt /> Timetable
        </button>
        
        <div style={{marginTop: 'auto'}}>
          <div style={{padding: '20px', fontSize: '14px', color: '#bdc3c7'}}>
            {user?.name}<br/>(Teacher)
          </div>
          <button className="sidebar-btn" onClick={logout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="dashboard-content">
        
        {/* TAB 1: LIVE MONITOR */}
        {activeTab === 'live' && (
          <div>
            <div className="section-header" style={{display:'flex', justifyContent:'space-between'}}>
              <h1>Live Attendance Monitor</h1>
              <select 
                className="form-input" 
                style={{width: '200px'}}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
              </select>
            </div>

            <div className="stats-cards">
              <div className="stat-card">
                <span className="stat-number" style={{color: '#3498db'}}>{stats.total}</span>
                <span>Total Students</span>
              </div>
              <div className="stat-card">
                <span className="stat-number" style={{color: '#27ae60'}}>{stats.present}</span>
                <span>Present Today</span>
              </div>
              <div className="stat-card">
                <span className="stat-number" style={{color: '#e74c3c'}}>{stats.absent}</span>
                <span>Absent</span>
              </div>
            </div>

            <div className="student-list">
              {loadingReport ? (
                 <p style={{padding:'20px'}}>Loading live data...</p>
              ) : attendanceReport?.map((record) => (
                <div key={record.student._id} className="student-row">
  <div style={{flex: 1}}>
    <strong>{record.student.name}</strong>
    <div style={{fontSize: '12px', color: '#777'}}>{record.student.email}</div>
  </div>

  {/* --- NEW: FOCUS SCORE INDICATOR --- */}
  {record.status === 'present' && (
      <div style={{marginRight: '20px', textAlign: 'right'}}>
          <div style={{fontSize: '11px', fontWeight:'bold', color: '#95a5a6', marginBottom:'2px'}}>
              ENGAGEMENT
          </div>
          <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 'bold',
              background: record.focusScore >= 80 ? '#e8f8f5' : (record.focusScore >= 50 ? '#fef9e7' : '#fdedec'),
              color: record.focusScore >= 80 ? '#27ae60' : (record.focusScore >= 50 ? '#f1c40f' : '#e74c3c'),
              border: `1px solid ${record.focusScore >= 80 ? '#27ae60' : (record.focusScore >= 50 ? '#f1c40f' : '#e74c3c')}`
          }}>
              {record.focusScore}%
          </div>
      </div>
  )}

  <span className={`status-badge status-${record.status}`}>
    {record.status.toUpperCase()}
  </span>
</div>
              ))}
              {!loadingReport && attendanceReport?.length === 0 && (
                <p style={{padding:'20px'}}>No students enrolled yet.</p>
              )}
            </div>
            <button onClick={fetchReport} className="btn-secondary" style={{marginTop:'20px'}}>
              <FaSync /> Refresh Data
            </button>
          </div>
        )}

        {/* TAB 2: CREATE CLASS */}
        {activeTab === 'create' && (
          <div>
            <h1 className="section-header">Create New Class</h1>
            <div className="form-card">
              <form onSubmit={handleCreateClass}>
                <div className="form-group">
                  <label>Class Name</label>
                  <input className="form-input" placeholder="e.g. Physics 101" 
                    value={newClass.className} onChange={e => setNewClass({...newClass, className: e.target.value})} required 
                  />
                </div>
                <div className="form-group">
                  <label>Class Code (Unique)</label>
                  <input className="form-input" placeholder="e.g. PHY101" 
                    value={newClass.classCode} onChange={e => setNewClass({...newClass, classCode: e.target.value})} required 
                  />
                </div>
                <div className="form-group">
                  <label>Room Name</label>
                  <input className="form-input" placeholder="e.g. Lab 3" 
                    value={newClass.roomName} onChange={e => setNewClass({...newClass, roomName: e.target.value})} required 
                  />
                </div>

                <div className="form-group" style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px'}}>
                  <label><FaMapMarkerAlt /> Geofence Setup</label>
                  <p style={{fontSize: '13px', color: '#666', marginBottom: '10px'}}>
                    Stand in the center of the classroom and click the button below.
                  </p>
                  
                  <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                    <input className="form-input" placeholder="Latitude" value={newClass.latitude} readOnly />
                    <input className="form-input" placeholder="Longitude" value={newClass.longitude} readOnly />
                  </div>
                  
                  <button type="button" className="btn-secondary" onClick={handleGetLocation} disabled={locating}>
                    {locating ? 'Locating...' : '📍 Get My Current Location'}
                  </button>
                </div>

                <div className="form-group">
                  <label>Radius (Meters)</label>
                  <input type="number" className="form-input" 
                    value={newClass.radius} onChange={e => setNewClass({...newClass, radius: e.target.value})} 
                  />
                </div>

                <button type="submit" className="btn-primary" style={{width: '100%'}}>Create Class</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: TIMETABLE MANAGER */}
        {activeTab === 'timetable' && (
          <div>
            <h1 className="section-header">Manage Timetables</h1>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{fontWeight:'bold'}}>Select Class to Edit: </label>
              <select 
                className="form-input" 
                style={{width: '300px', display: 'inline-block', marginLeft: '10px'}}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
              </select>
            </div>

            <div style={{display: 'flex', gap: '30px'}}>
              {/* Add Slot Form */}
              <div className="form-card" style={{flex: 1}}>
                <h3>Add New Time Slot</h3>
                <form onSubmit={handleAddSchedule}>
                  <div className="form-group">
                    <label>Day</label>
                    <select className="form-input" value={schedule.day} onChange={e => setSchedule({...schedule, day: e.target.value})}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start Time</label>
                    <input type="time" className="form-input" value={schedule.startTime} onChange={e => setSchedule({...schedule, startTime: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input type="time" className="form-input" value={schedule.endTime} onChange={e => setSchedule({...schedule, endTime: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Room (Optional)</label>
                    <input className="form-input" value={schedule.room} onChange={e => setSchedule({...schedule, room: e.target.value})} placeholder="Room 101" />
                  </div>
                  <button type="submit" className="btn-primary">Add to Schedule</button>
                </form>
              </div>

              {/* Current Schedule View */}
              <div style={{flex: 1}}>
                 <h3>Current Schedule</h3>
                 {selectedClassId && classes.find(c => c._id === selectedClassId)?.schedule?.length > 0 ? (
                    classes.find(c => c._id === selectedClassId).schedule.map((slot, idx) => (
                      <div key={idx} className="schedule-item">
                        <div>
                          <strong>{slot.day}</strong>
                          <div style={{fontSize: '13px'}}>{slot.startTime} - {slot.endTime}</div>
                        </div>
                        <div style={{fontWeight: 'bold', color: '#7f8c8d'}}>{slot.room}</div>
                      </div>
                    ))
                 ) : (
                   <p style={{color: '#999'}}>No schedule added yet.</p>
                 )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherDashboard;