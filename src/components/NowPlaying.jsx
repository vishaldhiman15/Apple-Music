import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Mic2,
  ListMusic,
  SlidersHorizontal,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Loader2,
} from "lucide-react";
import player, { enableAudioGraph, getAnalyser } from "../store/usePlayerStore";
import { Cover, IconButton } from "./UI";
import { Lyrics } from "./PlayerPanels";
import SoundControls from "./SoundControls";
import { formatDuration } from "../utils/helpers";
function Visualizer() {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas.getContext("2d");
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, 640, 160);
      const analyser = getAnalyser();
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        data.forEach((v, i) => {
          const h = (v / 255) * 130;
          ctx.fillStyle = `rgba(255,255,255,${0.15 + (v / 255) * 0.6})`;
          ctx.fillRect(i * 10, 150 - h, 5, h);
        });
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      width="640"
      height="160"
      className="visualizer"
      aria-label="Audio spectrum"
    />
  );
}
export default function NowPlaying() {
  const s = player();
  const [tab, setTab] = useState("art");
  const ref = useRef();
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") s.closeNowPlaying();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll(
          'button:not(:disabled),input,select,[tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, []);
  if (!s.currentSong) return null;
  const p = s.currentSong;
  return (
    <section
      className="now-playing"
      role="dialog"
      aria-modal="true"
      aria-label="Now Playing"
      ref={ref}
      tabIndex={-1}
      style={{ "--album-color": p.color || "#452f3f" }}
    >
      <div className="now-playing-glow" />
      <header>
        <IconButton label="Close Now Playing" onClick={s.closeNowPlaying}>
          <ChevronDown size={26} />
        </IconButton>
        <div>
          <span className="eyebrow">NOW PLAYING</span>
          <p>{p.albumTitle}</p>
        </div>
        <div className="now-tabs">
          <button
            className={tab === "art" ? "active" : ""}
            onClick={() => setTab("art")}
          >
            Artwork
          </button>
          <button
            className={tab === "lyrics" ? "active" : ""}
            onClick={() => setTab("lyrics")}
          >
            Lyrics
          </button>
          <button
            className={tab === "sound" ? "active" : ""}
            onClick={() => {
              enableAudioGraph();
              setTab("sound");
            }}
          >
            Sound
          </button>
        </div>
      </header>
      <div className="now-playing-body">
        <div className="now-playing-left">
          <Cover
            className={"large-art " + (s.isPlaying ? "is-playing" : "")}
            src={p.coverUrl}
            alt={p.albumTitle}
          />
          <div className="now-song-label">
            <div>
              <h1>{p.title}</h1>
              <p>{p.artist}</p>
            </div>
            <button
              className="audio-format-badge"
              aria-label={
                "Sound mode: " +
                (s.soundMode === "spatial" ? "Spatial stereo" : "Stereo")
              }
              onClick={() => {
                enableAudioGraph();
                setTab("sound");
              }}
            >
              {s.soundMode === "spatial" ? "SPATIAL STEREO" : "STEREO"}
            </button>
          </div>
          <div className="now-seek">
            <input
              type="range"
              aria-label="Now Playing position"
              min="0"
              max={s.duration || 0}
              step=".1"
              value={Math.min(s.progress, s.duration || 0)}
              onChange={(e) => s.setProgress(e.target.value)}
              style={{
                "--fill": `${s.duration ? (s.progress / s.duration) * 100 : 0}%`,
              }}
            />
            <div>
              <time>{formatDuration(s.progress)}</time>
              <time>−{formatDuration(s.duration - s.progress)}</time>
            </div>
          </div>
          <div className="transport now-transport">
            <IconButton
              label="Shuffle"
              className={s.shuffle ? "enabled" : ""}
              onClick={s.toggleShuffle}
            >
              <Shuffle size={20} />
            </IconButton>
            <IconButton label="Previous" onClick={s.prevSong}>
              <SkipBack size={29} fill="currentColor" />
            </IconButton>
            <button
              aria-label={
                s.isPlaying ? "Pause full player" : "Play full player"
              }
              className="now-play-button"
              onClick={s.togglePlay}
            >
              {s.isLoading ? (
                <Loader2 className="spin" size={31} />
              ) : s.isPlaying ? (
                <Pause size={34} fill="currentColor" />
              ) : (
                <Play size={34} fill="currentColor" />
              )}
            </button>
            <IconButton label="Next" onClick={s.nextSong}>
              <SkipForward size={29} fill="currentColor" />
            </IconButton>
            <IconButton
              label={"Full player repeat " + s.repeat}
              className={s.repeat !== "off" ? "enabled" : ""}
              onClick={s.toggleRepeat}
            >
              {s.repeat === "one" ? (
                <Repeat1 size={20} />
              ) : (
                <Repeat size={20} />
              )}
            </IconButton>
          </div>
        </div>
        <div className="now-playing-right">
          {tab === "lyrics" ? (
            <Lyrics full />
          ) : tab === "sound" ? (
            <div className="sound-panel">
              <span className="eyebrow">A NEW DIMENSION OF LISTENING</span>
              <h2>Sound, all around you.</h2>
              <p>Clear vocals. Tight bass. Space that feels natural.</p>
              <SoundControls />
              <div className="sound-eq-label">TONE</div>
              <div className="eq-options">
                {[
                  ["flat", "Original"],
                  ["warm", "Warm"],
                  ["vocal", "Vocal"],
                  ["bright", "Bright"],
                ].map(([id, name]) => (
                  <button
                    key={id}
                    className={s.eq === id ? "active" : ""}
                    onClick={() => s.setEqualizer(id)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <Visualizer />
              <label className="now-volume">
                <Volume2 size={20} />
                <input
                  type="range"
                  aria-label="Full player volume"
                  min="0"
                  max="1"
                  step=".01"
                  value={s.volume}
                  onChange={(e) => s.setVolume(e.target.value)}
                  style={{ "--fill": `${s.volume * 100}%` }}
                />
              </label>
            </div>
          ) : (
            <div className="art-caption">
              <span className="eyebrow">LET EVERYTHING ELSE FADE.</span>
              <h2>
                Just you.
                <br />
                And the music.
              </h2>
              <div className="quiet-wave">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <p>
                {p.instrumental
                  ? "An original instrumental. A little space to get lost in."
                  : p.genre + " · " + p.albumTitle}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
