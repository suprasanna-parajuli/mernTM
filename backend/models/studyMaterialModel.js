import mongoose from "mongoose";

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  tag: {
    type: String,
    enum: ["study", "revision", "notes", "reference", "assignment"],
    required: true,
  },
  fileUrl: {
    type: String,
    default: "",
  },
  targetHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: 0,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
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
  lastStudied: {
    type: Date,
    default: null,
  },
});

const StudyMaterial = mongoose.models.StudyMaterial || mongoose.model("StudyMaterial", studyMaterialSchema);

export default StudyMaterial;
