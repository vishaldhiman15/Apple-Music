import { useLocation, useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'

const pageSearchLabels = {
  '/library/recent': 'Find in Recently Added',
  '/library/artists': 'Find in Artists',
  '/library/albums': 'Find in Albums',
  '/library/songs': 'Find in Songs',
  '/playlist/favourites': 'Find in Playlist',
  '/playlists': 'Find in Playlists',
}

export default function TopBar({ searchQuery, onSearchChange }) {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  const isHome = path === '/'
  const isSearch = path === '/search'
  const isLibraryOrPlaylist = path.startsWith('/library') || path.startsWith('/playlist') || path === '/playlists'
  const isArtistDetail = path.startsWith('/library/artists/')

  const searchPlaceholder = pageSearchLabels[path] || 'Search'

  return (
    <header className="h-topbar flex items-center justify-between px-4 topbar-glass relative z-10 flex-shrink-0 gap-3">
      {/* Left — Navigation arrows */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded-md text-am-text-muted hover:text-am-text hover:bg-white/[0.06] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => navigate(1)}
          className="p-1 rounded-md text-am-text-muted hover:text-am-text hover:bg-white/[0.06] transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Center — Search bar (for Home/Browse pages) */}
      {(isHome || isSearch) && (
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-[380px] group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-am-text-muted group-focus-within:text-am-text-secondary transition-colors" />
            <input
              type="text"
              placeholder="Apple Music"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange?.(e.target.value)
                if (e.target.value.trim() && !isSearch) {
                  navigate('/search')
                }
              }}
              className="w-full bg-am-input text-am-text text-[13px] rounded-lg py-[6px] pl-9 pr-3 placeholder:text-am-text-muted focus:bg-am-input-hover focus:ring-1 focus:ring-white/10 transition-all"
            />
          </div>
        </div>
      )}

      {/* Center — Search bar (for Library pages) */}
      {isLibraryOrPlaylist && !isArtistDetail && (
        <div className="flex-1" />
      )}

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Sort/Filter + Search for library pages */}
        {isLibraryOrPlaylist && (
          <>
            <button className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-am-text-muted hover:text-am-text-secondary">
              <SlidersHorizontal size={16} />
            </button>
            <div className="relative w-48 group">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-am-text-muted group-focus-within:text-am-text-secondary transition-colors" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full bg-am-input text-am-text text-[12px] rounded-md py-[5px] pl-7 pr-2.5 placeholder:text-am-text-muted focus:bg-am-input-hover focus:ring-1 focus:ring-white/10 transition-all"
              />
            </div>
          </>
        )}

        {/* Apple Music / Library segmented control */}
        {(isHome || isSearch) && (
          <div className="flex bg-white/[0.06] rounded-md overflow-hidden p-[2px]">
            <button className={`px-3 py-[3px] text-[11px] font-semibold rounded-[4px] transition-all ${!isSearch ? 'bg-white/[0.1] text-am-text shadow-sm' : 'text-am-text-muted hover:text-am-text-secondary'}`}>
              Apple Music
            </button>
            <button className={`px-3 py-[3px] text-[11px] font-semibold rounded-[4px] transition-all ${isSearch ? 'bg-white/[0.1] text-am-text shadow-sm' : 'text-am-text-muted hover:text-am-text-secondary'}`}>
              Library
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
