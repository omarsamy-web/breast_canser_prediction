import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import datasetRoutes from "./routes/dataset.routes.js";
import mlRoutes from "./routes/ml.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  return Boolean(origin && (allowedOrigins.includes(origin) || allowedOrigins.includes("*")));
}

app.use(helmet());
// Explicit CORS middleware — sets a complete, explicit set of CORS headers when the request Origin is allowed.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    // Required
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    // Explicitly allowed methods and headers
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] || "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    );
    // Optional but useful
    res.setHeader("Access-Control-Expose-Headers", "Authorization, Content-Length");
    res.setHeader("Access-Control-Max-Age", "600"); // cache preflight for 10 minutes
    // Vary ensures caches differentiate responses by Origin
    res.setHeader("Vary", "Origin");
  }

  // If it's a preflight request, respond immediately
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "node-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/dataset", datasetRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/admin", adminRoutes);
app.use(errorHandler);

export default app;
