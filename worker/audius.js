const API = "https://api.audius.co/v1";
export const TRACK_ID = /^[a-zA-Z0-9]{3,20}$/;
export function normalizeAudius(track) {
  if (
    !track ||
    !TRACK_ID.test(track.id || "") ||
    track.is_streamable !== true ||
    track.is_available === false ||
    track.is_stream_gated ||
    track.is_delete ||
    track.is_unlisted ||
    track.stream_conditions ||
    !(track.duration > 0)
  )
    return null;
  const safeUrl = (value) => {
    try {
      const u = new URL(value);
      return u.protocol === "https:" ? u.href : "";
    } catch {
      return "";
    }
  };
  const artist = track.user?.name || track.user?.handle || "Audius artist";
  return {
    id: "audius-" + track.id,
    providerId: track.id,
    provider: "audius",
    sourceName: "Audius",
    title: String(track.title || "Untitled").slice(0, 200),
    artist,
    artistId: "audius-artist-" + (track.user?.id || track.id),
    albumId: "audius-release-" + track.id,
    albumTitle: String(track.title || "Single").slice(0, 200),
    genre: track.genre || "Independent",
    duration: Number(track.duration),
    coverUrl:
      safeUrl(track.artwork?.["480x480"] || track.artwork?.["150x150"]) ||
      "/artwork/01.svg",
    audioUrl: "/api/catalog/stream/" + track.id,
    sourceUrl:
      "https://audius.co" +
      (String(track.permalink || "").startsWith("/") ? track.permalink : "/"),
    releaseYear: track.release_date?.slice(0, 4) || "",
    createdAt: track.release_date || track.created_at,
    description: String(track.description || "").slice(0, 4000),
    license: track.license || "",
    demo: false,
    local: false,
    instrumental: false,
  };
}
export async function audiusRequest(path, fetcher = fetch) {
  const url = new URL(API + path);
  url.searchParams.set("app_name", "MusicMax");
  const response = await fetcher(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw Object.assign(
      new Error(
        response.status === 429
          ? "The free music catalog is busy. Try again shortly."
          : "The music catalog is temporarily unavailable.",
      ),
      { status: response.status === 429 ? 429 : 502 },
    );
  const body = await response.json();
  return body.data;
}
export async function browseAudius(
  { query = "", genre = "", limit = 24, offset = 0 } = {},
  fetcher = fetch,
) {
  const params = new URLSearchParams({
    limit: String(Math.min(100, Math.max(limit * 2, 24))),
    offset: String(Math.max(0, offset)),
  });
  let path = "/tracks/trending";
  if (query.trim()) {
    path = "/tracks/search";
    params.set("query", query.trim().slice(0, 120));
  }
  if (genre) params.set("genre", genre.slice(0, 60));
  const rows = await audiusRequest(path + "?" + params, fetcher);
  return (Array.isArray(rows) ? rows : [])
    .map(normalizeAudius)
    .filter(Boolean)
    .slice(0, limit);
}
