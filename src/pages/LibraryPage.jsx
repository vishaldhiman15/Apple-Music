import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Music2,
  Search,
  Disc3,
  Mic2,
  Heart,
  Play,
  Shuffle,
  Upload,
  Grid3X3,
  List,
  Clock3,
} from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import player from "../store/usePlayerStore";
import {
  AlbumCard,
  Cover,
  SongTable,
  Empty,
  IconButton,
} from "../components/UI";
export default function LibraryPage({ view = "albums" }) {
  const { albums, songs, artists, userData } = useDataStore();
  const nav = useNavigate();
  const { artistId } = useParams();
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState("added");
  const artist = artists.find((a) => a.id === artistId);
  let items =
    view === "recent"
      ? userData.recentlyPlayed
          .map((id) => albums.find((a) => a.id === id))
          .filter(Boolean)
      : view === "artists"
        ? artists
        : albums;
  if (artist) items = albums.filter((a) => a.artistId === artist.id);
  const label =
    artist?.name ||
    {
      songs: "Songs",
      albums: "Albums",
      artists: "Artists",
      recent: "Recently Played",
    }[view];
  const filtered = items.filter((x) =>
    (x.title || x.name).toLowerCase().includes(query.toLowerCase()),
  );
  const tracks = songs.filter((s) =>
    (s.title + " " + s.artist + " " + s.albumTitle)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  if (sort === "name") {
    filtered.sort((a, b) =>
      (a.title || a.name).localeCompare(b.title || b.name),
    );
    tracks.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "artist") {
    filtered.sort((a, b) =>
      (a.artist || a.name || "").localeCompare(b.artist || b.name || ""),
    );
    tracks.sort((a, b) => a.artist.localeCompare(b.artist));
  }
  const displayed = view === "songs" ? tracks.length : filtered.length;
  return (
    <div className="page-container library-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">YOUR WORLD. ALL HERE.</span>
          <h1>
            {label}
            <span className="heading-dot">.</span>
          </h1>
          <p>
            {artist
              ? "The sound of " + artist.name
              : displayed +
                " " +
                (view === "songs"
                  ? "tracks"
                  : view === "artists"
                    ? "artists"
                    : "albums") +
                " to make yourself at home with."}
          </p>
        </div>
        <button className="btn secondary" onClick={() => nav("/upload")}>
          <Upload size={15} /> Import music
        </button>
      </header>
      <div className="library-toolbar">
        <div className="inline-search">
          <Search size={15} />
          <input
            aria-label={"Filter " + label}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={"Find in " + label.toLowerCase()}
          />
        </div>
        <select
          aria-label="Sort library"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="added">Library order</option>
          <option value="name">Title A–Z</option>
          <option value="artist">Artist A–Z</option>
        </select>
      </div>
      {view === "songs" ? (
        <SongTable songs={tracks} />
      ) : view === "artists" && !artist ? (
        <div className="artists-grid">
          {filtered.map((a) => (
            <button
              className="artist-card"
              key={a.id}
              onClick={() => nav("/library/artists/" + a.id)}
            >
              <Cover src={a.image} alt={a.name} />
              <b>{a.name}</b>
              <small>
                {songs.filter((s) => s.artistId === a.id).length} tracks
              </small>
            </button>
          ))}
        </div>
      ) : (
        <div className="album-grid">
          {filtered.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </div>
      )}
      {displayed === 0 && (
        <Empty
          icon={view === "recent" ? Clock3 : Music2}
          title={
            view === "recent"
              ? "Good music is worth coming back to."
              : "A little quiet here."
          }
          body={
            query
              ? "Try a different title or artist."
              : view === "recent"
                ? "Play a track and your recent albums will appear here."
                : "Import your recordings to start building your collection."
          }
        />
      )}
    </div>
  );
}
