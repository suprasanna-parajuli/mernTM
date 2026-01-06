import Notification from "../models/notificationModel.js";
import Subject from "../models/subjectModel.js";
import Progress from "../models/progressModel.js";
import Streak from "../models/streakModel.js";
import StudyBlock from "../models/studyBlockModel.js";

// Helper to calculate days between dates
function getDaysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diff = Math.abs(d2 - d1);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Check if a time is near (within minutes)
function isTimeNear(currentTime, targetTime, minutesBefore) {
  const now = new Date(currentTime);
  const target = new Date();
  const [hours, minutes] = targetTime.split(":");
  target.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const diff = target - now;
  const diffMinutes = diff / (1000 * 60);

  return diffMinutes > 0 && diffMinutes <= minutesBefore;
}

// Get notifications for user
export async function getNotifications(req, res) {
  try {
    const userId = req.user._id;

    const notifs = await Notification.find({ owner: userId, read: false })
      .populate("subject", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, notifications: notifs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get notifications" });
  }
}

// Mark notification as read
export async function markAsRead(req, res) {
  try {
    const userId = req.user._id;
    const notifId = req.params.id;

    const notif = await Notification.findOneAndUpdate(
      { _id: notifId, owner: userId },
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, notification: notif });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
}

// Delete all notifications (for testing/cleanup)
export async function deleteAllNotifications(req, res) {
  try {
    const userId = req.user._id;
    const result = await Notification.deleteMany({ owner: userId });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete notifications" });
  }
}

// Algorithm 6: Check and create notifications
export async function checkAndCreateNotifications(req, res) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const notifications = [];

    console.log("Checking notifications for user:", userId);

    // Get user data
    const subjects = await Subject.find({ owner: userId });
    const streak = await Streak.findOne({ owner: userId });

    // 1. Check schedule start times (15 min before)
    const today = now.toLocaleDateString("en-US", { weekday: "long" });
    const todayBlocks = await StudyBlock.find({
      owner: userId,
      day: today,
      completed: false,
    }).populate("subject", "name");

    for (let i = 0; i < todayBlocks.length; i++) {
      const block = todayBlocks[i];
      if (isTimeNear(now, block.startTime, 15)) {
        // Check if we already sent this notification
        const exists = await Notification.findOne({
          owner: userId,
          type: "schedule_start",
          subject: block.subject._id,
          createdAt: { $gte: new Date(now.getTime() - 20 * 60 * 1000) },
        });

        if (!exists) {
          const notif = new Notification({
            owner: userId,
            type: "schedule_start",
            message: `Time to study ${block.subject.name}!`,
            subject: block.subject._id,
            read: false,
            triggerTime: now,
          });
          await notif.save();
          notifications.push(notif);
        }
      }
    }

    // 2. Check deadline warnings (exam within 7 days)
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      if (subject.examDate) {
        const daysLeft = getDaysBetween(now, subject.examDate);

        if (daysLeft <= 7 && daysLeft > 0) {
          // Check if we already sent warning today
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const exists = await Notification.findOne({
            owner: userId,
            type: "deadline_warning",
            subject: subject._id,
            createdAt: { $gte: today },
          });

          if (!exists) {
            const notif = new Notification({
              owner: userId,
              type: "deadline_warning",
              message: `${subject.name} exam in ${daysLeft} day${daysLeft > 1 ? "s" : ""}!`,
              subject: subject._id,
              read: false,
              triggerTime: now,
            });
            await notif.save();
            notifications.push(notif);
          }
        }
      }
    }

    // 3. Check no progress (no study for 3+ days)
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Only check if subject is at least 3 days old
      const subjectAge = getDaysBetween(subject.createdAt, now);
      if (subjectAge < 3) continue;

      const recentProgress = await Progress.findOne({
        owner: userId,
        subject: subject._id,
        date: { $gte: threeDaysAgo },
      });

      if (!recentProgress) {
        // No progress in 3 days - check if we already warned
        const exists = await Notification.findOne({
          owner: userId,
          type: "no_progress",
          subject: subject._id,
          createdAt: { $gte: threeDaysAgo },
        });

        if (!exists) {
          const notif = new Notification({
            owner: userId,
            type: "no_progress",
            message: `No progress on ${subject.name} for 3+ days`,
            subject: subject._id,
            read: false,
            triggerTime: now,
          });
          await notif.save();
          notifications.push(notif);
        }
      }
    }

    // 4. Check streak risk (active streak but no study today)
    if (streak && streak.currentStreak > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayProgress = await Progress.findOne({
        owner: userId,
        date: { $gte: today },
      });

      if (!todayProgress) {
        // No study today - check if we already warned
        const exists = await Notification.findOne({
          owner: userId,
          type: "streak_risk",
          createdAt: { $gte: today },
        });

        if (!exists) {
          const notif = new Notification({
            owner: userId,
            type: "streak_risk",
            message: `Study now to keep your ${streak.currentStreak} day streak!`,
            read: false,
            triggerTime: now,
          });
          await notif.save();
          notifications.push(notif);
        }
      }
    }

    console.log(`Created ${notifications.length} new notifications`);

    res.json({
      success: true,
      message: `Checked notifications, created ${notifications.length} new ones`,
      newNotifications: notifications.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to check notifications" });
  }
}
