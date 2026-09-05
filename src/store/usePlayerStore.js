import { create } from 'zustand'
import { useDataStore } from './useDataStore'
import { useAuthStore } from './useAuthStore'
import { Howl } from 'howler'

let sound = null

const usePlayerStore = create((set, get) => {
  const initialSongs = useDataStore.getState().songs
  return {
    // ── Player State ──
    currentSong: initialSongs[0],
    isPlaying: false,
    queue: [...initialSongs],
    currentIndex: 0,
    volume: 0.8,
    progress: 0,
    duration: initialSongs[0]?.duration || 0,
    shuffle: false,
    repeat: 'off',
    showNowPlaying: false,
    showLyrics: false,
    showQueue: false,

    // ── Actions ──
    playSong: (song, songList) => {
      const queue = songList || get().queue
      const index = queue.findIndex(s => s.id === song.id)
      
      set({
        currentSong: song,
        queue,
        currentIndex: index >= 0 ? index : 0,
        progress: 0,
        duration: song.duration,
      })

      get().loadAndPlay(song)

      const userId = useAuthStore.getState().currentUser
      if (song.albumId) {
        useDataStore.getState().addToRecentlyPlayed(userId, song.albumId)
      }
    },

    loadAndPlay: (song) => {
      if (sound) {
        sound.unload()
      }
      if (!song) return

      const src = song.audioUrl || song.audio
      if (!src) return

      sound = new Howl({
        src: [src],
        html5: true,
        volume: get().volume,
        onend: () => {
          if (get().repeat === 'one') {
            sound.play()
          } else {
            get().nextSong()
          }
        }
      })
      sound.play()
      set({ isPlaying: true })
    },

    togglePlay: () => {
      const { isPlaying } = get()
      if (sound) {
        if (isPlaying) sound.pause()
        else sound.play()
      }
      set({ isPlaying: !isPlaying })
    },
    
    pause: () => {
      if (sound) sound.pause()
      set({ isPlaying: false })
    },
    
    play: () => {
      if (sound) sound.play()
      set({ isPlaying: true })
    },

    nextSong: () => {
      const { queue, currentIndex, shuffle, repeat } = get()
      let nextIndex

      if (shuffle) {
        nextIndex = Math.floor(Math.random() * queue.length)
      } else if (currentIndex < queue.length - 1) {
        nextIndex = currentIndex + 1
      } else if (repeat === 'all') {
        nextIndex = 0
      } else {
        if (sound) sound.stop()
        set({ isPlaying: false, progress: 0 })
        return
      }

      const nextSong = queue[nextIndex]
      if (nextSong) {
        set({
          currentSong: nextSong,
          currentIndex: nextIndex,
          progress: 0,
          duration: nextSong.duration,
        })
        get().loadAndPlay(nextSong)
        
        const userId = useAuthStore.getState().currentUser
        if (nextSong.albumId) {
          useDataStore.getState().addToRecentlyPlayed(userId, nextSong.albumId)
        }
      }
    },

    prevSong: () => {
      const { queue, currentIndex, progress } = get()
      if (progress > 3) {
        if (sound) sound.seek(0)
        set({ progress: 0 })
        return
      }

      const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1
      const prevSong = queue[prevIndex]
      if (prevSong) {
        set({
          currentSong: prevSong,
          currentIndex: prevIndex,
          progress: 0,
          duration: prevSong.duration,
        })
        get().loadAndPlay(prevSong)
        
        const userId = useAuthStore.getState().currentUser
        if (prevSong.albumId) {
          useDataStore.getState().addToRecentlyPlayed(userId, prevSong.albumId)
        }
      }
    },

    setVolume: (vol) => {
      const newVol = Math.max(0, Math.min(1, vol))
      if (sound) sound.volume(newVol)
      set({ volume: newVol })
    },
    
    setProgress: (prog) => {
      if (sound) sound.seek(prog)
      set({ progress: prog })
    },

    updateProgress: () => {
      if (sound && get().isPlaying) {
        set({ progress: sound.seek() })
      }
    },

    toggleShuffle: () => set(state => ({ shuffle: !state.shuffle })),

    toggleRepeat: () => set(state => {
      const modes = ['off', 'all', 'one']
      const currentIdx = modes.indexOf(state.repeat)
      return { repeat: modes[(currentIdx + 1) % modes.length] }
    }),

    toggleNowPlaying: () => set(state => ({ showNowPlaying: !state.showNowPlaying })),
    
    closeNowPlaying: () => set({ showNowPlaying: false }),

    toggleLyrics: () => set(state => ({ showLyrics: !state.showLyrics })),

    toggleQueue: () => set(state => ({ showQueue: !state.showQueue })),

    toggleFavourite: (songId) => {
      const userId = useAuthStore.getState().currentUser
      useDataStore.getState().toggleFavourite(userId, songId)
    },
  }
})

export default usePlayerStore
