import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { serveRange } from "../src/lib/range.js";
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}
const files = walk("dist").filter(
  (p) => /\.(html|css|js|svg|webmanifest)$/.test(p) && !p.endsWith("sw.js"),
);
const version = createHash("sha256");
for (const file of files) version.update(readFileSync(file));
const cache = "music-shell-" + version.digest("hex").slice(0, 12);
const assets = files.map((p) => "/" + p.replace(/^dist\//, ""));
const code = `const SHELL=${JSON.stringify(cache)};const ASSETS=${JSON.stringify(assets)};
${serveRange.toString()}
self.addEventListener('install',event=>{event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('music-shell-')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const req=event.request;const url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
if(url.pathname.startsWith('/audio/')){event.respondWith(caches.open('music-audio-v1').then(async cache=>{const hit=await cache.match(url.href);if(!hit)return fetch(req);const range=req.headers.get('range');return range?serveRange(hit,range):hit}));return;}
if(req.mode==='navigate'){event.respondWith(fetch(req).catch(()=>caches.open(SHELL).then(c=>c.match('/index.html'))));return;}
if(ASSETS.includes(url.pathname)){event.respondWith(caches.open(SHELL).then(async c=>await c.match(url.pathname)||fetch(req)));}});
`;
writeFileSync("dist/sw.js", code);
console.log(
  "Offline app shell ready: " +
    assets.length +
    " assets. Demo audio is saved only when requested.",
);
