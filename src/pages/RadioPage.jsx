import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Radio, Play, Shuffle, Headphones, Check } from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import player from "../store/usePlayerStore";
import { Cover, SongTable, SectionHead } from "../components/UI";
export default function RadioPage() {
  const { songs, albums } = useDataStore();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(params.get("genre") || "Electronic");
  const genres = [...new Set(songs.map((s) => s.genre).filter(Boolean))];
  const tracks = songs.filter((s) => s.genre === selected);
  const color = albums.find((a) => a.genre === selected)?.color || "#56393e";
  function play(genre) {
    const list = songs.filter((s) => s.genre === genre);
    if (!list.length) return;
    setSelected(genre);
    player.setState({ shuffle: true, repeat: "all" });
    player
      .getState()
      .playSong(list[Math.floor(Math.random() * list.length)], list);
  }
  return (
    <div className="page-container radio-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">LESS CHOOSING. MORE LISTENING.</span>
          <h1>
            Find your frequency<span className="heading-dot">.</span>
          </h1>
        </div>
        <Radio size={27} />
      </header>
      <section className="radio-hero" style={{ "--radio-color": color }}>
        <div className="radio-orbits">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div>
          <span className="eyebrow">YOUR LIBRARY. IN CONTINUOUS ROTATION.</span>
          <h2>
            {selected}
            <br />
            on a wavelength.
          </h2>
          <p>
            A never-ending mix from your collection.
            <br />
            Press play. Let it find its own way.
          </p>
          <button className="btn btn-white" onClick={() => play(selected)}>
            <Play size={16} fill="currentColor" /> Start station
          </button>
        </div>
        <div className="radio-word">
          radio<span>∞</span>
        </div>
      </section>
      <section>
        <SectionHead
          title="What’s your mood?"
          subtitle="Every station plays tracks from your library."
        />
        <div className="radio-stations">
          {genres.map((g) => (
            <button
              key={g}
              className={"station-card " + (selected === g ? "selected" : "")}
              onClick={() => setSelected(g)}
            >
              <Cover src={albums.find((a) => a.genre === g)?.coverUrl} alt="" />
              <span>
                <Radio size={16} />
                <b>{g}</b>
                <small>
                  {songs.filter((s) => s.genre === g).length} tracks in rotation
                </small>
              </span>
              {selected === g ? <Check size={18} /> : <Play size={17} />}
            </button>
          ))}
        </div>
      </section>
      <section>
        <SectionHead
          title={"In the " + selected.toLowerCase() + " rotation"}
          action={
            <button className="small-link" onClick={() => play(selected)}>
              <Shuffle size={14} /> Play station
            </button>
          }
        />
        <SongTable songs={tracks} />
      </section>
    </div>
  );
}
