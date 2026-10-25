import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Music2,
  ImagePlus,
  X,
  Check,
  Loader2,
  HardDrive,
  Cloud,
  ShieldCheck,
  FileAudio,
  ArrowUpRight,
} from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import { useAuthStore } from "../store/useAuthStore";
import { useUIStore } from "../store/useUIStore";
import { api } from "../lib/api";
import { formatDuration } from "../utils/helpers";
import { IconButton } from "../components/UI";
const ALLOWED = /\.(mp3|wav|m4a|aac|ogg|opus|flac|webm|mp4)$/i;
export default function UploadPage() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.currentUser);
  const authProvider = useAuthStore((s) => s.authProvider);
  const [file, setFile] = useState(null),
    [cover, setCover] = useState(null),
    [coverUrl, setCoverUrl] = useState(""),
    [duration, setDuration] = useState(0),
    [busy, setBusy] = useState(false),
    [drag, setDrag] = useState(false),
    [error, setError] = useState(""),
    [progress, setProgress] = useState(""),
    [target, setTarget] = useState("device"),
    [cloud, setCloud] = useState(false);
  const [fields, setFields] = useState({
    title: "",
    artist: "",
    albumTitle: "My Collection",
    genre: "Electronic",
    releaseYear: String(new Date().getFullYear()),
    lyrics: "",
    instrumental: false,
  });
  const input = useRef();
  useEffect(() => {
    if (user)
      api("/health")
        .then((h) => {
          setCloud(h.uploads);
          if (h.uploads && h.hosting === "online") setTarget("cloud");
        })
        .catch(() => {});
  }, [user]);
  useEffect(() => {
    if (!cover) {
      setCoverUrl("");
      return;
    }
    const url = URL.createObjectURL(cover);
    setCoverUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);
  useEffect(() => {
    if (!file) return;
    let alive = true;
    setDuration(0);
    const url = URL.createObjectURL(file),
      a = new Audio();
    const timer = setTimeout(() => {
      if (alive && !a.duration)
        setError(
          "The file could not be decoded. Try an MP3, WAV, or M4A recording.",
        );
    }, 10000);
    a.onloadedmetadata = () => {
      if (alive) {
        if (!Number.isFinite(a.duration) || a.duration <= 0)
          setError("Choose a finite audio recording.");
        else setDuration(a.duration);
      }
    };
    a.onerror = () =>
      alive &&
      setError(
        "This browser cannot decode that audio file. Try MP3, WAV, or M4A.",
      );
    a.src = url;
    return () => {
      alive = false;
      clearTimeout(timer);
      a.removeAttribute("src");
      a.load();
      URL.revokeObjectURL(url);
    };
  }, [file]);
  function choose(f) {
    if (!f) return;
    if (!ALLOWED.test(f.name)) {
      setError(
        "Choose an MP3, WAV, M4A, AAC, OGG, Opus, FLAC, or WebM audio file.",
      );
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("Please choose an audio file under 100 MB.");
      return;
    }
    setError("");
    setFile(f);
    setFields({
      ...fields,
      title: f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
    });
  }
  function field(e) {
    setFields({
      ...fields,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  }
  async function cloudUpload(f, type) {
    const signature = await api(
      type === "audio" ? "/songs/signature" : "/songs/cover-signature",
    );
    const form = new FormData();
    form.append("file", f);
    for (const key of ["timestamp", "folder", "signature", "apiKey"])
      form.append(key === "apiKey" ? "api_key" : key, signature[key]);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/${type === "audio" ? "video" : "image"}/upload`,
      { method: "POST", body: form },
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error?.message || "Cloud upload failed.");
    return data.public_id;
  }
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!file || !duration) {
      setError("Choose a playable audio file first.");
      return;
    }
    if (!fields.title.trim() || !fields.artist.trim()) {
      setError("Add a track title and artist.");
      return;
    }
    setBusy(true);
    try {
      if (target === "cloud") {
        setProgress("Uploading audio…");
        const audioPublicId = await cloudUpload(file, "audio");
        let coverPublicId;
        if (cover) {
          setProgress("Uploading artwork…");
          coverPublicId = await cloudUpload(cover, "images");
        }
        setProgress("Adding to your library…");
        await api("/songs/upload", {
          method: "POST",
          body: {
            ...fields,
            artistName: fields.artist,
            audioPublicId,
            coverPublicId,
          },
        });
        await useDataStore.getState().fetchCatalog();
      } else {
        setProgress("Saving your recording on this device…");
        await useDataStore.getState().importTrack({
          audio: file,
          cover,
          metadata: {
            ...fields,
            albumTitle: fields.albumTitle.trim() || "My Collection",
            duration,
            instrumental: fields.instrumental,
            mime: file.type,
          },
        });
      }
      useUIStore.getState().notify("Your music is right where it belongs.");
      nav("/library/songs");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }
  return (
    <div className="page-container upload-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">YOUR MUSIC. YOUR SPACE.</span>
          <h1>
            Bring your own soundtrack<span className="heading-dot">.</span>
          </h1>
          <p>
            A favorite recording, an old mix, something you made. Give it a
            home.
          </p>
        </div>
        <Upload size={27} />
      </header>
      <form className="import-layout" onSubmit={submit}>
        <div>
          <input
            ref={input}
            type="file"
            accept="audio/*,.m4a,.flac,.opus"
            hidden
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <div
            className={
              "drop-zone " +
              (drag ? "dragging" : "") +
              (file ? " has-file" : "")
            }
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              choose(e.dataTransfer.files?.[0]);
            }}
          >
            {file ? (
              <>
                <FileAudio size={51} />
                <h2>{file.name}</h2>
                <p>
                  {duration ? formatDuration(duration) : "Reading audio…"} ·{" "}
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => input.current.click()}
                >
                  Choose a different track
                </button>
              </>
            ) : (
              <>
                <span className="drop-icon">
                  <Music2 size={47} />
                  <PlusBadge />
                </span>
                <h2>Drop a little music here.</h2>
                <p>
                  Drag an audio file into this space,
                  <br />
                  or choose one from your device.
                </p>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => input.current.click()}
                >
                  Choose audio file
                </button>
                <small>MP3, WAV, M4A, AAC, OGG, FLAC · up to 100 MB</small>
              </>
            )}
          </div>
          <div className="import-note">
            <ShieldCheck size={22} />
            <div>
              <b>
                {target === "device"
                  ? "It stays close to home."
                  : "Ready for your connected library."}
              </b>
              <p>
                {target === "device"
                  ? "Device imports are stored in your browser and can play offline. Clearing browser data removes those copies."
                  : authProvider === "chatgpt"
                    ? "Uploads are saved to your cloud library. Cloudinary media URLs can be accessed by anyone with the link. Only upload recordings you have permission to share."
                    : "Cloud uploads are visible in the shared catalog. Only upload recordings you have permission to share."}
              </p>
            </div>
          </div>
        </div>
        <div className="import-fields">
          <div className="storage-options">
            <button
              type="button"
              className={target === "device" ? "selected" : ""}
              onClick={() => setTarget("device")}
            >
              <HardDrive size={17} />
              <span>
                On this device<small>Private · offline ready</small>
              </span>
              {target === "device" && <Check size={15} />}
            </button>
            <button
              type="button"
              disabled={!user || !cloud}
              className={target === "cloud" ? "selected" : ""}
              onClick={() => setTarget("cloud")}
            >
              <Cloud size={17} />
              <span>
                Cloud library
                <small>
                  {!user
                    ? "Sign in to enable"
                    : !cloud
                      ? "Not connected"
                      : authProvider === "chatgpt"
                        ? "Available across your devices"
                        : "Share with your catalog"}
                </small>
              </span>
              {target === "cloud" && <Check size={15} />}
            </button>
          </div>
          <div className="cover-upload">
            <label
              className="cover-picker"
              tabIndex={0}
              role="button"
              aria-label="Choose cover artwork"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.currentTarget.querySelector("input").click();
                }
              }}
            >
              {coverUrl ? (
                <img src={coverUrl} alt="Selected cover" />
              ) : (
                <ImagePlus size={30} />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      f.type,
                    ) ||
                    f.size > 8 * 1024 * 1024
                  ) {
                    setError("Choose a JPEG, PNG, or WebP cover under 8 MB.");
                    return;
                  }
                  setCover(f);
                }}
              />
            </label>
            <div>
              <b>Give it a cover.</b>
              <p>JPG, PNG, or WebP. Optional, but a nice touch.</p>
              {cover && (
                <button
                  type="button"
                  className="small-link"
                  onClick={() => setCover(null)}
                >
                  Remove artwork
                </button>
              )}
            </div>
          </div>
          <div className="form-grid">
            <label>
              Track title
              <input
                name="title"
                value={fields.title}
                onChange={field}
                required
                maxLength={150}
                placeholder="What’s it called?"
              />
            </label>
            <label>
              Artist
              <input
                name="artist"
                value={fields.artist}
                onChange={field}
                required
                maxLength={100}
                placeholder="Who made it?"
              />
            </label>
            <label>
              Album
              <input
                name="albumTitle"
                value={fields.albumTitle}
                onChange={field}
                maxLength={150}
              />
            </label>
            <label>
              Genre
              <select name="genre" value={fields.genre} onChange={field}>
                {[
                  "Electronic",
                  "Ambient",
                  "Soul",
                  "Jazz",
                  "Lo-fi",
                  "Classical",
                  "Dance",
                  "R&B",
                  "Acoustic",
                  "Pop",
                  "Rock",
                  "Hip-Hop",
                  "Other",
                ].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label>
              Year
              <input
                name="releaseYear"
                value={fields.releaseYear}
                onChange={field}
                pattern="[0-9]{4}"
                maxLength={4}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="instrumental"
                checked={fields.instrumental}
                onChange={field}
              />
              Instrumental recording
            </label>
          </div>
          <label>
            Lyrics{" "}
            <span className="optional">optional · plain text or LRC</span>
            <textarea
              name="lyrics"
              value={fields.lyrics}
              onChange={field}
              rows={4}
              maxLength={50000}
              placeholder="[00:12.50] A line that comes in right on time…"
            />
          </label>
          <label className="lrc-upload">
            Have an LRC file?{" "}
            <input
              type="file"
              accept=".lrc,.txt"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f && f.size < 100000)
                  setFields({ ...fields, lyrics: await f.text() });
              }}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn primary full-width"
            disabled={busy || !file || !duration}
          >
            {busy ? (
              <>
                <Loader2 className="spin" size={17} />
                {progress}
              </>
            ) : (
              <>
                <Upload size={16} />
                Add to my library
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
function PlusBadge() {
  return <span>+</span>;
}
