import { useNavigate } from "react-router-dom";
import { Plus, ListMusic } from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import { useUIStore } from "../store/useUIStore";
import { PlaylistArt } from "./PlaylistPage";
import { Empty } from "../components/UI";
export default function PlaylistsPage() {
  const { songs, userData } = useDataStore();
  const nav = useNavigate();
  return (
    <div className="page-container">
      <header className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE MORE PERSONAL</span>
          <h1>
            Your playlists<span className="heading-dot">.</span>
          </h1>
          <p>Every mood deserves its own soundtrack.</p>
        </div>
        <button
          className="btn primary"
          onClick={() => useUIStore.getState().setModal({ type: "playlist" })}
        >
          <Plus size={17} /> New playlist
        </button>
      </header>
      <div className="playlist-grid">
        {userData.playlists.map((p) => {
          const tracks = p.songs
            .map((id) => songs.find((s) => s.id === id))
            .filter(Boolean);
          return (
            <button
              className="playlist-card"
              key={p.id}
              onClick={() => nav("/playlist/" + p.id)}
            >
              <PlaylistArt tracks={tracks} />
              <b>{p.name}</b>
              <small>{tracks.length} tracks</small>
            </button>
          );
        })}
        <button
          className="playlist-card new-playlist-card"
          onClick={() => useUIStore.getState().setModal({ type: "playlist" })}
        >
          <span>
            <Plus size={38} />
          </span>
          <b>Something only you could make.</b>
          <small>Create a playlist</small>
        </button>
      </div>
    </div>
  );
}
