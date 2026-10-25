import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import OnlinePage from "./pages/OnlinePage";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import PlaylistPage from "./pages/PlaylistPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import UploadPage from "./pages/UploadPage";
import AuthPage from "./pages/AuthPage";
import NewPage from "./pages/NewPage";
import RadioPage from "./pages/RadioPage";
import SettingsPage from "./pages/SettingsPage";
import Modals from "./components/Modals";
import { Toast } from "./components/UI";
import { useAuthStore } from "./store/useAuthStore";
import { useDataStore } from "./store/useDataStore";
import { useUIStore } from "./store/useUIStore";
import player from "./store/usePlayerStore";
export default function App() {
  const user = useAuthStore((s) => s.currentUser),
    theme = useUIStore((s) => s.theme);
  useEffect(() => {
    useAuthStore.getState().fetchProfile();
    useDataStore.getState().fetchCatalog();
  }, []);
  useEffect(() => {
    player.getState().resetLibrary();
    useDataStore.getState().switchUser(user);
  }, [user?._id]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector("meta[name=theme-color]")
      ?.setAttribute("content", theme === "dark" ? "#141416" : "#f8f7f5");
  }, [theme]);
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to music
      </a>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage register />} />
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="online" element={<OnlinePage />} />
          <Route path="new" element={<NewPage />} />
          <Route path="radio" element={<RadioPage />} />
          <Route
            path="library/recent"
            element={<LibraryPage view="recent" />}
          />
          <Route
            path="library/artists"
            element={<LibraryPage view="artists" />}
          />
          <Route
            path="library/artists/:artistId"
            element={<LibraryPage view="artists" />}
          />
          <Route
            path="library/albums"
            element={<LibraryPage view="albums" />}
          />
          <Route path="library/songs" element={<LibraryPage view="songs" />} />
          <Route path="album/:albumId" element={<AlbumDetailPage />} />
          <Route path="playlist/:id" element={<PlaylistPage />} />
          <Route path="playlists" element={<PlaylistsPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Modals />
      <Toast />
    </>
  );
}
