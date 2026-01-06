import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["schedule_start", "deadline_warning", "no_progress", "streak_risk"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  triggerTime: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
