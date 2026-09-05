import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await login(email, password)
    if (res.success) {
      navigate('/home', { replace: true })
    } else {
      setError(res.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-am-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-am-red/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-sm relative z-10 animate-fade-in">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-am-red to-rose-600 rounded-2xl flex items-center justify-center shadow-glow">
            <Music size={28} className="text-white" />
          </div>
        </div>
        <h2 className="text-center text-[24px] font-bold text-am-text tracking-tight">
          Sign in to Apple Music
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm relative z-10 animate-fade-in">
        <div className="bg-am-card/80 border border-white/[0.04] py-7 px-6 shadow-glass rounded-2xl backdrop-blur-xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-2.5 bg-red-500/8 border border-red-500/15 rounded-lg text-[13px] text-red-400 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-am-text-secondary mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-am-text placeholder-am-text-muted focus:ring-1 focus:ring-am-red/30 focus:border-am-red/30 transition-all text-[13px]"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-am-text-secondary mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-am-text placeholder-am-text-muted focus:ring-1 focus:ring-am-red/30 focus:border-am-red/30 transition-all text-[13px]"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg text-[13px] font-medium text-white bg-am-red hover:bg-am-red-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="px-2 bg-am-card/80 text-am-text-muted">
                  New to Apple Music?
                </span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to="/signup"
                className="w-full flex justify-center py-2.5 px-4 border border-white/[0.06] rounded-lg text-[13px] font-medium text-am-text bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
