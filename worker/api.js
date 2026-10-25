import {
  browseAudius,
  audiusRequest,
  normalizeAudius,
  TRACK_ID,
} from "./audius.js";
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const idPattern =
  /^(audius-[A-Za-z0-9]{3,20}|cloud-[a-f0-9-]{36}|[a-f0-9]{24})$/;
const cloudReady = (env) =>
  Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );
export async function digest(value, algorithm = "SHA-256") {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest(algorithm, new TextEncoder().encode(value)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function cloudSignature(params, secret) {
  const serialized = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => k + "=" + v)
    .join("&");
  return digest(serialized + secret, "SHA-1");
}
async function body(request) {
  if (Number(request.headers.get("content-length")) > 150000)
    fail("Request is too large.", 413);
  const raw = await request.text();
  if (raw.length > 150000) fail("Request is too large.", 413);
  try {
    return JSON.parse(raw);
  } catch {
    fail("Invalid JSON request.");
  }
}
function text(value, max, required = true) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    fail("Check the required fields and try again.");
  return value.trim();
}
const identity = (request) => {
  const id = request.headers.get("oai-authenticated-user-id");
  if (!id) fail("Sign in with ChatGPT to use your cloud library.", 401);
  return id;
};
async function ownerOf(request) {
  return "sites-" + (await digest(identity(request))).slice(0, 24);
}
function dbOf(env) {
  if (!env.DB)
    fail("Cloud library storage is starting. Please try again shortly.", 503);
  return env.DB;
}
async function profile(request, env) {
  const owner = await ownerOf(request),
    db = dbOf(env);
  let name =
    request.headers.get("oai-authenticated-user-full-name") ||
    request.headers.get("oai-authenticated-user-email")?.split("@")[0] ||
    "Music lover";
  if (
    request.headers.get("oai-authenticated-user-full-name-encoding") ===
    "percent-encoded-utf-8"
  ) {
    try {
      name = decodeURIComponent(name);
    } catch {}
  }
  await db
    .prepare(
      "INSERT OR IGNORE INTO music_profiles(owner,name,payload,version) VALUES(?,?,?,0)",
    )
    .bind(owner, name, JSON.stringify({ favourites: [], recentlyPlayed: [] }))
    .run();
  const row = await db
    .prepare("SELECT * FROM music_profiles WHERE owner=?")
    .bind(owner)
    .first();
  return {
    ...JSON.parse(row.payload),
    _id: owner,
    name: row.name,
    email: request.headers.get("oai-authenticated-user-email") || "",
    version: row.version,
    provider: "chatgpt",
  };
}
async function mutateProfile(request, env, transform) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const p = await profile(request, env),
      updated = transform(p);
    const result = await env.DB.prepare(
      "UPDATE music_profiles SET payload=?,name=?,version=version+1 WHERE owner=? AND version=?",
    )
      .bind(
        JSON.stringify({
          favourites: updated.favourites,
          recentlyPlayed: updated.recentlyPlayed,
        }),
        updated.name,
        p._id,
        p.version,
      )
      .run();
    if (result.meta.changes) return updated;
  }
  fail("Your library changed. Please try again.", 409);
}
const recentCache = new Map();
async function onlineCatalog(request, env, url) {
  const query = (url.searchParams.get("q") || "").slice(0, 120),
    genre = (url.searchParams.get("genre") || "").slice(0, 60),
    offset = Math.min(
      1000,
      Math.max(0, Number(url.searchParams.get("offset")) || 0),
    );
  const key = query + "|" + genre + "|" + offset;
  let hit = recentCache.get(key);
  if (!hit || hit.until < Date.now()) {
    const tracks = await browseAudius({ query, genre, offset, limit: 24 });
    hit = { tracks, until: Date.now() + 60000 };
    if (recentCache.size > 100) recentCache.clear();
    recentCache.set(key, hit);
  }
  if (env.DB && request.headers.get("oai-authenticated-user-id"))
    await env.DB.batch(
      hit.tracks.map((track) =>
        env.DB.prepare(
          "INSERT INTO music_catalog_cache(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at",
        ).bind(track.id, JSON.stringify(track), Date.now()),
      ),
    );
  return json({
    tracks: hit.tracks,
    provider: "Audius",
    hasMore: hit.tracks.length === 24,
  });
}
async function cloudResource(env, publicId, type) {
  const url = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/${type}/upload/${encodeURIComponent(publicId)}?media_metadata=true`;
  const response = await fetch(url, {
    headers: {
      Authorization:
        "Basic " +
        btoa(env.CLOUDINARY_API_KEY + ":" + env.CLOUDINARY_API_SECRET),
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok)
    fail("The uploaded media could not be verified. Try uploading again.", 502);
  return response.json();
}
async function getCloudSongs(owner, env) {
  const result = await env.DB.prepare(
    "SELECT payload FROM music_cloud_tracks WHERE owner=? ORDER BY created_at DESC LIMIT 500",
  )
    .bind(owner)
    .all();
  return result.results.map((r) => JSON.parse(r.payload));
}
export async function handleApi(request, env, { demo }) {
  const url = new URL(request.url),
    path = url.pathname,
    method = request.method;
  try {
    if (!["GET", "HEAD"].includes(method)) {
      if (request.headers.get("X-Music-Request") !== "1")
        fail("Request protection header required.", 403);
      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin) fail("Origin not allowed.", 403);
      identity(request);
    }
    if (path === "/api/health") {
      let database = env.DB ? "connected" : "unavailable";
      let uploads = cloudReady(env);
      if (url.searchParams.get("check") === "1") {
        if (env.DB) {
          try {
            await env.DB.prepare("SELECT COUNT(*) AS count FROM music_profiles").first();
          } catch { database = "unavailable"; }
        }
        if (uploads) {
          try {
            const ping = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/ping`, {
              headers: { Authorization: "Basic " + btoa(env.CLOUDINARY_API_KEY + ":" + env.CLOUDINARY_API_SECRET) },
              signal: AbortSignal.timeout(10000),
            });
            uploads = ping.ok;
            await ping.body?.cancel();
          } catch { uploads = false; }
        }
      }
      return json({
        ok: true,
        database,
        uploads,
        catalog: "audius",
        authProvider: "chatgpt",
        hosting: "online",
      });
    }
    if (path === "/api/catalog/trending" || path === "/api/catalog/search")
      return await onlineCatalog(request, env, url);
    const stream = path.match(/^\/api\/catalog\/stream\/([A-Za-z0-9]+)$/);
    if (stream) {
      if (!TRACK_ID.test(stream[1])) fail("Invalid track.", 400);
      const track = normalizeAudius(
        await audiusRequest("/tracks/" + stream[1]),
      );
      if (!track) fail("This track is unavailable for streaming.", 404);
      const range = request.headers.get("Range");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      let upstream;
      try {
        upstream = await fetch(
          `https://api.audius.co/v1/tracks/${stream[1]}/stream?app_name=MusicMax`,
          {
            headers: range ? { Range: range } : {},
            redirect: "follow",
            signal: controller.signal,
          },
        );
      } finally {
        // Bound connection setup without aborting a full-length song's body.
        clearTimeout(timer);
      }
      if (!upstream.ok) {
        await upstream.body?.cancel();
        fail("This stream is temporarily unavailable. Try another track.", 502);
      }
      const headers = new Headers({
        "Content-Type": upstream.headers.get("Content-Type") || "audio/mpeg",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Accept-Ranges": "bytes",
      });
      for (const key of ["Content-Length", "Content-Range"])
        if (upstream.headers.has(key))
          headers.set(key, upstream.headers.get(key));
      return new Response(upstream.body, { status: upstream.status, headers });
    }
    if (path === "/api/auth/me" && method === "GET")
      return json(await profile(request, env));
    if (path === "/api/auth/me" && method === "PATCH") {
      const data = await body(request);
      return json(
        await mutateProfile(request, env, (p) => ({
          ...p,
          name: text(data.name, 60),
        })),
      );
    }
    if (path === "/api/auth/logout")
      return json({ ok: true, externalSignOut: true });
    if (path === "/api/auth/login" || path === "/api/auth/register")
      fail("This hosted app uses Sign in with ChatGPT.", 400);
    const owner = await ownerOf(request);
    dbOf(env);
    if (path === "/api/songs" && method === "GET") {
      const cached = await env.DB.prepare(
        "SELECT payload FROM music_catalog_cache ORDER BY updated_at DESC LIMIT 300",
      ).all();
      return json([
        ...demo.songs,
        ...cached.results.map((r) => JSON.parse(r.payload)),
        ...(await getCloudSongs(owner, env)),
      ]);
    }
    if (
      path === "/api/songs/signature" ||
      path === "/api/songs/cover-signature"
    ) {
      if (!cloudReady(env)) fail("Cloudinary uploads are not configured.", 503);
      const type = path.endsWith("cover-signature") ? "images" : "audio",
        params = {
          timestamp: Math.floor(Date.now() / 1000),
          folder: `musicmax/${type}/${owner}`,
        };
      return json({
        ...params,
        signature: await cloudSignature(params, env.CLOUDINARY_API_SECRET),
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
      });
    }
    if (path === "/api/songs/upload" && method === "POST") {
      if (!cloudReady(env)) fail("Cloudinary uploads are not configured.", 503);
      const d = await body(request);
      const title = text(d.title, 150),
        artist = text(d.artistName, 100),
        albumTitle = text(d.albumTitle, 150),
        genre = text(d.genre, 40),
        year = text(d.releaseYear, 4);
      if (!/^\d{4}$/.test(year)) fail("Use a four-digit release year.");
      if (
        typeof d.audioPublicId !== "string" ||
        !d.audioPublicId.startsWith(`musicmax/audio/${owner}/`)
      )
        fail("Upload ownership could not be verified.", 403);
      const audio = await cloudResource(env, d.audioPublicId, "video");
      if (
        (!audio.has_audio && !audio.audio_codec) ||
        !Number.isFinite(audio.duration) ||
        audio.duration <= 0 ||
        audio.duration > 86400
      )
        fail("Upload a supported audio recording.");
      let coverUrl = "/artwork/02.svg";
      if (d.coverPublicId) {
        if (
          typeof d.coverPublicId !== "string" ||
          !d.coverPublicId.startsWith(`musicmax/images/${owner}/`)
        )
          fail("Cover ownership could not be verified.", 403);
        coverUrl = (await cloudResource(env, d.coverPublicId, "image"))
          .secure_url;
      }
      const id = "cloud-" + crypto.randomUUID(),
        artistId = "cloud-artist-" + (await digest(artist)).slice(0, 20),
        albumId =
          "cloud-album-" +
          (await digest(artist + "|" + albumTitle)).slice(0, 20),
        song = {
          id,
          _id: id,
          title,
          artist,
          artistId,
          albumId,
          albumTitle,
          genre,
          releaseYear: year,
          audioUrl: audio.secure_url,
          coverUrl,
          duration: audio.duration,
          lyrics: typeof d.lyrics === "string" ? d.lyrics.slice(0, 50000) : "",
          instrumental: d.instrumental === true,
          provider: "cloudinary",
          sourceName: "Your Cloudinary library",
          createdAt: new Date().toISOString(),
        };
      await env.DB.prepare(
        "INSERT INTO music_cloud_tracks(id,owner,payload,created_at) VALUES(?,?,?,?)",
      )
        .bind(id, owner, JSON.stringify(song), Date.now())
        .run();
      return json(song, 201);
    }
    if (path === "/api/users/favourites" && method === "PUT") {
      const { songId } = await body(request);
      if (!idPattern.test(songId || "")) fail("Invalid track.");
      const p = await mutateProfile(request, env, (p) => ({
        ...p,
        favourites: p.favourites.includes(songId)
          ? p.favourites.filter((x) => x !== songId)
          : [...p.favourites, songId].slice(-1000),
      }));
      return json(p.favourites);
    }
    if (path === "/api/users/recently-played" && method === "PUT") {
      const { albumId } = await body(request);
      const id = text(albumId, 100);
      const p = await mutateProfile(request, env, (p) => ({
        ...p,
        recentlyPlayed: [id, ...p.recentlyPlayed.filter((x) => x !== id)].slice(
          0,
          30,
        ),
      }));
      return json(p.recentlyPlayed);
    }
    if (path === "/api/playlists" && method === "GET") {
      const rows = await env.DB.prepare(
        "SELECT payload FROM music_playlists WHERE owner=? ORDER BY updated_at",
      )
        .bind(owner)
        .all();
      return json(rows.results.map((r) => JSON.parse(r.payload)));
    }
    if (path === "/api/playlists" && method === "POST") {
      const d = await body(request),
        id = crypto.randomUUID(),
        p = {
          id,
          _id: id,
          name: text(d.name, 80),
          description: text(d.description || "", 500, false),
          songs: [],
          createdAt: new Date().toISOString(),
        };
      await env.DB.prepare(
        "INSERT INTO music_playlists(id,owner,payload,updated_at) VALUES(?,?,?,?)",
      )
        .bind(id, owner, JSON.stringify(p), Date.now())
        .run();
      return json(p, 201);
    }
    const playlist = path.match(/^\/api\/playlists\/([a-f0-9-]{36})$/);
    if (playlist) {
      const row = await env.DB.prepare(
        "SELECT payload FROM music_playlists WHERE id=? AND owner=?",
      )
        .bind(playlist[1], owner)
        .first();
      if (!row) fail("Playlist not found.", 404);
      let p = JSON.parse(row.payload);
      if (method === "GET") return json(p);
      if (method === "DELETE") {
        await env.DB.prepare(
          "DELETE FROM music_playlists WHERE id=? AND owner=?",
        )
          .bind(p.id, owner)
          .run();
        return json({ ok: true });
      }
      if (method === "PATCH") {
        const d = await body(request);
        if (d.name !== undefined) p.name = text(d.name, 80);
        if (d.description !== undefined)
          p.description = text(d.description, 500, false);
        if (d.songs !== undefined) {
          if (
            !Array.isArray(d.songs) ||
            d.songs.length > 1000 ||
            d.songs.some((x) => typeof x !== "string" || !idPattern.test(x))
          )
            fail("Choose valid library tracks.");
          p.songs = [...new Set(d.songs)];
        }
        await env.DB.prepare(
          "UPDATE music_playlists SET payload=?,updated_at=? WHERE id=? AND owner=?",
        )
          .bind(JSON.stringify(p), Date.now(), p.id, owner)
          .run();
        return json(p);
      }
    }
    return json({ message: "Endpoint not found." }, 404);
  } catch (error) {
    return json(
      {
        message: error.status
          ? error.message
          : "The online service is temporarily unavailable. Please try again.",
      },
      error.status || 503,
    );
  }
}
