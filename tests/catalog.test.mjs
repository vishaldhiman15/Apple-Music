import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  normalizeSong,
  deriveCatalog,
  parseLyrics,
  recommendAlbums,
  selectNextIndex,
} from "../src/lib/catalog.js";
import { formatDuration } from "../src/utils/helpers.js";
const catalog = JSON.parse(
  readFileSync(new URL("../src/data/catalog.json", import.meta.url)),
);
test("populated and unpopulated catalog records normalize without missing-artist crashes", () => {
  const populated = normalizeSong({
    _id: "song",
    title: "A",
    artist: { _id: "artist", name: "Artist" },
    albumId: { _id: "album", title: "Album", coverUrl: "cover" },
    duration: 120,
  });
  assert.equal(populated.artist, "Artist");
  assert.equal(populated.artistId, "artist");
  assert.equal(populated.albumId, "album");
  assert.equal(populated.albumTitle, "Album");
  const missing = normalizeSong({
    _id: "empty",
    title: "Missing fields",
    artist: null,
    albumId: null,
  });
  assert.equal(missing.artist, "Unknown artist");
  assert.equal(missing.albumTitle, "Singles");
  assert.ok(missing.coverUrl);
  assert.equal(deriveCatalog([populated, populated]).albums.length, 1);
});
test("shuffle never repeats the same entry when other entries exist and respects end-of-queue", () => {
  const queue = [1, 2, 3];
  for (let i = 0; i < 3; i++)
    for (const rng of [0, 0.25, 0.99])
      assert.notEqual(
        selectNextIndex(
          { queue, index: i, shuffle: true, repeat: "off" },
          () => rng,
        ),
        i,
      );
  assert.equal(
    selectNextIndex({ queue: [], index: 0, shuffle: true, repeat: "all" }),
    -1,
  );
  assert.equal(
    selectNextIndex({ queue, index: 2, shuffle: false, repeat: "off" }),
    -1,
  );
  assert.equal(
    selectNextIndex({ queue, index: 2, shuffle: false, repeat: "all" }),
    0,
  );
});
test("LRC parser supports fractional times and multiple timestamps without inventing timing for plain lyrics", () => {
  const parsed = parseLyrics(
    "[00:01.25][01:10.500] First line\n[00:09] Next line\n[ar:Artist]\nUntimed",
  );
  assert.deepEqual(parsed, [
    { time: 1.25, text: "First line" },
    { time: 9, text: "Next line" },
    { time: 70.5, text: "First line" },
  ]);
  assert.deepEqual(parseLyrics("Plain lyrics"), []);
});
test("recommendations change with genuine favorites and listening activity", () => {
  const target = catalog.songs.find((s) => s.genre === "Classical");
  const albums = recommendAlbums(catalog.albums, catalog.songs, {
    favourites: [target.id],
    listens: { [target.id]: 4 },
    recentlyPlayed: [],
  });
  assert.equal(albums[0].id, target.albumId);
  assert.match(albums[0].reason, /Classical/i);
  assert.equal(new Set(albums.map((a) => a.id)).size, albums.length);
});
test("all original demo recordings and artwork exist with unique stable IDs", () => {
  assert.equal(catalog.songs.length, 24);
  assert.equal(catalog.albums.length, 12);
  assert.equal(new Set(catalog.songs.map((s) => s.id)).size, 24);
  for (const s of catalog.songs) {
    assert.ok(/^[a-f0-9]{24}$/.test(s.id));
    assert.ok(existsSync(new URL("../public" + s.audioUrl, import.meta.url)));
    assert.ok(existsSync(new URL("../public" + s.coverUrl, import.meta.url)));
    assert.ok(catalog.albums.some((a) => a.id === s.albumId));
    assert.ok(s.demo);
  }
});
test("time formatting handles unknown durations and longer recordings", () => {
  assert.equal(formatDuration(NaN), "0:00");
  assert.equal(formatDuration(-20), "0:00");
  assert.equal(formatDuration(125.8), "2:05");
  assert.equal(formatDuration(3661), "1:01:01");
});
