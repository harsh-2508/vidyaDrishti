import express from "express";
import cors from "cors";
import 'dotenv/config';
import connectDB from "./config/mongodb.js";

// Existing routers
import authRouter       from "./routes/authRoutes.js";
import classRouter      from "./routes/classRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import financeRouter    from './routes/financeRoutes.js';
import shikshaRouter    from './routes/shikshaRoutes.js';

// Dropout prediction routers
import predictionRoutes from "./routes/predictions.js";
import studentRoutes    from "./routes/students.js";

const app  = express();
const port = process.env.PORT || 4000;
connectDB();

// --- Middleware ---
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://vidya-drishti.vercel.app/api' // Use your clean, production domain
  ], 
  credentials: true 
}));

// --- API Endpoints ---
app.get('/', (req, res) => res.send("API working"));

// Existing routes
app.use('/api/auth',       authRouter);
app.use('/api/classes',    classRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/finance',    financeRouter);
app.use('/api/shiksha',    shikshaRouter);

// Dropout prediction routes
app.use("/api/predictions", predictionRoutes);
app.use("/api/students",    studentRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "dropout-backend" });
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});