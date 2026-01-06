import StudyMaterial from "../models/studyMaterialModel.js";
import Subject from "../models/subjectModel.js";
import Progress from "../models/progressModel.js";
import Streak from "../models/streakModel.js";
import AIModel from "../models/aiModel.js";
import StudyAI from "../utils/simpleAI.js";
import { autoRegenerateSchedule } from "../utils/autoRegenerate.js";
import { analyzePDF, generateStudyTips } from "../utils/geminiService.js";
import path from "path";

// Helper function to figure out progress percentage
// Only count study, revision, and notes tags for progress
const calculateProgress = (material) => {
  const validTags = ["study", "revision", "notes"];
  if (!validTags.includes(material.tag)) return 0;

  // Convert hours to minutes so we can compare
  const targetMinutes = material.targetHours * 60;
  if (targetMinutes === 0) return 0;

  // Calculate what percentage is done
  const percentage = (material.timeSpent / targetMinutes) * 100;

  // Make sure it stays between 0 and 100
  if (percentage > 100) return 100;
  if (percentage < 0) return 0;
  return percentage;
};

// Helper function to calculate days between dates
const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to update streak
const updateUserStreak = async (userId, timeSpent) => {
  try {
    let streak = await Streak.findOne({ owner: userId });

    if (!streak) {
      // First time studying - create new streak
      streak = new Streak({
        owner: userId,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: new Date(),
        totalStudyDays: 1,
      });
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastDate = new Date(streak.lastStudyDate);
      lastDate.setHours(0, 0, 0, 0);

      const daysDiff = daysBetween(lastDate, today);

      if (daysDiff === 0) {
        // Same day - no change to streak count, just update timestamp
        streak.lastStudyDate = new Date();
      } else if (daysDiff === 1) {
        // Consecutive day - increment streak
        streak.currentStreak += 1;
        streak.longestStreak = Math.max(
          streak.longestStreak,
          streak.currentStreak
        );
        streak.lastStudyDate = new Date();
        streak.totalStudyDays += 1;
      } else {
        // Streak broken - reset to 1
        streak.currentStreak = 1;
        streak.lastStudyDate = new Date();
        streak.totalStudyDays += 1;
      }
    }

    await streak.save();
    return streak;
  } catch (error) {
    console.error("Error updating streak:", error);
    return null;
  }
};

//CREATE A NEW STUDY MATERIAL
export async function createMaterial(req, res) {
  try {
    const { title, subject, tag, fileUrl, targetHours } = req.body;

    // Make sure required fields are provided
    if (!title || !subject || !tag) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, subject, and tag",
      });
    }

    // Verify the subject exists and belongs to the user
    const subjectExists = await Subject.findOne({
      _id: subject,
      owner: req.user.id,
    });

    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or doesn't belong to you",
      });
    }

    // Create the material
    const material = new StudyMaterial({
      title,
      subject,
      tag,
      fileUrl: fileUrl || "",
      targetHours: targetHours || 0,
      owner: req.user.id,
    });

    const saved = await material.save();
    res.status(201).json({ success: true, material: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

//GET ALL MATERIALS FOR LOGGED IN USER
export async function getMaterials(req, res) {
  try {
    // Get all materials and populate subject info
    const materials = await StudyMaterial.find({ owner: req.user.id })
      .populate("subject", "name difficulty")
      .sort({ createdAt: -1 });

    res.json({ success: true, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

//GET MATERIALS BY SUBJECT ID
export async function getMaterialsBySubject(req, res) {
  try {
    const materials = await StudyMaterial.find({
      subject: req.params.subjectId,
      owner: req.user.id,
    })
      .populate("subject", "name difficulty")
      .sort({ createdAt: -1 });

    res.json({ success: true, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

//GET SINGLE MATERIAL BY ID
export async function getMaterialById(req, res) {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      owner: req.user.id,
    }).populate("subject", "name difficulty examDate");

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found or doesn't belong to you",
      });
    }

    res.json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

//UPDATE A MATERIAL BY ID
export async function updateMaterial(req, res) {
  try {
    const { title, tag, fileUrl, targetHours } = req.body;

    // Build update object
    const updateData = {};
    if (title) updateData.title = title;
    if (tag) updateData.tag = tag;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (targetHours !== undefined) updateData.targetHours = targetHours;

    const updated = await StudyMaterial.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).populate("subject", "name difficulty");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Material not found or doesn't belong to you",
      });
    }

    // Recalculate progress if target hours changed
    if (targetHours !== undefined) {
      updated.progress = calculateProgress(updated);
      await updated.save();
    }

    res.json({ success: true, material: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

//DELETE A MATERIAL
export async function deleteMaterial(req, res) {
  try {
    const deleted = await StudyMaterial.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Material not found or doesn't belong to you",
      });
    }

    // Delete all progress records for this material
    await Progress.deleteMany({ material: req.params.id });

    res.json({ success: true, message: "Material deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

//START STUDY TIMER - Record when user starts studying
export async function startTimer(req, res) {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    // Just return the material - frontend will handle the timer
    // We'll record the time when they stop
    res.json({
      success: true,
      message: "Timer started",
      material,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

//STOP STUDY TIMER - Record study session and update progress
export async function stopTimer(req, res) {
  try {
    const { timeSpent } = req.body; // time spent in minutes

    if (!timeSpent || timeSpent < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid time spent",
      });
    }

    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    // Update material's total time spent
    material.timeSpent += timeSpent;
    material.lastStudied = new Date();
    material.progress = calculateProgress(material);
    await material.save();

    // Create a progress record for tracking
    const progressRecord = new Progress({
      subject: material.subject,
      material: material._id,
      date: new Date(),
      timeSpent: timeSpent,
      tag: material.tag,
      owner: req.user.id,
    });
    await progressRecord.save();

    // Update streak after study session
    const updatedStreak = await updateUserStreak(req.user.id, timeSpent);

    // Train AI with this study session
    try {
      const subject = await Subject.findById(material.subject);
      if (subject) {
        const now = new Date();
        const timeOfDay = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];

        // Load AI model
        let aiModelData = await AIModel.findOne({ owner: req.user.id });
        if (!aiModelData) {
          aiModelData = new AIModel({ owner: req.user.id });
        }

        const ai = new StudyAI();
        ai.importModel(aiModelData);

        // Add training data (session was completed if they studied for >5 min)
        ai.addTrainingData({
          timeOfDay: timeOfDay,
          subjectDifficulty: subject.difficulty,
          dayOfWeek: dayOfWeek,
          completed: timeSpent >= 5, // Consider it completed if studied 5+ minutes
          focusScore: Math.min(1, timeSpent / 60) // Longer session = better focus
        });

        // Save updated AI model
        const updatedModel = ai.exportModel();
        aiModelData.trainingData = updatedModel.trainingData;
        aiModelData.weights = updatedModel.weights;
        aiModelData.lastTrained = new Date();
        await aiModelData.save();

        console.log(`AI trained: ${aiModelData.trainingData.length} sessions`);
      }
    } catch (aiError) {
      // Don't fail the request if AI training fails
      console.error("AI training error:", aiError);
    }

    // AUTO-REGENERATE: Study session completed, update schedule
    autoRegenerateSchedule(req.user.id, 'study_session_completed');

    res.json({
      success: true,
      message: "Study session recorded",
      material,
      sessionTime: timeSpent,
      streak: updatedStreak
        ? {
            currentStreak: updatedStreak.currentStreak,
            longestStreak: updatedStreak.longestStreak,
            totalStudyDays: updatedStreak.totalStudyDays,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

//UPLOAD PDF FILE
export async function uploadPDF(req, res) {
  try {
    // File is uploaded via multer middleware and available in req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded",
      });
    }

    // Get file info
    const filePath = `/uploads/pdfs/${req.file.filename}`;
    const fileUrl = `http://localhost:4000${filePath}`;

    // Optional: Analyze PDF with Gemini AI
    let aiAnalysis = null;
    if (req.body.analyzeWithAI === "true") {
      aiAnalysis = await analyzePDF(
        req.file.path,
        req.body.title || req.file.originalname,
        req.body.tag || "study"
      );
    }

    res.json({
      success: true,
      message: "PDF uploaded successfully",
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      aiAnalysis: aiAnalysis,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

//GET AI STUDY TIPS FOR A MATERIAL
export async function getStudyTips(req, res) {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      owner: req.user.id,
    }).populate("subject", "name difficulty");

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    const tips = await generateStudyTips(material);

    res.json({
      success: true,
      tips: tips,
      material: {
        title: material.title,
        progress: material.progress,
        timeSpent: material.timeSpent,
      },
    });
  } catch (error) {
    console.error("Study tips error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
