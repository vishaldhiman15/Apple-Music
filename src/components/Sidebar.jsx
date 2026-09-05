import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  Search, Home, LayoutGrid, Radio,
  Clock, Mic2, Disc3, Music,
  ListMusic, Star, List, Upload
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useDataStore } from '../store/useDataStore'

const appleNavItems = [
  { to: '/', label: 'Listen Now', icon: Home },
  { to: '/search', label: 'Browse', icon: LayoutGrid },
  { to: '/radio', label: 'Radio', icon: Radio },
]

const libraryItems = [
  { to: '/library/recent', label: 'Recently Added', icon: Clock },
  { to: '/library/artists', label: 'Artists', icon: Mic2 },
  { to: '/library/albums', label: 'Albums', icon: Disc3 },
  { to: '/library/songs', label: 'Songs', icon: Music },
]

const playlistItems = [
  { to: '/playlists', label: 'All Playlists', icon: ListMusic },
  { to: '/playlist/favourites', label: 'Favourite Songs', icon: Star },
]

function SidebarLink({ to, label, icon: Icon }) {
  const location = useLocation()
  const isActive = to === '/library/artists'
    ? location.pathname.startsWith('/library/artists')
    : location.pathname === to

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-2.5 px-3 py-[5px] mx-2 text-[13px] rounded-md transition-all duration-150 group relative
        ${isActive
          ? 'sidebar-active'
          : 'text-am-text-secondary hover:text-am-text hover:bg-white/[0.04]'
        }`}
    >
      <Icon size={16} className={`flex-shrink-0 transition-colors ${isActive ? 'text-am-red' : 'text-am-text-muted group-hover:text-am-text-secondary'}`} strokeWidth={isActive ? 2.2 : 1.8} />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const { currentUser, users, login } = useAuthStore()
  const userData = useDataStore(state => state.getUserData())

  const currentId = currentUser?._id || currentUser?.id || currentUser
  const activeUser = users?.find(u => u.id === currentId) || users?.[0] || { name: 'Guest' }

  return (
    <aside className="w-sidebar h-full sidebar-glass flex flex-col select-none relative z-20">
      {/* macOS title bar spacer */}
      <div className="h-[52px] flex-shrink-0"></div>

      {/* Navigation */}
      <nav className="flex-1 pb-4 overflow-y-auto scrollbar-hide">
        {/* Apple Music Section */}
        <div className="mb-5">
          <p className="px-5 mb-1.5 text-[10px] font-bold text-am-text-muted uppercase tracking-[0.12em]">
            Apple Music
          </p>
          <div className="space-y-[1px]">
            {appleNavItems.map(item => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </div>
        </div>

        {/* Library */}
        <div className="mb-5">
          <p className="px-5 mb-1.5 text-[10px] font-bold text-am-text-muted uppercase tracking-[0.12em]">
            Library
          </p>
          <div className="space-y-[1px]">
            {libraryItems.map(item => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </div>
        </div>

        {/* Playlists */}
        <div className="mb-3">
          <p className="px-5 mb-1.5 text-[10px] font-bold text-am-text-muted uppercase tracking-[0.12em]">
            Playlists
          </p>
          <div className="space-y-[1px]">
            {playlistItems.map(item => (
              <SidebarLink key={item.to} {...item} />
            ))}
            {/* Dynamic Playlists */}
            {userData.playlists.map(playlist => (
              <SidebarLink
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                label={playlist.name}
                icon={List}
              />
            ))}
          </div>
        </div>

        {/* Upload — small link at bottom of nav */}
        <div className="mt-2 mx-2">
          <NavLink
            to="/upload"
            className={({ isActive }) => `flex items-center gap-2.5 px-3 py-[5px] text-[13px] rounded-md transition-all duration-150
              ${isActive ? 'sidebar-active' : 'text-am-text-muted hover:text-am-text-secondary hover:bg-white/[0.04]'}`}
          >
            <Upload size={16} strokeWidth={1.8} className="flex-shrink-0" />
            <span className="truncate">Upload</span>
          </NavLink>
        </div>
      </nav>

      {/* User Profile */}
      {currentUser ? (
        <div className="p-3 mx-2 mb-2 flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02]">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <img
              src={activeUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'}
              alt={activeUser?.name || 'User'}
              className="w-7 h-7 rounded-full bg-white/10 flex-shrink-0"
            />
            <span className="text-[12px] font-medium text-am-text truncate">{activeUser?.name || 'Guest'}</span>
          </div>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="text-[10px] uppercase font-semibold text-am-text-muted hover:text-am-red transition-colors px-1.5 py-0.5"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="p-3 mx-2 mb-2">
          <Link
            to="/login"
            className="w-full flex items-center justify-center py-2 px-4 bg-am-red hover:bg-am-red-hover text-white rounded-lg font-medium text-[13px] transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}
    </aside>
  )
}
