import mongoose from "mongoose";

const streakSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastStudyDate: {
    type: Date,
    default: null,
  },
  totalStudyDays: {
    type: Number,
    default: 0,
    min: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Streak = mongoose.models.Streak || mongoose.model("Streak", streakSchema);

export default Streak;
