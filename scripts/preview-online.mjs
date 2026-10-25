import { createServer } from "node:http";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { Readable } from "node:stream";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../backend/config/env");
mkdirSync(".local", { recursive: true });
const sqlite = new DatabaseSync(".local/online-preview.sqlite");
sqlite.exec(
  "CREATE TABLE IF NOT EXISTS _preview_migrations(name TEXT PRIMARY KEY)",
);
for (const name of readdirSync("drizzle")
  .filter((x) => x.endsWith(".sql"))
  .sort()) {
  if (
    sqlite
      .prepare("SELECT name FROM _preview_migrations WHERE name=?")
      .get(name)
  )
    continue;
  sqlite.exec(readFileSync("drizzle/" + name, "utf8"));
  sqlite.prepare("INSERT INTO _preview_migrations VALUES(?)").run(name);
}
const prepare = (sql, params = []) => ({
  bind: (...values) => prepare(sql, values),
  first: async () => sqlite.prepare(sql).get(...params) || null,
  all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
  run: async () => ({
    meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) },
  }),
});
const DB = {
  prepare,
  batch: async (statements) => {
    sqlite.exec("BEGIN");
    try {
      const result = [];
      for (const statement of statements) result.push(await statement.run());
      sqlite.exec("COMMIT");
      return result;
    } catch (e) {
      sqlite.exec("ROLLBACK");
      throw e;
    }
  },
};
const code = readFileSync("dist/server/index.js", "utf8");
const worker = (
  await import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  )
).default;
createServer(async (req, res) => {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers))
      if (value !== undefined) headers.set(key, String(value));
    headers.set("oai-authenticated-user-id", "local-online-preview");
    headers.set("oai-authenticated-user-email", "preview@example.test");
    headers.set("oai-authenticated-user-full-name", "Local online preview");
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const request = new Request("http://127.0.0.1:4173" + req.url, {
      method: req.method,
      headers,
      ...(!["GET", "HEAD"].includes(req.method) ? { body } : {}),
    });
    const response = await worker.fetch(request, { ...process.env, DB }, {});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) {
      const stream = Readable.fromWeb(response.body);
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    } else res.end();
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Local online preview failed." }));
  }
}).listen(4173, "127.0.0.1", () =>
  console.log("Online app preview: http://127.0.0.1:4173"),
);
