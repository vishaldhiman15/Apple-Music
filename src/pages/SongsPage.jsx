import { useState } from 'react'
import {
  Star, MoreHorizontal, Volume2, Cloud
} from 'lucide-react'
import { formatDuration } from '../utils/helpers'
import usePlayerStore from '../store/usePlayerStore'
import { useAuthStore } from '../store/useAuthStore'
import { useDataStore } from '../store/useDataStore'

export default function SongsPage() {
  const playSong = usePlayerStore(s => s.playSong)
  const currentSong = usePlayerStore(s => s.currentSong)
  const isPlaying = usePlayerStore(s => s.isPlaying)

  const currentUser = useAuthStore(state => state.currentUser)
  const userData = useDataStore(state => state.getUserData(currentUser))
  const toggleFavourite = useDataStore(state => state.toggleFavourite)
  
  const storeSongs = useDataStore(state => state.songs)
  const albums = useDataStore(state => state.albums)
  const artists = useDataStore(state => state.artists)

  const [sortBy, setSortBy] = useState('artist')
  
  const songsWithMetadata = storeSongs.map(s => ({
    ...s,
    artistName: typeof s.artist === 'string' ? s.artist : (s.artist?.name || artists.find(a => a.id === s.artistId)?.name || 'Unknown Artist'),
    albumTitle: s.album || albums.find(a => a.id === s.albumId)?.title || 'Unknown Album',
  }))

  const sortedSongs = [...songsWithMetadata].sort((a, b) => {
    switch (sortBy) {
      case 'title': return (a.title || '').localeCompare(b.title || '')
      case 'artist': return a.artistName.localeCompare(b.artistName)
      case 'album': return a.albumTitle.localeCompare(b.albumTitle)
      case 'genre': return (a.genre || '').localeCompare(b.genre || '')
      case 'plays': return (b.plays || 0) - (a.plays || 0)
      default: return a.artistName.localeCompare(b.artistName)
    }
  })

  const headers = [
    { key: null, label: '#', width: 'w-8 text-center' },
    { key: null, label: '', width: 'w-6' }, // star
    { key: 'title', label: 'Title', width: 'flex-[2.5]' },
    { key: 'artist', label: 'Artist', width: 'flex-1' },
    { key: 'album', label: 'Album', width: 'flex-1' },
    { key: 'genre', label: 'Genre', width: 'w-24' },
    { key: null, label: '', width: 'w-6' }, // more
    { key: 'time', label: 'Time', width: 'w-14 text-right' },
    { key: 'plays', label: 'Plays', width: 'w-12 text-right' },
  ]

  return (
    <div className="px-2 animate-fade-in">
      {/* Table Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 am-divider text-[10px] text-am-text-muted uppercase tracking-wider sticky top-0 bg-am-bg/95 backdrop-blur-sm z-10">
        {headers.map((h, i) => (
          <div
            key={i}
            className={`${h.width} ${h.key ? 'cursor-pointer hover:text-am-text-secondary transition-colors' : ''} truncate`}
            onClick={() => h.key && h.key !== 'time' && setSortBy(h.key)}
          >
            <span className={sortBy === h.key ? 'text-am-text-secondary font-semibold' : ''}>
              {h.label}
            </span>
            {sortBy === h.key && <span className="ml-0.5 text-[8px]">▲</span>}
          </div>
        ))}
      </div>

      {/* Song Rows */}
      <div>
        {sortedSongs.map((song, idx) => {
          const isCurrentPlaying = currentSong?.id === song.id
          const isFav = userData.favourites.includes(song.id)

          return (
            <div
              key={song.id}
              className={`song-row flex items-center gap-2 px-3 py-[6px] cursor-pointer group ${isCurrentPlaying ? 'playing' : ''}`}
              onDoubleClick={() => playSong(song, sortedSongs)}
            >
              {/* # */}
              <div className="w-8 text-center text-[12px] text-am-text-muted tabular-nums">
                {isCurrentPlaying && isPlaying ? (
                  <div className="flex items-end justify-center gap-[2px] h-3">
                    <div className="eq-bar" />
                    <div className="eq-bar" />
                    <div className="eq-bar" />
                  </div>
                ) : (
                  idx + 1
                )}
              </div>

              {/* Star */}
              <div
                className="w-6 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavourite(currentUser, song.id)
                }}
              >
                {isFav ? (
                  <Star size={10} className="text-am-red fill-am-red hover:scale-125 transition-transform" />
                ) : (
                  <Star size={10} className="text-am-text-muted opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-white transition-all" />
                )}
              </div>

              {/* Title */}
              <div className="flex-[2.5] min-w-0">
                <span className={`text-[13px] truncate block ${isCurrentPlaying ? 'text-am-red font-medium' : 'text-am-text'}`}>
                  {song.title}
                </span>
              </div>

              {/* Artist */}
              <div className="flex-1 text-[13px] text-am-text-secondary truncate">
                {song.artistName}
              </div>

              {/* Album */}
              <div className="flex-1 text-[13px] text-am-text-secondary truncate">
                {song.albumTitle}
              </div>

              {/* Genre */}
              <div className="w-24 text-[13px] text-am-text-secondary truncate">
                {song.genre}
              </div>

              {/* More */}
              <div className="w-6 flex items-center justify-center">
                <MoreHorizontal size={13} className="text-am-text-muted opacity-0 group-hover:opacity-60 transition-opacity" />
              </div>

              {/* Time */}
              <div className="w-14 text-[12px] text-am-text-secondary tabular-nums text-right">
                {formatDuration(song.duration)}
              </div>

              {/* Plays */}
              <div className="w-12 text-[12px] text-am-text-secondary text-right tabular-nums">
                {song.plays > 0 ? song.plays : ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
