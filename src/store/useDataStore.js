import { create } from 'zustand'
import { categories } from '../data/constants'

export const useDataStore = create((set, get) => ({
  songs: [],
  albums: [],
  artists: [],
  categories: categories,
  userData: { favourites: [], recentlyPlayed: [], playlists: [], topPicks: [] },

  fetchCatalog: async () => {
    try {
      const res = await fetch('/api/songs')
      if (!res.ok) throw new Error('Backend not available')
      
      const songs = await res.json()
      
      const albumsMap = new Map()
      const artistsMap = new Map()
      
      songs.forEach(song => {
        if (song.albumId) albumsMap.set(song.albumId._id, { id: song.albumId._id, ...song.albumId })
        if (song.artist) artistsMap.set(song.artist._id, { id: song.artist._id, ...song.artist })
        
        song.id = song._id
        song.albumId = song.albumId._id
        song.artistId = song.artist._id
      })

      set({ 
        songs, 
        albums: Array.from(albumsMap.values()), 
        artists: Array.from(artistsMap.values()) 
      })
    } catch (err) {
      console.warn('Backend unavailable or error occurred.', err)
    }
  },

  fetchUserPlaylists: async (token) => {
    if (!token) return
    try {
      const res = await fetch('/api/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const playlists = await res.json()
      set(state => ({
        userData: { ...state.userData, playlists: playlists.map(p => ({ ...p, id: p._id })) }
      }))
    } catch (err) {
      console.error('Failed to fetch playlists', err)
    }
  },

  setUserData: (user) => {
    set(state => ({
      userData: {
        ...state.userData,
        favourites: Array.isArray(user.favourites) ? user.favourites : [],
        recentlyPlayed: Array.isArray(user.recentlyPlayed) ? user.recentlyPlayed : []
      }
    }))
  },

  getUserData: () => get().userData, // Returns current session's data

  toggleFavourite: async (currentUser, songId) => {
    if (!currentUser) return
    try {
      const res = await fetch('/api/users/favourites', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ songId })
      })
      const favourites = await res.json()
      set(state => ({
        userData: { ...state.userData, favourites }
      }))
    } catch (err) {
      console.error(err)
    }
  },

  addToRecentlyPlayed: async (currentUser, albumId) => {
    if (!currentUser) return
    try {
      const res = await fetch('/api/users/recently-played', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ albumId })
      })
      const recentlyPlayed = await res.json()
      set(state => ({
        userData: { ...state.userData, recentlyPlayed }
      }))
    } catch (err) {
      console.error(err)
    }
  },

  createPlaylist: async (currentUser, name) => {
    if (!currentUser) return
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ name })
      })
      const newPlaylist = await res.json()
      newPlaylist.id = newPlaylist._id
      set(state => ({
        userData: {
          ...state.userData,
          playlists: [...state.userData.playlists, newPlaylist]
        }
      }))
    } catch (err) {
      console.error(err)
    }
  }
}))
