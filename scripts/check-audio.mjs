import { createServer } from "node:http";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
createServer((req, res) => {
  const paths = {
    "/": "tests/browser/audio.html",
    "/audioEngine.js": "src/lib/audioEngine.js",
  };
  if (!paths[req.url]) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    "Content-Type",
    req.url.endsWith(".js") ? "text/javascript" : "text/html",
  );
  res.end(readFileSync(new URL(paths[req.url], root)));
}).listen(4190, "127.0.0.1", () =>
  console.log("Open http://127.0.0.1:4190 and run the native audio checks."),
);
