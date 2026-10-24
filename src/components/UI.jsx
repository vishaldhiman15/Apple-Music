import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  Plus,
  Music2,
  ChevronRight,
  X,
  CheckCircle2,
  Loader2,
  SkipForward,
  Clock,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import player from "../store/usePlayerStore";
import { useDataStore } from "../store/useDataStore";
import { useUIStore } from "../store/useUIStore";
import { formatDuration } from "../utils/helpers";
export function IconButton({
  label,
  children,
  onClick,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={"icon-button " + className}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <svg viewBox="0 0 20 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M15.7 12.7c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-1.9-1.5-.2-3 .9-3.7.9-.8 0-1.9-.9-3.1-.8C5.8 7.1 4.3 8 3.5 9.4c-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8s2.1-1.2 2.9-2.3c.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.2-.8-2.2-3.4ZM13.3 5.5c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3Z"
        />
      </svg>
      <span>Music</span>
      <sup>MAX</sup>
    </span>
  );
}
export function Cover({ src, alt = "", className = "", ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <img
      src={failed ? "/artwork/01.svg" : src || "/artwork/01.svg"}
      alt={alt}
      className={"cover " + className}
      loading="lazy"
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
export function Empty({ icon: Icon = Music2, title, body, action }) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={31} />
      </span>
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading">
      <Loader2 className="spin" size={25} />
    </div>
  );
}
export function SectionHead({ title, subtitle, to, action }) {
  const nav = useNavigate();
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {to && (
        <button className="small-link" onClick={() => nav(to)}>
          See all <ChevronRight size={14} />
        </button>
      )}
      {action}
    </div>
  );
}
export function AlbumCard({ album, reason = false }) {
  const nav = useNavigate();
  const songs = useDataStore((s) => s.songs);
  const tracks = songs.filter((s) => s.albumId === album.id);
  const current = player((s) => s.currentSong);
  const playing = player((s) => s.isPlaying);
  return (
    <article className="album-card">
      <div className="album-art">
        <button
          aria-label={"Open " + album.title}
          className="album-open"
          onClick={() => nav("/album/" + album.id)}
        >
          <Cover src={album.coverUrl} alt={album.title} />
        </button>
        <button
          className="art-play"
          aria-label={"Play " + album.title}
          onClick={() =>
            tracks.length && player.getState().playSong(tracks[0], tracks)
          }
        >
          <Play size={20} fill="currentColor" />
        </button>
        {current?.albumId === album.id && playing && <Equalizer />}
      </div>
      <button className="album-label" onClick={() => nav("/album/" + album.id)}>
        <b>{album.title}</b>
        <span>{album.artist}</span>
      </button>
      {reason && album.reason && (
        <small className="album-reason">{album.reason}</small>
      )}
    </article>
  );
}
export function Equalizer() {
  return (
    <span className="equalizer" aria-label="Playing">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
export function SongTable({
  songs,
  playlistId,
  reorder = false,
  compact = false,
}) {
  const state = player();
  const data = useDataStore((s) => s.userData);
  const updatePlaylist = useDataStore((s) => s.updatePlaylist);
  const notify = useUIStore((s) => s.notify);
  const nav = useNavigate();
  async function favourite(s) {
    try {
      await useDataStore.getState().toggleFavourite(s.id);
    } catch (e) {
      notify(e.message);
    }
  }
  async function move(index, delta) {
    const p = data.playlists.find((p) => p.id === playlistId);
    const ids = [...p.songs];
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await updatePlaylist(playlistId, { songs: ids });
    } catch (e) {
      notify(e.message);
    }
  }
  return (
    <div className={"song-table " + (compact ? "compact" : "")}>
      <div className="song-table-head">
        <span>#</span>
        <span>Title</span>
        <span className="song-album">Album</span>
        <span className="song-genre">Genre</span>
        <span />
        <Clock size={13} />
        <span />
      </div>
      {songs.map((s, i) => {
        const current = state.currentSong?.id === s.id;
        const liked = data.favourites.includes(s.id);
        return (
          <div key={s.id} className={"track-row " + (current ? "current" : "")}>
            <button
              className="track-number"
              aria-label={
                (current && state.isPlaying ? "Pause " : "Play ") + s.title
              }
              onClick={() =>
                current ? state.togglePlay() : state.playSong(s, songs)
              }
            >
              {current && state.isPlaying ? (
                <Equalizer />
              ) : (
                <>
                  <span>{i + 1}</span>
                  <Play size={14} fill="currentColor" />
                </>
              )}
            </button>
            <div className="track-main">
              <button
                aria-label={"Play " + s.title}
                onClick={() => state.playSong(s, songs)}
              >
                <Cover src={s.coverUrl} alt="" />
              </button>
              <div>
                <button
                  className="track-title"
                  onClick={() =>
                    current ? state.togglePlay() : state.playSong(s, songs)
                  }
                >
                  {s.title}
                  {s.explicit && <small className="explicit">E</small>}
                </button>
                <button
                  className="track-artist"
                  onClick={() => nav("/library/artists/" + s.artistId)}
                >
                  {s.artist}
                </button>
              </div>
            </div>
            <button
              className="song-album"
              onClick={() => nav("/album/" + s.albumId)}
            >
              {s.albumTitle}
            </button>
            <span className="song-genre">{s.genre || "—"}</span>
            <IconButton
              label={(liked ? "Unfavorite " : "Favorite ") + s.title}
              className={liked ? "favorite" : ""}
              onClick={() => favourite(s)}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
            </IconButton>
            <time>{formatDuration(s.duration)}</time>
            {reorder ? (
              <div className="reorder-buttons">
                <IconButton
                  label={"Move " + s.title + " up"}
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                >
                  <ArrowUp size={13} />
                </IconButton>
                <IconButton
                  label={"Move " + s.title + " down"}
                  onClick={() => move(i, 1)}
                  disabled={i === songs.length - 1}
                >
                  <ArrowDown size={13} />
                </IconButton>
                <IconButton
                  label={"Remove " + s.title + " from playlist"}
                  onClick={async () => {
                    try {
                      const p = data.playlists.find((p) => p.id === playlistId);
                      await updatePlaylist(playlistId, {
                        songs: p.songs.filter((id) => id !== s.id),
                      });
                    } catch (e) {
                      notify(e.message);
                    }
                  }}
                >
                  <X size={14} />
                </IconButton>
              </div>
            ) : (
              <IconButton
                label={"Options for " + s.title}
                onClick={() =>
                  useUIStore
                    .getState()
                    .setModal({ type: "song", song: s, playlistId })
                }
              >
                <MoreHorizontal size={18} />
              </IconButton>
            )}
          </div>
        );
      })}
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll(
          'button:not(:disabled),input,textarea,select,[tabindex="0"]',
        );
        if (!items?.length) return;
        const a = items[0],
          b = items[items.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        className={"modal " + (wide ? "wide" : "")}
      >
        <header>
          <h2>{title}</h2>
          <IconButton label="Close dialog" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Toast() {
  const message = useUIStore((s) => s.toast);
  return message ? (
    <div role="status" className="toast">
      <CheckCircle2 size={18} />
      <span>{message}</span>
      <IconButton
        label="Dismiss"
        onClick={() => useUIStore.setState({ toast: "" })}
      >
        <X size={15} />
      </IconButton>
    </div>
  ) : null;
}
