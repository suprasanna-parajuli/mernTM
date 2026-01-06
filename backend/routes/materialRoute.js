import express from "express";
import authMiddleware from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  createMaterial,
  deleteMaterial,
  getMaterialById,
  getMaterials,
  getMaterialsBySubject,
  updateMaterial,
  startTimer,
  stopTimer,
  uploadPDF,
  getStudyTips,
} from "../controllers/materialController.js";

const materialRouter = express.Router();

// Base route: /api/materials
materialRouter
  .route("/gp")
  .get(authMiddleware, getMaterials)
  .post(authMiddleware, createMaterial);

// Get materials by subject: /api/materials/subject/:subjectId/gp
materialRouter
  .route("/subject/:subjectId/gp")
  .get(authMiddleware, getMaterialsBySubject);

// Timer routes: /api/materials/:id/timer/start and /api/materials/:id/timer/stop
materialRouter
  .route("/:id/timer/start/gp")
  .post(authMiddleware, startTimer);

materialRouter
  .route("/:id/timer/stop/gp")
  .post(authMiddleware, stopTimer);

// PDF upload route: /api/materials/upload-pdf/gp
materialRouter
  .route("/upload-pdf/gp")
  .post(authMiddleware, upload.single("pdf"), uploadPDF);

// AI study tips route: /api/materials/:id/study-tips/gp
materialRouter
  .route("/:id/study-tips/gp")
  .get(authMiddleware, getStudyTips);

// ID route: /api/materials/:id/gp (must come after specific routes)
materialRouter
  .route("/:id/gp")
  .get(authMiddleware, getMaterialById)
  .put(authMiddleware, updateMaterial)
  .delete(authMiddleware, deleteMaterial);

export default materialRouter;
