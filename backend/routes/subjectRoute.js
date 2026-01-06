import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
  recalculatePriorities,
} from "../controllers/subjectController.js";

const subjectRouter = express.Router();

// Base route: /api/subjects
subjectRouter
  .route("/gp")
  .get(authMiddleware, getSubjects)
  .post(authMiddleware, createSubject);

// Recalculate priorities route: /api/subjects/priority/gp
// This needs to come before /:id route to avoid treating "priority" as an ID
subjectRouter.route("/priority/gp").get(authMiddleware, recalculatePriorities);

// ID route: /api/subjects/:id/gp
subjectRouter
  .route("/:id/gp")
  .get(authMiddleware, getSubjectById)
  .put(authMiddleware, updateSubject)
  .delete(authMiddleware, deleteSubject);

export default subjectRouter;
