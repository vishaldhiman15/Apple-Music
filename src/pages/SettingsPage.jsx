import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Keyboard,
  Clock3,
  HardDrive,
  Cloud,
  LogOut,
  Download,
  Trash2,
  Headphones,
  SlidersHorizontal,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useDataStore } from "../store/useDataStore";
import { useUIStore } from "../store/useUIStore";
import player from "../store/usePlayerStore";
import { offlineIds, clearOffline } from "../lib/offline";
import { Brand } from "../components/UI";
export default function SettingsPage() {
  const { currentUser, logout, updateProfile } = useAuthStore();
  const { userData, localCount, clearHistory } = useDataStore();
  const { theme, setTheme, setModal, notify } = useUIStore();
  const s = player();
  const [name, setName] = useState(currentUser?.name || ""),
    [saving, setSaving] = useState(false),
    [offlineCount, setOfflineCount] = useState(offlineIds().length);
  const nav = useNavigate();
  async function signout() {
    try {
      await logout();
      notify("Signed out. Your device library is ready.");
      nav("/");
    } catch (e) {
      notify(e.message);
    }
  }
  return (
    <div className="page-container settings-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">MAKE THE EXPERIENCE YOURS</span>
          <h1>
            Your kind of listening<span className="heading-dot">.</span>
          </h1>
        </div>
        <SlidersHorizontal size={25} />
      </header>
      <div className="settings-grid">
        <div>
          <section className="settings-card">
            <h2>A little about you</h2>
            <div className="settings-account">
              <span className="account-avatar large">
                {currentUser ? (
                  currentUser.name.slice(0, 1).toUpperCase()
                ) : (
                  <Headphones size={24} />
                )}
              </span>
              <div>
                <b>{currentUser?.name || "Your device library"}</b>
                <p>
                  {currentUser?.email || "No account needed to make it yours."}
                </p>
              </div>
              <span className="status-tag">
                {currentUser ? (
                  <>
                    <Cloud size={12} />
                    Synced
                  </>
                ) : (
                  <>
                    <HardDrive size={12} />
                    Device
                  </>
                )}
              </span>
            </div>
            {currentUser ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSaving(true);
                  try {
                    await updateProfile({ name });
                    notify("Looking good. Your name is updated.");
                  } catch (e) {
                    notify(e.message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <label>
                  Display name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={60}
                  />
                </label>
                <button className="btn secondary" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </form>
            ) : (
              <p className="setting-description">
                Playlists, favorites, and imported music are saved in this
                browser. They stay here when you come back.
              </p>
            )}
          </section>
          <section className="settings-card">
            <h2>Set the mood</h2>
            <div className="setting-row">
              <span>
                <b>Appearance</b>
                <small>Find your favorite light.</small>
              </span>
              <button
                className="btn secondary"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}{" "}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>
            <div className="setting-row">
              <span>
                <b>Sleep timer</b>
                <small>
                  {s.sleepUntil
                    ? "Playback will pause at " +
                      new Date(s.sleepUntil).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Let the music tuck itself in."}
                </small>
              </span>
              <select
                aria-label="Sleep timer"
                value={s.sleepUntil ? "active" : "off"}
                onChange={(e) => s.setSleepTimer(Number(e.target.value) || 0)}
              >
                {s.sleepUntil && <option value="active">Timer active</option>}
                <option value="off">Off</option>
                {[5, 15, 30, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} minutes
                  </option>
                ))}
              </select>
            </div>
            <div className="setting-row">
              <span>
                <b>Sound profile</b>
                <small>A little warmth. A little presence.</small>
              </span>
              <select
                aria-label="Sound profile"
                value={s.eq}
                onChange={(e) => s.setEqualizer(e.target.value)}
              >
                <option value="flat">Balanced</option>
                <option value="warm">Warm</option>
                <option value="vocal">Vocal</option>
                <option value="bright">Bright</option>
              </select>
            </div>
            <div className="setting-row">
              <span>
                <b>Keyboard shortcuts</b>
                <small>Good music at your fingertips.</small>
              </span>
              <button
                className="small-link"
                onClick={() => setModal({ type: "shortcuts" })}
              >
                <Keyboard size={17} />
                View shortcuts
              </button>
            </div>
          </section>
          <section className="settings-card">
            <h2>Your library, your control</h2>
            <div className="setting-row">
              <span>
                <b>Listening history</b>
                <small>
                  {userData.history.length} tracks remembered on this device.
                </small>
              </span>
              <button
                className="small-link"
                onClick={() => {
                  clearHistory();
                  notify("Listening history cleared.");
                }}
              >
                Clear history
              </button>
            </div>
            <div className="setting-row">
              <span>
                <b>Saved offline</b>
                <small>
                  {offlineCount} demo tracks cached for offline listening.
                </small>
              </span>
              <button
                className="small-link"
                onClick={async () => {
                  try {
                    await clearOffline();
                    setOfflineCount(0);
                    notify("Offline demo copies cleared.");
                  } catch (e) {
                    notify(e.message);
                  }
                }}
              >
                Clear cache
              </button>
            </div>
            <div className="setting-row">
              <span>
                <b>Imported recordings</b>
                <small>{localCount} recordings stored in this browser.</small>
              </span>
              <button
                className="small-link"
                onClick={() => nav("/library/songs")}
              >
                Manage library <ArrowUpRight size={14} />
              </button>
            </div>
            {currentUser && (
              <div className="setting-row">
                <span>
                  <b>Sign out</b>
                  <small>
                    Your cloud library will be here when you return.
                  </small>
                </span>
                <button className="small-link danger" onClick={signout}>
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </section>
        </div>
        <div>
          <section className="settings-feature">
            <span className="eyebrow">THE MORE YOU LISTEN</span>
            <h2>
              A little more
              <br />
              like you.
            </h2>
            <p>
              Your listening history and favorites help shape the
              recommendations on Listen Now. Genres and artists you return to
              get a little more room in your mix.
            </p>
            <div className="library-stats">
              <div>
                <strong>{userData.favourites.length}</strong>
                <span>favorites</span>
              </div>
              <div>
                <strong>{userData.playlists.length}</strong>
                <span>playlists</span>
              </div>
              <div>
                <strong>{localCount}</strong>
                <span>your tracks</span>
              </div>
            </div>
          </section>
          <section className="settings-card about-card">
            <Brand />
            <p>
              Music Max builds on the original Apple-Music project by Vishal
              Dhiman. An independent player with original demo recordings and a
              home for your own collection.
            </p>
            <p>
              The demo artist names and albums are fictional. Audio quality
              depends on the source recording. This app does not provide an
              Apple Music subscription or access to its catalog.
            </p>
            <a
              href="https://github.com/vishaldhiman15/Apple-Music"
              target="_blank"
              rel="noreferrer"
            >
              View the project <ArrowUpRight size={13} />
            </a>
            <small>Version 2.0 · Made to be listened to.</small>
          </section>
        </div>
      </div>
    </div>
  );
}
