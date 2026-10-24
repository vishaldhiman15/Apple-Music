import { spawn, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const children = [];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const p of children) p.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
const external = process.env.MONGODB_URI;
if (!external) {
  const check = spawnSync("mongod", ["--version"], { stdio: "ignore" });
  if (check.status !== 0) {
    console.error(
      "MongoDB is not installed. Set MONGODB_URI, or run npm run dev for the device library.",
    );
    process.exit(1);
  }
  mkdirSync(".local/mongo", { recursive: true });
  const mongo = spawn(
    "mongod",
    [
      "--dbpath",
      ".local/mongo",
      "--port",
      "27029",
      "--bind_ip",
      "127.0.0.1",
      "--quiet",
      "--logpath",
      ".local/mongo.log",
    ],
    { stdio: "inherit" },
  );
  children.push(mongo);
  mongo.on("exit", (code) => {
    if (code && !stopping) {
      console.error("MongoDB could not start. See .local/mongo.log.");
      stop();
    }
  });
}
process.env.MONGODB_URI = external || "mongodb://127.0.0.1:27029/music-max";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || randomBytes(48).toString("hex");
process.env.PORT = process.env.PORT || "5001";
try {
  const { connect } = require("../backend/server.js");
  await connect();
  const { seed } = require("../backend/seed.js");
  await seed();
  await require("mongoose").disconnect();
  if (stopping) process.exit(1);
  const api = spawn(process.execPath, ["backend/server.js"], {
    stdio: "inherit",
    env: process.env,
  });
  const web = spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
    stdio: "inherit",
    env: process.env,
  });
  children.push(api, web);
  api.on("exit", stop);
  web.on("exit", stop);
} catch (e) {
  console.error(e.message);
  stop();
  process.exitCode = 1;
}
