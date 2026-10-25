import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { handleApi } from "../worker/api.js";
import { normalizeAudius, browseAudius } from "../worker/audius.js";
import demo from "../src/data/catalog.json" with { type: "json" };
let sqlite;
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
    const result = [];
    for (const s of statements) result.push(await s.run());
    return result;
  },
};
const env = {
  DB,
  CLOUDINARY_CLOUD_NAME: "fixture",
  CLOUDINARY_API_KEY: "fixture-key",
  CLOUDINARY_API_SECRET: "fixture-secret",
};
let playlist;
const track = {
  id: "abc123",
  title: "A real catalog track",
  duration: 180,
  is_streamable: true,
  is_available: true,
  genre: "Electronic",
  user: { id: "artist1", name: "Independent Artist" },
  permalink: "/independent/track",
  artwork: { "480x480": "https://example.test/cover.jpg" },
};
async function request(
  path,
  { user = "alice", method = "GET", body, headers = {} } = {},
) {
  const r = await handleApi(
    new Request("https://app.example" + path, {
      method,
      headers: {
        ...(user
          ? {
              "oai-authenticated-user-id": user,
              "oai-authenticated-user-email": user + "@example.test",
            }
          : {}),
        "X-Music-Request": "1",
        ...headers,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
    { demo },
  );
  return { status: r.status, body: await r.json() };
}
before(() => {
  sqlite = new DatabaseSync(":memory:");
  for (const name of readdirSync("drizzle")
    .filter((n) => n.endsWith(".sql"))
    .sort())
    sqlite.exec(readFileSync("drizzle/" + name, "utf8"));
});
after(() => sqlite.close());
test("free catalog normalizes streamable tracks and excludes gated or unavailable recordings", async () => {
  const song = normalizeAudius(track);
  assert.equal(song.id, "audius-abc123");
  assert.equal(song.audioUrl, "/api/catalog/stream/abc123");
  assert.equal(song.sourceUrl, "https://audius.co/independent/track");
  assert.equal(normalizeAudius({ ...track, is_streamable: false }), null);
  assert.equal(normalizeAudius({ ...track, is_stream_gated: true }), null);
  assert.equal(normalizeAudius({ ...track, is_available: false }), null);
  assert.equal(normalizeAudius({ ...track, is_unlisted: true }), null);
  let seen;
  const result = await browseAudius(
    { query: "indie & calm", limit: 2 },
    async (url) => {
      seen = url;
      return Response.json({
        data: [track, { ...track, is_streamable: false }],
      });
    },
  );
  assert.equal(result.length, 1);
  assert.equal(seen.searchParams.get("query"), "indie & calm");
  assert.equal(seen.searchParams.get("app_name"), "MusicMax");
  assert.equal(seen.origin, "https://api.audius.co");
});
test("hosted identities and request protection reject missing users, headers, and foreign origins", async () => {
  assert.equal((await request("/api/auth/me", { user: null })).status, 401);
  assert.equal(
    (
      await request("/api/playlists", {
        method: "POST",
        body: { name: "bad" },
        headers: { "X-Music-Request": "" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/api/playlists", {
        method: "POST",
        body: { name: "bad" },
        headers: { Origin: "https://foreign.example" },
      })
    ).status,
    403,
  );
  const me = await request("/api/auth/me");
  assert.equal(me.body.provider, "chatgpt");
  assert.ok(me.body._id.startsWith("sites-"));
  assert.equal((await request("/api/health")).body.uploads, true);
});
test("hosted playlists persist, reorder, and remain isolated to their ChatGPT owner", async () => {
  const created = await request("/api/playlists", {
    method: "POST",
    body: { name: "Online collection" },
  });
  assert.equal(created.status, 201);
  playlist = created.body;
  const updated = await request("/api/playlists/" + playlist.id, {
    method: "PATCH",
    body: { songs: ["audius-abc123", demo.songs[0].id, "audius-abc123"] },
  });
  assert.deepEqual(updated.body.songs, ["audius-abc123", demo.songs[0].id]);
  assert.equal(
    (await request("/api/playlists/" + playlist.id, { user: "bob" })).status,
    404,
  );
  assert.equal(
    (
      await request("/api/playlists/" + playlist.id, {
        user: "bob",
        method: "DELETE",
      })
    ).status,
    404,
  );
  assert.equal((await request("/api/playlists")).body.length, 1);
  assert.equal(
    (await request("/api/playlists", { user: "bob" })).body.length,
    0,
  );
});
test("hosted favorites accept online catalog IDs and keep concurrent updates with optimistic locking", async () => {
  const result = await request("/api/users/favourites", {
    method: "PUT",
    body: { songId: "audius-abc123" },
  });
  assert.deepEqual(result.body, ["audius-abc123"]);
  assert.deepEqual(
    (await request("/api/auth/me", { user: "bob" })).body.favourites,
    [],
  );
  await Promise.all(
    ["audius-def456", "audius-ghi789"].map((songId) =>
      request("/api/users/favourites", { method: "PUT", body: { songId } }),
    ),
  );
  const me = (await request("/api/auth/me")).body;
  assert.equal(me.favourites.length, 3);
  assert.equal(
    (
      await request("/api/users/favourites", {
        method: "PUT",
        body: { songId: "invalid" },
      })
    ).status,
    400,
  );
});
test("hosted Cloudinary signatures remain server-side and bind uploads to the signed-in owner", async () => {
  const signed = (await request("/api/songs/signature")).body;
  const expected = createHash("sha1")
    .update(
      `folder=${signed.folder}&timestamp=${signed.timestamp}fixture-secret`,
    )
    .digest("hex");
  assert.equal(signed.signature, expected);
  assert.ok(signed.folder.startsWith("musicmax/audio/sites-"));
  assert.equal(JSON.stringify(signed).includes("fixture-secret"), false);
  assert.notEqual(
    (await request("/api/songs/signature", { user: "bob" })).body.folder,
    signed.folder,
  );
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.match(options.headers.Authorization, /^Basic /);
    return Response.json({
      has_audio: true,
      audio_codec: "mp3",
      duration: 42,
      secure_url: "https://res.cloudinary.com/fixture/video/upload/checked.mp3",
    });
  };
  try {
    const fields = {
      title: "Owned recording",
      artistName: "Owner",
      albumTitle: "Cloud album",
      genre: "Electronic",
      releaseYear: "2026",
      audioPublicId: signed.folder + "/recording",
    };
    assert.equal(
      (
        await request("/api/songs/upload", {
          user: "bob",
          method: "POST",
          body: fields,
        })
      ).status,
      403,
    );
    assert.equal(calls, 0);
    const saved = await request("/api/songs/upload", {
      method: "POST",
      body: {
        ...fields,
        duration: 999,
        audioUrl: "https://untrusted.example/forged",
      },
    });
    assert.equal(saved.status, 201);
    assert.equal(saved.body.duration, 42);
    assert.equal(
      saved.body.audioUrl,
      "https://res.cloudinary.com/fixture/video/upload/checked.mp3",
    );
    assert.ok(
      (await request("/api/songs")).body.some((s) => s.id === saved.body.id),
    );
    assert.ok(
      !(await request("/api/songs", { user: "bob" })).body.some(
        (s) => s.id === saved.body.id,
      ),
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("online stream relay forwards byte ranges without caching or copying tracks", async () => {
  const original = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (url, options) => {
    seen.push(String(url));
    if (String(url).includes("/stream?")) {
      assert.equal(options.headers.Range, "bytes=0-3");
      return new Response(new Uint8Array([1, 2, 3, 4]), {
        status: 206,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Range": "bytes 0-3/99",
          "Content-Length": "4",
        },
      });
    }
    return Response.json({ data: track });
  };
  try {
    const r = await handleApi(
      new Request("https://app.example/api/catalog/stream/abc123", {
        headers: { Range: "bytes=0-3" },
      }),
      env,
      { demo },
    );
    assert.equal(r.status, 206);
    assert.equal(r.headers.get("Cache-Control"), "no-store");
    assert.equal(r.headers.get("Content-Range"), "bytes 0-3/99");
    assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [1, 2, 3, 4]);
    assert.equal(seen.length, 2);
  } finally {
    globalThis.fetch = original;
  }
});
