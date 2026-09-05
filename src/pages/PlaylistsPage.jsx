import { useNavigate } from 'react-router-dom'
import { Star, ListMusic, Plus } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useDataStore } from '../store/useDataStore'

export default function PlaylistsPage() {
  const navigate = useNavigate()

  const currentUser = useAuthStore(state => state.currentUser)
  const userData = useDataStore(state => state.getUserData(currentUser))
  const createPlaylist = useDataStore(state => state.createPlaylist)

  const handleCreatePlaylist = () => {
    const name = prompt("Enter playlist name:")
    if (name) {
      createPlaylist(currentUser, name)
    }
  }

  const playlists = [
    {
      id: 'favourites',
      name: 'Favourite Songs',
      icon: Star,
      iconColor: 'text-am-red fill-am-red/80',
      bgGradient: 'from-red-500/15 to-red-600/5',
      songCount: userData.favourites.length,
      to: '/playlist/favourites',
    },
    ...userData.playlists.map(p => ({
      id: p.id,
      name: p.name,
      icon: ListMusic,
      iconColor: 'text-white/60',
      bgGradient: 'from-white/[0.06] to-white/[0.02]',
      songCount: (p.songs || []).length,
      to: `/library/playlist/${p.id}`,
    }))
  ]

  return (
    <div className="px-6 pb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[28px] font-bold text-am-text tracking-tight">Playlists</h1>
        <button
          onClick={handleCreatePlaylist}
          className="flex items-center gap-1.5 px-4 py-[7px] rounded-md bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-am-text text-[13px] font-medium transition-colors"
        >
          <Plus size={14} />
          New Playlist
        </button>
      </div>

      <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
        {playlists.map(playlist => {
          const Icon = playlist.icon
          return (
            <div
              key={playlist.id}
              className="group cursor-pointer"
              onClick={() => navigate(playlist.to)}
            >
              <div className={`relative rounded-lg overflow-hidden aspect-square mb-2 bg-gradient-to-br ${playlist.bgGradient} flex items-center justify-center border border-white/[0.04] group-hover:border-white/[0.08] transition-colors shadow-album group-hover:scale-[1.02] duration-300`}>
                <Icon size={48} className={playlist.iconColor} />
              </div>
              <h4 className="text-[13px] font-medium text-am-text truncate leading-tight mt-1.5">
                {playlist.name}
              </h4>
              <p className="text-[11px] text-am-text-secondary mt-0.5">
                {playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
