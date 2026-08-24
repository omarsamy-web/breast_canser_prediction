import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import "./src/config/env.js"; // must load before any module that reads process.env
import app from "./src/app.js";
import { connectDatabase } from "./src/config/database.js";
import { initMonitoring } from "./src/config/monitoring.js";

initMonitoring();

const port = process.env.PORT || 5000;

try {
  await connectDatabase();
} catch (error) {
  console.error("Database setup error:", error.message);
}

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Breast Cancer AI API running on port ${port} (${process.env.NODE_ENV || "development"})`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception — shutting down:", error);
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 5000).unref();
});
