import mongoose from "mongoose";

const freeTimeBlockSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const weekConfigSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  totalAvailableHours: {
    type: Number,
    required: true,
    min: 0,
    default: 40,
  },
  weekStartDate: {
    type: Date,
    default: Date.now,
  },
  freeTimeBlocks: {
    type: [freeTimeBlockSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const WeekConfig = mongoose.models.WeekConfig || mongoose.model("WeekConfig", weekConfigSchema);

export default WeekConfig;
