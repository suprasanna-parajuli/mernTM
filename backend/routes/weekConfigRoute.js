import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getWeekConfig,
  updateWeekConfig
} from "../controllers/weekConfigController.js";

const weekConfigRouter = express.Router();

weekConfigRouter.route("/gp")
  .get(authMiddleware, getWeekConfig)
  .put(authMiddleware, updateWeekConfig);

export default weekConfigRouter;
