import { getRecentlyAddedGrouped } from '../utils/helpers'
import usePlayerStore from '../store/usePlayerStore'
import { useDataStore } from '../store/useDataStore'
import { useNavigate } from 'react-router-dom'

function AlbumGridCard({ album, songs }) {
  const navigate = useNavigate()
  const playSong = usePlayerStore(s => s.playSong)
  const albumSongs = songs.filter(s => s.albumId === album.id)

  const artistName = typeof album.artist === 'string' ? album.artist : album.artist?.name || 'Unknown Artist'

  return (
    <div className="group cursor-pointer" onClick={() => navigate(`/album/${album.id}`)}>
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
            className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-lg hover:scale-105"
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
      <h4 className="text-[13px] font-medium text-am-text truncate leading-tight">{album.title}</h4>
      <p className="text-[11px] text-am-text-secondary truncate mt-0.5">{artistName}</p>
    </div>
  )
}

export default function RecentlyAddedPage() {
  const albums = useDataStore(state => state.albums)
  const songs = useDataStore(state => state.songs)
  
  const grouped = getRecentlyAddedGrouped(albums, songs)

  return (
    <div className="px-6 pb-8 animate-fade-in">
      {Object.entries(grouped).map(([label, groupAlbums]) => (
        <section key={label} className="mb-7">
          <h2 className="text-[18px] font-bold text-am-text mb-3 tracking-tight">{label}</h2>
          <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
            {groupAlbums.map(album => (
              <AlbumGridCard key={album.id} album={album} songs={songs} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
