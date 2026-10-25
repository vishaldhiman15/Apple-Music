import { useEffect, useState } from "react";
import { Globe2, ArrowUpRight, Loader2, RefreshCw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../store/useDataStore";
import { AlbumCard, SectionHead, SongTable, Empty } from "./UI";
export default function OnlineMusic({
  query = "",
  genre = "",
  compact = false,
}) {
  const [tracks, setTracks] = useState([]),
    [status, setStatus] = useState("loading"),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const nav = useNavigate();
  useEffect(() => {
    let alive = true;
    setStatus("loading");
    const timer = setTimeout(
      () => {
        useDataStore
          .getState()
          .fetchOnline({ query, genre })
          .then((r) => {
            if (alive) {
              setTracks(r.tracks);
              setStatus("ready");
            }
          })
          .catch((e) => {
            if (alive) {
              setError(e.message);
              setStatus("error");
            }
          });
      },
      query ? 400 : 0,
    );
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, genre, retry]);
  return (
    <section className="online-music-section">
      <SectionHead
        title={
          compact
            ? "Trending online"
            : query
              ? "From the Audius catalog"
              : "Music without the walls"
        }
        subtitle="Stream music from independent artists on Audius."
        action={
          compact ? (
            <button className="small-link" onClick={() => nav("/online")}>
              Explore online <ArrowUpRight size={14} />
            </button>
          ) : (
            <a
              className="small-link"
              href="https://audius.co"
              target="_blank"
              rel="noreferrer"
            >
              Powered by Audius <ArrowUpRight size={14} />
            </a>
          )
        }
      />
      {status === "loading" ? (
        <div className="online-loading" role="status">
          <Loader2 size={19} className="spin" />
          Finding your next favorite…
        </div>
      ) : status === "error" ? (
        <div className="online-error" role="status">
          <Globe2 size={21} />
          <div>
            <b>The online catalog is taking a moment.</b>
            <p>{error}</p>
          </div>
          <button
            className="btn secondary"
            onClick={() => setRetry((r) => r + 1)}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      ) : tracks.length ? (
        compact ? (
          <div className="album-grid online-album-grid">
            {tracks.slice(0, 6).map((t) => (
              <AlbumCard
                key={t.id}
                album={{
                  id: t.albumId,
                  title: t.title,
                  artist: t.artist,
                  coverUrl: t.coverUrl,
                  sourceName: "Audius",
                }}
              />
            ))}
          </div>
        ) : (
          <SongTable songs={tracks} />
        )
      ) : (
        <Empty
          icon={Search}
          title="No streamable matches just yet."
          body="Try an artist, a different spelling, or a genre. Availability depends on the Audius catalog."
        />
      )}
    </section>
  );
}
