import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  House,
  Compass,
  Radio,
  Clock3,
  Mic2,
  Disc3,
  Music2,
  Heart,
  Plus,
  Upload,
  Settings,
  ChevronDown,
  X,
  ListMusic,
} from "lucide-react";
import { Brand, IconButton } from "./UI";
import { useDataStore } from "../store/useDataStore";
import { useUIStore } from "../store/useUIStore";
export default function Sidebar() {
  const [mobile, setMobile] = useState(
    () => matchMedia("(max-width:760px)").matches,
  );
  useEffect(() => {
    const q = matchMedia("(max-width:760px)");
    const change = () => setMobile(q.matches);
    change();
    q.addEventListener("change", change);
    window.addEventListener("resize", change);
    return () => {
      q.removeEventListener("change", change);
      window.removeEventListener("resize", change);
    };
  }, []);
  const nav = useNavigate();
  const playlists = useDataStore((s) => s.userData.playlists);
  const open = useUIStore((s) => s.sidebarOpen);
  const setSidebar = useUIStore((s) => s.setSidebar);
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (event.key === "Escape") setSidebar(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open, setSidebar]);
  const setModal = useUIStore((s) => s.setModal);
  const link = ([url, label, Icon]) => (
    <NavLink
      key={url}
      to={url}
      end={url === "/"}
      onClick={() => setSidebar(false)}
      className={({ isActive }) => "nav-link " + (isActive ? "active" : "")}
    >
      <Icon size={19} strokeWidth={1.8} />
      <span>{label}</span>
    </NavLink>
  );
  return (
    <>
      <button
        aria-label="Close navigation"
        className={"sidebar-scrim " + (open ? "visible" : "")}
        onClick={() => setSidebar(false)}
      />
      <aside
        className={"sidebar " + (open ? "mobile-open" : "")}
        inert={mobile && !open ? "" : undefined}
        aria-hidden={mobile && !open ? true : undefined}
      >
        <div className="sidebar-brand">
          <button onClick={() => nav("/")} aria-label="Music home">
            <Brand />
          </button>
          <IconButton
            label="Close navigation"
            className="mobile-only"
            onClick={() => setSidebar(false)}
          >
            <X size={20} />
          </IconButton>
        </div>
        <nav>
          <div className="nav-group">
            {[
              ["/", "Listen Now", House],
              ["/new", "Discover", Compass],
              ["/radio", "Radio", Radio],
            ].map(link)}
          </div>
          <div className="nav-group">
            <div className="nav-group-heading">YOUR LIBRARY</div>
            {[
              ["/library/recent", "Recently Added", Clock3],
              ["/library/artists", "Artists", Mic2],
              ["/library/albums", "Albums", Disc3],
              ["/library/songs", "Songs", Music2],
              ["/playlist/favourites", "Favorites", Heart],
            ].map(link)}
          </div>
          <div className="nav-group playlists-nav">
            <div className="nav-group-heading">
              <span>PLAYLISTS</span>
              <IconButton
                label="Create playlist"
                onClick={() => setModal({ type: "playlist" })}
              >
                <Plus size={15} />
              </IconButton>
            </div>
            {playlists.slice(0, 8).map((p) => (
              <NavLink
                key={p.id}
                to={"/playlist/" + p.id}
                onClick={() => setSidebar(false)}
                className={({ isActive }) =>
                  "playlist-nav-link " + (isActive ? "active" : "")
                }
              >
                <ListMusic size={16} />
                <span>{p.name}</span>
              </NavLink>
            ))}
            <button
              className="all-playlists"
              onClick={() => {
                nav("/playlists");
                setSidebar(false);
              }}
            >
              All playlists <ChevronDown size={12} />
            </button>
          </div>
        </nav>
        <div className="sidebar-bottom">
          <button
            className="import-cta"
            onClick={() => {
              nav("/upload");
              setSidebar(false);
            }}
          >
            <span>
              <Upload size={19} />
            </span>
            <div>
              <b>Your music belongs here.</b>
              <small>Import your favorite tracks</small>
            </div>
            <Plus size={15} />
          </button>
          <button
            className="sidebar-settings"
            onClick={() => {
              nav("/settings");
              setSidebar(false);
            }}
          >
            <Settings size={17} />
            <span>Settings</span>
            <kbd>?</kbd>
          </button>
          <p>An independent music experience.</p>
        </div>
      </aside>
    </>
  );
}
