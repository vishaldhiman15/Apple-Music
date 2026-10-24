import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Headphones,
  Radio,
  Heart,
  Plus,
} from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import { useUIStore } from "../store/useUIStore";
import player from "../store/usePlayerStore";
import { recommendAlbums } from "../lib/catalog";
import { AlbumCard, Cover, SectionHead, IconButton } from "../components/UI";
const MOODS = {
  All: null,
  Focus: ["Ambient", "Lo-fi", "Classical"],
  Chill: ["Soul", "Jazz", "Acoustic", "R&B"],
  Energy: ["Electronic", "Dance"],
  Unwind: ["Ambient", "Acoustic", "Classical"],
};
export default function HomePage() {
  const { songs, albums, userData } = useDataStore();
  const [mood, setMood] = useState("All");
  const nav = useNavigate();
  const selected = recommendAlbums(albums, songs, userData).filter(
    (a) => !MOODS[mood] || MOODS[mood].includes(a.genre),
  );
  const recent = userData.recentlyPlayed
    .map((id) => albums.find((a) => a.id === id))
    .filter(Boolean);
  const featured = albums.find((a) => a.title === "After Hours") || albums[0];
  const secondary = albums.find((a) => a.title === "Soft Focus") || albums[1];
  const playAlbum = (a) => {
    const tracks = songs.filter((s) => s.albumId === a.id);
    if (tracks.length) player.getState().playSong(tracks[0], tracks);
  };
  return (
    <div className="home-page page-container">
      <header className="page-heading">
        <div>
          <span className="eyebrow">A SOUNDTRACK FOR EVERY SIDE OF YOU</span>
          <h1>
            Listen Now<span className="heading-dot">.</span>
          </h1>
        </div>
        <p>Your world. In sound.</p>
      </header>
      <div className="mood-tabs" aria-label="Listening mood">
        {Object.keys(MOODS).map((m) => (
          <button
            key={m}
            className={mood === m ? "active" : ""}
            onClick={() => setMood(m)}
          >
            {m === "All" && <Sparkles size={13} />} {m}
          </button>
        ))}
      </div>
      <section className="feature-grid">
        {featured && (
          <article className="feature-card main-feature">
            <Cover
              src={
                featured.demo
                  ? "/artwork/hero-after-hours.svg"
                  : featured.coverUrl
              }
              alt=""
              className="feature-background"
            />
            <div className="feature-shade" />
            <div className="feature-top">
              <span>
                <i /> THE AFTER-HOURS EDIT
              </span>
              <span className="feature-logo">MUSIC MAX / 001</span>
            </div>
            <div className="feature-copy">
              <span className="feature-kicker">WHEN THE CITY GOES QUIET</span>
              <h2>
                Stay up.
                <br />
                Tune in.
              </h2>
              <p>
                A little darker. A little deeper.
                <br />
                Find your rhythm after hours.
              </p>
              <button
                className="btn btn-white"
                onClick={() => playAlbum(featured)}
              >
                <Play size={15} fill="currentColor" /> Listen now
              </button>
              <button
                className="feature-details"
                aria-label="Explore After Hours"
                onClick={() => nav("/album/" + featured.id)}
              >
                <ArrowUpRight size={22} />
              </button>
            </div>
            <div className="feature-bottom">
              <span>NIGHT TAPES — AFTER HOURS</span>
              <span>ORIGINAL RECORDINGS</span>
            </div>
          </article>
        )}
        {secondary && (
          <article className="feature-card secondary-feature">
            <Cover
              src={secondary.coverUrl}
              alt=""
              className="feature-background"
            />
            <div className="secondary-shade" />
            <div className="feature-top">
              <span>ROOM TO BREATHE</span>
              <Headphones size={20} />
            </div>
            <div className="soft-orbit">
              <i />
              <i />
              <i />
            </div>
            <div className="feature-copy">
              <span className="feature-kicker">A SOFTER SIDE OF SOUND</span>
              <h2>
                Less noise.
                <br />
                More feeling.
              </h2>
              <p>Quiet moments, beautifully scored.</p>
              <button
                className="feature-text-button"
                onClick={() => playAlbum(secondary)}
              >
                Find your focus <ArrowUpRight size={17} />
              </button>
            </div>
          </article>
        )}
      </section>
      <section className="album-section">
        <SectionHead
          title={
            mood === "All" ? "Made for your kind of day" : mood + " starts here"
          }
          subtitle={
            userData.history.length
              ? "A mix shaped by what you love."
              : "A few favorites to get you started."
          }
          to="/library/albums"
        />
        <div className="album-shelf">
          {selected.slice(0, 6).map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </div>
      </section>
      {recent.length > 0 && (
        <section className="album-section">
          <SectionHead
            title="Pick up where you left off"
            subtitle="Good music deserves another listen."
            to="/library/recent"
          />
          <div className="album-shelf">
            {recent.slice(0, 6).map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        </section>
      )}
      <section className="quick-picks">
        <SectionHead
          title="Your next little obsession"
          subtitle="One tap away from something good."
          to="/library/songs"
        />
        <div className="quick-pick-grid">
          {selected.slice(0, 6).map((a) => {
            const song = songs.find((s) => s.albumId === a.id);
            if (!song) return null;
            return (
              <div className="quick-pick" key={song.id}>
                <button
                  className="quick-pick-open"
                  onClick={() =>
                    player.getState().playSong(
                      song,
                      songs.filter((s) => s.genre === song.genre),
                    )
                  }
                >
                  <Cover src={a.coverUrl} alt="" />
                  <span>
                    <b>{song.title}</b>
                    <small>{song.artist}</small>
                  </span>
                </button>
                <button
                  className="quick-pick-play"
                  aria-label={"Play " + song.title}
                  onClick={() =>
                    player.getState().playSong(
                      song,
                      songs.filter((s) => s.genre === song.genre),
                    )
                  }
                >
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <section className="mix-section">
        <SectionHead
          title="Find your frequency"
          subtitle="A mood, a moment, a whole new direction."
          to="/radio"
        />
        <div className="mix-grid">
          {[
            [
              "focus",
              "Deep focus",
              "A little room to think.",
              "Ambient",
              "#5e7765",
            ],
            [
              "night",
              "Midnight drive",
              "For the scenic route home.",
              "Electronic",
              "#82606b",
            ],
            [
              "warm",
              "Sunday kind of feeling",
              "Slow down. Stay a while.",
              "Soul",
              "#a67c52",
            ],
          ].map(([id, title, description, genre, color]) => (
            <button
              key={id}
              className={"mix-card mix-" + id}
              style={{ "--mix-color": color }}
              onClick={() => nav("/radio?genre=" + genre)}
            >
              <span className="mix-kicker">
                <Radio size={13} /> LIBRARY STATION
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="mix-play">
                <Play size={16} fill="currentColor" />
              </span>
              <div className="mix-decoration">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </button>
          ))}
        </div>
      </section>
      <div className="home-note">
        <span>
          <MusicNote /> {songs.filter((s) => s.demo).length} original demo
          tracks. A whole world of your own to add.
        </span>
        <button onClick={() => nav("/upload")}>
          Make it yours <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
function MusicNote() {
  return <Headphones size={14} />;
}
