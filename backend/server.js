import express from "express";
import cors from "cors";
import "dotenv/config";
import { connecteDB } from "./config/db.js";

import userRouter from "./routes/userRoute.js";
import taskRouter from "./routes/taskRoute.js";
import subjectRouter from "./routes/subjectRoute.js";
import materialRouter from "./routes/materialRoute.js";
import scheduleRouter from "./routes/scheduleRoute.js";
import weekConfigRouter from "./routes/weekConfigRoute.js";
import progressRouter from "./routes/progressRoute.js";
import streakRouter from "./routes/streakRoute.js";
import notificationRouter from "./routes/notificationRoute.js";
import aiRouter from "./routes/aiRoute.js";

const app = express();
const port = process.env.PORT || 4000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded PDFs)
app.use("/uploads", express.static("uploads"));

//DB connect
connecteDB();

//Routes
console.log("Registering routes...");
app.use("/api/user", userRouter);
console.log("✓ User routes registered");
app.use("/api/tasks", taskRouter);
console.log("✓ Task routes registered");
app.use("/api/subjects", subjectRouter);
console.log("✓ Subject routes registered");
app.use("/api/materials", materialRouter);
console.log("✓ Material routes registered");
app.use("/api/schedule", scheduleRouter);
console.log("✓ Schedule routes registered");
app.use("/api/week-config", weekConfigRouter);
console.log("✓ Week config routes registered");
app.use("/api/progress", progressRouter);
console.log("✓ Progress routes registered");
app.use("/api/streak", streakRouter);
console.log("✓ Streak routes registered");
app.use("/api/notifications", notificationRouter);
console.log("✓ Notification routes registered");
app.use("/api/ai", aiRouter);
console.log("✓ AI routes registered");

app.get("/", (req, res) => {
  res.send("API working");
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
