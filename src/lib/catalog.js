export function normalizeSong(raw) {
  const artist =
    typeof raw.artist === "object" && raw.artist ? raw.artist : null;
  const album =
    typeof raw.albumId === "object" && raw.albumId ? raw.albumId : null;
  return {
    ...raw,
    id: String(raw.id || raw._id),
    artist: artist?.name || raw.artist || raw.artistName || "Unknown artist",
    artistId: String(artist?._id || raw.artistId || ""),
    albumId: String(album?._id || raw.albumId || ""),
    albumTitle: album?.title || raw.albumTitle || "Singles",
    coverUrl: raw.coverUrl || album?.coverUrl || "/artwork/01.svg",
    duration: Number(raw.duration) || 0,
  };
}
export function deriveCatalog(songs) {
  const albums = new Map(),
    artists = new Map();
  for (const song of songs) {
    if (!albums.has(song.albumId))
      albums.set(song.albumId, {
        id: song.albumId,
        title: song.albumTitle,
        artist: song.artist,
        artistId: song.artistId,
        coverUrl: song.coverUrl,
        genre: song.genre,
        year: song.releaseYear,
        color: song.color || "#37303c",
        local: song.local,
      });
    if (!artists.has(song.artistId))
      artists.set(song.artistId, {
        id: song.artistId,
        name: song.artist,
        image: song.coverUrl,
      });
  }
  return { albums: [...albums.values()], artists: [...artists.values()] };
}
export function recommendAlbums(albums, songs, data, limit = 12) {
  const affinity = {},
    artistAffinity = {};
  for (const s of songs) {
    const weight =
      (data.favourites.includes(s.id) ? 4 : 0) +
      Math.min(data.listens?.[s.id] || 0, 8) * 0.6;
    if (weight) {
      affinity[s.genre] = (affinity[s.genre] || 0) + weight;
      artistAffinity[s.artistId] =
        (artistAffinity[s.artistId] || 0) + weight * 0.5;
    }
  }
  return albums
    .map((a, i) => ({
      ...a,
      score:
        (affinity[a.genre] || 0) +
        (artistAffinity[a.artistId] || 0) +
        (data.recentlyPlayed.includes(a.id) ? 0.8 : 0) +
        (1 / (1 + i)) * 0.2,
      reason: affinity[a.genre]
        ? `Because you enjoy ${a.genre.toLowerCase()}`
        : "A fresh perspective for your library",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
export function parseLyrics(text = "") {
  const rows = [];
  for (const line of text.split("\n")) {
    const matches = [...line.matchAll(/\[(\d{1,3}):(\d{2}(?:\.\d+)?)\]/g)];
    const content = line.replace(/\[[^\]]*\]/g, "").trim();
    if (matches.length)
      for (const m of matches)
        rows.push({ time: Number(m[1]) * 60 + Number(m[2]), text: content });
  }
  return rows.sort((a, b) => a.time - b.time);
}
export function selectNextIndex(
  { queue, index, shuffle, repeat },
  random = Math.random,
) {
  if (!queue.length) return -1;
  if (shuffle && queue.length > 1) {
    const offset = 1 + Math.floor(random() * (queue.length - 1));
    return (index + offset) % queue.length;
  }
  if (index < queue.length - 1) return index + 1;
  return repeat === "all" ? 0 : -1;
}
export const safeDuration = (seconds) =>
  Number.isFinite(Number(seconds)) ? Math.max(0, Number(seconds)) : 0;
