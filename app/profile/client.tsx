'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, User, Mail, Phone, Calendar, Shield, Ban } from 'lucide-react'
import { BuyerNav } from '@/components/nav/buyer-nav'

interface UserData {
  uid: string
  username: string
  fullname: string
  email: string
  phone: string
  createdAt: string
  roles: {
    isCreator: boolean
    isAdmin: boolean
  }
  restrictions: {
    isBanned: boolean
    isCreatorBanned: boolean
    isPaymentBanned: boolean
  }
}

export function ProfileClient() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
      } else {
        router.push('/auth/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        const user = auth.currentUser
        if (!user) return

        const token = await user.getIdToken()

        const response = await fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          setUserData(result.data)
        } else {
          setError(result.message || 'Failed to load profile')
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err)
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [isAuthenticated])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <BuyerNav />
        <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-background">
        <BuyerNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Card className="p-8 text-center">
            <p className="text-destructive mb-4">{error || 'Profile not found'}</p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <BuyerNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">My Profile</h1>
          <p className="text-lg text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{userData.fullname}</h2>
                <p className="text-muted-foreground mb-4">@{userData.username}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{userData.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{userData.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="font-medium">{formatDate(userData.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Roles & Permissions */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Roles & Permissions</h3>
            </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Creator Account</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  userData.roles.isCreator
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {userData.roles.isCreator ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Admin Privileges</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  userData.roles.isAdmin
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {userData.roles.isAdmin ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </Card>

        {/* Account Status */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold">Account Status</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Account Status</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  userData.restrictions.isBanned
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {userData.restrictions.isBanned ? 'Banned' : 'Active'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Creator Privileges</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  userData.restrictions.isCreatorBanned
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {userData.restrictions.isCreatorBanned ? 'Restricted' : 'Active'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Payment Privileges</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  userData.restrictions.isPaymentBanned
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {userData.restrictions.isPaymentBanned ? 'Restricted' : 'Active'}
              </span>
            </div>
          </div>
        </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={() => router.push('/settings')}>
              Edit Profile
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  // Clear server-side cookies
                  await fetch('/api/users/logout', {
                    method: 'POST',
                  })
                  
                  // Sign out from Firebase
                  await auth.signOut()
                  
                  // Redirect to login
                  router.push('/auth/login')
                } catch (error) {
                  console.error('Sign out error:', error)
                  // Still try to sign out from Firebase even if API call fails
                  await auth.signOut()
                  router.push('/auth/login')
                }
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}