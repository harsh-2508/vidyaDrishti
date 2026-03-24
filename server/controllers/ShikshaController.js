
import Alert from "../models/AlertModel.js";
import AttendanceRecord from "../models/AttendanceRecordModel.js";
import User from "../models/UserModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Resource from "../models/ResourceModel.js";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- 1. RESOURCES (Notes Sharing) ---
export const createResource = async (req, res) => {
  try {
    const newResource = await Resource.create({ ...req.body, uploadedBy: req.user.id });
    res.status(201).json({ status: "success", data: newResource });
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const getClassResources = async (req, res) => {
  try {
    const resources = await Resource.find({ classId: req.params.classId }).sort("-createdAt");
    res.status(200).json({ status: "success", data: resources });
  } catch (err) { res.status(400).json({ error: err.message }); }
};

// --- 2. CLASSROOM SOS (Student "I don't understand" button) ---
export const triggerSOS = async (req, res) => {
  try {
    const { classId, message } = req.body;
    await Alert.create({
        student: req.user.id,
        classId,
        type: "SOS",
        message: message || "Student requested help."
    });
    res.status(200).json({ status: "success", message: "Teacher notified!" });
  } catch (err) { res.status(400).json({ error: err.message }); }
};

// --- 3. AI DROPOUT PREDICTION (The Logic) ---
export const analyzeDropoutRisk = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Get all students in class
    const students = await User.find({ role: 'student' }); // In real app, filter by Class enrollment
    
    const riskReport = [];

    for (const student of students) {
        // AI Logic: Analyze Attendance + Focus
        const records = await AttendanceRecord.find({ student: student._id, class: classId });
        
        const totalClasses = records.length;
        if (totalClasses === 0) continue;

        const absentCount = records.filter(r => r.status === 'absent').length;
        const avgFocus = records.reduce((acc, r) => acc + (r.focusScore || 0), 0) / totalClasses;

        // RISK ALGORITHM
        let riskLevel = "Low";
        let reason = "";

        if (absentCount / totalClasses > 0.3) { // >30% Absent
            riskLevel = "High";
            reason = "Chronic Absenteeism";
        } else if (avgFocus < 40) { // <40% Focus
            riskLevel = "Medium";
            reason = "Disengaged / Low Attention";
        }

        if (riskLevel !== "Low") {
            riskReport.push({
                studentName: student.name,
                riskLevel,
                reason,
                attendance: Math.round(((totalClasses - absentCount) / totalClasses) * 100) + "%",
                avgFocus: Math.round(avgFocus) + "%"
            });
        }
    }

    res.status(200).json({ status: "success", data: riskReport });

  } catch (err) { res.status(400).json({ error: err.message }); }
};

// --- 4. AI CAREER & PERSONALIZED LEARNING ---
export const getAIRecommendations = async (req, res) => {
    // This mocks an AI response based on student weakness
    // In real life, this connects to OpenAI API
    try {
        const { focusScore, subject } = req.body; // e.g., 40, "Math"
        
        let recommendations = [];
        
        if (focusScore < 50) {
            recommendations = [
                { title: `Basics of ${subject} (Video)`, link: "https://youtube.com/..." },
                { title: "Easy Practice Quiz", link: "/quiz/easy" }
            ];
        } else {
             recommendations = [
                { title: `Advanced ${subject} Projects`, link: "https://..." },
                { title: "Career Path: Data Scientist", link: "/career/data-science" }
            ];
        }

        res.status(200).json({ status: "success", data: recommendations });
    } catch (err) { res.status(400).json({ error: err.message }); }
};

// --- 5. AI QUESTION GENERATOR (REAL GEMINI) ---
export const generateQuestions = async (req, res) => {
    try {
        const { topic, difficulty } = req.body;
        
        const prompt = `Generate 5 ${difficulty || "Medium"} level questions about "${topic}" for high school students. 
        Include a mix of MCQ, Theory, and Conceptual questions.
        Return the response ONLY as a raw JSON array (no markdown, no code blocks) with this structure:
        [
          { "id": 1, "type": "MCQ", "text": "Question?", "options": ["A", "B", "C", "D"] },
          { "id": 2, "type": "Theory", "text": "Question?" }
        ]`;
      console.log("Using API Key:", process.env.GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌");
        const result = await model.generateContent(prompt);
        const response =  result.response;
        
        // Clean up the text to ensure it's valid JSON
        let text = response.text();
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const questions = JSON.parse(text);

        res.status(200).json({ status: "success", data: questions });

    } catch (err) { 
        console.error("AI Error:", err);
        res.status(400).json({ status: "fail", message: "AI generation failed. Try again." }); 
    }
};

// --- 6. AI CHAPTER PLANNER (REAL GEMINI) ---
export const generateLessonPlan = async (req, res) => {
    try {
        const { chapterName, duration } = req.body; 

        const prompt = `Create a ${duration}-day lesson plan for the chapter "${chapterName}".
        Return the response ONLY as a raw JSON array (no markdown) with this exact structure:
        [
          { "day": "Day 1", "topic": "Title", "activity": "Class Activity", "homework": "Assignment" }
        ]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Clean up text
        let text = response.text();
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const plan = JSON.parse(text);

        res.status(200).json({ status: "success", data: plan });

    } catch (err) { 
        console.error("AI Error:", err);
        res.status(400).json({ status: "fail", message: "AI planning failed. Try again." }); 
    }
};