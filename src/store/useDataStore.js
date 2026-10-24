import { create } from "zustand";
import demo from "../data/catalog.json";
import { api, backendEnabled } from "../lib/api";
import { normalizeSong, deriveCatalog } from "../lib/catalog";
import {
  readStorage,
  writeStorage,
  getTracks,
  storeTrack,
  deleteTrack,
} from "../lib/storage";
import { useUIStore } from "./useUIStore";
const localUrls = new Map();
const defaults = () => ({
  favourites: [demo.songs[0].id, demo.songs[6].id],
  recentlyPlayed: [],
  listens: {},
  history: [],
  playlists: [
    {
      id: "local-night",
      name: "Late night, no plans",
      description: "A little company for the hours after dark.",
      songs: demo.songs
        .filter((s) => ["Electronic", "R&B"].includes(s.genre))
        .slice(0, 7)
        .map((s) => s.id),
      createdAt: new Date().toISOString(),
    },
    {
      id: "local-focus",
      name: "A little headspace",
      description: "Less noise. More room to think.",
      songs: demo.songs
        .filter((s) => ["Ambient", "Lo-fi", "Classical"].includes(s.genre))
        .map((s) => s.id),
      createdAt: new Date().toISOString(),
    },
  ],
});
const empty = () => ({
  favourites: [],
  recentlyPlayed: [],
  listens: {},
  history: [],
  playlists: [],
});
const persist = (scope, data) => {
  if (!writeStorage("music-library:" + scope, data))
    useUIStore
      .getState()
      .notify("Your changes could not be saved. Browser storage may be full.");
};
const notify = (message) => useUIStore.getState().notify(message);
function validateName(name) {
  const value = String(name).trim();
  if (!value || value.length > 80)
    throw new Error("Give your playlist a name between 1 and 80 characters.");
  return value;
}
export const useDataStore = create((set, get) => ({
  songs: demo.songs,
  albums: demo.albums,
  artists: demo.artists,
  scope: "guest",
  user: null,
  userData: readStorage("music-library:guest", defaults()),
  status: "ready",
  catalogSource: "demo",
  localCount: 0,
  fetchCatalog: async () => {
    if (!backendEnabled) return;
    try {
      const raw = await api("/songs", { timeout: 2200 });
      if (!Array.isArray(raw) || !raw.length) return;
      const songs = raw.map(normalizeSong);
      set({ songs, ...deriveCatalog(songs), catalogSource: "server" });
      await get().hydrateLocal();
    } catch {}
  },
  switchUser: async (user) => {
    const scope = user ? String(user._id || user.id) : "guest";
    const userData = readStorage(
      "music-library:" + scope,
      user ? empty() : defaults(),
    );
    set({ scope, user, userData });
    if (user) {
      try {
        const playlists = await api("/playlists");
        if (get().scope !== scope) return;
        const data = {
          ...userData,
          favourites: [
            ...new Set([
              ...(user.favourites || []),
              ...userData.favourites.filter((id) => id.startsWith("import-")),
            ]),
          ],
          recentlyPlayed: [
            ...new Set([
              ...(user.recentlyPlayed || []),
              ...userData.recentlyPlayed.filter((id) =>
                id.startsWith("import-"),
              ),
            ]),
          ],
          playlists: [
            ...playlists.map((p) => ({
              ...p,
              id: p._id,
              songs: p.songs.map((s) => String(s._id || s)),
            })),
            ...userData.playlists.filter((p) => p.id.startsWith("local-")),
          ],
        };
        set({ userData: data });
        persist(scope, data);
      } catch (e) {
        notify("Cloud sync is unavailable. Your saved library is still here.");
      }
    }
    await get().hydrateLocal();
  },
  hydrateLocal: async () => {
    const scope = get().scope;
    try {
      const records = await getTracks(scope);
      if (get().scope !== scope) return;
      const keys = new Set(records.map((r) => scope + ":" + r.id));
      for (const [key, value] of localUrls) {
        if (!keys.has(key)) {
          URL.revokeObjectURL(value.audioUrl);
          if (value.coverUrl.startsWith("blob:"))
            URL.revokeObjectURL(value.coverUrl);
          localUrls.delete(key);
        }
      }
      const locals = records.map((r) => {
        const key = scope + ":" + r.id;
        if (!localUrls.has(key))
          localUrls.set(key, {
            audioUrl: URL.createObjectURL(r.audio),
            coverUrl: r.cover
              ? URL.createObjectURL(r.cover)
              : "/artwork/02.svg",
          });
        return { ...r.metadata, ...localUrls.get(key), local: true };
      });
      const base = get().songs.filter((s) => !s.local);
      const songs = [...base, ...locals];
      const derived = deriveCatalog(songs);
      set({
        songs,
        albums: derived.albums.map((a) => ({
          ...demo.albums.find((d) => d.id === a.id),
          ...a,
        })),
        artists: derived.artists,
        localCount: locals.length,
      });
    } catch (e) {
      notify(e.message);
    }
  },
  toggleFavourite: async (id) => {
    const { user, scope, userData } = get();
    if (!get().songs.some((s) => s.id === id)) return;
    let favourites = userData.favourites.includes(id)
      ? userData.favourites.filter((x) => x !== id)
      : [...userData.favourites, id];
    if (user && !get().songs.find((s) => s.id === id)?.local) {
      favourites = [
        ...(await api("/users/favourites", {
          method: "PUT",
          body: { songId: id },
        })),
        ...userData.favourites.filter(
          (sid) => get().songs.find((s) => s.id === sid)?.local,
        ),
      ];
    }
    const data = { ...get().userData, favourites };
    set({ userData: data });
    persist(scope, data);
    return favourites.includes(id);
  },
  recordPlay: (id) => {
    const { songs, userData, scope, user } = get();
    const s = songs.find((s) => s.id === id);
    if (!s) return;
    const data = {
      ...userData,
      listens: { ...userData.listens, [id]: (userData.listens[id] || 0) + 1 },
      recentlyPlayed: [
        s.albumId,
        ...userData.recentlyPlayed.filter((x) => x !== s.albumId),
      ].slice(0, 30),
      history: [
        { id, time: Date.now() },
        ...userData.history.filter((x) => x.id !== id),
      ].slice(0, 100),
    };
    set({ userData: data });
    persist(scope, data);
    if (user && !s.local)
      api("/users/recently-played", {
        method: "PUT",
        body: { albumId: s.albumId, songId: id },
      }).catch(() => {});
  },
  createPlaylist: async (name, description = "", deviceOnly = false) => {
    name = validateName(name);
    const { user, scope } = get();
    const p =
      user && !deviceOnly
        ? await api("/playlists", {
            method: "POST",
            body: { name, description },
          })
        : {
            id: "local-" + crypto.randomUUID(),
            name,
            description,
            songs: [],
            createdAt: new Date().toISOString(),
          };
    p.id = p.id || p._id;
    const data = {
      ...get().userData,
      playlists: [...get().userData.playlists, p],
    };
    set({ userData: data });
    persist(scope, data);
    return p;
  },
  updatePlaylist: async (id, patch) => {
    const { user, scope } = get();
    if (patch.name !== undefined)
      patch = { ...patch, name: validateName(patch.name) };
    const current = get().userData.playlists.find((p) => p.id === id);
    if (!current) throw new Error("Playlist not found.");
    let updated = { ...current, ...patch };
    if (user && !id.startsWith("local-")) {
      const remoteSongs = (patch.songs || current.songs).filter(
        (sid) => !get().songs.find((s) => s.id === sid)?.local,
      );
      if (remoteSongs.length !== (patch.songs || current.songs).length)
        throw new Error(
          "Imported files stay on this device. Add them to a device playlist.",
        );
      const remote = await api("/playlists/" + id, {
        method: "PATCH",
        body: { ...patch, ...(patch.songs ? { songs: remoteSongs } : {}) },
      });
      updated = { ...remote, id: remote._id };
    }
    const data = {
      ...get().userData,
      playlists: get().userData.playlists.map((p) =>
        p.id === id ? updated : p,
      ),
    };
    set({ userData: data });
    persist(scope, data);
  },
  deletePlaylist: async (id) => {
    const { user, scope } = get();
    if (user && !id.startsWith("local-"))
      await api("/playlists/" + id, { method: "DELETE" });
    const data = {
      ...get().userData,
      playlists: get().userData.playlists.filter((p) => p.id !== id),
    };
    set({ userData: data });
    persist(scope, data);
  },
  addToPlaylist: async (playlistId, songId) => {
    const p = get().userData.playlists.find((p) => p.id === playlistId);
    if (!p) throw new Error("Choose a playlist.");
    if (p.songs.includes(songId)) return;
    await get().updatePlaylist(playlistId, { songs: [...p.songs, songId] });
  },
  importTrack: async ({ audio, cover, metadata }) => {
    const id = "import-" + crypto.randomUUID();
    const scope = get().scope;
    const record = {
      id,
      scope,
      audio,
      cover,
      metadata: {
        ...metadata,
        id,
        albumId:
          "import-album-" +
          (metadata.artist + "-" + metadata.albumTitle)
            .toLowerCase()
            .replace(/\W/g, "-"),
        artistId:
          "import-artist-" + metadata.artist.toLowerCase().replace(/\W/g, "-"),
        local: true,
        createdAt: new Date().toISOString(),
      },
    };
    await storeTrack(record);
    await get().hydrateLocal();
    return id;
  },
  removeLocalTrack: async (id) => {
    const song = get().songs.find((s) => s.id === id);
    if (!song?.local) return;
    await deleteTrack(id);
    const data = {
      ...get().userData,
      favourites: get().userData.favourites.filter((x) => x !== id),
      playlists: get().userData.playlists.map((p) => ({
        ...p,
        songs: p.songs.filter((x) => x !== id),
      })),
    };
    set({ userData: data });
    persist(get().scope, data);
    await get().hydrateLocal();
  },
  clearHistory: () => {
    const data = {
      ...get().userData,
      history: [],
      recentlyPlayed: [],
      listens: {},
    };
    set({ userData: data });
    persist(get().scope, data);
  },
}));
