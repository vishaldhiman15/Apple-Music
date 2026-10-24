import { useParams, useNavigate } from "react-router-dom";
import { Play, Shuffle, Plus, ArrowLeft, Disc3 } from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import { useUIStore } from "../store/useUIStore";
import player from "../store/usePlayerStore";
import {
  Cover,
  SongTable,
  Empty,
  AlbumCard,
  SectionHead,
} from "../components/UI";
import { formatTotal } from "../utils/helpers";
export default function AlbumDetailPage() {
  const { albumId } = useParams(),
    nav = useNavigate();
  const { albums, songs } = useDataStore();
  const a = albums.find((a) => a.id === albumId);
  if (!a)
    return (
      <Empty
        icon={Disc3}
        title="This album isn’t in your library."
        body="Discover something new or import a recording of your own."
        action={
          <button
            className="btn primary"
            onClick={() => nav("/library/albums")}
          >
            Explore albums
          </button>
        }
      />
    );
  const tracks = songs.filter((s) => s.albumId === a.id);
  function play(shuffle = false) {
    if (!tracks.length) return;
    player.setState({ shuffle });
    player
      .getState()
      .playSong(
        shuffle ? tracks[Math.floor(Math.random() * tracks.length)] : tracks[0],
        tracks,
      );
  }
  return (
    <div className="detail-page page-container">
      <section
        className="collection-hero"
        style={{ "--collection-color": a.color || "#3d3547" }}
      >
        <div className="collection-glow" />
        <Cover src={a.coverUrl} alt={a.title} className="collection-art" />
        <div className="collection-info">
          <span className="eyebrow">
            {a.local ? "FROM YOUR COLLECTION" : "ALBUM · " + (a.year || "2026")}
          </span>
          <h1>{a.title}</h1>
          <button
            className="artist-link"
            onClick={() => nav("/library/artists/" + a.artistId)}
          >
            {a.artist}
          </button>
          <p>{a.description || "A little space to get lost in the music."}</p>
          <div className="collection-metadata">
            <span>{a.genre}</span>
            <i />
            <span>{tracks.length} tracks</span>
            <i />
            <span>
              {formatTotal(tracks.reduce((n, s) => n + s.duration, 0))}
            </span>
          </div>
          <div className="collection-actions">
            <button className="btn primary" onClick={() => play()}>
              <Play size={15} fill="currentColor" /> Play
            </button>
            <button className="btn secondary" onClick={() => play(true)}>
              <Shuffle size={16} /> Shuffle
            </button>
            <button
              className="circle-action"
              aria-label="Add album to playlist"
              onClick={() =>
                useUIStore.getState().setModal({ type: "add", songs: tracks })
              }
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </section>
      <SongTable songs={tracks} />
      <p className="recording-note">
        {a.local
          ? "Imported to this device. Your recording stays in your browser."
          : tracks.every((s) => s.demo)
            ? "Original instrumental demo recordings, created for Music Max. All artists and releases in this demo collection are fictional."
            : "From your connected music library."}
      </p>
      <section className="album-section">
        <SectionHead title="Keep the feeling going" to="/library/albums" />
        <div className="album-shelf">
          {albums
            .filter(
              (x) =>
                x.id !== a.id &&
                (x.artistId === a.artistId || x.genre === a.genre),
            )
            .slice(0, 6)
            .map((x) => (
              <AlbumCard key={x.id} album={x} />
            ))}
        </div>
      </section>
    </div>
  );
}
