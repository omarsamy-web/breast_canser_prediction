import axios from "axios";

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

export async function analyzeDataset(path) {
  const { data } = await client.post("/dataset/analyze", { path });
  return data;
}
