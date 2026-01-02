import AttendanceRecord from '../models/AttendanceRecordModel.js';
import Class from '../models/ClassModel.js';
import { getDistanceInMeters } from '../utils/geoUtils.js';

// --- Helper: Convert "10:30" to minutes (e.g., 630) ---
const getMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// --- 1. STUDENT CHECK-IN (Main Attendance Logic) ---
export const checkIn = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { classId, studentLat, studentLon } = req.body;

    // A. Find Class
    const classToAttend = await Class.findById(classId).populate('location');
    if (!classToAttend) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // B. TIME RESTRICTION CHECK
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find schedule for TODAY
    const todaySchedule = classToAttend.schedule.find(s => s.day === currentDay);

    if (!todaySchedule) {
      return res.status(400).json({ message: `No class scheduled for ${classToAttend.classCode} today.` });
    }

    const startMinutes = getMinutes(todaySchedule.startTime);
    const endMinutes = getMinutes(todaySchedule.endTime);

    // Allow check-in 10 mins before start until end time
    if (currentMinutes < (startMinutes - 10) || currentMinutes > endMinutes) {
      return res.status(400).json({ 
        message: `Attendance is closed. Class time: ${todaySchedule.startTime} - ${todaySchedule.endTime}` 
      });
    }

    // C. GEOFENCE CHECK
    const { location } = classToAttend;
    const distance = getDistanceInMeters(
      studentLat,
      studentLon,
      location.latitude,
      location.longitude
    );

    if (distance > location.radius) {
      return res.status(400).json({
        message: `You are too far (${Math.round(distance)}m). You must be in the classroom.`,
      });
    }

    // D. MARK ATTENDANCE
    const todayDate = new Date().setHours(0, 0, 0, 0);
    
    // Find existing or create new
    const record = await AttendanceRecord.findOneAndUpdate(
      {
        student: studentId,
        class: classId,
        date: { $gte: todayDate },
      },
      {
        geofenceCheck: true,
        cameraCheck: true, // Frontend face verification passed
        checkInTime: Date.now(),
        status: 'present'
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Attendance Marked Successfully!',
      data: { record },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// --- 2. GET STUDENT STATS (For Dashboard) ---
export const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const enrolledClasses = await Class.find({ students: studentId });
    const records = await AttendanceRecord.find({ student: studentId }).populate('class', 'className classCode');

    // A. Generate "Today's Schedule" Cards
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const todayStart = new Date().setHours(0, 0, 0, 0);

    const todaysClasses = enrolledClasses.filter(cls => 
      cls.schedule.some(s => s.day === currentDay)
    ).map(cls => {
      // Check if attendance marked today
      const todayRecord = records.find(r => 
        r.class && r.class._id.equals(cls._id) && new Date(r.date).getTime() >= todayStart
      );

      const scheduleDetails = cls.schedule.find(s => s.day === currentDay);

      return {
        classId: cls._id,
        className: cls.className,
        classCode: cls.classCode,
        startTime: scheduleDetails.startTime,
        endTime: scheduleDetails.endTime,
        room: scheduleDetails.room,
        status: todayRecord ? todayRecord.status : 'Not Posted'
      };
    });

    // B. Calculate Overall Stats
    const totalClassesHeld = records.length; 
    const totalPresent = records.filter(r => r.status === 'present').length;
    const overallPercentage = totalClassesHeld === 0 ? 100 : Math.round((totalPresent / totalClassesHeld) * 100);

    // C. Calculate Course-wise Stats
    const courseStats = enrolledClasses.map(cls => {
      const classRecords = records.filter(r => r.class && r.class._id.equals(cls._id));
      const presentCount = classRecords.filter(r => r.status === 'present').length;
      const totalCount = classRecords.length;
      const percentage = totalCount === 0 ? 100 : Math.round((presentCount / totalCount) * 100);

      return {
        classId: cls._id,
        className: cls.className,
        classCode: cls.classCode,
        percentage: percentage,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        today: todaysClasses,
        overall: {
            percentage: overallPercentage,
            present: totalPresent,
            absent: totalClassesHeld - totalPresent
        },
        courses: courseStats
      }
    });

  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
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

// --- 5. GET CLASS REPORT (For Teacher Dashboard) ---
export const getClassReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const date = req.query.date
      ? new Date(req.query.date).setHours(0, 0, 0, 0)
      : new Date().setHours(0, 0, 0, 0);

    const currentClass = await Class.findById(classId).populate('students', 'name studentId email');
    if (!currentClass) return res.status(404).json({ message: 'Class not found' });

    const records = await AttendanceRecord.find({
      class: classId,
      date: { $gte: date },
    });

    const recordsMap = new Map();
    records.forEach((record) => recordsMap.set(record.student.toString(), record));

   // ... inside getClassReport ...

    const fullReport = currentClass.students.map((student) => {
      const record = recordsMap.get(student._id.toString());
      return record ? {
          _id: record._id,
          student: student,
          status: record.status,
          checkInTime: record.checkInTime,
          
          // --- NEW: SEND FOCUS SCORE ---
          focusScore: record.focusScore || 0, // Default to 0 if missing
          
      } : {
          _id: null,
          student: student,
          status: 'absent',
          focusScore: 0,
      };
    });

// ... rest of the function

    res.status(200).json({
      status: 'success',
      results: fullReport.length,
      data: { records: fullReport },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// --- 6. LEGACY: Verify By Camera (Optional) ---
export const verifyByCamera = async (req, res) => {
    // This logic is now mostly handled in checkIn, 
    // but kept here if you have a dedicated camera device setup.
    res.status(200).json({ message: "Use check-in endpoint for app verification." });
};

// ... existing imports

// NEW: Update Focus Score (Called continuously or at end of class)
export const updateFocusScore = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { classId, score, status } = req.body;
    const today = new Date().setHours(0, 0, 0, 0);

    // Prepare update object
    const updateData = { 
      focusScore: score 
    };

    // Only log if they are distracted to save space
    if (status && status.includes('Distracted') || status.includes('Drowsy')) {
      // We use $push to add to the array history
      // We use $set to update the current score
      await AttendanceRecord.findOneAndUpdate(
        { student: studentId, class: classId, date: { $gte: today } },
        { 
          $set: { focusScore: score },
          $push: { attentionLogs: { time: new Date(), status: status } }
        }
      );
    } else {
      // Just update the score
      await AttendanceRecord.findOneAndUpdate(
        { student: studentId, class: classId, date: { $gte: today } },
        { $set: { focusScore: score } }
      );
    }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};