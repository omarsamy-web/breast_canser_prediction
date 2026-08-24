import dotenv from "dotenv";

// This module MUST be the first static import in server.js so that every
// later module sees the loaded environment.
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
export const nodeEnv = process.env.NODE_ENV || "development";
export const sentryDsn = process.env.SENTRY_DSN || "";

const JWT_SECRET = process.env.JWT_SECRET;
const INSECURE_SECRETS = new Set([
  undefined,
  "",
  "replace-with-a-long-random-secret",
  "bXJlYXN0Q2FuY2VyQUlTZWNyZXRLZXkyMDI2IQ=="
]);

if (INSECURE_SECRETS.has(JWT_SECRET)) {
  const hint = "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\"";
  if (isProduction) {
    console.error("FATAL: JWT_SECRET is missing or uses a known insecure value. Refusing to start. " + hint);
    process.exit(1);
  }
  console.warn("WARNING: JWT_SECRET is missing or insecure — dev fallback enabled. " + hint);
  process.env.JWT_SECRET = "dev-only-insecure-secret-do-not-use-in-production";
}

if (isProduction && !process.env.MONGODB_URI && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("WARNING: no database configured — all data will be lost on restart.");
}

if (process.env.FRONTEND_ORIGIN === "*") {
  console.warn("WARNING: FRONTEND_ORIGIN=* disables a key CORS protection. Set explicit origins in production.");
}
