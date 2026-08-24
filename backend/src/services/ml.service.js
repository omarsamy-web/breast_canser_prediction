import axios from "axios";
import csvParser from "csv-parser";
import fs from "fs";
import nodePath from "path";

const client = axios.create({
  baseURL: process.env.ML_SERVICE_URL || "http://localhost:8000",
  timeout: 600000,
  headers: process.env.ML_ACCESS_TOKEN ? { "X-ML-Token": process.env.ML_ACCESS_TOKEN } : {}
});

function normalizeMlError(error, action) {
  const unreachable = ["ECONNREFUSED", "ENOTFOUND", "ECONNABORTED", "ETIMEDOUT"].includes(error.code) ||
    ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT"].includes(error.cause?.code || "");
  if (unreachable) {
    const wrapped = new Error(
      `ML service is unreachable (${process.env.ML_SERVICE_URL || "http://localhost:8000"}). ` +
      "Verify the ML service is deployed and ML_SERVICE_URL points to its URL."
    );
    wrapped.status = 503;
    wrapped.code = "ML_UNREACHABLE";
    return wrapped;
  }
  if (error.response?.status === 404 && action === "evaluate") {
    const wrapped = new Error("Models are not trained yet. The ML service auto-trains on first start — check its deploy logs.");
    wrapped.status = 503;
    return wrapped;
  }
  return error;
}

async function mlCall(action, request) {
  try {
    return await request();
  } catch (error) {
    throw normalizeMlError(error, action);
  }
}

export async function trainModel(payload) {
  return mlCall("train", () => client.post("/train", payload)).then((r) => r.data);
}

export async function predictDiagnosis(payload) {
  return mlCall("predict", () => client.post("/predict", payload)).then((r) => r.data);
}

export async function evaluateModels() {
  return mlCall("evaluate", () => client.get("/evaluate")).then((r) => r.data);
}

export async function getModels() {
  return mlCall("models", () => client.get("/models")).then((r) => r.data);
}

export async function analyzeBundledDataset() {
  return mlCall("analyze", () => client.post("/dataset/analyze", {})).then((r) => r.data);
}

export async function mlServiceStatus() {
  const configuredUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
  try {
    const { data } = await client.get("/", { timeout: 5000 });
    return { reachable: true, url: configuredUrl, ready: Boolean(data?.ready), version: data?.version };
  } catch (error) {
    return { reachable: false, url: configuredUrl, error: error.code || error.message };
  }
}
