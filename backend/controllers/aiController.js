import AIModel from "../models/aiModel.js";
import StudyAI from "../utils/simpleAI.js";
import StudyBlock from "../models/studyBlockModel.js";
import Subject from "../models/subjectModel.js";
import Streak from "../models/streakModel.js";

// Get AI insights for the user
export async function getAIInsights(req, res) {
  try {
    const userId = req.user._id;

    // Load user's AI model from database
    let aiModelData = await AIModel.findOne({ owner: userId });

    if (!aiModelData) {
      // No AI data yet - create new
      aiModelData = new AIModel({ owner: userId });
      await aiModelData.save();
    }

    // Create AI instance and load training data
    const ai = new StudyAI();
    ai.importModel(aiModelData);

    // Get insights
    const insights = ai.getInsights();

    res.json({
      success: true,
      insights: insights
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get AI insights" });
  }
}

// Train AI with a new study session
export async function trainAI(req, res) {
  try {
    const userId = req.user._id;
    const { timeOfDay, subjectDifficulty, dayOfWeek, completed, focusScore } = req.body;

    // Validation
    if (!timeOfDay || subjectDifficulty === undefined || !dayOfWeek) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Load user's AI model
    let aiModelData = await AIModel.findOne({ owner: userId });

    if (!aiModelData) {
      aiModelData = new AIModel({ owner: userId });
    }

    // Create AI instance and load existing data
    const ai = new StudyAI();
    ai.importModel(aiModelData);

    // Add new training data
    ai.addTrainingData({
      timeOfDay,
      subjectDifficulty,
      dayOfWeek,
      completed: completed !== false, // default true
      focusScore: focusScore || 0.7
    });

    // Save updated model
    const updatedModel = ai.exportModel();
    aiModelData.trainingData = updatedModel.trainingData;
    aiModelData.weights = updatedModel.weights;
    aiModelData.lastTrained = new Date();

    await aiModelData.save();

    res.json({
      success: true,
      message: "AI trained successfully",
      totalSessions: aiModelData.trainingData.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to train AI" });
  }
}

// Get AI prediction for a specific scenario
export async function getPrediction(req, res) {
  try {
    const userId = req.user._id;
    const { timeOfDay, subjectDifficulty, dayOfWeek } = req.query;

    // Load AI model
    const aiModelData = await AIModel.findOne({ owner: userId });

    if (!aiModelData || aiModelData.trainingData.length === 0) {
      return res.json({
        success: true,
        prediction: 0.5,
        confidence: "low",
        message: "Not enough data yet. Keep studying to train the AI!"
      });
    }

    // Get user's current streak
    const streak = await Streak.findOne({ owner: userId });
    const recentStreak = streak ? streak.currentStreak : 0;

    // Create AI and make prediction
    const ai = new StudyAI();
    ai.importModel(aiModelData);

    const prediction = ai.predictSuccess(
      timeOfDay,
      parseInt(subjectDifficulty),
      dayOfWeek,
      recentStreak
    );

    // Determine confidence level
    let confidence = "low";
    if (aiModelData.trainingData.length > 20) confidence = "high";
    else if (aiModelData.trainingData.length > 10) confidence = "medium";

    res.json({
      success: true,
      prediction: Math.round(prediction * 100), // Convert to percentage
      confidence: confidence,
      message: `${Math.round(prediction * 100)}% chance of successful study session`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get prediction" });
  }
}

// Get AI-optimized schedule suggestions
export async function getOptimizedSchedule(req, res) {
  try {
    const userId = req.user._id;

    // Load AI model
    const aiModelData = await AIModel.findOne({ owner: userId });

    if (!aiModelData || aiModelData.trainingData.length < 5) {
      return res.json({
        success: true,
        optimized: false,
        message: "Need at least 5 study sessions to optimize schedule"
      });
    }

    // Get user's subjects
    const subjects = await Subject.find({ owner: userId }).sort({ priorityScore: -1 });

    if (subjects.length === 0) {
      return res.json({
        success: true,
        optimized: false,
        message: "No subjects found"
      });
    }

    // Get user's streak
    const streak = await Streak.findOne({ owner: userId });
    const recentStreak = streak ? streak.currentStreak : 0;

    // Create AI
    const ai = new StudyAI();
    ai.importModel(aiModelData);

    // Time slots to try
    const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "19:00", "20:00"];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Find best time slot for each subject
    const recommendations = [];

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      let bestScore = 0;
      let bestTime = timeSlots[0];
      let bestDay = days[0];

      // Try all combinations
      for (let j = 0; j < timeSlots.length; j++) {
        for (let k = 0; k < days.length; k++) {
          const prediction = ai.predictSuccess(
            timeSlots[j],
            subject.difficulty,
            days[k],
            recentStreak
          );

          if (prediction > bestScore) {
            bestScore = prediction;
            bestTime = timeSlots[j];
            bestDay = days[k];
          }
        }
      }

      recommendations.push({
        subject: subject.name,
        difficulty: subject.difficulty,
        bestDay: bestDay,
        bestTime: bestTime,
        successProbability: Math.round(bestScore * 100)
      });
    }

    res.json({
      success: true,
      optimized: true,
      recommendations: recommendations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to optimize schedule" });
  }
}
