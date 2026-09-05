import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import RecentlyAddedPage from './pages/RecentlyAddedPage'
import ArtistsPage from './pages/ArtistsPage'
import AlbumsPage from './pages/AlbumsPage'
import SongsPage from './pages/SongsPage'
import PlaylistPage from './pages/PlaylistPage'
import AlbumDetailPage from './pages/AlbumDetailPage'
import UploadPage from './pages/UploadPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import NewPage from './pages/NewPage'
import RadioPage from './pages/RadioPage'
import PlaylistsPage from './pages/PlaylistsPage'
import { useAuthStore } from './store/useAuthStore'
import { useDataStore } from './store/useDataStore'

export default function App() {
  const fetchProfile = useAuthStore(state => state.fetchProfile)
  const fetchCatalog = useDataStore(state => state.fetchCatalog)
  const currentUser = useAuthStore(state => state.currentUser)
  const fetchUserPlaylists = useDataStore(state => state.fetchUserPlaylists)
  const setUserData = useDataStore(state => state.setUserData)

  useEffect(() => {
    fetchProfile()
    fetchCatalog()
  }, [])

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser)
      fetchUserPlaylists(currentUser.token)
    }
  }, [currentUser])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<AppLayout />}>
        <Route path="upload" element={<UploadPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/new" element={<NewPage />} />
        <Route path="/radio" element={<RadioPage />} />
        <Route path="/library/recent" element={<RecentlyAddedPage />} />
        <Route path="/library/artists" element={<ArtistsPage />} />
        <Route path="/library/artists/:artistId" element={<ArtistsPage />} />
        <Route path="/library/albums" element={<AlbumsPage />} />
        <Route path="/library/songs" element={<SongsPage />} />
        <Route path="/album/:albumId" element={<AlbumDetailPage />} />
        <Route path="/playlist/favourites" element={<PlaylistPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
      </Route>
    </Routes>
  )
}
