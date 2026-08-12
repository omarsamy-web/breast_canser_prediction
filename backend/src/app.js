import cors from "cors";
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
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
      .split(",")
      .map(o => o.trim());
    if (!origin || allowed.includes(origin) || allowed.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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
