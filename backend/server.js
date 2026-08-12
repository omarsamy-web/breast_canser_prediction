import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";

import app from "./src/app.js";
import { connectDatabase } from "./src/config/database.js";

const port = process.env.PORT || 4000;

await connectDatabase();

app.listen(port, "0.0.0.0", () => {
  console.log(`Breast Cancer AI API running on port ${port}`);
});
