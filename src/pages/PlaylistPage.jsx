import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  ListMusic,
  Play,
  Shuffle,
  Plus,
  Pencil,
  ArrowDownUp,
  Trash2,
} from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import { useUIStore } from "../store/useUIStore";
import player from "../store/usePlayerStore";
import { Cover, SongTable, Empty, IconButton } from "../components/UI";
import { formatTotal } from "../utils/helpers";
export function PlaylistArt({ tracks, favorites = false }) {
  return (
    <div
      className={
        "playlist-art " +
        (favorites ? "favorites-art" : tracks.length >= 4 ? "mosaic" : "")
      }
    >
      {favorites ? (
        <Heart size={83} fill="currentColor" />
      ) : tracks.length >= 4 ? (
        tracks
          .slice(0, 4)
          .map((s) => <Cover key={s.id} src={s.coverUrl} alt="" />)
      ) : tracks[0] ? (
        <Cover src={tracks[0].coverUrl} alt="" />
      ) : (
        <ListMusic size={72} />
      )}
    </div>
  );
}
export default function PlaylistPage() {
  const { id } = useParams(),
    nav = useNavigate();
  const { songs, userData, scope } = useDataStore();
  const [reorder, setReorder] = useState(false);
  const favorites = id === "favourites";
  const p = favorites
    ? {
        id,
        name: "Favorite Songs",
        description: "The ones that feel like you.",
        songs: userData.favourites,
      }
    : userData.playlists.find((p) => p.id === id);
  if (!p)
    return (
      <Empty
        title="This playlist isn’t here."
        body="Find a favorite, or make a new one."
        action={
          <button className="btn primary" onClick={() => nav("/playlists")}>
            Your playlists
          </button>
        }
      />
    );
  const tracks = p.songs
    .map((id) => songs.find((s) => s.id === id))
    .filter(Boolean);
  function play(shuffle = false) {
    if (!tracks.length) return;
    player.setState({ shuffle });
    player
      .getState()
      .playSong(
        shuffle ? tracks[Math.floor(Math.random() * tracks.length)] : tracks[0],
        tracks,
      );
  }
  return (
    <div className="page-container playlist-page">
      <section className="collection-hero playlist-hero">
        <PlaylistArt tracks={tracks} favorites={favorites} />
        <div className="collection-info">
          <span className="eyebrow">
            {favorites
              ? "MADE OF THE MUSIC YOU LOVE"
              : scope === "guest"
                ? "YOUR DEVICE PLAYLIST"
                : "YOUR PLAYLIST"}
          </span>
          <h1>{p.name}</h1>
          <p>
            {p.description || "A little collection of things that move you."}
          </p>
          <div className="collection-metadata">
            <span>{tracks.length} tracks</span>
            <i />
            <span>
              {formatTotal(tracks.reduce((a, s) => a + s.duration, 0))}
            </span>
          </div>
          <div className="collection-actions">
            <button
              className="btn primary"
              disabled={!tracks.length}
              onClick={() => play()}
            >
              <Play size={15} fill="currentColor" /> Play
            </button>
            <button
              className="btn secondary"
              disabled={!tracks.length}
              onClick={() => play(true)}
            >
              <Shuffle size={16} /> Shuffle
            </button>
            {!favorites && (
              <>
                <IconButton
                  label="Edit playlist details"
                  onClick={() =>
                    useUIStore
                      .getState()
                      .setModal({ type: "playlist", playlist: p })
                  }
                >
                  <Pencil size={18} />
                </IconButton>
                <IconButton
                  label="Delete playlist"
                  onClick={() =>
                    useUIStore
                      .getState()
                      .setModal({ type: "deletePlaylist", playlist: p })
                  }
                >
                  <Trash2 size={18} />
                </IconButton>
              </>
            )}
          </div>
        </div>
      </section>
      {!favorites && tracks.length > 0 && (
        <div className="playlist-toolbar">
          <span>
            {reorder
              ? "Use the arrows to put things in your order."
              : "Your kind of music. Your kind of order."}
          </span>
          <button
            className={"small-link " + (reorder ? "accent" : "")}
            onClick={() => setReorder(!reorder)}
          >
            <ArrowDownUp size={15} />
            {reorder ? "Done" : "Edit tracks"}
          </button>
        </div>
      )}
      <SongTable
        songs={tracks}
        playlistId={!favorites ? p.id : undefined}
        reorder={reorder}
      />
      {!tracks.length && (
        <Empty
          icon={favorites ? Heart : ListMusic}
          title={
            favorites
              ? "Keep the ones you love."
              : "Make a little room for your favorites."
          }
          body={
            favorites
              ? "Tap the heart on a track to keep it here."
              : "Use a track’s options menu to add it to this playlist."
          }
          action={
            <button className="btn secondary" onClick={() => nav("/search")}>
              Find something good
            </button>
          }
        />
      )}
    </div>
  );
}
