import Streak from "../models/streakModel.js";

// Helper function to calculate days between two dates
function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Algorithm 5: Streak Update Logic
export async function updateStreak(req, res) {
  try {
    const userId = req.user._id;
    const { studyTimeMinutes } = req.body;

    if (!studyTimeMinutes || studyTimeMinutes < 1) {
      return res.status(400).json({
        success: false,
        message: "Study time must be at least 1 minute",
      });
    }

    // Find or create streak for user
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
        // Same day - no change to streak count, but update timestamp
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

    res.json({
      success: true,
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalStudyDays: streak.totalStudyDays,
        lastStudyDate: streak.lastStudyDate,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update streak" });
  }
}

// Get current user streak
export async function getStreak(req, res) {
  try {
    const userId = req.user._id;

    let streak = await Streak.findOne({ owner: userId });

    if (!streak) {
      // No streak yet - return defaults
      return res.json({
        success: true,
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          totalStudyDays: 0,
          lastStudyDate: null,
        },
      });
    }

    // Check if streak should be broken (no study yesterday or today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = new Date(streak.lastStudyDate);
    lastDate.setHours(0, 0, 0, 0);

    const daysDiff = daysBetween(lastDate, today);

    if (daysDiff > 1) {
      // Streak is broken - reset current streak to 0
      streak.currentStreak = 0;
      await streak.save();
    }

    res.json({
      success: true,
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalStudyDays: streak.totalStudyDays,
        lastStudyDate: streak.lastStudyDate,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get streak" });
  }
}
