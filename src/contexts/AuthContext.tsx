'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  plan: string
  emails_limit: number
  emails_used: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (accessToken: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('simaoutreach_token')
    if (stored) {
      setToken(stored)
      fetchProfile(stored)
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchProfile(jwt: string) {
    try {
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setToken(jwt)
      } else {
        localStorage.removeItem('simaoutreach_token')
        setToken(null)
      }
    } catch {
      localStorage.removeItem('simaoutreach_token')
    } finally {
      setLoading(false)
    }
  }

  async function login(accessToken: string) {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    })

    if (!res.ok) throw new Error('Login failed')

    const data = await res.json()
    localStorage.setItem('simaoutreach_token', data.token)
    setToken(data.token)
    await fetchProfile(data.token)
  }

  function logout() {
    localStorage.removeItem('simaoutreach_token')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
