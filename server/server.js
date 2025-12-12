import express from "express";
import cors from "cors";
import 'dotenv/config';
// import cookieParser from "cookie-parser"; // <-- Not needed for our strategy
import connectDB from "./config/mongodb.js";

// Import all your routers
import authRouter from "./routes/authRoutes.js";
import classRouter from "./routes/classRoutes.js"; // <-- ADD THIS
import attendanceRouter from "./routes/attendanceRoutes.js";

const app = express();
const port = process.env.PORT || 4000;
connectDB();

// --- Middleware ---
app.use(express.json()); // For parsing application/json
app.use(cors()); // Enable CORS for all routes
// app.use(cookieParser()); // <-- Not needed

// --- API Endpoints ---
app.get('/', (req, res) => res.send("API working"));

// Use the new routes you defined
app.use('/api/auth', authRouter);
app.use('/api/classes', classRouter); // <-- ADD THIS
app.use('/api/attendance', attendanceRouter);

// --- Server Start ---
app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});