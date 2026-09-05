import { useState, useEffect, useRef } from 'react'
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1,
  MoreHorizontal, MessageSquare, ListMusic, Star
} from 'lucide-react'
import usePlayerStore from '../store/usePlayerStore'
import { useAuthStore } from '../store/useAuthStore'
import { useDataStore } from '../store/useDataStore'

export default function PlayerBar() {
  const {
    currentSong, isPlaying, volume, progress, duration,
    shuffle, repeat, showNowPlaying,
    togglePlay, nextSong, prevSong, setVolume, setProgress,
    toggleShuffle, toggleRepeat, toggleNowPlaying, toggleQueue,
  } = usePlayerStore()

  const currentUser = useAuthStore(state => state.currentUser)
  const userData = useDataStore(state => state.getUserData(currentUser))
  const albums = useDataStore(state => state.albums)
  const isFavourite = currentSong ? userData.favourites.includes(currentSong.id) : false

  const albumTitle = currentSong?.album || albums.find(a => a.id === currentSong?.albumId)?.title || 'Unknown Album'
  const artistName = typeof currentSong?.artist === 'string' ? currentSong.artist : currentSong?.artist?.name || 'Unknown Artist'
  const coverImg = currentSong?.coverUrl || currentSong?.cover || 'https://via.placeholder.com/48/333/666?text=?'

  const progressRef = useRef(null)

  // Sync progress with actual audio playback
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      usePlayerStore.getState().updateProgress()
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying])

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    setProgress(Math.floor(ratio * duration))
  }

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  if (!currentSong) return null

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div className="player-glass h-[56px] rounded-[28px] flex items-center px-4 gap-4 shadow-2xl border border-white/[0.06] min-w-[600px] max-w-[720px]">
      {/* ── Playback Controls ── */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleShuffle}
          className={`p-1 rounded-full transition-colors ${shuffle ? 'text-am-red' : 'text-am-text-muted hover:text-am-text-secondary'}`}
        >
          <Shuffle size={14} />
        </button>
        <button
          onClick={prevSong}
          className="p-1 rounded-full text-am-text-secondary hover:text-am-text transition-all"
        >
          <SkipBack size={18} fill="currentColor" />
        </button>
        <button
          onClick={togglePlay}
          className="p-1 rounded-full text-am-text hover:text-white transition-all"
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>
        <button
          onClick={nextSong}
          className="p-1 rounded-full text-am-text-secondary hover:text-am-text transition-all"
        >
          <SkipForward size={18} fill="currentColor" />
        </button>
        <button
          onClick={toggleRepeat}
          className={`p-1 rounded-full transition-colors ${repeat !== 'off' ? 'text-am-red' : 'text-am-text-muted hover:text-am-text-secondary'}`}
        >
          {repeat === 'one' ? <Repeat1 size={14} /> : <Repeat size={14} />}
        </button>
      </div>

      {/* ── Song Info Pill (Progress Bar) ── */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="relative flex-1 h-[42px] bg-black/25 rounded-full flex items-center p-[3px] cursor-pointer overflow-hidden group border border-white/[0.04]"
      >
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-white/[0.08] transition-all duration-300 ease-linear group-hover:bg-white/[0.12]"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Spinning album art */}
        <div className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 relative z-10 shadow-sm ${isPlaying ? 'spin-album' : 'spin-album paused'}`}>
          <img
            src={coverImg}
            alt={currentSong.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = `https://via.placeholder.com/48/333/666?text=${encodeURIComponent(currentSong.title[0])}` }}
          />
        </div>

        {/* Text Info */}
        <div className="flex-1 flex flex-col justify-center px-2.5 min-w-0 relative z-10 pointer-events-none">
          <div className="flex items-center gap-1">
            <p className="text-[12px] text-am-text truncate font-semibold tracking-tight">
              {currentSong.title}
            </p>
            {isFavourite && (
              <Star size={8} className="text-am-red fill-am-red flex-shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-am-text-secondary truncate font-medium tracking-tight">
            {artistName} — {albumTitle}
          </p>
        </div>
      </div>

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded-full text-am-text-muted hover:text-am-text-secondary transition-colors">
          <MoreHorizontal size={16} />
        </button>
        <button
          onClick={toggleNowPlaying}
          className={`p-1.5 rounded-full transition-colors ${showNowPlaying ? 'text-am-red' : 'text-am-text-muted hover:text-am-text-secondary'}`}
        >
          <MessageSquare size={14} />
        </button>
        <button
          onClick={toggleQueue}
          className="p-1.5 rounded-full text-am-text-muted hover:text-am-text-secondary transition-colors"
        >
          <ListMusic size={14} />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-1.5 ml-1 w-20 group">
          <VolumeIcon size={14} className="text-am-text-muted group-hover:text-am-text-secondary transition-colors flex-shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 accent-white"
          />
        </div>
      </div>
    </div>
  )
}
