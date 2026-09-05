import { Radio as RadioIcon, Play } from 'lucide-react'

const stations = [
  { id: 'r1', name: 'Apple Music 1', description: 'The new music that matters.', gradient: 'from-red-600 to-pink-600' },
  { id: 'r2', name: 'Apple Music Hits', description: 'Songs you know and love.', gradient: 'from-orange-500 to-red-500' },
  { id: 'r3', name: 'Apple Music Country', description: "Today's country and the icons.", gradient: 'from-amber-600 to-orange-500' },
  { id: 'r4', name: 'Chill Radio', description: 'Kick back and unwind.', gradient: 'from-blue-500 to-cyan-400' },
  { id: 'r5', name: 'Pure Dance Radio', description: 'Dance music non-stop.', gradient: 'from-purple-600 to-pink-500' },
  { id: 'r6', name: 'Classical Radio', description: 'Great works & performances.', gradient: 'from-gray-600 to-gray-800' },
  { id: 'r7', name: 'Bollywood Radio', description: 'Hindi hits old and new.', gradient: 'from-yellow-500 to-red-500' },
  { id: 'r8', name: 'Rock Classics', description: 'The greatest rock anthems.', gradient: 'from-gray-700 to-gray-900' },
]

export default function RadioPage() {
  return (
    <div className="px-6 pb-8 animate-fade-in">
      <h1 className="text-[28px] font-bold text-am-text mb-1 tracking-tight">Radio</h1>
      <p className="text-am-text-secondary text-[13px] mb-5">Handpicked radio stations, just for you</p>

      {/* Featured Station */}
      <div className="relative rounded-xl overflow-hidden mb-8 cursor-pointer group h-[180px] bg-gradient-to-r from-red-700 via-pink-600 to-orange-500">
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/15 transition-colors" />
        <div className="relative z-10 h-full flex items-center justify-between px-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-white/75 text-[12px] font-medium">♫ LIVE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
            <h2 className="text-[32px] font-bold text-white mb-1 tracking-tight">Apple Music 1</h2>
            <p className="text-white/60 text-[15px]">The new music that matters.</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/[0.08] flex items-center justify-center group-hover:scale-110 group-hover:bg-white/[0.12] transition-all">
            <Play size={28} className="text-white ml-1" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Station Grid */}
      <h2 className="text-[18px] font-bold text-am-text mb-3 tracking-tight">Stations</h2>
      <div className="grid grid-cols-4 gap-3">
        {stations.map(station => (
          <div
            key={station.id}
            className={`relative rounded-xl overflow-hidden p-4 cursor-pointer group bg-gradient-to-br ${station.gradient} h-[120px] flex flex-col justify-end`}
          >
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            <div className="relative z-10">
              <h3 className="text-white font-bold text-[15px] leading-tight">{station.name}</h3>
              <p className="text-white/50 text-[11px] mt-0.5">{station.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
