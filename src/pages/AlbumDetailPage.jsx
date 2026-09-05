import { useParams, useNavigate } from 'react-router-dom'
import {
  Play, Shuffle, Star, MoreHorizontal, ArrowLeft
} from 'lucide-react'
import { formatDuration } from '../utils/helpers'
import usePlayerStore from '../store/usePlayerStore'
import { useAuthStore } from '../store/useAuthStore'
import { useDataStore } from '../store/useDataStore'

export default function AlbumDetailPage() {
  const { albumId } = useParams()
  const navigate = useNavigate()
  const playSong = usePlayerStore(s => s.playSong)
  const currentSong = usePlayerStore(s => s.currentSong)
  const isPlaying = usePlayerStore(s => s.isPlaying)

  const currentUser = useAuthStore(state => state.currentUser)
  const userData = useDataStore(state => state.getUserData(currentUser))
  const toggleFavourite = useDataStore(state => state.toggleFavourite)
  
  const albums = useDataStore(state => state.albums)
  const songs = useDataStore(state => state.songs)

  const album = albums.find(a => a.id === albumId)
  const albumSongs = songs.filter(s => s.albumId === albumId)

  if (!album) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-am-text-muted">Album not found</p>
      </div>
    )
  }

  const handlePlayAll = () => {
    if (albumSongs.length > 0) {
      playSong(albumSongs[0], albumSongs)
    }
  }

  const totalDuration = albumSongs.reduce((sum, s) => sum + s.duration, 0)

  return (
    <div className="px-6 pb-8 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-0.5 text-am-red text-[13px] mb-4 hover:text-am-red-hover transition-colors font-medium"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Album Header */}
      <div className="flex gap-5 mb-6">
        <div className="w-[220px] h-[220px] rounded-lg overflow-hidden flex-shrink-0 shadow-album">
          <img
            src={album.coverUrl || album.cover}
            alt={album.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/220/2a2a2c/666?text=${encodeURIComponent(album.title?.substring(0, 2) || '?')}`
            }}
          />
        </div>

        <div className="flex-1 pt-1 flex flex-col justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-am-text mb-0.5 leading-tight tracking-tight">{album.title}</h1>
            <p className="text-am-red text-[14px] font-medium mb-0.5 cursor-pointer hover:underline">
              {typeof album.artist === 'string' ? album.artist : album.artist?.name || 'Unknown Artist'}
            </p>
            <p className="text-am-text-secondary text-[12px] mb-0.5">
              {album.genre} · {album.year}
            </p>
            <p className="text-am-text-muted text-[12px]">
              {albumSongs.length} {albumSongs.length === 1 ? 'song' : 'songs'}, {formatDuration(totalDuration)}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-1.5 px-5 py-[7px] rounded-md bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-am-red text-[13px] font-medium transition-colors"
            >
              <Play size={13} fill="currentColor" />
              Play
            </button>
            <button className="flex items-center gap-1.5 px-5 py-[7px] rounded-md bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-am-red text-[13px] font-medium transition-colors">
              <Shuffle size={13} />
              Shuffle
            </button>
            <button className="p-1.5 text-am-text-muted hover:text-am-text-secondary transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Songs */}
      <div>
        {albumSongs.map((song, idx) => {
          const isCurrentPlaying = currentSong?.id === song.id
          const isFav = userData.favourites.includes(song.id)
          return (
            <div
              key={song.id}
              className={`song-row flex items-center gap-2.5 py-[7px] px-3 cursor-pointer rounded-md group ${isCurrentPlaying ? 'playing' : ''}`}
              onClick={() => playSong(song, albumSongs)}
            >
              {/* Track # or equalizer */}
              <span className="text-am-text-muted text-[12px] w-5 text-right flex-shrink-0 tabular-nums">
                {isCurrentPlaying && isPlaying ? (
                  <span className="flex items-end justify-center gap-[2px] h-3">
                    <span className="eq-bar" />
                    <span className="eq-bar" />
                    <span className="eq-bar" />
                  </span>
                ) : (
                  idx + 1
                )}
              </span>

              {/* Star */}
              <div
                className="w-4 flex justify-center items-center"
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

              {/* Title */}
              <span className={`text-[13px] flex-1 truncate ${isCurrentPlaying ? 'text-am-red font-medium' : 'text-am-text'}`}>
                {song.title}
              </span>

              {/* Duration */}
              <span className="text-am-text-secondary text-[12px] tabular-nums">
                {formatDuration(song.duration)}
              </span>

              {/* More */}
              <button className="p-0.5 text-am-text-muted opacity-0 group-hover:opacity-60 transition-opacity">
                <MoreHorizontal size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
