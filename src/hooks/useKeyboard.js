import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import player from "../store/usePlayerStore";
import { useUIStore } from "../store/useUIStore";
export default function useKeyboard() {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e) => {
      if (
        (e.target instanceof HTMLElement &&
          (e.target.closest("input,textarea,select,[contenteditable=true]") ||
            e.target.closest("[role=dialog]"))) ||
        useUIStore.getState().modal
      )
        return;
      const s = player.getState();
      if (e.code === "Space" && !e.target.closest("button")) {
        e.preventDefault();
        s.togglePlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.metaKey || e.ctrlKey ? s.nextSong() : s.setProgress(s.progress + 5);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.metaKey || e.ctrlKey ? s.prevSong() : s.setProgress(s.progress - 5);
      } else if (e.key === "m") s.toggleMute();
      else if (e.key === "q") s.toggleQueue();
      else if (e.key === "f") s.toggleNowPlaying();
      else if (e.key === "/") {
        e.preventDefault();
        navigate("/search");
        setTimeout(() => document.querySelector("[data-search]")?.focus(), 0);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navigate]);
}
