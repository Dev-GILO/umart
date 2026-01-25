'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export interface ChatRole {
  isAdmin: boolean
  isCreator: boolean
  role: 'buyer' | 'seller' | 'system Admin' | 'Admin + seller'
}

export function useChatRole() {
  const [role, setRole] = useState<ChatRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null)
        setLoading(false)
        return
      }

      try {
        const token = await user.getIdToken()
        const response = await fetch(`/api/v1/users?uid=${user.uid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }

        const userData = await response.json()
        const userRoles = userData.data?.roles || {}

        const isAdmin = userRoles.isAdmin || false
        const isCreator = userRoles.isCreator || false

        let roleLabel: 'buyer' | 'seller' | 'system Admin' | 'Admin + seller'

        if (isAdmin && isCreator) {
          roleLabel = 'Admin + seller'
        } else if (isAdmin) {
          roleLabel = 'system Admin'
        } else if (isCreator) {
          roleLabel = 'seller'
        } else {
          roleLabel = 'buyer'
        }

        setRole({
          isAdmin,
          isCreator,
          role: roleLabel,
        })
      } catch (error) {
        console.error('Error fetching user role:', error)
        setRole({
          isAdmin: false,
          isCreator: false,
          role: 'buyer',
        })
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return { role, loading }
}
