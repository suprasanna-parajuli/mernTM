import mongoose from "mongoose";

// This model stores the AI's learned data for each user
// So the AI remembers patterns even after the user logs out

const aiModelSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    // Training data (past study sessions)
    trainingData: {
      type: Array,
      default: []
    },
    // AI weights (how important each factor is)
    weights: {
      type: Object,
      default: {
        timeOfDay: 0.3,
        subjectDifficulty: 0.4,
        dayOfWeek: 0.2,
        recentStreak: 0.1
      }
    },
    // Model version
    version: {
      type: String,
      default: '1.0'
    },
    // Last time AI was trained
    lastTrained: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const AIModel = mongoose.model("AIModel", aiModelSchema);

export default AIModel;
