import { useOutletContext } from 'react-router-dom'
import { categories } from '../data/constants'
import { useDataStore } from '../store/useDataStore'
import usePlayerStore from '../store/usePlayerStore'

function CategoryCard({ category }) {
  return (
    <div className="relative rounded-[10px] overflow-hidden aspect-[4/3] cursor-pointer group">
      <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient}`} />
      {category.image && (
        <img
          src={category.image}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-55 transition-opacity mix-blend-overlay"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}
      <div className="absolute inset-0 category-overlay" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white text-[13px] font-semibold leading-tight drop-shadow-md">
          {category.name}
        </h3>
      </div>
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.06] transition-opacity duration-200" />
    </div>
  )
}

export default function SearchPage() {
  const { searchQuery } = useOutletContext() || { searchQuery: '' }
  const songs = useDataStore(s => s.songs)
  const playSong = usePlayerStore(s => s.playSong)

  const query = searchQuery?.toLowerCase().trim()
  
  const searchResults = query
    ? songs.filter(s => 
        s.title?.toLowerCase().includes(query) || 
        (typeof s.artist === 'string' ? s.artist.toLowerCase().includes(query) : s.artist?.name?.toLowerCase().includes(query))
      )
    : []

  if (query) {
    return (
      <div className="px-6 pb-8 animate-fade-in">
        <h1 className="text-[28px] font-bold text-am-text mb-5 tracking-tight">Search Results</h1>
        {searchResults.length === 0 ? (
          <p className="text-am-text-muted">No results found for "{searchQuery}"</p>
        ) : (
          <div className="flex flex-col">
            {searchResults.map((song) => (
              <div 
                key={song.id} 
                className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] rounded-md cursor-pointer group"
                onClick={() => playSong(song, searchResults)}
              >
                <img 
                  src={song.coverUrl || song.cover || 'https://via.placeholder.com/40/2a2a2c/666'} 
                  alt={song.title}
                  className="w-10 h-10 rounded shadow-sm object-cover" 
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-am-text font-medium truncate">{song.title}</div>
                  <div className="text-[12px] text-am-text-secondary truncate">
                    {typeof song.artist === 'string' ? song.artist : song.artist?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-6 pb-8 animate-fade-in">
      <h1 className="text-[28px] font-bold text-am-text mb-5 tracking-tight">Browse</h1>
      <div className="grid grid-cols-4 xl:grid-cols-5 gap-3">
        {categories.map(cat => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  )
}
