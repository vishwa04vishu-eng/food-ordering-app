// AuthContext.jsx
// -----------------
// React "Context" is just a way to share data (here: the logged-in user)
// with any component in the tree, without manually passing it down as
// props through every layer. Any component can call useAuth() to read
// `user` or call `login()` / `logout()`.
import { createContext, useContext, useState } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.access_token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  async function register(name, email, password, role) {
    await api.post('/auth/register', { name, email, password, role })
    // after registering, log them in right away
    return login(email, password)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
