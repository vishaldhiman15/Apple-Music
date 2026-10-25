import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import PlayerBar from "../components/PlayerBar";
import NowPlaying from "../components/NowPlaying";
import PlayerPanels from "../components/PlayerPanels";
import player from "../store/usePlayerStore";
import { useUIStore } from "../store/useUIStore";
import useKeyboard from "../hooks/useKeyboard";
export default function AppLayout() {
  const show = player((s) => s.showNowPlaying),
    error = player((s) => s.error),
    notify = useUIStore((s) => s.notify);
  const ref = useRef(),
    location = useLocation();
  useKeyboard();
  useEffect(() => {
    if (error) notify(error);
  }, [error]);
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [location.pathname]);
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-workspace">
        <TopBar />
        <main
          ref={ref}
          id="main-content"
          className="page-content"
          key={location.pathname}
        >
          <Outlet />
        </main>
      </div>
      <PlayerBar />
      <PlayerPanels />
      {show && <NowPlaying />}
    </div>
  );
}
