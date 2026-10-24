import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../backend/config/env.js");
const mongoose = require("mongoose");
const { cloudinary, configured } = require("../backend/config/cloudinary.js");
let failed = false;
try {
  if (!process.env.MONGODB_URI)
    throw new Error("Run npm run setup:local first.");
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  await mongoose.connection.db.command({ ping: 1 });
  console.log(`MongoDB: connected (${mongoose.connection.name})`);
} catch {
  failed = true;
  console.error(
    "MongoDB: unavailable. Check MONGODB_URI and your local MongoDB service.",
  );
} finally {
  await mongoose.disconnect();
}
if (!configured()) {
  failed = true;
  console.error(
    "Cloudinary: missing credentials. Add all three CLOUDINARY_* values or CLOUDINARY_URL to backend/.env.",
  );
} else {
  try {
    const result = await cloudinary.api.ping({ timeout: 10000 });
    if (result.status !== "ok") throw new Error("Not ready");
    console.log("Cloudinary: authenticated and reachable.");
  } catch (error) {
    failed = true;
    const code = error.http_code || error.error?.http_code;
    console.error(
      `Cloudinary: verification failed${code ? ` (HTTP ${code})` : ""}. Check credentials and network access.`,
    );
  }
}
process.exitCode = failed ? 1 : 0;
