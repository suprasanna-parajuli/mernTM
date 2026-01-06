import StudyBlock from "../models/studyBlockModel.js";
import Subject from "../models/subjectModel.js";
import WeekConfig from "../models/weekConfigModel.js";
import { calculatePriorityScore, allocateWeeklyTime, generateSchedule } from "../utils/algorithms.js";

// Get current week's schedule
export async function getSchedule(req, res) {
  try {
    const userId = req.user._id;

    const blocks = await StudyBlock.find({ owner: userId })
      .populate("subject", "name difficulty")
      .sort({ day: 1, startTime: 1 });

    res.json({ success: true, schedule: blocks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch schedule" });
  }
}

// Generate new weekly schedule
export async function generateWeeklySchedule(req, res) {
  try {
    const userId = req.user._id;

    // Get user's week config
    const weekConfig = await WeekConfig.findOne({ owner: userId });
    if (!weekConfig || weekConfig.freeTimeBlocks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please set your weekly availability first"
      });
    }

    // Get all user's subjects
    const subjects = await Subject.find({ owner: userId });
    if (subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No subjects found. Add subjects first"
      });
    }

    // Step 1: Calculate priority scores
    const subjectsWithPriority = subjects.map(subject => {
      const priorityScore = calculatePriorityScore(subject);
      subject.priorityScore = priorityScore;
      subject.save();
      return {
        _id: subject._id,
        name: subject.name,
        difficulty: subject.difficulty,
        priorityScore: priorityScore
      };
    });

    // Step 2: Allocate time
    const subjectsWithTime = allocateWeeklyTime(
      subjectsWithPriority,
      weekConfig.totalAvailableHours
    );

    // Step 3: Generate schedule
    console.log("Subjects with allocated time:", JSON.stringify(subjectsWithTime, null, 2));
    console.log("Free time blocks:", JSON.stringify(weekConfig.freeTimeBlocks, null, 2));
    const scheduleBlocks = generateSchedule(subjectsWithTime, weekConfig.freeTimeBlocks);
    console.log("Generated schedule blocks:", scheduleBlocks.length);

    // Delete old schedule
    await StudyBlock.deleteMany({ owner: userId });

    // Create new schedule blocks
    const newBlocks = scheduleBlocks.map(block => ({
      subject: block.subject,
      day: block.day,
      startTime: block.startTime,
      endTime: block.endTime,
      duration: block.duration,
      owner: userId,
      weekStartDate: weekConfig.weekStartDate,
      completed: false
    }));

    const savedBlocks = await StudyBlock.insertMany(newBlocks);

    res.json({
      success: true,
      message: "Schedule generated successfully",
      schedule: savedBlocks,
      totalBlocks: savedBlocks.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to generate schedule" });
  }
}

// Delete schedule
export async function deleteSchedule(req, res) {
  try {
    const userId = req.user._id;
    await StudyBlock.deleteMany({ owner: userId });
    res.json({ success: true, message: "Schedule deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete schedule" });
  }
}
