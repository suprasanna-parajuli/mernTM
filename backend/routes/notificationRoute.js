import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getNotifications,
  markAsRead,
  checkAndCreateNotifications,
  deleteAllNotifications,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.route("/gp").get(authMiddleware, getNotifications);

notificationRouter.route("/:id/read/gp").put(authMiddleware, markAsRead);

notificationRouter.route("/check/gp").post(authMiddleware, checkAndCreateNotifications);

notificationRouter.route("/clear/gp").delete(authMiddleware, deleteAllNotifications);

export default notificationRouter;
