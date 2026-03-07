import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

async function getUserData(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    const userDoc = await adminDb.collection('users').doc(uid).get()
    if (!userDoc.exists) return null

    const userData = userDoc.data()
    return {
      uid,
      roles: userData?.roles || { isCreator: false, isAdmin: false },
      restrictions: userData?.restrictions || {
        isBanned: false,
        isCreatorBanned: false,
        isPaymentBanned: false,
      },
    }
  } catch (error) {
    console.error('Error verifying token or fetching user:', error)
    return null
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Bypass: auth pages, API routes, static files, and designated error pages
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/banned' ||
    pathname === '/creator/banned'||
    pathname === '/admin/not-admin'
  ) {
    return NextResponse.next()
  }

  const authToken = request.cookies.get('__session')?.value

  const isProtectedRoute =
    pathname.startsWith('/creator') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/dashboard')

  if (isProtectedRoute) {
    // No token → redirect to login with return path
    if (!authToken) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const userData = await getUserData(authToken)

    if (!userData) {
      // Invalid/expired token — clear cookie and send to login
      const response = NextResponse.redirect(
        new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      )
      response.cookies.delete('__session')
      return response
    }

    // Global ban applies to every protected route — check first
    if (userData.restrictions.isBanned) {
      return NextResponse.redirect(new URL('/banned', request.url))
    }

    // ── /creator/* ──────────────────────────────────────────────────────────
    if (pathname.startsWith('/creator')) {
      // /creator/not-creator is only for authenticated non-creators.
      // Creators should never land here — redirect them into the creator area.
      if (pathname === '/creator/not-creator') {
        if (userData.roles.isCreator) {
          return NextResponse.redirect(new URL('/creator', request.url))
        }
        // Non-creator viewing the "not a creator" page — allow
        return NextResponse.next()
      }

      // Creator-banned users can only see /creator/banned
      if (userData.restrictions.isCreatorBanned) {
        return NextResponse.redirect(new URL('/creator/banned', request.url))
      }

      // Non-creators trying to access any other /creator/* route
      if (!userData.roles.isCreator) {
        return NextResponse.redirect(new URL('/creator/not-creator', request.url))
      }

      // Verified creator, not banned — allow
      return NextResponse.next()
    }

    // ── /admin/* ────────────────────────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
      if (!userData.roles.isAdmin) {
        return NextResponse.redirect(new URL('/admin/not-admin', request.url))
      }
      return NextResponse.next()
    }

    // ── /chat/* and other protected routes ──────────────────────────────────
    // Global ban already handled above — if we reach here the user is not banned
    return NextResponse.next()
  }

  // Public route
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}