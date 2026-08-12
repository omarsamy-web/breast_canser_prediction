import mongoose from "mongoose";

const datasetSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    path: String,
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    stats: {
      rows: Number,
      columns: Number,
      nullValues: Number,
      duplicateValues: Number,
      diagnosisDistribution: Object,
      featureStats: Object
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Dataset", datasetSchema);
