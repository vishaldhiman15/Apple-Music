import { useEffect, useRef } from "react";
import { X, ArrowUp, ArrowDown, Music2, Mic2 } from "lucide-react";
import player from "../store/usePlayerStore";
import { parseLyrics } from "../lib/catalog";
import { Cover, IconButton, Empty } from "./UI";
import { formatDuration } from "../utils/helpers";
export function Lyrics({ full = false }) {
  const song = player((s) => s.currentSong),
    progress = player((s) => s.progress);
  const active = useRef();
  const timed = parseLyrics(song?.lyrics || "");
  const index = timed.reduce(
    (last, line, i) => (line.time <= progress ? i : last),
    -1,
  );
  useEffect(() => {
    active.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [index]);
  if (!song?.lyrics)
    return (
      <Empty
        icon={Mic2}
        title={
          song?.instrumental
            ? "Let the music do the talking."
            : "No lyrics for this track yet."
        }
        body={
          song?.instrumental
            ? "An instrumental recording. Take a breath and listen."
            : "Import an LRC file with your own track to follow lyrics in time."
        }
      />
    );
  if (!timed.length)
    return (
      <div className="plain-lyrics">
        {song.lyrics.split("\n").map((line, i) => (
          <p key={i}>{line || "\u00a0"}</p>
        ))}
      </div>
    );
  return (
    <div className={"timed-lyrics " + (full ? "full-lyrics" : "")}>
      {timed.map((line, i) => (
        <button
          ref={i === index ? active : null}
          className={i === index ? "active" : ""}
          key={i}
          onClick={() => player.getState().setProgress(line.time)}
        >
          {line.text || "♪"}
        </button>
      ))}
    </div>
  );
}
export default function PlayerPanels() {
  const s = player();
  if (!s.showQueue && !s.showLyrics) return null;
  return (
    <aside className="player-panel">
      <header>
        <div>
          <span className="eyebrow">KEEP LISTENING</span>
          <h2>{s.showQueue ? "Up Next" : "Lyrics"}</h2>
        </div>
        <IconButton
          label="Close player panel"
          onClick={() =>
            player.setState({ showQueue: false, showLyrics: false })
          }
        >
          <X size={20} />
        </IconButton>
      </header>
      {s.showLyrics ? (
        <Lyrics />
      ) : (
        <>
          <div className="queue-heading">
            <span>{s.queue.length} tracks in queue</span>
            <button className="small-link" onClick={s.clearUpcoming}>
              Clear upcoming
            </button>
          </div>
          <div className="queue-list">
            {s.queue.map((song, i) => (
              <div
                key={song.id + ":" + i}
                className={
                  "queue-track " + (i === s.currentIndex ? "active" : "")
                }
              >
                <button
                  className="queue-track-open"
                  onClick={() => s.playSong(song, s.queue, i)}
                >
                  <Cover src={song.coverUrl} alt="" />
                  <span>
                    <b>{song.title}</b>
                    <small>{song.artist}</small>
                  </span>
                </button>
                <div className="queue-track-buttons">
                  <IconButton
                    label={"Move " + song.title + " up in queue"}
                    onClick={() => s.moveInQueue(i, -1)}
                    disabled={i === 0}
                  >
                    <ArrowUp size={13} />
                  </IconButton>
                  <IconButton
                    label={"Move " + song.title + " down in queue"}
                    onClick={() => s.moveInQueue(i, 1)}
                    disabled={i === s.queue.length - 1}
                  >
                    <ArrowDown size={13} />
                  </IconButton>
                  <IconButton
                    label={"Remove " + song.title + " from queue"}
                    onClick={() => s.removeFromQueue(i)}
                  >
                    <X size={14} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
