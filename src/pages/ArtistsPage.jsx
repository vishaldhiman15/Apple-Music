import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Play, Shuffle as ShuffleIcon, Star, MoreHorizontal, ChevronRight
} from 'lucide-react'
import { formatDuration } from '../utils/helpers'
import usePlayerStore from '../store/usePlayerStore'
import { useAuthStore } from '../store/useAuthStore'
import { useDataStore } from '../store/useDataStore'

function ArtistListItem({ artist, isSelected, onClick }) {
  return (
    <div
      onClick={() => onClick(artist.id)}
      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors rounded-md mx-2
        ${isSelected
          ? 'bg-am-red text-white'
          : 'hover:bg-white/[0.04] text-am-text'
        }`}
    >
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-am-card">
        <img
          src={artist.imageUrl || artist.image}
          alt={artist.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/28/2a2a2c/999?text=${encodeURIComponent(artist.name?.substring(0,1) || '?')}`
          }}
        />
      </div>
      <span className="text-[13px] truncate">{artist.name}</span>
    </div>
  )
}

function ArtistDetail({ artist }) {
  const playSong = usePlayerStore(s => s.playSong)
  const currentSong = usePlayerStore(s => s.currentSong)

  const currentUser = useAuthStore(state => state.currentUser)
  const userData = useDataStore(state => state.getUserData(currentUser))
  const toggleFavourite = useDataStore(state => state.toggleFavourite)
  
  const albums = useDataStore(state => state.albums)
  const songs = useDataStore(state => state.songs)

  const artistAlbums = albums.filter(a => a.artistId === artist.id)
  const artistSongs = songs.filter(s => artistAlbums.map(a => a.id).includes(s.albumId))

  const handlePlayAll = () => {
    if (artistSongs.length > 0) {
      playSong(artistSongs[0], artistSongs)
    }
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Hero */}
      <div className="flex gap-5 mb-8 items-end">
        <div className="w-[160px] h-[160px] rounded-full overflow-hidden flex-shrink-0 shadow-album border border-white/[0.04]">
          <img
            src={artist.imageUrl || artist.image}
            alt={artist.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/160/2a2a2c/666?text=${encodeURIComponent(artist.name?.substring(0, 2) || '?')}`
            }}
          />
        </div>
        <div className="flex-1 pb-1">
          <h1 className="text-[36px] font-bold text-am-text mb-3 tracking-tight leading-none">{artist.name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-1.5 px-5 py-[7px] rounded-md bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-am-red text-[13px] font-medium transition-colors"
            >
              <Play size={13} fill="currentColor" />
              Play
            </button>
            <button className="flex items-center gap-1.5 px-5 py-[7px] rounded-md bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-am-red text-[13px] font-medium transition-colors">
              <ShuffleIcon size={13} />
              Shuffle
            </button>
            <button className="p-1.5 text-am-text-muted hover:text-am-text-secondary transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Albums & Songs */}
      {artistAlbums.map(album => {
        const albumSongs = artistSongs.filter(s => s.albumId === album.id)
        return (
          <div key={album.id} className="mb-8">
            <div className="flex gap-5">
              <div className="w-[200px] h-[200px] rounded-lg overflow-hidden flex-shrink-0 shadow-album">
                <img
                  src={album.coverUrl || album.cover}
                  alt={album.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/200/2a2a2c/666?text=${encodeURIComponent(album.title?.substring(0, 2) || '?')}`
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-[18px] font-bold text-am-text mb-0.5 tracking-tight">{album.title}</h2>
                <p className="text-am-text-secondary text-[12px] mb-3">
                  {album.genre} · {album.year}
                </p>

                <div>
                  {albumSongs.map((song, idx) => {
                    const isCurrentPlaying = currentSong?.id === song.id
                    const isFav = userData.favourites.includes(song.id)
                    return (
                      <div
                        key={song.id}
                        className={`song-row flex items-center gap-2.5 py-[6px] px-2 rounded-md cursor-pointer group ${isCurrentPlaying ? 'playing' : ''}`}
                        onClick={() => playSong(song, artistSongs)}
                      >
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
                        <span className="text-am-text-muted text-[12px] w-5 flex-shrink-0 tabular-nums">
                          {idx + 1}
                        </span>
                        <span className={`text-[13px] flex-1 truncate ${isCurrentPlaying ? 'text-am-red font-medium' : 'text-am-text'}`}>
                          {song.title}
                        </span>
                        <span className="text-am-text-secondary text-[12px] tabular-nums">
                          {formatDuration(song.duration)}
                        </span>
                        <button className="p-0.5 text-am-text-muted hover:text-am-text-secondary transition-colors opacity-0 group-hover:opacity-60">
                          <MoreHorizontal size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ArtistsPage() {
  const { artistId } = useParams()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(artistId || null)
  
  const artists = useDataStore(state => state.artists)

  const selectedArtist = artists.find(a => a.id === selectedId)

  const handleSelect = (id) => {
    setSelectedId(id)
    navigate(`/library/artists/${id}`, { replace: true })
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Artist List */}
      <div className="w-[260px] border-r border-white/[0.04] overflow-y-auto scrollbar-hide py-1">
        <div
          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-white/[0.04] transition-colors rounded-md mx-2 text-am-text"
          onClick={() => { setSelectedId(null); navigate('/library/artists', { replace: true }) }}
        >
          <div className="w-7 h-7 rounded-full bg-am-card flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-am-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <span className="text-[13px]">All Artists</span>
        </div>

        {artists.map(artist => (
          <ArtistListItem
            key={artist.id}
            artist={artist}
            isSelected={selectedId === artist.id}
            onClick={handleSelect}
          />
        ))}
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto">
        {selectedArtist ? (
          <ArtistDetail artist={selectedArtist} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-am-text-muted text-[15px]">Select an Artist</p>
          </div>
        )}
      </div>
    </div>
  )
}
