export function formatDuration(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n < 0) return "0:00";
  const s = Math.floor(n);
  return s >= 3600
    ? `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
    : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
export function formatTotal(seconds) {
  const min = Math.round(seconds / 60);
  return min >= 60
    ? `${Math.floor(min / 60)} hr ${min % 60} min`
    : `${min} min`;
}
