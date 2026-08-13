import axios from "axios";
import csvParser from "csv-parser";
import fs from "fs";
import nodePath from "path";

const client = axios.create({
  baseURL: process.env.ML_SERVICE_URL || "http://localhost:8000",
  timeout: 600000
});

export async function trainModel(payload) {
  const { data } = await client.post("/train", payload);
  return data;
}

export async function predictDiagnosis(payload) {
  const { data } = await client.post("/predict", payload);
  return data;
}

export async function evaluateModels() {
  const { data } = await client.get("/evaluate");
  return data;
}

export async function getModels() {
  const { data } = await client.get("/models");
  return data;
}

export async function analyzeDataset(filePath) {
  const datasetPath = filePath ? String(filePath) : null;
  if (!datasetPath) {
    throw new Error("Dataset path is required");
  }

  const resolvedPath = nodePath.resolve(datasetPath);
  return new Promise((resolve, reject) => {
    const rows = [];
    const headers = [];
    const seenRows = new Set();
    const numericColumns = new Map();
    const diagnosisDistribution = new Map();
    let nullValues = 0;
    let duplicateValues = 0;

    const quantile = (sortedValues, percentile) => {
      if (!sortedValues.length) return null;
      if (sortedValues.length === 1) return sortedValues[0];
      const position = (sortedValues.length - 1) * percentile;
      const lowerIndex = Math.floor(position);
      const upperIndex = Math.ceil(position);
      if (lowerIndex === upperIndex) return sortedValues[lowerIndex];
      const weight = position - lowerIndex;
      return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
    };

    fs.createReadStream(resolvedPath)
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

        const rowSignature = JSON.stringify(headers.length ? headers.map((header) => String(row[header] ?? "").trim()) : Object.values(row).map((value) => String(value ?? "").trim()));
        if (seenRows.has(rowSignature)) duplicateValues += 1;
        else seenRows.add(rowSignature);

        for (const header of headers) {
          const cell = String(row[header] ?? "").trim();
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
              const cell = String(value ?? "").trim();
              previewRow[key] = cell === "" ? null : value;
            }
            return previewRow;
          })
        });
      })
      .on("error", reject);
  });
}
