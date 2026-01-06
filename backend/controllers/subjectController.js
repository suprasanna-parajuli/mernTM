import Subject from "../models/subjectModel.js";
import StudyMaterial from "../models/studyMaterialModel.js";
import Progress from "../models/progressModel.js";
import StudyBlock from "../models/studyBlockModel.js";
import { autoRegenerateSchedule } from "../utils/autoRegenerate.js";
import { calculatePriorityScore } from "../utils/algorithms.js"; // alg 1 bata: Import priority calculation

export async function createSubject(req, res) { 
  try {
    const { name, difficulty, examDate, targetHours, tags } = req.body; //form submission bhayeko eta

    // Check if all required fields are there
    if (!name || !difficulty || !examDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (name, difficulty, examDate)",
      });
    }

    // Difficulty should be 1-5
    if (difficulty < 1 || difficulty > 5) {
      return res.status(400).json({
        success: false,
        message: "Difficulty must be between 1 and 5",
      });
    }

    // Make sure exam date is valid
    const examDateObj = new Date(examDate);
    if (isNaN(examDateObj.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid exam date" });
    }

    // Create new subject
    const subject = new Subject({
      name,
      difficulty,
      examDate: examDateObj,//string to date obj
      targetHours: targetHours || 0, //default to 0 if not
      tags: tags || [],
      owner: req.user.id,//who ownes this subject from JWT token
    });

  //noww setting priority from algorithms.js
    subject.priorityScore = calculatePriorityScore(subject);

    const saved = await subject.save(); // save to db

    // ALGORITHM 7: Auto-regenerate schedule
    // New subject added → recalculate priorities → regenerate weekly schedule
    autoRegenerateSchedule(req.user.id, 'subject_added');

    res.status(201).json({ success: true, subject: saved });//http status 201 created(success)
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
} //for alg 1 continue.. line 104

/**
 * GET ALL SUBJECTS
 * Returns all subjects belonging to the logged-in user
 * Sorted by most recently created first
 */
export async function getSubjects(req, res) {
  try {
    // Get all subjects that belong to logged in user
    const subjects = await Subject.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET ONE SUBJECT BY ID
 * Ensures subject belongs to logged-in user (security)
 */
export async function getSubjectById(req, res) {
  try {
    // Find subject and make sure it belongs to this user
    const subject = await Subject.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or doesn't belong to you",
      });
    }

    res.json({ success: true, subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

//UPDATE A SUBJECT
//if exam date or difficulty changes, recalculates priority (Alg 1)
//triggers auto-regeneration if priority changed (Alg 7)
export async function updateSubject(req, res) {
  try {
    const { name, difficulty, examDate, targetHours, tags } = req.body;

    // Check difficulty is valid if they're updating it
    if (difficulty && (difficulty < 1 || difficulty > 5)) {
      return res.status(400).json({
        success: false,
        message: "Difficulty must be between 1 and 5",
      });
    }

    // Build the update object with what they sent
    const updateData = {};
    if (name) updateData.name = name;
    if (difficulty) updateData.difficulty = difficulty;
    if (examDate) updateData.examDate = new Date(examDate);
    if (targetHours !== undefined) updateData.targetHours = targetHours;
    if (tags !== undefined) updateData.tags = tags;

    // Update the subject
    const updated = await Subject.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or doesn't belong to you",
      });
    }

    // ALGORITHM 1: Recalculate priority if exam date or difficulty changed
    if (examDate || difficulty) {
      updated.priorityScore = calculatePriorityScore(updated);
      await updated.save();

      // ALGORITHM 7: Trigger schedule regeneration
      autoRegenerateSchedule(req.user.id, 'subject_updated');
    }

    res.json({ success: true, subject: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * DELETE A SUBJECT
 * - Cascading delete: removes all related materials, progress records, and study blocks
 * - Triggers schedule regeneration (Algorithm 7)
 */
export async function deleteSubject(req, res) {
  try {
    const deleted = await Subject.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or doesn't belong to you",
      });
    }

    // CASCADE DELETE: Remove all related data
    await StudyMaterial.deleteMany({ subject: req.params.id });
    await Progress.deleteMany({ subject: req.params.id });
    await StudyBlock.deleteMany({ subject: req.params.id });

    // ALGORITHM 7: Subject removed → regenerate schedule
    autoRegenerateSchedule(req.user.id, 'subject_deleted');

    res.json({ success: true, message: "Subject and related data deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * RECALCULATE ALL PRIORITIES
 * Manually refresh all subjects' priority scores
 * Useful when:
 * - Time has passed (exams getting closer)
 * - User wants to see updated priorities
 * - Daily automated task
 */
export async function recalculatePriorities(req, res) {
  try {
    // Get all user's subjects
    const subjects = await Subject.find({ owner: req.user.id });

    // ALGORITHM 1: Recalculate each subject's priority with current date
    for (let i = 0; i < subjects.length; i++) {
      subjects[i].priorityScore = calculatePriorityScore(subjects[i]);
      await subjects[i].save();
    }

    // Return updated subjects sorted by priority (highest first)
    const updated = await Subject.find({ owner: req.user.id }).sort({
      priorityScore: -1,
    });

    res.json({
      success: true,
      message: `Updated ${subjects.length} subjects`,
      subjects: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
