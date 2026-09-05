export function formatDuration(seconds) {
  if (!seconds) return '0:00'
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function getRecentlyAddedGrouped(albums, songs) {
  const groups = {}
  
  // Sort albums by addedDate or createdAt of their songs
  const sortedAlbums = [...albums].sort((a, b) => {
    const songA = songs.find(s => s.albumId === a.id)
    const songB = songs.find(s => s.albumId === b.id)
    
    // Fallback to a placeholder date if no songs or dates exist
    const dateA = songA?.createdAt || songA?.addedDate || '2000-01-01'
    const dateB = songB?.createdAt || songB?.addedDate || '2000-01-01'
    
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  // We'll use actual dates for grouping
  const today = new Date().toISOString().split('T')[0]
  const yesterdayDate = new Date(Date.now() - 86400000)
  const yesterday = yesterdayDate.toISOString().split('T')[0]

  sortedAlbums.forEach(album => {
    const song = songs.find(s => s.albumId === album.id)
    const rawDate = song?.createdAt || song?.addedDate || today
    
    let dateStr = ''
    try {
      dateStr = new Date(rawDate).toISOString().split('T')[0]
    } catch(e) {
      dateStr = today
    }

    let label
    if (dateStr === today) label = 'Today'
    else if (dateStr === yesterday) label = 'Yesterday'
    else label = dateStr.substring(0, 4) // Year

    if (!groups[label]) groups[label] = []
    groups[label].push(album)
  })

  return groups
}
