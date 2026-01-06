import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getAIInsights,
  trainAI,
  getPrediction,
  getOptimizedSchedule
} from "../controllers/aiController.js";

const aiRouter = express.Router();

// Get AI insights about user's study patterns
aiRouter.route("/insights/gp").get(authMiddleware, getAIInsights);

// Train AI with a study session
aiRouter.route("/train/gp").post(authMiddleware, trainAI);

// Get prediction for a specific scenario
aiRouter.route("/predict/gp").get(authMiddleware, getPrediction);

// Get AI-optimized schedule recommendations
aiRouter.route("/optimize/gp").get(authMiddleware, getOptimizedSchedule);

export default aiRouter;
