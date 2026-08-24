import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Admin", "Patient"], default: "Patient" },
    plan: { type: String, enum: ["free", "pro", "clinic"], default: "free" },
    credits: { type: Number, default: 0, min: 0 },
    freePredictionUsed: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("User", userSchema);
