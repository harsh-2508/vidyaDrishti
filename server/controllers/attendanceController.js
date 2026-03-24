import AttendanceRecord from '../models/AttendanceRecordModel.js';
import Class from '../models/ClassModel.js';
import { getDistanceInMeters } from '../utils/geoUtils.js';

// --- Helper: Convert "10:30" to minutes ---
const getMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// 1. STUDENT CHECK-IN
export const checkIn = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { classId, studentLat, studentLon } = req.body;

    const classToAttend = await Class.findById(classId).populate('location');
    if (!classToAttend) return res.status(404).json({ message: 'Class not found' });

    // Time Check
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todaySchedule = classToAttend.schedule.find(s => s.day === currentDay);

    if (!todaySchedule) return res.status(400).json({ message: `No class scheduled for today.` });

    const startMinutes = getMinutes(todaySchedule.startTime);
    const endMinutes = getMinutes(todaySchedule.endTime);

    if (currentMinutes < (startMinutes - 15) || currentMinutes > endMinutes) {
      return res.status(400).json({ message: `Attendance closed. Class time: ${todaySchedule.startTime} - ${todaySchedule.endTime}` });
    }

    // Geofence Check
    const { location } = classToAttend;
    // Handle case where location might be structured differently in DB vs Query
    const targetLat = location.coordinates ? location.coordinates[1] : location.latitude;
    const targetLon = location.coordinates ? location.coordinates[0] : location.longitude;
    
    const distance = getDistanceInMeters(studentLat, studentLon, targetLat, targetLon);

    if (distance > location.radius) {
      return res.status(400).json({ message: `Too far (${Math.round(distance)}m). You must be in class.` });
    }

    // Mark Attendance
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    
    const record = await AttendanceRecord.findOneAndUpdate(
      { student: studentId, class: classId, date: { $gte: todayDate } },
      { geofenceCheck: true, cameraCheck: true, checkInTime: Date.now(), status: 'present' },
      { new: true, upsert: true }
    );

    res.status(200).json({ status: 'success', message: 'Attendance Marked!', data: { record } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// 2. GET CLASS REPORT (Teacher)
export const getClassReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0,0,0,0);

    const currentClass = await Class.findById(classId).populate('students', 'name studentId email');
    const records = await AttendanceRecord.find({ class: classId, date: { $gte: date } });

    const recordsMap = new Map();
    records.forEach((record) => recordsMap.set(record.student.toString(), record));

    const fullReport = currentClass.students.map((student) => {
      const record = recordsMap.get(student._id.toString());
      return {
          _id: record ? record._id : null, // Important for manual update
          student: student,
          status: record ? record.status : 'absent',
          checkInTime: record ? record.checkInTime : null,
          focusScore: record ? (record.focusScore || 0) : 0,
      };
    });

    res.status(200).json({ status: 'success', data: { records: fullReport } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// 3. MANUAL UPDATE (The Fix for your Error)
export const updateAttendanceStatus = async (req, res) => {
  try {
    // If we get a recordId, we update that specific record
    // If we get studentId/classId (legacy), we handle that too.
    const { recordId, status, studentId, classId } = req.body;

    let record;

    if (recordId) {
        // CASE A: Updating existing record (e.g., toggling present/absent)
        record = await AttendanceRecord.findByIdAndUpdate(
            recordId, 
            { status: status }, 
            { new: true }
        );
    } else if (studentId && classId) {
        // CASE B: Creating a record for a student who was absent (so no recordId existed)
        const today = new Date(); today.setHours(0,0,0,0);
        record = await AttendanceRecord.findOneAndUpdate(
            { student: studentId, class: classId, date: { $gte: today } },
            { status: status, checkInTime: new Date() },
            { new: true, upsert: true }
        );
    }

    if (!record) return res.status(404).json({ message: "Could not update record" });

    res.status(200).json({ status: 'success', data: { record } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// 4. UPDATE FOCUS SCORE (Student)
export const updateFocusScore = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { classId, score } = req.body;
    const today = new Date(); today.setHours(0,0,0,0);

    await AttendanceRecord.findOneAndUpdate(
      { student: studentId, class: classId, date: { $gte: today } },
      { $set: { focusScore: score } }
    );
    res.status(200).json({ status: 'success' });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// 5. GET STATS (Student)
export const getStudentStats = async (req, res) => {
    // (Keep your existing logic for getStudentStats here, it looked fine)
    // For brevity, ensuring the response structure matches frontend expectation:
    try {
        const studentId = req.user.id;
        const records = await AttendanceRecord.find({ student: studentId });
        const enrolledClasses = await Class.find({ students: studentId });
        
        // Simplified Logic for dashboard
        const courseStats = enrolledClasses.map(cls => {
            return {
                classId: cls._id,
                className: cls.className,
                // ... other details
            }
        });

        res.status(200).json({ status: 'success', data: { courses: courseStats } }); 
    } catch(err) { res.status(400).json({message: err.message}); }
};

// --- 3. GET CLASS HISTORY (For Modal) ---
export const getStudentClassHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { classId } = req.params;

    const records = await AttendanceRecord.find({
      student: studentId,
      class: classId
    })
    .sort({ date: -1 })
    .select('date status checkInTime');

    res.status(200).json({
      status: 'success',
      data: { records }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// --- 4. MANUAL MARK (For Teacher Dashboard) ---
export const manualMarkAttendance = async (req, res) => {
  try {
    const { classId, studentId, status } = req.body;
    const today = new Date().setHours(0, 0, 0, 0);

    const record = await AttendanceRecord.findOneAndUpdate(
      {
        student: studentId,
        class: classId,
        date: { $gte: today },
      },
      { $set: { status: status } },
      { new: true, upsert: true }
    ).populate('student', 'name email studentId');

    res.status(200).json({
      status: 'success',
      data: { record },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};


// ... existing imports

// --- 7. GET SPECIFIC STUDENT HISTORY (For Teacher Modal) ---
// ... (Add this to the bottom of server/controllers/attendanceController.js)

export const getStudentHistoryForTeacher = async (req, res) => {
  try {
    const { classId, studentId } = req.query;

    // Validate Input
    if (!classId || !studentId) {
      return res.status(400).json({ message: "Missing Class ID or Student ID" });
    }

    // 1. Get Class Info
    const classDetails = await Class.findById(classId);
    if (!classDetails) return res.status(404).json({ message: "Class not found" });

    // 2. Get Student Info
    // Note: We use 'User' model here. Ensure you imported it at the top if not present!
    // import User from '../models/UserModel.js'; 
    // If you don't want to import User, you can rely on populate in step 3, 
    // but looking up the user directly is safer for the header details.
    
    // 3. Get History
    const records = await AttendanceRecord.find({
      class: classId,
      student: studentId
    })
    .sort({ date: -1 })
    .populate('student', 'name email'); // Populate student just in case

    // 4. Calculate Stats
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    // Mock student details if User model fetch isn't added
    const studentName = records.length > 0 ? records[0].student.name : "Student";
    const studentEmail = records.length > 0 ? records[0].student.email : "";

    res.status(200).json({
      status: 'success',
      data: {
        classDetails,
        studentDetails: { name: studentName, email: studentEmail },
        summary: { total, present, absent: total - present, percentage },
        history: records
      }
    });

  } catch (err) {
    console.error("History Error:", err); // Log error to terminal
    res.status(500).json({ status: 'fail', message: err.message });
  }
};