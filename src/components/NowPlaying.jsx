import { useState, useEffect } from 'react'
import {
  X, Maximize2, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Volume2, Star, MoreHorizontal,
  MessageSquare, ListMusic
} from 'lucide-react'
import usePlayerStore from '../store/usePlayerStore'
import { useDataStore } from '../store/useDataStore'
import { formatDuration } from '../utils/helpers'

const sampleLyrics = [
  "In the silence of the night",
  "We find our way through shadows",
  "Dancing with the moonlight",
  "Whispers carry on the wind",
  "",
  "Every note a story told",
  "Melodies of days gone by",
  "Hearts that beat in rhythm",
  "Souls that learn to fly",
  "",
  "Through the waves of sound we ride",
  "Finding peace in every stride",
  "Music is the bridge between",
  "The world we know and dreams unseen",
  "",
  "Let the melody unfold",
  "Stories waiting to be told",
  "In this moment, here and now",
  "We remember, we allow",
]

export default function NowPlaying() {
  const {
    currentSong, isPlaying, progress, duration,
    shuffle, repeat, volume,
    togglePlay, nextSong, prevSong, setProgress,
    toggleShuffle, toggleRepeat, closeNowPlaying, setVolume,
  } = usePlayerStore()
  
  const albums = useDataStore(state => state.albums)
  
  const albumTitle = currentSong?.album || albums.find(a => a.id === currentSong?.albumId)?.title || 'Unknown Album'
  const artistName = typeof currentSong?.artist === 'string' ? currentSong.artist : currentSong?.artist?.name || 'Unknown Artist'
  const coverImg = currentSong?.coverUrl || currentSong?.cover || 'https://via.placeholder.com/320/333/666?text=?'

  const [activeLyricIndex, setActiveLyricIndex] = useState(3)

  // Simulate lyric scrolling
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setActiveLyricIndex(prev => (prev + 1) % sampleLyrics.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [isPlaying])

  if (!currentSong) return null

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      {/* Background with album art blur */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={coverImg}
          alt=""
          className="w-full h-full object-cover scale-[1.8] blur-[80px] opacity-35"
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={closeNowPlaying}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <X size={16} />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white">
              <Maximize2 size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/[0.08] rounded-full px-3 py-1.5">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 accent-white"
              />
              <Volume2 size={14} className="text-white/70" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center px-8 pb-8 gap-10">
          {/* Left - Album Art & Controls */}
          <div className="w-[380px] flex-shrink-0 flex flex-col items-center">
            {/* Album Art */}
            <div className="w-[320px] h-[320px] rounded-xl overflow-hidden shadow-album mb-6">
              <img
                src={coverImg}
                alt={albumTitle}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = `https://via.placeholder.com/320/333/666?text=${encodeURIComponent(currentSong.title[0])}` }}
              />
            </div>

            {/* Song Info */}
            <div className="w-full px-4">
              <div className="flex items-center justify-between mb-1">
                <div className="min-w-0 flex-1">
                  <h2 className="text-white text-lg font-semibold truncate">{currentSong.title}</h2>
                  <p className="text-white/50 text-sm">
                    {artistName} — {albumTitle}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                  <button className="p-1.5 text-white/50 hover:text-white transition-colors">
                    <Star size={16} className={currentSong.isFavourite ? 'fill-am-red text-am-red' : ''} />
                  </button>
                  <button className="p-1.5 text-white/50 hover:text-white transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div
                  className="w-full h-[3px] bg-white/15 rounded-full cursor-pointer group hover:h-[5px] transition-all"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const ratio = (e.clientX - rect.left) / rect.width
                    setProgress(Math.floor(ratio * duration))
                  }}
                >
                  <div
                    className="h-full bg-white/65 rounded-full transition-[width] duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-white/40 tabular-nums">{formatDuration(progress)}</span>
                  <span className="text-[10px] text-white/40 tabular-nums">-{formatDuration(Math.max(0, duration - progress))}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-5 mt-3">
                <button
                  onClick={toggleShuffle}
                  className={`p-1 transition-colors ${shuffle ? 'text-white' : 'text-white/35 hover:text-white/60'}`}
                >
                  <Shuffle size={16} />
                </button>
                <button
                  onClick={prevSong}
                  className="p-1 text-white/75 hover:text-white transition-colors"
                >
                  <SkipBack size={22} fill="currentColor" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-2 text-white hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                </button>
                <button
                  onClick={nextSong}
                  className="p-1 text-white/75 hover:text-white transition-colors"
                >
                  <SkipForward size={22} fill="currentColor" />
                </button>
                <button
                  onClick={toggleRepeat}
                  className={`p-1 transition-colors ${repeat !== 'off' ? 'text-white' : 'text-white/35 hover:text-white/60'}`}
                >
                  {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Right - Lyrics */}
          <div className="flex-1 h-full flex flex-col justify-center overflow-hidden">
            <div className="space-y-5">
              {sampleLyrics.map((line, i) => {
                if (!line) return <div key={i} className="h-3" />
                const distance = Math.abs(i - activeLyricIndex)
                const isActive = i === activeLyricIndex
                return (
                  <p
                    key={i}
                    className={`text-[28px] font-bold transition-all duration-700 ease-out cursor-pointer
                      ${isActive
                        ? 'text-white opacity-100'
                        : distance === 1
                          ? 'text-white/30 opacity-60'
                          : distance === 2
                            ? 'text-white/15 opacity-40'
                            : 'text-white/8 opacity-20'
                      }`}
                  >
                    {line}
                  </p>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-end px-6 pb-4 gap-2">
          <button className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors text-white/60">
            <MessageSquare size={14} />
          </button>
          <button className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors text-white/60">
            <ListMusic size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
