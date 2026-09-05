import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import usePlayerStore from '../store/usePlayerStore'
import { useAuthStore } from '../store/useAuthStore'
import { useDataStore } from '../store/useDataStore'

function TopPickCard({ pick }) {
  return (
    <div className={`relative rounded-xl overflow-hidden aspect-[16/9] min-w-[320px] flex-shrink-0 cursor-pointer group bg-gradient-to-br ${pick.gradient} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
      {pick.image && (
        <img
          src={pick.image}
          alt={pick.title}
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 group-hover:opacity-55 transition-opacity duration-500"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}

      {pick.badge && (
        <div className="absolute top-3 right-3">
          <span className="text-white/90 text-[9px] font-bold tracking-wider uppercase bg-white/[0.12] backdrop-blur-md rounded-full px-2.5 py-0.5 border border-white/15">
            ♫ Music
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 top-pick-gradient">
        <p className="text-white/60 text-[10px] font-semibold tracking-wide uppercase mb-0.5">{pick.label}</p>
        <h3 className="text-white text-xl font-bold leading-tight line-clamp-1">{pick.title}</h3>
        {pick.subtitle && (
          <p className="text-white/50 text-[12px] mt-0.5 line-clamp-1">{pick.subtitle}</p>
        )}
      </div>

      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.06] transition-colors duration-300" />
    </div>
  )
}

function AlbumCard({ album, songs }) {
  const navigate = useNavigate()
  const playSong = usePlayerStore(s => s.playSong)
  const allSongs = songs.filter(s => s.albumId === album.id)

  const handlePlay = (e) => {
    e.stopPropagation()
    if (allSongs.length > 0) {
      playSong(allSongs[0], allSongs)
    }
  }

  const artistName = typeof album.artist === 'string' ? album.artist : album.artist?.name || 'Unknown Artist'

  return (
    <div className="group cursor-pointer" onClick={() => navigate(`/album/${album.id}`)}>
      <div className="relative rounded-lg overflow-hidden aspect-square mb-2 shadow-md group-hover:shadow-lg transition-shadow duration-300">
        <img
          src={album.coverUrl || album.cover}
          alt={album.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/180/2a2a2c/666?text=${encodeURIComponent(album.title?.substring(0, 2) || '?')}`
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
          <div 
            onClick={handlePlay}
            className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 shadow-lg hover:scale-105"
          >
            <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <h4 className="text-[13px] font-medium text-am-text truncate leading-tight">{album.title}</h4>
      <p className="text-[12px] text-am-text-secondary truncate mt-0.5">{artistName}</p>
    </div>
  )
}

function RecommendationRow({ title, displayAlbums, songs }) {
  if (!displayAlbums || displayAlbums.length === 0) return null

  return (
    <section className="mb-8">
      <div className="flex items-center gap-0.5 mb-3 group cursor-pointer w-fit">
        <h2 className="text-[20px] font-bold text-am-text tracking-tight group-hover:text-am-red transition-colors">{title}</h2>
        <ChevronRight size={20} className="text-am-text-muted group-hover:text-am-red transition-colors mt-0.5" />
      </div>
      <div className="scroll-row scrollbar-hide">
        {displayAlbums.map(album => (
          <AlbumCard key={album.id} album={album} songs={songs} />
        ))}
      </div>
    </section>
  )
}

export default function HomePage() {
  const currentUser = useAuthStore(state => state.currentUser)
  const userData = useDataStore(state => state.getUserData(currentUser))
  const albums = useDataStore(state => state.albums)
  const songs = useDataStore(state => state.songs)

  // Generate dynamic top picks from albums
  const dynamicTopPicks = albums.slice(0, 4).map((a, i) => ({
    id: `tp${i}`,
    label: i === 0 ? 'Made for You' : 'New Release',
    title: a.title,
    subtitle: typeof a.artist === 'string' ? a.artist : a.artist?.name,
    gradient: ['from-red-600 to-orange-500', 'from-gray-700 to-gray-900', 'from-orange-500 to-yellow-400', 'from-yellow-500 to-orange-400'][i % 4],
    image: a.coverUrl || a.cover,
    badge: i % 2 === 0
  }))

  const recentlyPlayedAlbums = userData.recentlyPlayed.map(id => albums.find(a => a.id === id)).filter(Boolean)
  const madeForYouAlbums = albums.slice(0, 5)
  const stationsAlbums = albums.slice(5, 10)

  return (
    <div className="px-6 pb-8 animate-fade-in">
      {/* Header */}
      <h1 className="text-[28px] font-bold text-am-text mb-6 tracking-tight">Listen Now</h1>

      {/* Top Picks */}
      {dynamicTopPicks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[20px] font-bold text-am-text mb-3 tracking-tight">Top Picks for You</h2>
          <div className="scroll-row scrollbar-hide -mx-6 px-6">
            {dynamicTopPicks.map(pick => (
              <TopPickCard key={pick.id} pick={pick} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Played */}
      <RecommendationRow
        title="Recently Played"
        displayAlbums={recentlyPlayedAlbums}
        songs={songs}
      />

      {/* Curated rows */}
      <RecommendationRow
        title="Made for You"
        displayAlbums={madeForYouAlbums}
        songs={songs}
      />

      <RecommendationRow
        title="Stations for You"
        displayAlbums={stationsAlbums}
        songs={songs}
      />
    </div>
  )
}
