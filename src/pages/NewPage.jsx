import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Play, Compass } from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import { AlbumCard, SectionHead, Cover, SongTable } from "../components/UI";
import player from "../store/usePlayerStore";
export default function NewPage() {
  const { albums, songs } = useDataStore();
  const nav = useNavigate();
  return (
    <div className="page-container discover-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">A DIFFERENT PERSPECTIVE</span>
          <h1>
            Discover<span className="heading-dot">.</span>
          </h1>
          <p>Something familiar. Something unexpected. Something you.</p>
        </div>
        <Compass size={28} />
      </header>
      <div className="editorial-grid">
        {albums.slice(2, 5).map((a, i) => (
          <button
            className="editorial-card"
            key={a.id}
            onClick={() => nav("/album/" + a.id)}
          >
            <Cover src={a.coverUrl} alt="" />
            <span className="editorial-overlay" />
            <span className="editorial-tag">
              {
                [
                  "THE BLUE HOUR EDIT",
                  "FEEL-GOOD FREQUENCIES",
                  "SLOW MORNINGS",
                ][i]
              }
            </span>
            <span className="editorial-title">
              <b>{a.title}</b>
              <small>{a.artist}</small>
            </span>
            <ArrowUpRight size={22} />
          </button>
        ))}
      </div>
      <section className="album-section">
        <SectionHead
          title="New to your radar"
          subtitle="Original recordings, ready for a first listen."
          to="/library/albums"
        />
        <div className="album-shelf">
          {albums.slice(6, 12).map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </div>
      </section>
      <section>
        <SectionHead
          title="Start with these"
          subtitle="A few good reasons to press play."
        />
        <SongTable songs={songs.filter((_, i) => i % 3 === 0).slice(0, 7)} />
      </section>
    </div>
  );
}
