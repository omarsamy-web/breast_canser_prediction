import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["Admin", "Patient"]).default("Patient")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const trainSchema = z.object({
  algorithm: z.enum(["knn", "svm", "decision_tree", "random_forest", "all"]),
  datasetPath: z.string().optional(),
  hyperparameters: z.record(z.any()).default({})
});

export const predictSchema = z.object({
  model: z.string().optional(),
  features: z.array(z.number()).min(1)
});

export function validate(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues.map((issue) => issue.message).join(", "));
    error.status = 400;
    throw error;
  }
  return parsed.data;
}
