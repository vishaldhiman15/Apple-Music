import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Integration tests never use developer Cloudinary credentials.
for (const key of [
  "CLOUDINARY_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
])
  process.env[key] = "";
const dir = mkdtempSync(join(tmpdir(), "music-max-api-")),
  name = "music_max_test_" + randomBytes(5).toString("hex");
const mongoExists =
  spawnSync("mongod", ["--version"], { stdio: "ignore" }).status === 0;
const available = Boolean(process.env.MONGODB_TEST_URI) || mongoExists;
let mongo, server, mongoose, base, alice, bob, playlist, songs;
async function request(
  path,
  { user, method = "GET", body, headers = {} } = {},
) {
  const r = await fetch(base + path, {
    method,
    headers: {
      "X-Music-Request": "1",
      ...(user ? { Cookie: user.cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: r.status,
    body: await r.json(),
    cookie: r.headers.get("set-cookie"),
  };
}
async function register(label) {
  const r = await request("/auth/register", {
    method: "POST",
    body: {
      name: label,
      email: label + "@example.test",
      password: "StrongTestPassword2026!",
    },
  });
  assert.equal(r.status, 201);
  return { ...r.body, cookie: r.cookie.split(";")[0] };
}
before(async () => {
  if (!available) return;
  let uri = process.env.MONGODB_TEST_URI;
  if (!uri) {
    mongo = spawn(
      "mongod",
      [
        "--dbpath",
        dir,
        "--port",
        "27039",
        "--bind_ip",
        "127.0.0.1",
        "--quiet",
        "--logpath",
        join(dir, "mongo.log"),
      ],
      { stdio: "ignore" },
    );
    uri = "mongodb://127.0.0.1:27039/" + name;
  } else {
    const url = new URL(uri);
    url.pathname = "/" + name;
    uri = url.href;
  }
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = randomBytes(48).toString("hex");
  mongoose = require("mongoose");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await require("../backend/seed.js").seed();
  const { app } = require("../backend/server.js");
  server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  base = "http://127.0.0.1:" + server.address().port + "/api";
  alice = await register("alice");
  bob = await register("bob");
  songs = (await request("/songs")).body;
});
after(async () => {
  if (server) await new Promise((r) => server.close(r));
  if (mongoose) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongo) {
    mongo.kill();
    await new Promise((r) => mongo.once("exit", r));
  }
  rmSync(dir, { recursive: true, force: true });
});
const check = (name, fn) =>
  test(
    name,
    {
      skip: !available
        ? "MongoDB is not installed; set MONGODB_TEST_URI to run integration tests."
        : false,
    },
    fn,
  );
check(
  "sessions use HttpOnly cookies and never return password hashes or bearer tokens",
  async () => {
    const r = await request("/auth/login", {
      method: "POST",
      body: {
        email: "alice@example.test",
        password: "StrongTestPassword2026!",
      },
    });
    assert.equal(r.status, 200);
    assert.match(r.cookie, /HttpOnly/);
    assert.match(r.cookie, /SameSite=Lax/);
    assert.equal(r.body.token, undefined);
    assert.equal(r.body.password, undefined);
    const me = await request("/auth/me", { user: alice });
    assert.equal(me.status, 200);
    assert.equal(me.body.password, undefined);
    assert.equal((await request("/auth/me")).status, 401);
  },
);
check(
  "invalid credentials cannot authenticate through a mock fallback",
  async () => {
    assert.equal(
      (
        await request("/auth/login", {
          method: "POST",
          body: { email: "alice@example.test", password: "wrong" },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/auth/login", {
          method: "POST",
          body: { email: "guest@example.com", password: "password123" },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/auth/register", {
          method: "POST",
          body: { name: "Short", email: "short@example.test", password: "123" },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request("/auth/register", {
          method: "POST",
          body: {
            name: "Duplicate",
            email: "ALICE@example.test",
            password: "StrongTestPassword2026!",
          },
        })
      ).status,
      409,
    );
  },
);
check(
  "mutation routes reject missing request protection headers and untrusted origins",
  async () => {
    assert.equal(
      (
        await request("/playlists", {
          user: alice,
          method: "POST",
          body: { name: "Blocked" },
          headers: { "X-Music-Request": "" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request("/playlists", {
          user: alice,
          method: "POST",
          body: { name: "Blocked" },
          headers: { Origin: "https://untrusted.example" },
        })
      ).status,
      403,
    );
  },
);
check(
  "playlist create, rename, reorder, deduplicate, and delete persist to MongoDB",
  async () => {
    const p = await request("/playlists", {
      user: alice,
      method: "POST",
      body: { name: "My mix", description: "A test collection" },
    });
    assert.equal(p.status, 201);
    playlist = p.body;
    const ids = songs.slice(0, 3).map((s) => s._id);
    const update = await request("/playlists/" + playlist._id, {
      user: alice,
      method: "PATCH",
      body: { name: "Renamed mix", songs: [ids[2], ids[0], ids[0], ids[1]] },
    });
    assert.equal(update.status, 200);
    assert.equal(update.body.name, "Renamed mix");
    assert.deepEqual(update.body.songs, [ids[2], ids[0], ids[1]]);
    const stored = await request("/playlists/" + playlist._id, { user: alice });
    assert.deepEqual(stored.body.songs, [ids[2], ids[0], ids[1]]);
  },
);
check(
  "one account cannot inspect, change, or delete another account’s playlist",
  async () => {
    for (const method of ["GET", "PATCH", "DELETE"])
      assert.equal(
        (
          await request("/playlists/" + playlist._id, {
            user: bob,
            method,
            body: method === "PATCH" ? { name: "Hijacked" } : undefined,
          })
        ).status,
        404,
      );
    assert.equal((await request("/playlists", { user: bob })).body.length, 0);
    assert.equal(
      (
        await request("/playlists/" + playlist._id + "/add-song", {
          user: bob,
          method: "PUT",
          body: { songId: songs[0]._id },
        })
      ).status,
      404,
    );
  },
);
check(
  "playlist validation refuses malformed and nonexistent track IDs",
  async () => {
    assert.equal(
      (
        await request("/playlists/invalid", {
          user: alice,
          method: "PATCH",
          body: { name: "Invalid" },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request("/playlists/" + playlist._id, {
          user: alice,
          method: "PATCH",
          body: { songs: ["not-an-id"] },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request("/playlists/" + playlist._id, {
          user: alice,
          method: "PATCH",
          body: { songs: ["ffffffffffffffffffffffff"] },
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request("/playlists", {
          user: alice,
          method: "POST",
          body: { name: "   " },
        })
      ).status,
      400,
    );
  },
);
check(
  "favorites toggle atomically and stay private to the account",
  async () => {
    const songId = songs[0]._id;
    assert.deepEqual(
      (
        await request("/users/favourites", {
          user: alice,
          method: "PUT",
          body: { songId },
        })
      ).body,
      [songId],
    );
    assert.deepEqual(
      (await request("/auth/me", { user: bob })).body.favourites,
      [],
    );
    assert.deepEqual(
      (
        await request("/users/favourites", {
          user: alice,
          method: "PUT",
          body: { songId },
        })
      ).body,
      [],
    );
    const toggles = await Promise.all(
      [1, 2].map(() =>
        request("/users/favourites", {
          user: alice,
          method: "PUT",
          body: { songId },
        }),
      ),
    );
    assert.ok(toggles.every((r) => r.status === 200));
    assert.deepEqual(
      (await request("/auth/me", { user: alice })).body.favourites,
      [],
    );
  },
);
check(
  "recent albums are deduplicated and invalid references are rejected",
  async () => {
    const albumId = songs[0].albumId._id;
    for (let i = 0; i < 3; i++)
      assert.equal(
        (
          await request("/users/recently-played", {
            user: alice,
            method: "PUT",
            body: { albumId },
          })
        ).status,
        200,
      );
    assert.deepEqual(
      (await request("/auth/me", { user: alice })).body.recentlyPlayed,
      [albumId],
    );
    assert.equal(
      (
        await request("/users/recently-played", {
          user: alice,
          method: "PUT",
          body: { albumId: "ffffffffffffffffffffffff" },
        })
      ).status,
      404,
    );
  },
);
check(
  "unconfigured uploads fail clearly and public audio cannot be deleted by a listener",
  async () => {
    assert.equal(
      (await request("/songs/signature", { user: alice })).status,
      503,
    );
    assert.equal(
      (
        await request("/songs/" + songs[0]._id, {
          user: alice,
          method: "DELETE",
        })
      ).status,
      404,
    );
  },
);
check(
  "signed Cloudinary requests use server credentials and verify uploaded ownership",
  async () => {
    const { cloudinary } = require("../backend/config/cloudinary");
    const previous = { ...cloudinary.config() };
    const originalResource = cloudinary.api.resource;
    const User = require("../backend/models/User");
    const aliceId = String(
      (await User.findOne({ email: "alice@example.test" }))._id,
    );
    const audioId = `applemusic/audio/${aliceId}/test-recording`;
    const coverId = `applemusic/images/${aliceId}/test-cover`;
    cloudinary.config({
      cloud_name: "fixture-cloud",
      api_key: "fixture-key",
      api_secret: "fixture-secret",
    });
    try {
      const health = await request("/health");
      assert.equal(health.body.uploads, true);
      const signed = await request("/songs/signature", { user: alice });
      assert.equal(signed.status, 200);
      assert.equal(signed.body.folder, `applemusic/audio/${aliceId}`);
      assert.equal(signed.body.apiKey, "fixture-key");
      assert.equal(
        signed.body.signature,
        cloudinary.utils.api_sign_request(
          { timestamp: signed.body.timestamp, folder: signed.body.folder },
          "fixture-secret",
        ),
      );
      assert.equal(
        JSON.stringify(signed.body).includes("fixture-secret"),
        false,
      );
      const image = await request("/songs/cover-signature", { user: alice });
      assert.equal(image.body.folder, `applemusic/images/${aliceId}`);
      const seen = [];
      cloudinary.api.resource = async (id, options) => {
        seen.push([id, options.resource_type]);
        return options.resource_type === "video"
          ? {
              audio: { codec: "mp3" },
              duration: 48,
              secure_url:
                "https://res.cloudinary.com/fixture-cloud/video/upload/test-recording.mp3",
            }
          : {
              secure_url:
                "https://res.cloudinary.com/fixture-cloud/image/upload/test-cover.jpg",
            };
      };
      const body = {
        title: "Cloud test recording",
        artistName: "Test performer",
        albumTitle: "Cloud test album",
        genre: "Electronic",
        releaseYear: "2026",
        audioPublicId: audioId,
        coverPublicId: coverId,
      };
      assert.equal(
        (await request("/songs/upload", { user: bob, method: "POST", body }))
          .status,
        403,
      );
      assert.equal(seen.length, 0);
      const created = await request("/songs/upload", {
        user: alice,
        method: "POST",
        body: {
          ...body,
          audioUrl: "https://untrusted.example/forged.mp3",
          duration: 999,
        },
      });
      assert.equal(created.status, 201);
      assert.equal(created.body.duration, 48);
      assert.match(created.body.audioUrl, /^https:\/\/res\.cloudinary\.com\//);
      assert.equal(
        created.body.coverUrl,
        "https://res.cloudinary.com/fixture-cloud/image/upload/test-cover.jpg",
      );
      assert.deepEqual(seen, [
        [audioId, "video"],
        [coverId, "image"],
      ]);
      assert.equal(
        (
          await request("/songs/" + created.body._id, {
            user: bob,
            method: "DELETE",
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await request("/songs/" + created.body._id, {
            user: alice,
            method: "DELETE",
          })
        ).status,
        200,
      );
    } finally {
      cloudinary.api.resource = originalResource;
      cloudinary.config(previous);
    }
  },
);
check(
  "seeding is idempotent and preserves existing accounts and playlists",
  async () => {
    await require("../backend/seed.js").seed();
    assert.equal(await require("../backend/models/Song").countDocuments(), 24);
    assert.equal(await require("../backend/models/User").countDocuments(), 2);
    assert.ok(
      (await request("/playlists/" + playlist._id, { user: alice })).body._id,
    );
  },
);
check(
  "profile edits are restricted and playlist deletion removes only the playlist",
  async () => {
    const user = await request("/auth/me", {
      user: alice,
      method: "PATCH",
      body: {
        name: "Alice Updated",
        email: "hijack@example.test",
        favourites: [songs[0]._id],
      },
    });
    assert.equal(user.body.name, "Alice Updated");
    assert.equal(user.body.email, "alice@example.test");
    assert.deepEqual(user.body.favourites, []);
    assert.equal(
      (
        await request("/playlists/" + playlist._id, {
          user: alice,
          method: "DELETE",
        })
      ).status,
      200,
    );
    assert.equal(
      (await request("/playlists/" + playlist._id, { user: alice })).status,
      404,
    );
    assert.equal((await request("/songs")).body.length, 24);
  },
);
check(
  "logout clears the browser session cookie with the correct path",
  async () => {
    const r = await request("/auth/logout", { user: alice, method: "POST" });
    assert.equal(r.status, 200);
    assert.match(r.cookie, /Path=\/api/);
    assert.match(r.cookie, /Expires=Thu, 01 Jan 1970/);
  },
);
