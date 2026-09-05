import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  currentUser: null, // This will hold the JWT user object {_id, name, email, avatar, token}
  token: localStorage.getItem('token') || null,
  users: [
    { id: 'u1', name: 'Tourist', email: 'tourist@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tourist' },
    { id: 'u2', name: 'Guest', email: 'guest@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest' },
  ],

  register: async (name, email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        set({ currentUser: data, token: data.token })
        return { success: true }
      }
      return { success: false, message: data.message || 'Registration failed' }
    } catch (err) {
      console.error('Registration failed', err)
      return { success: false, message: 'Network error' }
    }
  },

  login: async (emailOrId, password) => {
    let email = emailOrId;
    if (emailOrId === 'u1') email = 'tourist@example.com'
    if (emailOrId === 'u2') email = 'guest@example.com'

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'password123' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Backend fail')
      
      localStorage.setItem('token', data.token)
      set({ currentUser: data, token: data.token })
      return { success: true }
    } catch (err) {
      console.warn('Backend login failed, using mock auth fallback', err)
      if (email === 'tourist@example.com' || email === 'guest@example.com') {
        const mockUser = email === 'tourist@example.com' 
          ? { _id: 'u1', name: 'Tourist', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tourist', token: 'mock-token-1' } 
          : { _id: 'u2', name: 'Guest', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest', token: 'mock-token-2' }
        set({ currentUser: mockUser, token: mockUser.token })
        return { success: true }
      }
      return { success: false, message: err.message || 'Login failed' }
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ currentUser: null, token: null })
  },

  // Load user details if token exists
  fetchProfile: async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        set({ currentUser: { ...data, token } })
      } else {
        localStorage.removeItem('token')
        set({ currentUser: null, token: null })
      }
    } catch (err) {
      console.error(err)
    }
  }
}))

