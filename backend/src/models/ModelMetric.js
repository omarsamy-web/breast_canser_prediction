import mongoose from "mongoose";

const modelMetricSchema = new mongoose.Schema(
  {
    model_name: String,
    accuracy: Number,
    precision: Number,
    recall: Number,
    f1_score: Number,
    roc_auc: Number,
    confusion_matrix: [[Number]],
    classification_report: Object,
    feature_importance: [Object],
    isBest: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("ModelMetric", modelMetricSchema);
