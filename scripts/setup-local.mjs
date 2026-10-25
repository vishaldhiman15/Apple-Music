import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { parse } from "dotenv";

const path = fileURLToPath(new URL("../backend/.env", import.meta.url));
const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
const values = parse(existing);
const defaults = {
  MONGODB_URI: "mongodb://127.0.0.1:27017/music-max",
  JWT_SECRET: randomBytes(48).toString("hex"),
  PORT: "5001",
  HOST: "127.0.0.1",
  APP_ORIGINS:
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173",
  COOKIE_SECURE: "false",
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
};
const missing = Object.entries(defaults).filter(
  ([key]) => values[key] === undefined,
);
if (missing.length) {
  const additions = missing.map(([key, value]) => `${key}=${value}`).join("\n");
  writeFileSync(
    path,
    existing +
      (existing.endsWith("\n") || !existing ? "" : "\n") +
      additions +
      "\n",
    { mode: 0o600 },
  );
}
chmodSync(path, 0o600);
console.log(
  "Local backend configuration ready. Existing values were preserved.",
);
console.log("Run npm run dev:full to start the frontend and account server.");
console.log(
  "Add your Cloudinary credentials to backend/.env, then restart the server.",
);
