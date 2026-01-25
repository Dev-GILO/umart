import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

// Helper function to verify token and get user data
async function getUserData(token: string) {
  try {
    // Verify the Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    // Fetch user data from Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get()
    
    if (!userDoc.exists) {
      return null
    }

    const userData = userDoc.data()
    return {
      uid,
      roles: userData?.roles || { isCreator: false, isAdmin: false },
      restrictions: userData?.restrictions || { 
        isBanned: false, 
        isCreatorBanned: false, 
        isPaymentBanned: false 
      },
    }
  } catch (error) {
    console.error('Error verifying token or fetching user:', error)
    return null
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow access to auth pages, API routes, static files, and error pages
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/banned' ||
    pathname === '/creator/banned' ||
    pathname === '/creator/not-creator' ||
    pathname === '/admin/not-admin'
  ) {
    return NextResponse.next()
  }

  // Get auth token from __session cookie
  const authToken = request.cookies.get('__session')?.value

  // Protected routes that require authentication
  const isProtectedRoute = 
    pathname.startsWith('/creator') || 
    pathname.startsWith('/admin') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/dashboard')

  if (isProtectedRoute) {
    // If no token, redirect to login
    if (!authToken) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Get user data from Firestore
    const userData = await getUserData(authToken)

    if (!userData) {
      // Invalid token, clear cookies and redirect to login
      const response = NextResponse.redirect(
        new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      )
      response.cookies.delete('__session')
      return response
    }

    // Check if user is generally banned (applies to all routes)
    if (userData.restrictions.isBanned && pathname !== '/banned') {
      return NextResponse.redirect(new URL('/banned', request.url))
    }

    // Handle /creator routes
    if (pathname.startsWith('/creator')) {
      // Check if user is creator-banned
      if (userData.restrictions.isCreatorBanned && pathname !== '/creator/banned') {
        return NextResponse.redirect(new URL('/creator/banned', request.url))
      }

      // Check if user is a creator
      if (!userData.roles.isCreator && pathname !== '/creator/not-creator') {
        return NextResponse.redirect(new URL('/creator/not-creator', request.url))
      }

      // User is a creator and not banned, allow access
      if (userData.roles.isCreator && !userData.restrictions.isCreatorBanned) {
        return NextResponse.next()
      }
    }

    // Handle /admin routes
    if (pathname.startsWith('/admin')) {
      // Check if user is an admin
      if (!userData.roles.isAdmin && pathname !== '/admin/not-admin') {
        return NextResponse.redirect(new URL('/admin/not-admin', request.url))
      }

      // User is an admin, allow access
      if (userData.roles.isAdmin) {
        return NextResponse.next()
      }
    }

    // Handle /chat routes - allow for both buyers and creators
    if (pathname.startsWith('/chat')) {
      if (!userData.restrictions.isBanned) {
        return NextResponse.next()
      }
    }

    // For other protected routes, just check if user is banned
    if (!userData.restrictions.isBanned) {
      return NextResponse.next()
    }
  }

  // Allow access to public routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}