import { useState } from "react";
import { Globe2, Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import OnlineMusic from "../components/OnlineMusic";
const genres = [
  "All",
  "Electronic",
  "Hip-Hop/Rap",
  "House",
  "Pop",
  "Ambient",
  "Jazz",
  "Rock",
  "Classical",
];
export default function OnlinePage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || ""),
    [genre, setGenre] = useState("");
  return (
    <div className="page-container online-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">CONNECTED TO SOMETHING NEW</span>
          <h1>
            A world of music<span className="heading-dot">.</span>
          </h1>
          <p>Discover independent artists. Press play on something real.</p>
        </div>
        <Globe2 size={29} />
      </header>
      <form
        className="large-search"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(query ? { q: query } : {});
        }}
      >
        <Search size={22} />
        <input
          aria-label="Search online music"
          placeholder="Find songs and artists on Audius…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear online search"
            onClick={() => {
              setQuery("");
              setParams({});
            }}
          >
            <X size={18} />
          </button>
        )}
      </form>
      <div className="filter-pills online-genres">
        {genres.map((g) => (
          <button
            key={g}
            className={(genre || "All") === g ? "active" : ""}
            onClick={() => setGenre(g === "All" ? "" : g)}
          >
            {g}
          </button>
        ))}
      </div>
      <OnlineMusic query={query} genre={genre} />
      <p className="provider-note">
        Music is streamed directly from Audius. Artist names, artwork, and
        availability come from its catalog. Gated or unavailable tracks are
        excluded. Your Cloudinary uploads are available in your library.
      </p>
    </div>
  );
}
