import { spawnSync } from "node:child_process";
import {
  readFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";
const mediaFile = "worker/media.json";
if (!existsSync(mediaFile))
  throw Error("Run npm run media:publish before the hosted build.");
const run = spawnSync(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build"],
  { stdio: "inherit", env: { ...process.env, VITE_BACKEND_MODE: "enabled" } },
);
if (run.status !== 0) process.exit(run.status || 1);
const offline = spawnSync(process.execPath, ["scripts/build-offline.mjs"], {
  stdio: "inherit",
});
if (offline.status !== 0) process.exit(offline.status || 1);
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
const assets = {};
for (const path of walk("dist")) {
  const extension = path.split(".").at(-1),
    types = {
      html: "text/html; charset=utf-8",
      js: "text/javascript; charset=utf-8",
      css: "text/css; charset=utf-8",
      svg: "image/svg+xml",
      webmanifest: "application/manifest+json",
    };
  if (types[extension])
    assets["/" + path.slice(5)] = {
      body: readFileSync(path, "utf8"),
      type: types[extension],
    };
}
const manifest = JSON.parse(readFileSync(".openai/hosting.json", "utf8"));
if (manifest.static)
  throw Error("Remove static from the Worker hosting manifest.");
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/server", { recursive: true });
mkdirSync("dist/.openai", { recursive: true });
writeFileSync("dist/.openai/hosting.json", JSON.stringify(manifest, null, 2));
await build({
  entryPoints: ["worker/index.js"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  define: {
    __STATIC_ASSETS__: JSON.stringify(assets),
    __CLOUD_MEDIA__: readFileSync(mediaFile, "utf8"),
  },
  logLevel: "info",
});
console.log(
  "Online Worker built with embedded app assets, Audius API, and Cloudinary routes.",
);
