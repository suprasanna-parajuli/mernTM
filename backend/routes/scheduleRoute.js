import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getSchedule,
  generateWeeklySchedule,
  deleteSchedule
} from "../controllers/scheduleController.js";

const scheduleRouter = express.Router();

scheduleRouter.route("/gp")
  .get(authMiddleware, getSchedule);

scheduleRouter.route("/generate/gp")
  .post(authMiddleware, generateWeeklySchedule);

scheduleRouter.route("/delete/gp")
  .delete(authMiddleware, deleteSchedule);

export default scheduleRouter;
