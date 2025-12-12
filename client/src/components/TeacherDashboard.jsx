import { useState, useEffect } from 'react';
import api from '../api/axios.js';

function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch teacher's classes on load
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/classes/my-classes');
        setClasses(response.data.data.classes);
        // Automatically select the first class
        if (response.data.data.classes.length > 0) {
          setSelectedClass(response.data.data.classes[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch classes', error);
      }
    };
    fetchClasses();
  }, []);

  // 2. Fetch attendance report when selectedClass changes
  useEffect(() => {
    if (!selectedClass) return;

    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/attendance/report/${selectedClass}`);
        setAttendance(response.data.data.records);
      } catch (error) {
        console.error('Failed to fetch report', error);
      }
      setIsLoading(false);
    };
    fetchReport();
  }, [selectedClass]);

  // 3. Manual mark handler
  const handleMark = async (studentId, status) => {
    try {
      const response = await api.post('/attendance/mark', {
        classId: selectedClass,
        studentId: studentId,
        status: status,
      });
      
      // Update the local state instantly
      setAttendance(prev => 
        prev.map(record => 
          record.student._id === studentId ? response.data.data.record : record
        )
      );
    } catch (error) {
      console.error('Failed to mark attendance', error);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Teacher Dashboard</h2>
      
      <select 
        className="class-selector"
        value={selectedClass} 
        onChange={(e) => setSelectedClass(e.target.value)}
      >
        <option value="">Select a class...</option>
        {classes.map(cls => (
          <option key={cls._id} value={cls._id}>
            {cls.className} ({cls.classCode})
          </option>
        ))}
      </select>

      {isLoading ? (
        <p>Loading report...</p>
      ) : (
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Student ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map(record => (
              <tr key={record.student._id}>
                <td>{record.student.name}</td>
                <td>{record.student.studentId || 'N/A'}</td>
                <td>
                  <span className={`status-${record.status.toLowerCase()}`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </td>
                <td>
                  <button 
                    className="action-btn btn-present"
                    onClick={() => handleMark(record.student._id, 'present')}
                  >
                    P
                  </button>
                  <button 
                    className="action-btn btn-absent"
                    onClick={() => handleMark(record.student._id, 'absent')}
                  >
                    A
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TeacherDashboard;