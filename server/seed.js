import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs'; // or 'bcrypt' if that's what you installed
import User from './models/UserModel.js';
import Class from './models/ClassModel.js';
import AttendanceRecord from './models/AttendanceRecordModel.js';
import BudgetRequest from './models/BudgetRequestModel.js';

dotenv.config();

// --- CONFIGURATION ---
const MONGO_URI = process.env.MONGODB_URI;
const PASSWORD_HASH = await bcrypt.hash('password123', 12); // All users will have password: password123

// --- DUMMY DATA GENERATORS ---
const teachers = [
  { name: 'Amit Sharma', email: 'amit@school.com', role: 'teacher', password: PASSWORD_HASH },
  { name: 'Priya Verma', email: 'priya@school.com', role: 'teacher', password: PASSWORD_HASH }
];

const students = [
  { name: 'Rahul Singh', email: 'rahul@student.com', role: 'student', password: PASSWORD_HASH },
  { name: 'Anjali Gupta', email: 'anjali@student.com', role: 'student', password: PASSWORD_HASH },
  { name: 'Vikram Malhotra', email: 'vikram@student.com', role: 'student', password: PASSWORD_HASH },
  { name: 'Sneha Patel', email: 'sneha@student.com', role: 'student', password: PASSWORD_HASH },
  { name: 'Arjun Reddy', email: 'arjun@student.com', role: 'student', password: PASSWORD_HASH }
];

const classesData = [
  { 
    className: 'Physics 101', 
    classCode: 'PHY101', 
    roomName: 'Lab 1', 
    radius: 50,
    // GeoJSON Format: location object with type and coordinates [Longitude, Latitude]
    location: {
        type: 'Point',
        coordinates: [77.4126, 23.2599] 
    }
  },
  { 
    className: 'Mathematics', 
    classCode: 'MATH202', 
    roomName: 'Room 304', 
    radius: 50,
    location: {
        type: 'Point',
        coordinates: [77.4126, 23.2599]
    }
  }
];

const budgetRequestsData = [
  { title: 'Repair Roof Leak', category: 'Infrastructure', amount: 15000, urgency: 'Critical', status: 'Pending', description: 'Water is leaking in Class 5 during rains.' },
  { title: 'Mid-Day Meal Rice', category: 'Mid-Day Meal', amount: 5000, urgency: 'Medium', status: 'Approved', description: 'Supply for next month.' },
  { title: 'Science Lab Equipment', category: 'Books/Stationery', amount: 25000, urgency: 'Low', status: 'Funds Released', description: 'Beakers and test tubes.' }
];

// --- MAIN SCRIPT ---
const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🌱 Connected to MongoDB...');

    // 1. CLEAR EXISTING DATA
    await User.deleteMany({});
    await Class.deleteMany({});
    await AttendanceRecord.deleteMany({});
    await BudgetRequest.deleteMany({});
    console.log('🗑️  Old data cleared.');

    // 2. CREATE USERS
    const createdTeachers = await User.insertMany(teachers);
    const createdStudents = await User.insertMany(students);
    console.log(`busts Created ${createdTeachers.length} Teachers and ${createdStudents.length} Students.`);

    // 3. CREATE CLASSES (Assign to first teacher)
    const mainTeacher = createdTeachers[0];
    const classesWithTeacher = classesData.map(c => ({ ...c, teacher: mainTeacher._id }));
    const createdClasses = await Class.insertMany(classesWithTeacher);
    
    // Enroll students in these classes (if your model has an 'enrolledStudents' array, update it here)
    // Assuming Class model has `students: [ObjectId]`
    for (const cls of createdClasses) {
      cls.students = createdStudents.map(s => s._id);
      await cls.save();
    }
    console.log(`📚 Created ${createdClasses.length} Classes.`);

    // 4. MARK ATTENDANCE (Backdated for History)
    // We will create records for the last 3 days
    const attendanceDocs = [];
    const today = new Date();

    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i); // Go back i days

      for (const student of createdStudents) {
        // Randomize Status
        const isPresent = Math.random() > 0.2; // 80% chance of being present
        const status = isPresent ? 'present' : 'absent';
        
        // Randomize Focus Score if present
        const focusScore = isPresent ? Math.floor(Math.random() * (100 - 60) + 60) : 0; 

        if (isPresent) {
            attendanceDocs.push({
                student: student._id,
                class: createdClasses[0]._id, // Mark for Physics Class
                date: date,
                status: 'present',
                checkInTime: new Date(date.setHours(10, 0, 0)), // 10:00 AM
                geofenceCheck: true,
                cameraCheck: true,
                focusScore: focusScore,
                attentionLogs: []
            });
        } else {
             attendanceDocs.push({
                student: student._id,
                class: createdClasses[0]._id,
                date: date,
                status: 'absent',
                focusScore: 0
            });
        }
      }
    }
    await AttendanceRecord.insertMany(attendanceDocs);
    console.log(`✅ Marked ${attendanceDocs.length} Attendance records.`);

    // 5. CREATE BUDGET REQUESTS
    const budgetWithUser = budgetRequestsData.map(b => ({ ...b, requester: mainTeacher._id }));
    await BudgetRequest.insertMany(budgetWithUser);
    console.log(`💰 Created ${budgetWithUser.length} Budget Requests.`);

    console.log('---------------------------------');
    console.log('🎉 SEEDING COMPLETE!');
    console.log('---------------------------------');
    console.log('Login Credentials:');
    console.log('Teacher: amit@school.com / password123');
    console.log('Student: rahul@student.com / password123');
    
    process.exit();

  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
};

seedDB();