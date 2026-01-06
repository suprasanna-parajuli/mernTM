import StudyBlock from "../models/studyBlockModel.js";
import Subject from "../models/subjectModel.js";
import WeekConfig from "../models/weekConfigModel.js";
import { calculatePriorityScore, allocateWeeklyTime, generateSchedule } from "./algorithms.js";

/**
 * AUTO-REGENERATION SYSTEM
 *
 * This automatically updates the weekly schedule when important changes happen.
 *
 * When does it trigger?
 * 1. When you finish a study session
 * 2. When you add/edit/delete a subject
 * 3. When you change your weekly availability
 *
 * What does it do?
 * 1. Recalculates all subject priorities (based on difficulty + deadline)
 * 2. Reallocates study time to each subject
 * 3. Regenerates the weekly timetable
 */

// Main function - regenerates schedule automatically
export async function autoRegenerateSchedule(userId, reason) {
  try {
    console.log(`🔄 Auto-regenerating schedule for user ${userId}`);
    console.log(`📋 Reason: ${reason}`);

    // Get user's week configuration
    const weekConfig = await WeekConfig.findOne({ owner: userId });

    // If user hasn't set their availability yet, skip regeneration
    if (!weekConfig || weekConfig.freeTimeBlocks.length === 0) {
      console.log("⏭️  Skipping: No week config set");
      return { success: false, message: "Week config not set" };
    }

    // Get all subjects for this user
    const subjects = await Subject.find({ owner: userId });

    // If no subjects exist, skip regeneration
    if (subjects.length === 0) {
      console.log("⏭️  Skipping: No subjects found");
      return { success: false, message: "No subjects found" };
    }

    // STEP 1: Recalculate priority scores for all subjects
    console.log("📊 Step 1: Recalculating priorities...");
    const subjectsWithPriority = subjects.map(subject => {
      const priorityScore = calculatePriorityScore(subject);
      subject.priorityScore = priorityScore;
      subject.save(); // Save updated priority to database
      return {
        _id: subject._id,
        name: subject.name,
        difficulty: subject.difficulty,
        priorityScore: priorityScore
      };
    });

    // STEP 2: Allocate weekly time based on priorities
    console.log("⏰ Step 2: Allocating time...");
    const subjectsWithTime = allocateWeeklyTime(
      subjectsWithPriority,
      weekConfig.totalAvailableHours
    );

    // STEP 3: Generate new schedule using greedy algorithm
    console.log("📅 Step 3: Generating schedule...");
    const scheduleBlocks = generateSchedule(subjectsWithTime, weekConfig.freeTimeBlocks);

    // STEP 4: Delete old schedule
    console.log("🗑️  Step 4: Removing old schedule...");
    await StudyBlock.deleteMany({ owner: userId });

    // STEP 5: Save new schedule to database
    console.log("💾 Step 5: Saving new schedule...");
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

    await StudyBlock.insertMany(newBlocks);

    console.log(`✅ Schedule regenerated successfully! Created ${newBlocks.length} blocks`);

    return {
      success: true,
      message: "Schedule auto-regenerated",
      blocksCreated: newBlocks.length
    };

  } catch (error) {
    console.error("❌ Auto-regeneration failed:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Helper function - checks if auto-regeneration should happen
 *
 * @param {string} eventType - Type of event that occurred
 * @returns {boolean} - True if schedule should regenerate
 */
export function shouldRegenerate(eventType) {
  const triggers = [
    'study_session_completed',    // After finishing study
    'subject_added',              // New subject created
    'subject_updated',            // Subject edited (especially exam date)
    'subject_deleted',            // Subject removed
    'availability_changed',       // Week config updated
  ];

  const shouldRegen = triggers.includes(eventType);

  if (shouldRegen) {
    console.log(`✓ Event "${eventType}" triggers regeneration`);
  } else {
    console.log(`✗ Event "${eventType}" does not trigger regeneration`);
  }

  return shouldRegen;
}
