import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ListMusic,
  Plus,
  Play,
  SkipForward,
  ListEnd,
  Heart,
  Download,
  Trash2,
  Info,
  Clock3,
  Check,
  Loader2,
  ArrowUpRight,
  Link,
} from "lucide-react";
import { useUIStore } from "../store/useUIStore";
import { useDataStore } from "../store/useDataStore";
import player from "../store/usePlayerStore";
import { makeOffline, offlineIds } from "../lib/offline";
import { Modal, Cover, Empty } from "./UI";
import { formatDuration } from "../utils/helpers";
function PlaylistModal({ playlist, onClose }) {
  const [name, setName] = useState(playlist?.name || ""),
    [description, setDescription] = useState(playlist?.description || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const user = useDataStore((s) => s.user);
  const [device, setDevice] = useState(!user);
  const nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (playlist)
        await useDataStore
          .getState()
          .updatePlaylist(playlist.id, { name, description });
      else {
        const p = await useDataStore
          .getState()
          .createPlaylist(name, description, device);
        nav("/playlist/" + p.id);
      }
      onClose();
      useUIStore
        .getState()
        .notify(
          playlist ? "Playlist updated." : "A new soundtrack starts here.",
        );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={playlist ? "A little fine-tuning" : "Make it your own"}
      onClose={onClose}
    >
      <form className="modal-body" onSubmit={submit}>
        <span className="modal-illustration">
          <ListMusic size={34} />
        </span>
        <label>
          Playlist name
          <input
            autoFocus
            required
            maxLength={80}
            placeholder="A feeling, a place, a time…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Description <span className="optional">optional</span>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="What’s the story?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {user && !playlist && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={device}
              onChange={(e) => setDevice(e.target.checked)}
            />
            Keep this playlist on this device
          </label>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="btn primary full-width" disabled={busy}>
          {busy ? (
            <Loader2 size={17} className="spin" />
          ) : playlist ? (
            "Save changes"
          ) : (
            "Create playlist"
          )}
        </button>
      </form>
    </Modal>
  );
}
function AddModal({ songs, onClose }) {
  const playlists = useDataStore((s) => s.userData.playlists);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function add(p) {
    if (busy) return;
    setBusy(true);
    try {
      await useDataStore.getState().updatePlaylist(p.id, {
        songs: [...new Set([...p.songs, ...songs.map((s) => s.id)])],
      });
      useUIStore.getState().notify(`Added to ${p.name}.`);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        "Add " + (songs.length > 1 ? songs.length + " tracks" : "to a playlist")
      }
      onClose={onClose}
    >
      <div className="modal-body">
        <div className="add-playlist-list">
          {playlists.map((p) => (
            <button key={p.id} disabled={busy} onClick={() => add(p)}>
              <span>
                <ListMusic size={21} />
              </span>
              <div>
                <b>{p.name}</b>
                <small>{p.songs.length} tracks</small>
              </div>
              <Plus size={18} />
            </button>
          ))}
        </div>
        {!playlists.length && (
          <Empty
            icon={ListMusic}
            title="A new collection starts here."
            body="Create a playlist, then add the tracks you love."
          />
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button
          className="btn secondary full-width"
          onClick={() => useUIStore.getState().setModal({ type: "playlist" })}
        >
          <Plus size={16} /> Create a playlist
        </button>
      </div>
    </Modal>
  );
}
function SongMenu({ song: s, onClose, playlistId }) {
  const notify = useUIStore((s) => s.notify);
  const liked = useDataStore((d) => d.userData.favourites.includes(s.id));
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  async function action(fn, message) {
    setBusy(true);
    try {
      await fn();
      if (message) notify(message);
      onClose();
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="A little more music" onClose={onClose}>
      <div className="song-menu-track">
        <Cover src={s.coverUrl} alt="" />
        <div>
          <b>{s.title}</b>
          <small>
            {s.artist} · {s.albumTitle}
          </small>
        </div>
      </div>
      <div className="song-actions">
        {s.sourceUrl && (
          <a
            className="provider-source-link"
            href={s.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ArrowUpRight size={18} /> View artist and track on Audius
          </a>
        )}
        <button
          disabled={busy}
          onClick={() => action(() => player.getState().playSong(s))}
        >
          <Play size={18} />
          Play now
        </button>
        <button
          onClick={() =>
            action(() => player.getState().addToQueue(s, true), "Playing next.")
          }
        >
          <SkipForward size={18} />
          Play next
        </button>
        <button
          onClick={() =>
            action(() => player.getState().addToQueue(s), "Added to Up Next.")
          }
        >
          <ListEnd size={18} />
          Add to queue
        </button>
        <button
          onClick={() =>
            useUIStore.getState().setModal({ type: "add", songs: [s] })
          }
        >
          <Plus size={18} />
          Add to playlist
        </button>
        <button
          disabled={busy}
          onClick={() =>
            action(() => useDataStore.getState().toggleFavourite(s.id))
          }
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
          {liked ? "Remove from favorites" : "Add to favorites"}
        </button>
        {s.demo && (
          <button
            disabled={busy}
            onClick={() =>
              action(
                () => makeOffline(s),
                "Saved for offline listening on this device.",
              )
            }
          >
            <Download size={18} />
            {offlineIds().includes(s.id)
              ? "Available offline"
              : "Make available offline"}
          </button>
        )}
        <button
          onClick={() => {
            onClose();
            nav("/album/" + s.albumId);
          }}
        >
          <ArrowUpRight size={18} />
          Go to album
        </button>
        <button
          onClick={() =>
            useUIStore.getState().setModal({ type: "info", song: s })
          }
        >
          <Info size={18} />
          Track details
        </button>
        {s.local && (
          <button
            className="danger"
            onClick={() =>
              useUIStore.getState().setModal({ type: "removeLocal", song: s })
            }
          >
            <Trash2 size={18} />
            Remove imported track
          </button>
        )}
      </div>
    </Modal>
  );
}
function Confirmation({ title, body, label = "Delete", onConfirm, onClose }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <div className="modal-body">
        <p className="confirmation-copy">{body}</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="confirmation-buttons">
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onClose();
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {label}
          </button>
        </div>
      </div>
    </Modal>
  );
}
export default function Modals() {
  const modal = useUIStore((s) => s.modal),
    close = () => useUIStore.getState().setModal(null);
  const nav = useNavigate();
  if (!modal) return null;
  if (modal.type === "playlist")
    return <PlaylistModal playlist={modal.playlist} onClose={close} />;
  if (modal.type === "add")
    return <AddModal songs={modal.songs} onClose={close} />;
  if (modal.type === "song")
    return (
      <SongMenu
        song={modal.song}
        playlistId={modal.playlistId}
        onClose={close}
      />
    );
  if (modal.type === "deletePlaylist")
    return (
      <Confirmation
        title="Delete this playlist?"
        body="The playlist will be permanently removed. The tracks will stay in your library."
        onClose={close}
        onConfirm={async () => {
          await useDataStore.getState().deletePlaylist(modal.playlist.id);
          nav("/playlists");
          useUIStore.getState().notify("Playlist deleted.");
        }}
      />
    );
  if (modal.type === "removeLocal")
    return (
      <Confirmation
        title="Remove this imported track?"
        body="The browser’s stored copy will be deleted from this device. Your original file is untouched."
        label="Remove track"
        onClose={close}
        onConfirm={async () => {
          player.getState().removeTrack(modal.song.id);
          await useDataStore.getState().removeLocalTrack(modal.song.id);
          useUIStore.getState().notify("Imported track removed.");
        }}
      />
    );
  if (modal.type === "info") {
    const s = modal.song;
    return (
      <Modal title="Behind the track" onClose={close}>
        <div className="modal-body track-info">
          <Cover src={s.coverUrl} alt={s.albumTitle} />
          <h2>{s.title}</h2>
          <p>{s.artist}</p>
          <dl>
            {[
              ["Album", s.albumTitle],
              ["Genre", s.genre || "Not specified"],
              ["Duration", formatDuration(s.duration)],
              ["Year", s.releaseYear || "—"],
              [
                "Source",
                s.provider === "audius"
                  ? "Audius · online stream"
                  : s.provider === "cloudinary"
                    ? "Your Cloudinary library"
                    : s.local
                      ? "Imported recording on this device"
                      : s.demo
                        ? "Original demo recording"
                        : "Connected library",
              ],
              [
                "Vocals",
                s.instrumental
                  ? "Instrumental"
                  : s.lyrics
                    ? "Lyrics available"
                    : "Not specified",
              ],
            ].map(([key, val]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Modal>
    );
  }
  if (modal.type === "shortcuts")
    return (
      <Modal title="A few shortcuts to a good listen" onClose={close}>
        <div className="modal-body shortcut-list">
          {[
            ["Space", "Play / pause"],
            ["← / →", "Seek 5 seconds"],
            ["Ctrl / ⌘ + ← / →", "Previous / next track"],
            ["M", "Mute / unmute"],
            ["Q", "Open Up Next"],
            ["F", "Expand Now Playing"],
            ["/", "Search your library"],
            ["Esc", "Close a dialog"],
          ].map(([key, label]) => (
            <div key={key}>
              <span>{label}</span>
              <kbd>{key}</kbd>
            </div>
          ))}
        </div>
      </Modal>
    );
  return null;
}
