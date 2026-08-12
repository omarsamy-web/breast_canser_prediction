import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    model: String,
    result: String,
    confidence: Number,
    riskPercentage: Number,
    features: [Number],
    recommendation: String
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Prediction", predictionSchema);
