import WeekConfig from "../models/weekConfigModel.js";
import { autoRegenerateSchedule } from "../utils/autoRegenerate.js";

// Get user's week configuration
export async function getWeekConfig(req, res) {
  try {
    const userId = req.user._id;

    let config = await WeekConfig.findOne({ owner: userId });

    if (!config) {
      config = await WeekConfig.create({
        owner: userId,
        totalAvailableHours: 40,
        freeTimeBlocks: []
      });
    }

    res.json({ success: true, config });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch week config" });
  }
}

// Update week configuration
export async function updateWeekConfig(req, res) {
  try {
    const userId = req.user._id;
    const { totalAvailableHours, freeTimeBlocks } = req.body;

    let config = await WeekConfig.findOne({ owner: userId });

    if (!config) {
      config = await WeekConfig.create({
        owner: userId,
        totalAvailableHours,
        freeTimeBlocks,
        updatedAt: Date.now()
      });
    } else {
      config.totalAvailableHours = totalAvailableHours;
      config.freeTimeBlocks = freeTimeBlocks;
      config.updatedAt = Date.now();
      await config.save();
    }

    // AUTO-REGENERATE: Availability changed, update schedule
    autoRegenerateSchedule(userId, 'availability_changed');

    res.json({
      success: true,
      message: "Week configuration updated",
      config
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update week config" });
  }
}
