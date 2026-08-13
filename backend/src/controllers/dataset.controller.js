import Dataset from "../models/Dataset.js";
import csvParser from "csv-parser";
import fs from "fs";
import path from "path";
import { hasDatabase } from "../config/database.js";
import { memory } from "../services/memory.store.js";
import { hasSupabase, supabaseStore } from "../services/supabase.store.js";

function normalizeCell(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function quantile(sortedValues, percentile) {
  if (!sortedValues.length) return null;
  if (sortedValues.length === 1) return sortedValues[0];

  const position = (sortedValues.length - 1) * percentile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);

  if (lowerIndex === upperIndex) return sortedValues[lowerIndex];

  const weight = position - lowerIndex;
  return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
}

async function analyzeLocalDataset(datasetPath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const headers = [];
    const seenRows = new Set();
    const numericColumns = new Map();
    const diagnosisDistribution = new Map();
    let nullValues = 0;
    let duplicateValues = 0;

    const stream = fs.createReadStream(datasetPath);

    stream
      .on("error", reject)
      .pipe(csvParser({
        mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, "")
      }))
      .on("headers", (parsedHeaders) => {
        headers.splice(0, headers.length, ...parsedHeaders);
        for (const header of headers) {
          if (header !== "diagnosis") numericColumns.set(header, []);
        }
      })
      .on("data", (row) => {
        rows.push(row);

        const rowSignature = JSON.stringify(headers.length ? headers.map((header) => normalizeCell(row[header])) : Object.values(row).map(normalizeCell));
        if (seenRows.has(rowSignature)) duplicateValues += 1;
        else seenRows.add(rowSignature);

        for (const header of headers) {
          const cell = normalizeCell(row[header]);
          if (!cell) {
            nullValues += 1;
            continue;
          }

          if (header === "diagnosis") {
            diagnosisDistribution.set(cell, (diagnosisDistribution.get(cell) || 0) + 1);
            continue;
          }

          const numericValue = Number(cell);
          if (Number.isFinite(numericValue) && numericColumns.has(header)) {
            numericColumns.get(header).push(numericValue);
          }
        }
      })
      .on("end", () => {
        const featureStats = {};

        for (const [columnName, values] of numericColumns.entries()) {
          if (!values.length) continue;

          const sortedValues = [...values].sort((a, b) => a - b);
          const sum = values.reduce((total, value) => total + value, 0);
          const mean = sum / values.length;
          const variance = values.reduce((total, value) => total + ((value - mean) ** 2), 0) / Math.max(values.length - 1, 1);

          featureStats[columnName] = {
            count: values.length,
            mean,
            std: Math.sqrt(variance),
            min: sortedValues[0],
            "25%": quantile(sortedValues, 0.25),
            "50%": quantile(sortedValues, 0.5),
            "75%": quantile(sortedValues, 0.75),
            max: sortedValues[sortedValues.length - 1]
          };
        }

        resolve({
          rows: rows.length,
          columns: headers.length,
          nullValues,
          duplicateValues,
          diagnosisDistribution: Object.fromEntries(diagnosisDistribution.entries()),
          featureStats,
          preview: rows.slice(0, 25).map((row) => {
            const previewRow = {};
            for (const [key, value] of Object.entries(row)) {
              const cell = normalizeCell(value);
              previewRow[key] = cell === "" ? null : value;
            }
            return previewRow;
          })
        });
      })
      .on("error", reject);
  });
}

export async function uploadDataset(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "CSV file is required" });
    const datasetPath = path.resolve(req.file.path);
    const stats = await analyzeLocalDataset(datasetPath);
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
