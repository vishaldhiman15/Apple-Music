import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import PlayerBar from '../components/PlayerBar'
import NowPlaying from '../components/NowPlaying'
import usePlayerStore from '../store/usePlayerStore'

export default function AppLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const showNowPlaying = usePlayerStore(s => s.showNowPlaying)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-am-bg relative">
      {/* Main area (sidebar + content) */}
      <div className="flex flex-1 min-h-0 relative z-10">
        {/* Sidebar */}
        <Sidebar />

        {/* Content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-28">
            <Outlet context={{ searchQuery }} />
          </main>
        </div>
      </div>

      {/* Player Bar — docked bottom, full width */}
      <div className="absolute bottom-4 left-[220px] right-0 flex justify-center pointer-events-none z-40 px-6">
        <div className="pointer-events-auto">
          <PlayerBar />
        </div>
      </div>

      {/* Now Playing Overlay */}
      {showNowPlaying && <NowPlaying />}
    </div>
  )
}
