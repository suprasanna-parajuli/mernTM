import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getAnalytics, getSubjectProgress } from "../controllers/progressController.js";

const progressRouter = express.Router();

progressRouter.route("/analytics/gp").get(authMiddleware, getAnalytics);

progressRouter.route("/subject/:subjectId/gp").get(authMiddleware, getSubjectProgress);

export default progressRouter;
