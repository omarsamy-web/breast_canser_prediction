import crypto from "node:crypto";
import { sentryDsn } from "./env.js";

let Sentry = null;

export async function initMonitoring() {
  if (!sentryDsn) {
    console.log("Monitoring: SENTRY_DSN not set — skipping Sentry init.");
    return;
  }
  try {
    Sentry = await import("@sentry/node");
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0.1
    });
    console.log("Monitoring: Sentry initialised.");
  } catch (error) {
    console.warn("Monitoring: failed to initialise Sentry:", error.message);
  }
}

export function captureError(error, context = {}) {
  const errorId = crypto.randomUUID();
  console.error(JSON.stringify({
    level: "error",
    errorId,
    name: error?.name,
    message: error?.message,
    status: error?.status,
    route: context.route,
    userId: context.userId,
    at: new Date().toISOString()
  }));
  if (Sentry) {
    Sentry.captureException(error, { extra: { errorId, ...context } });
  }
  return errorId;
}

export function auditEvent(event, details = {}) {
  // Structured audit trail (stdout). For HIPAA-grade compliance this should be
  // shipped to an append-only log store with retention policies.
  console.log(JSON.stringify({ level: "audit", event, at: new Date().toISOString(), ...details }));
}
