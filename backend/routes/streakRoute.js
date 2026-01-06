import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getStreak, updateStreak } from "../controllers/streakController.js";

const streakRouter = express.Router();

streakRouter.route("/gp").get(authMiddleware, getStreak);

streakRouter.route("/update/gp").post(authMiddleware, updateStreak);

export default streakRouter;
