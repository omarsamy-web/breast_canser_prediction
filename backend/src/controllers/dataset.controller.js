import Dataset from "../models/Dataset.js";
import { analyzeDataset } from "../services/ml.service.js";
import path from "path";
import { hasDatabase } from "../config/database.js";
import { memory } from "../services/memory.store.js";
import { hasSupabase, supabaseStore } from "../services/supabase.store.js";

export async function uploadDataset(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "CSV file is required" });
    const datasetPath = path.resolve(req.file.path);
    const stats = await analyzeDataset(datasetPath);
    const payload = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: datasetPath,
      uploaded_by: req.user._id,
      stats
    };
    const dataset = hasDatabase()
      ? await Dataset.create(payload)
      : hasSupabase()
        ? await supabaseStore.datasets.create(payload)
        : memory.datasets.create(payload);
    res.status(201).json(dataset);
  } catch (error) {
    next(error);
  }
}

export async function listDatasets(req, res, next) {
  try {
    const datasets = hasDatabase()
      ? await Dataset.find().sort({ created_at: -1 }).populate("uploaded_by", "name email role")
      : hasSupabase()
        ? await supabaseStore.datasets.list()
        : memory.datasets.list();
    res.json(datasets);
  } catch (error) {
    next(error);
  }
}

export async function deleteDataset(req, res, next) {
  try {
    if (hasDatabase()) await Dataset.findByIdAndDelete(req.params.id);
    else if (hasSupabase()) await supabaseStore.datasets.delete(req.params.id);
    else memory.datasets.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
