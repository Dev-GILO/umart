'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        try {
          // Get a fresh token and update the cookie
          const token = await user.getIdToken(true)
          
          await fetch('/api/users/cookies', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          })
        } catch (error) {
          console.error('Error refreshing token:', error)
        }
      }
      
      setLoading(false)
    })

    // Set up token refresh every 50 minutes (tokens expire in 60 minutes)
    const refreshInterval = setInterval(async () => {
      const currentUser = auth.currentUser
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken(true)
          
          await fetch('/api/users/cookies', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          })
        } catch (error) {
          console.error('Error refreshing token:', error)
        }
      }
    }, 50 * 60 * 1000) // 50 minutes

    return () => {
      unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}