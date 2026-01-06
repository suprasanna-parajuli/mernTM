import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyMaterial",
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0,
  },
  tag: {
    type: String,
    enum: ["study", "revision", "notes", "reference", "assignment"],
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Progress = mongoose.models.Progress || mongoose.model("Progress", progressSchema);

export default Progress;
