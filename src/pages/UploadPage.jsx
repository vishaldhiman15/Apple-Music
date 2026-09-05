import { useState, useRef } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { UploadCloud, Music, Image as ImageIcon, X, Check, Loader2 } from 'lucide-react'

export default function UploadPage() {
  const currentUser = useAuthStore(state => state.currentUser)
  const [formData, setFormData] = useState({
    title: '',
    artistName: '',
    albumTitle: '',
    genre: '',
    releaseYear: new Date().getFullYear().toString(),
    explicit: false
  })
  const [duration, setDuration] = useState(null)
  
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const audioInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
  }

  const handleAudioChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAudioFile(file)
      // Extract duration
      const url = URL.createObjectURL(file)
      const audio = new Audio(url)
      audio.addEventListener('loadedmetadata', () => {
        setDuration(Math.round(audio.duration))
        URL.revokeObjectURL(url)
      })
    }
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverFile(file)
      const url = URL.createObjectURL(file)
      setCoverPreview(url)
    }
  }

  const removeAudio = () => {
    setAudioFile(null)
    setDuration(null)
    if (audioInputRef.current) audioInputRef.current.value = ''
  }

  const removeCover = () => {
    setCoverFile(null)
    setCoverPreview(null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const uploadToCloudinary = async (file, signatureData, folder) => {
    const form = new FormData()
    form.append('file', file)
    form.append('api_key', signatureData.apiKey)
    form.append('timestamp', signatureData.timestamp)
    form.append('signature', signatureData.signature)
    form.append('folder', folder)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`, {
      method: 'POST',
      body: form
    })
    
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error?.message || 'Cloudinary upload failed')
    }
    return await res.json()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!audioFile) {
      setMessage('Please select an audio file to upload.')
      setIsError(true)
      return
    }
    if (!duration) {
      setMessage('Still calculating audio duration. Please wait a moment and try again.')
      setIsError(true)
      return
    }

    setLoading(true)
    setMessage('Starting upload...')
    setIsError(false)

    try {
      // 1. Get audio signature
      setMessage('Uploading audio...')
      const audioSigRes = await fetch('/api/songs/signature', {
        headers: { Authorization: `Bearer ${currentUser?.token}` }
      })
      if (!audioSigRes.ok) throw new Error('Failed to get upload signature')
      const audioSigData = await audioSigRes.json()

      // 2. Upload audio directly to Cloudinary
      const audioUploadData = await uploadToCloudinary(audioFile, audioSigData, 'applemusic/audio')
      const audioUrl = audioUploadData.secure_url

      let coverUrl = ''
      // 3. Upload cover art if selected
      if (coverFile) {
        setMessage('Uploading artwork...')
        const coverSigRes = await fetch('/api/songs/cover-signature', {
          headers: { Authorization: `Bearer ${currentUser?.token}` }
        })
        if (!coverSigRes.ok) throw new Error('Failed to get artwork signature')
        const coverSigData = await coverSigRes.json()

        const coverUploadData = await uploadToCloudinary(coverFile, coverSigData, 'applemusic/images')
        coverUrl = coverUploadData.secure_url
      }

      // 4. Save to our database
      setMessage('Saving to library...')
      const res = await fetch('/api/songs/upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser?.token}` 
        },
        body: JSON.stringify({
          ...formData,
          duration,
          audioUrl,
          coverUrl
        })
      })

      if (res.ok) {
        setMessage('Song uploaded successfully! It is now available in your library.')
        setIsError(false)
        setFormData({ title: '', artistName: '', albumTitle: '', genre: '', releaseYear: new Date().getFullYear().toString(), explicit: false })
        removeAudio()
        removeCover()
      } else {
        const error = await res.json()
        throw new Error(error.message || 'Database save failed')
      }
    } catch (err) {
      setMessage('Upload error: ' + err.message)
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) return <div className="p-10 text-am-text text-center text-xl font-medium">Please log in to upload music.</div>

  return (
    <div className="min-h-full p-8 max-w-4xl mx-auto animate-fade-in relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-am-red/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      
      <div className="relative z-10">
        <h1 className="text-4xl font-bold text-am-text mb-2 tracking-tight">Upload Music</h1>
        <p className="text-am-text-secondary mb-10 text-lg">Add your favorite tracks to your personal library.</p>
        
        {message && (
          <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 backdrop-blur-md border ${isError ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-green-500/10 border-green-500/20 text-green-200'}`}>
            {isError ? <X size={20} /> : <Check size={20} />}
            <span className="font-medium">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column - Media Uploads */}
          <div className="col-span-1 md:col-span-4 space-y-6">
            {/* Cover Art Upload */}
            <div>
              <label className="block text-sm font-semibold text-am-text mb-3 uppercase tracking-wider text-xs">Artwork</label>
              <div 
                onClick={() => coverInputRef.current?.click()}
                className="w-full aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-am-red/50 transition-all group overflow-hidden relative shadow-xl shadow-black/20"
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium text-sm">Change Image</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); removeCover(); }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-am-red rounded-full text-white backdrop-blur-md transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon size={28} className="text-am-text-muted group-hover:text-am-text transition-colors" />
                    </div>
                    <span className="text-am-text-secondary text-sm font-medium">Select Cover Art</span>
                    <span className="text-am-text-muted text-xs mt-1">(Optional)</span>
                  </>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </div>

            {/* Audio Upload */}
            <div>
              <label className="block text-sm font-semibold text-am-text mb-3 uppercase tracking-wider text-xs">Audio File</label>
              <div 
                onClick={() => !audioFile && audioInputRef.current?.click()}
                className={`w-full p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl shadow-black/20
                  ${audioFile ? 'bg-am-red/10 border-am-red/30 cursor-default' : 'bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 hover:border-am-red/50 group'}`}
              >
                {audioFile ? (
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-am-red flex items-center justify-center flex-shrink-0 shadow-lg shadow-am-red/20">
                        <Music size={20} className="text-white" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-am-text font-medium text-sm truncate block">{audioFile.name}</span>
                        <span className="text-am-text-muted text-xs block">{duration ? `${Math.floor(duration/60)}:${(duration%60).toString().padStart(2, '0')}` : 'Calculating duration...'}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={removeAudio}
                      className="p-2 text-am-text-muted hover:text-am-red hover:bg-white/10 rounded-full transition-colors flex-shrink-0 ml-2"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={32} className="text-am-text-muted group-hover:text-am-text mb-3 transition-colors" />
                    <span className="text-am-text-secondary text-sm font-medium">Select Audio File</span>
                    <span className="text-am-text-muted text-xs mt-1">MP3, WAV, AAC</span>
                  </>
                )}
              </div>
              <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
            </div>
          </div>

          {/* Right Column - Details Form */}
          <div className="col-span-1 md:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl shadow-black/40">
            <h3 className="text-xl font-semibold text-am-text mb-6 pb-4 border-b border-white/10">Track Details</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-am-text-muted mb-2 uppercase tracking-wider">Song Title *</label>
                <input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Blinding Lights" className="w-full bg-black/20 border border-white/10 focus:border-am-red rounded-xl p-3.5 text-am-text placeholder-white/20 outline-none transition-colors text-base" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-am-text-muted mb-2 uppercase tracking-wider">Artist Name *</label>
                  <input required name="artistName" value={formData.artistName} onChange={handleChange} placeholder="e.g. The Weeknd" className="w-full bg-black/20 border border-white/10 focus:border-am-red rounded-xl p-3.5 text-am-text placeholder-white/20 outline-none transition-colors text-base" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-am-text-muted mb-2 uppercase tracking-wider">Album Title *</label>
                  <input required name="albumTitle" value={formData.albumTitle} onChange={handleChange} placeholder="e.g. After Hours" className="w-full bg-black/20 border border-white/10 focus:border-am-red rounded-xl p-3.5 text-am-text placeholder-white/20 outline-none transition-colors text-base" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-am-text-muted mb-2 uppercase tracking-wider">Genre</label>
                  <input name="genre" value={formData.genre} onChange={handleChange} placeholder="e.g. Synth-pop" className="w-full bg-black/20 border border-white/10 focus:border-am-red rounded-xl p-3.5 text-am-text placeholder-white/20 outline-none transition-colors text-base" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-am-text-muted mb-2 uppercase tracking-wider">Release Year</label>
                  <input type="number" name="releaseYear" value={formData.releaseYear} onChange={handleChange} placeholder="YYYY" className="w-full bg-black/20 border border-white/10 focus:border-am-red rounded-xl p-3.5 text-am-text placeholder-white/20 outline-none transition-colors text-base" />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" name="explicit" checked={formData.explicit} onChange={handleChange} className="peer sr-only" />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-am-red transition-colors shadow-inner"></div>
                  </div>
                  <div>
                    <span className="text-am-text font-medium text-sm block">Explicit Content</span>
                    <span className="text-am-text-muted text-xs block">Indicates parental advisory</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
              <button 
                type="submit" 
                disabled={loading || !audioFile || !duration} 
                className="px-8 py-3.5 bg-am-red hover:bg-am-red-hover text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-am-red/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : 'Upload to Library'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
