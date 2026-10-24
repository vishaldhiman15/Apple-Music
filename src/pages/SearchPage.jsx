import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, X, ArrowUpRight, Compass, Play } from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import {
  AlbumCard,
  SongTable,
  Cover,
  SectionHead,
  Empty,
  IconButton,
} from "../components/UI";
import { readStorage, writeStorage } from "../lib/storage";
export default function SearchPage() {
  const [params, setParams] = useSearchParams(),
    nav = useNavigate();
  const [query, setQuery] = useState(params.get("q") || ""),
    [tab, setTab] = useState("All"),
    [recent, setRecent] = useState(() => readStorage("music-searches", []));
  const { songs, albums, artists } = useDataStore();
  useEffect(() => setQuery(params.get("q") || ""), [params]);
  const normalize = (s) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const q = normalize(query.trim());
  const result = {
    songs: songs.filter((s) =>
      normalize(
        s.title + " " + s.artist + " " + s.genre + " " + s.albumTitle,
      ).includes(q),
    ),
    albums: albums.filter((a) =>
      normalize(a.title + " " + a.artist + " " + a.genre).includes(q),
    ),
    artists: artists.filter((a) => normalize(a.name).includes(q)),
  };
  function saveSearch(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    const list = [
      query.trim(),
      ...recent.filter((x) => x !== query.trim()),
    ].slice(0, 8);
    setRecent(list);
    writeStorage("music-searches", list);
    setParams({ q: query });
  }
  const genres = [...new Set(songs.map((s) => s.genre).filter(Boolean))];
  return (
    <div className="page-container search-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">THERE’S ALWAYS SOMETHING MORE</span>
          <h1>
            Follow your curiosity<span className="heading-dot">.</span>
          </h1>
        </div>
      </header>
      <form className="large-search" onSubmit={saveSearch}>
        <Search size={24} />
        <input
          autoFocus
          data-search
          aria-label="Search songs, artists, albums, or genres"
          placeholder="Songs, artists, albums, a feeling…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <IconButton
            label="Clear search"
            onClick={() => {
              setQuery("");
              setParams({});
            }}
          >
            <X size={20} />
          </IconButton>
        )}
      </form>
      {!q ? (
        <>
          {recent.length > 0 && (
            <section>
              <SectionHead
                title="Your recent curiosities"
                action={
                  <button
                    className="small-link"
                    onClick={() => {
                      setRecent([]);
                      writeStorage("music-searches", []);
                    }}
                  >
                    Clear
                  </button>
                }
              />
              <div className="recent-searches">
                {recent.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuery(s);
                      setParams({ q: s });
                    }}
                  >
                    <Search size={14} />
                    {s}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
            </section>
          )}
          <SectionHead
            title="Find your mood"
            subtitle="Start somewhere. See where it takes you."
          />
          <div className="genre-grid">
            {genres.map((g, i) => {
              const a = albums.find((a) => a.genre === g);
              return (
                <button
                  className={"genre-card genre-" + (i % 4)}
                  style={{ "--genre-color": a?.color || "#564662" }}
                  key={g}
                  onClick={() => {
                    setQuery(g);
                    setParams({ q: g });
                  }}
                >
                  <h2>{g}</h2>
                  <ArrowUpRight size={23} />
                  <Cover src={a?.coverUrl} alt="" />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="filter-pills">
            {["All", "Songs", "Albums", "Artists"].map((t) => (
              <button
                key={t}
                className={t === tab ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {(tab === "All" || tab === "Albums") && result.albums.length > 0 && (
            <section className="album-section">
              <SectionHead
                title="Albums"
                subtitle={`${result.albums.length} finds for “${query}”`}
              />
              <div className="album-grid">
                {result.albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            </section>
          )}
          {(tab === "All" || tab === "Artists") &&
            result.artists.length > 0 && (
              <section>
                <SectionHead title="Artists" />
                <div className="artist-result-list">
                  {result.artists.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => nav("/library/artists/" + a.id)}
                    >
                      <Cover src={a.image} alt="" />
                      <span>
                        <b>{a.name}</b>
                        <small>Artist</small>
                      </span>
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                </div>
              </section>
            )}
          {(tab === "All" || tab === "Songs") && result.songs.length > 0 && (
            <section>
              <SectionHead title="Songs" />
              <SongTable songs={result.songs} />
            </section>
          )}
          {!(tab === "All"
            ? result.songs.length + result.albums.length + result.artists.length
            : result[tab.toLowerCase()].length) && (
            <Empty
              icon={Search}
              title="Nothing here just yet."
              body="Try a different name, title, or genre. Search looks through the music in this library."
            />
          )}
        </>
      )}
    </div>
  );
}
