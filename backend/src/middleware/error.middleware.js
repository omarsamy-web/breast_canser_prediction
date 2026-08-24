import crypto from "node:crypto";
import { nodeEnv } from "../config/env.js";
import { captureError } from "../config/monitoring.js";

const GENERIC_500 = "Internal server error. Please try again or contact support if the problem persists.";

export function errorHandler(error, req, res, _next) {
  const status = Number(error.status) || Number(error.statusCode) || (error.name === "MulterError" ? 400 : 500);
  const errorId = captureError(error, { route: req.originalUrl, userId: req.user?._id, method: req.method });

  // Never leak internals: clients get a stable message + reference id only.
  const message =
    status >= 500
      ? GENERIC_500
      : error.message || "Request failed";

  res.status(status).json({
    message,
    errorId,
    ...(nodeEnv === "development" && status < 500 ? { details: error.response?.data?.detail ?? null } : {})
  });
}
