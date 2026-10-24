import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Menu,
  User,
  Cloud,
  HardDrive,
  SlidersHorizontal,
} from "lucide-react";
import { IconButton } from "./UI";
import { useAuthStore } from "../store/useAuthStore";
import { useUIStore } from "../store/useUIStore";
export default function TopBar() {
  const nav = useNavigate(),
    location = useLocation();
  const [query, setQuery] = useState("");
  const user = useAuthStore((s) => s.currentUser);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <IconButton
          label="Open navigation"
          className="mobile-only"
          onClick={() => useUIStore.getState().setSidebar(true)}
        >
          <Menu size={21} />
        </IconButton>
        <IconButton
          label="Go back"
          disabled={!(window.history.state?.idx > 0)}
          onClick={() => nav(-1)}
        >
          <ChevronLeft size={21} />
        </IconButton>
        <span className="topbar-section">
          {location.pathname.startsWith("/library")
            ? "Your Library"
            : location.pathname === "/radio"
              ? "Radio"
              : location.pathname === "/new"
                ? "Discover"
                : location.pathname.startsWith("/playlist")
                  ? "Playlists"
                  : "Listen Now"}
        </span>
      </div>
      <form
        className="global-search"
        onSubmit={(e) => {
          e.preventDefault();
          nav("/search?q=" + encodeURIComponent(query));
        }}
      >
        <Search size={16} />
        <input
          placeholder="Search your music"
          aria-label="Search your music"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>/</kbd>
      </form>
      <div className="topbar-account">
        <span className="device-label">
          {user ? (
            <>
              <Cloud size={13} /> Synced library
            </>
          ) : (
            <>
              <HardDrive size={13} /> On this device
            </>
          )}
        </span>
        <button
          className="account-avatar"
          aria-label={
            user ? "Account settings" : "Sign in or continue on this device"
          }
          onClick={() => nav(user ? "/settings" : "/login")}
        >
          {user ? user.name.slice(0, 1).toUpperCase() : <User size={18} />}
        </button>
      </div>
    </header>
  );
}
