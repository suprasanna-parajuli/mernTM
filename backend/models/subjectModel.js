import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3,
  },
  examDate: {
    type: Date,
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  allocatedTime: {
    type: Number,
    default: 0,
    min: 0,
  },
  priorityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  tags: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Subject = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);

export default Subject;
