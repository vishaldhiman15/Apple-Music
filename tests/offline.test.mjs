import { test } from "node:test";
import assert from "node:assert/strict";
import { serveRange } from "../src/lib/range.js";
const response = () =>
  new Response(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), {
    headers: { "Content-Type": "audio/mpeg" },
  });
test("cached audio serves correct byte ranges for seeking and suffix requests", async () => {
  const middle = await serveRange(response(), "bytes=3-5");
  assert.equal(middle.status, 206);
  assert.equal(middle.headers.get("Content-Range"), "bytes 3-5/10");
  assert.deepEqual([...new Uint8Array(await middle.arrayBuffer())], [3, 4, 5]);
  const tail = await serveRange(response(), "bytes=-3");
  assert.deepEqual([...new Uint8Array(await tail.arrayBuffer())], [7, 8, 9]);
  const open = await serveRange(response(), "bytes=8-");
  assert.deepEqual([...new Uint8Array(await open.arrayBuffer())], [8, 9]);
});
test("invalid and unsatisfiable cached audio ranges return 416", async () => {
  for (const range of [
    "bytes=20-30",
    "bytes=8-3",
    "invalid",
    "bytes=-",
    "bytes=0-1,5-7",
  ])
    assert.equal((await serveRange(response(), range)).status, 416);
});
