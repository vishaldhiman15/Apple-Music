import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useDataStore } from '../store/useDataStore'
import usePlayerStore from '../store/usePlayerStore'
import { useAuthStore } from '../store/useAuthStore'

function AlbumGridCard({ album, songs, onClick }) {
  const playSong = usePlayerStore(s => s.playSong)
  const albumSongs = songs.filter(s => s.albumId === album.id)

  const artistName = typeof album.artist === 'string' ? album.artist : album.artist?.name || 'Unknown Artist'

  return (
    <div className="group cursor-pointer" onClick={() => onClick(album.id)}>
      <div className="relative rounded-lg overflow-hidden aspect-square mb-2">
        <img
          src={album.coverUrl || album.cover}
          alt={album.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/200/2a2a2c/666?text=${encodeURIComponent(album.title?.substring(0, 2) || '?')}`
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <div
            className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-lg"
            onClick={(e) => {
              e.stopPropagation()
              if (albumSongs.length > 0) playSong(albumSongs[0], albumSongs)
            }}
          >
            <svg className="w-4.5 h-4.5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-1">
        <h4 className="text-[13px] font-medium text-am-text truncate leading-tight flex-1">{album.title}</h4>
      </div>
      <p className="text-[11px] text-am-text-secondary truncate mt-0.5">{artistName}</p>
    </div>
  )
}

export default function AlbumsPage() {
  const navigate = useNavigate()
  const albums = useDataStore(state => state.albums)
  const songs = useDataStore(state => state.songs)

  return (
    <div className="px-6 pb-8 animate-fade-in">
      <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
        {albums.map(album => (
          <AlbumGridCard
            key={album.id}
            album={album}
            songs={songs}
            onClick={(id) => navigate(`/album/${id}`)}
          />
        ))}
      </div>
    </div>
  )
}
