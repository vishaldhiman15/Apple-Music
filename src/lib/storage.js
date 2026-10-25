export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
let database;
function open() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open("music-max-files", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("tracks", { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(
          new Error("Your browser could not open the local music library."),
        );
    });
  return database;
}
export async function storeTrack(record) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("tracks", "readwrite");
    tx.objectStore("tracks").put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () =>
      reject(new Error("There is not enough browser storage for this track."));
  });
}
export async function getTracks(scope) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction("tracks").objectStore("tracks").getAll();
    req.onsuccess = () => resolve(req.result.filter((x) => x.scope === scope));
    req.onerror = () => reject(req.error);
  });
}
export async function deleteTrack(id) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("tracks", "readwrite");
    tx.objectStore("tracks").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
