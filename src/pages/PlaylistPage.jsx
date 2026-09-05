import { useParams } from 'react-router-dom'
import {
  Play, Shuffle, Star, MoreHorizontal, Download, ListMusic
} from 'lucide-react'
import { formatDuration } from '../utils/helpers'
import usePlayerStore from '../store/usePlayerStore'
import { useAuthStore } from '../store/useAuthStore'
import { useDataStore } from '../store/useDataStore'

export default function PlaylistPage() {
  const { id } = useParams()

  const playSong = usePlayerStore(s => s.playSong)
  const currentSong = usePlayerStore(s => s.currentSong)
  const isPlaying = usePlayerStore(s => s.isPlaying)

  const currentUser = useAuthStore(state => state.currentUser)
  const userData = useDataStore(state => state.getUserData(currentUser))
  const toggleFavourite = useDataStore(state => state.toggleFavourite)
  
  const storeSongs = useDataStore(state => state.songs)
  const albums = useDataStore(state => state.albums)
  const artists = useDataStore(state => state.artists)

  const isFavourites = id === 'favourites'

  let playlistInfo = {}
  let playlistSongs = []
  
  const getSongById = (songId) => {
    let s = null
    if (typeof songId === 'object' && songId !== null) {
      // If populated
      s = storeSongs.find(x => x.id === songId._id || x.id === songId.id) || songId
    } else {
      s = storeSongs.find(x => x.id === songId)
    }
    if (!s) return null
    return {
      ...s,
      artistName: typeof s.artist === 'string' ? s.artist : (s.artist?.name || artists.find(a => a.id === s.artistId)?.name || 'Unknown Artist'),
      albumTitle: s.album || albums.find(a => a.id === s.albumId)?.title || 'Unknown Album',
    }
  }

  if (isFavourites) {
    playlistInfo = {
      name: 'Favourite Songs',
      icon: Star,
      iconColor: 'text-am-red fill-am-red/80',
      bgGradient: 'from-red-500/15 to-red-600/5'
    }
    playlistSongs = userData.favourites.map(getSongById).filter(Boolean)
  } else {
    const p = userData.playlists.find(p => p.id === id)
    if (p) {
      playlistInfo = {
        name: p.name,
        icon: ListMusic,
        iconColor: 'text-white/60',
        bgGradient: 'from-white/[0.06] to-white/[0.02]'
      }
      playlistSongs = (p.songs || []).map(getSongById).filter(Boolean)
    } else {
      return <div className="p-6 text-am-text-muted text-[13px]">Playlist not found</div>
    }
  }

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) playSong(playlistSongs[0], playlistSongs)
  }

  const handleShuffle = () => {
    if (playlistSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * playlistSongs.length)
      playSong(playlistSongs[randomIndex], playlistSongs)
      usePlayerStore.setState({ shuffle: true })
    }
  }

  const Icon = playlistInfo.icon

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-5 px-6 pb-0 pt-2">
        <div className={`w-[180px] h-[180px] rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br ${playlistInfo.bgGradient} flex items-center justify-center border border-white/[0.04] shadow-album`}>
          <Icon size={64} className={playlistInfo.iconColor} />
        </div>

        <div className="flex-1 pt-3">
          <h1 className="text-[28px] font-bold text-am-text mb-4 tracking-tight">
            {playlistInfo.name}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-1.5 px-5 py-[7px] rounded-md bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-am-red text-[13px] font-medium transition-colors"
            >
              <Play size={13} fill="currentColor" />
              Play
            </button>
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-5 py-[7px] rounded-md bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-am-red text-[13px] font-medium transition-colors"
            >
              <Shuffle size={13} />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Song List */}
      <div className="mt-5">
        <div className="flex items-center gap-2.5 px-6 py-1.5 am-divider text-[10px] text-am-text-muted uppercase tracking-wider">
          <div className="w-4" />
          <div className="w-9" />
          <div className="flex-1">Song</div>
          <div className="w-14 text-right">Time</div>
          <div className="w-6" />
        </div>

        <div>
          {playlistSongs.length === 0 && (
            <div className="p-6 text-am-text-muted text-[13px]">
              No songs in this playlist.
            </div>
          )}
          {playlistSongs.map(song => {
            const isCurrentPlaying = currentSong?.id === song.id
            const isFav = userData.favourites.includes(song.id)

            return (
              <div
                key={song.id}
                className={`song-row flex items-center gap-2.5 px-6 py-[6px] cursor-pointer group ${isCurrentPlaying ? 'playing' : ''}`}
                onClick={() => playSong(song, playlistSongs)}
              >
                {/* Star */}
                <div
                  className="w-4 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavourite(currentUser, song.id)
                  }}
                >
                  {isFav ? (
                    <Star size={9} className="text-am-red fill-am-red hover:scale-125 transition-transform" />
                  ) : (
                    <Star size={9} className="text-am-text-muted opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-white transition-all" />
                  )}
                </div>

                {/* Album art */}
                <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={song.coverUrl || song.cover}
                    alt={song.albumTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/36/2a2a2c/666?text=${encodeURIComponent(song.title[0])}`
                    }}
                  />
                </div>

                {/* Song info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] truncate ${isCurrentPlaying ? 'text-am-red font-medium' : 'text-am-text'}`}>
                    {song.title}
                  </p>
                  <p className="text-[11px] text-am-text-secondary truncate">
                    {song.artistName} — {song.albumTitle}
                  </p>
                </div>

                {/* Duration */}
                <div className="w-14 text-right text-[12px] text-am-text-secondary tabular-nums">
                  {formatDuration(song.duration)}
                </div>

                {/* More */}
                <button className="w-6 flex justify-center p-0.5 text-am-text-muted opacity-0 group-hover:opacity-60 transition-opacity">
                  <MoreHorizontal size={13} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
