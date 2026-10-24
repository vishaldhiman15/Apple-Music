import { readStorage, writeStorage } from "./storage";
export const offlineIds = () => readStorage("music-offline-tracks", []);
export async function makeOffline(song) {
  if (song.local) return;
  if (!song.demo)
    throw new Error(
      "Cloud recordings are streamed. You can import your own audio for offline listening.",
    );
  if (!("caches" in window))
    throw new Error("Offline storage is unavailable in this browser.");
  const response = await fetch(song.audioUrl);
  if (!response.ok)
    throw new Error("Could not save this track. Please try again.");
  const cache = await caches.open("music-audio-v1");
  await cache.put(
    new Request(new URL(song.audioUrl, location.origin)),
    response,
  );
  const ids = [...new Set([...offlineIds(), song.id])];
  writeStorage("music-offline-tracks", ids);
}
export async function clearOffline() {
  if ("caches" in window) await caches.delete("music-audio-v1");
  writeStorage("music-offline-tracks", []);
}
