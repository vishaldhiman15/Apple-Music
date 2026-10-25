import {
  Heart,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  ListMusic,
  Mic2,
  Maximize2,
  Loader2,
} from "lucide-react";
import player from "../store/usePlayerStore";
import { useDataStore } from "../store/useDataStore";
import { useUIStore } from "../store/useUIStore";
import { Cover, IconButton } from "./UI";
import { formatDuration } from "../utils/helpers";
export default function PlayerBar() {
  const s = player();
  const favourites = useDataStore((d) => d.userData.favourites);
  const p = s.currentSong;
  const liked = p && favourites.includes(p.id);
  const favorite = async () => {
    try {
      await useDataStore.getState().toggleFavourite(p.id);
    } catch (e) {
      useUIStore.getState().notify(e.message);
    }
  };
  return (
    <footer className="player-bar" aria-label="Music player">
      <div className="player-track">
        <button
          className="player-art"
          aria-label="Open Now Playing"
          onClick={s.toggleNowPlaying}
        >
          <Cover src={p?.coverUrl} alt={p?.albumTitle || "No track selected"} />
        </button>
        <button className="player-track-title" onClick={s.toggleNowPlaying}>
          <b>{p?.title || "Find your next favorite"}</b>
          <span>{p?.artist || "Choose something to play"}</span>
        </button>
        <IconButton
          label={liked ? "Unfavorite current track" : "Favorite current track"}
          className={liked ? "favorite" : ""}
          disabled={!p}
          onClick={favorite}
        >
          <Heart size={17} fill={liked ? "currentColor" : "none"} />
        </IconButton>
      </div>
      <div className="player-center">
        <div className="transport">
          <IconButton
            label={s.shuffle ? "Disable shuffle" : "Enable shuffle"}
            className={s.shuffle ? "enabled" : ""}
            onClick={s.toggleShuffle}
          >
            <Shuffle size={15} />
          </IconButton>
          <IconButton label="Previous track" onClick={s.prevSong} disabled={!p}>
            <SkipBack size={20} fill="currentColor" />
          </IconButton>
          <button
            className="play-toggle"
            aria-label={s.isPlaying ? "Pause" : "Play"}
            onClick={s.togglePlay}
            disabled={!p}
          >
            {s.isLoading ? (
              <Loader2 className="spin" size={21} />
            ) : s.isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </button>
          <IconButton label="Next track" onClick={s.nextSong} disabled={!p}>
            <SkipForward size={20} fill="currentColor" />
          </IconButton>
          <IconButton
            label={"Repeat: " + s.repeat}
            className={s.repeat !== "off" ? "enabled" : ""}
            onClick={s.toggleRepeat}
          >
            {s.repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </IconButton>
        </div>
        <div className="seek-control">
          <time>{formatDuration(s.progress)}</time>
          <input
            type="range"
            aria-label="Playback position"
            min="0"
            max={s.duration || 0}
            step=".1"
            value={Math.min(s.progress, s.duration || 0)}
            onChange={(e) => s.setProgress(e.target.value)}
            style={{
              "--fill": `${s.duration ? (s.progress / s.duration) * 100 : 0}%`,
            }}
          />
          <time>{formatDuration(s.duration)}</time>
        </div>
      </div>
      <div className="player-extras">
        <IconButton
          label="Lyrics"
          className={s.showLyrics ? "enabled" : ""}
          onClick={s.toggleLyrics}
        >
          <Mic2 size={17} />
        </IconButton>
        <IconButton
          label="Up Next queue"
          className={s.showQueue ? "enabled" : ""}
          onClick={s.toggleQueue}
        >
          <ListMusic size={19} />
        </IconButton>
        <span className="player-divider" />
        <IconButton label={s.muted ? "Unmute" : "Mute"} onClick={s.toggleMute}>
          {s.muted || s.volume === 0 ? (
            <VolumeX size={17} />
          ) : (
            <Volume2 size={17} />
          )}
        </IconButton>
        <input
          type="range"
          className="volume-slider"
          aria-label="Volume"
          min="0"
          max="1"
          step=".01"
          value={s.muted ? 0 : s.volume}
          onChange={(e) => s.setVolume(e.target.value)}
          style={{ "--fill": `${s.volume * 100}%` }}
        />
        <IconButton label="Expand player" onClick={s.toggleNowPlaying}>
          <Maximize2 size={16} />
        </IconButton>
      </div>
    </footer>
  );
}
