import { createRequire } from "node:module";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const { cloudinary, configured } = require("../backend/config/cloudinary");
if (!configured())
  throw Error("Cloudinary credentials are required in backend/.env.");
const file = new URL("../worker/media.json", import.meta.url),
  manifest = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
const root = new URL("../public/audio/", import.meta.url),
  queue = readdirSync(root).filter((n) => n.endsWith(".mp3"));
let cursor = 0,
  uploaded = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (cursor < queue.length) {
      const name = queue[cursor++],
        path = new URL(name, root),
        hash = createHash("sha256").update(readFileSync(path)).digest("hex");
      if (manifest["/audio/" + name]?.hash === hash) continue;
      const result = await cloudinary.uploader.upload(path.pathname, {
        resource_type: "video",
        public_id: `musicmax/demo/${name.replace(".mp3", "")}-${hash.slice(0, 12)}`,
        overwrite: false,
        tags: ["musicmax-original-demo"],
      });
      manifest["/audio/" + name] = { url: result.secure_url, hash };
      writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
      uploaded++;
    }
  }),
);
console.log(
  `Cloudinary demo media ready: ${Object.keys(manifest).length} tracks (${uploaded} uploaded).`,
);
