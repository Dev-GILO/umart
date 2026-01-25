import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    // Get all query parameters
    const email = req.nextUrl.searchParams.get('email')
    const phone = req.nextUrl.searchParams.get('phone')
    const userId = req.nextUrl.searchParams.get('userId')
    
    // Check for alien parameters
    const allowedParams = ['email', 'phone', 'userId']
    const allParams = Array.from(req.nextUrl.searchParams.keys())
    const alienParams = allParams.filter(param => !allowedParams.includes(param))
    
    if (alienParams.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unrecognized parameter(s): ${alienParams.join(', ')}`,
          code: 'INVALID_PARAMETER'
        },
        { status: 400 }
      )
    }

    // If query params provided, search for that user
    if (email || phone || userId) {
      let userDoc

      if (userId) {
        userDoc = await adminDb.collection('users').doc(userId).get()
      } else if (email) {
        const snapshot = await adminDb
          .collection('users')
          .where('email', '==', email)
          .limit(1)
          .get()
        userDoc = snapshot.docs[0]
      } else if (phone) {
        const snapshot = await adminDb
          .collection('users')
          .where('phone', '==', phone)
          .limit(1)
          .get()
        userDoc = snapshot.docs[0]
      }

      if (!userDoc || !userDoc.exists) {
        return NextResponse.json(
          { success: false, error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        )
      }

      const userData = userDoc.data()
      return NextResponse.json(
        {
          success: true,
          data: {
            uid: userDoc.id,
            fullname: userData?.fullname || '',
            email: userData?.email || '',
            phone: userData?.phone || '',
            createdAt: userData?.createdAt || '',
          },
        },
        { status: 200 }
      )
    }

    // Check authentication from header first (takes priority)
    const authHeader = req.headers.get('authorization')
    let decodedToken

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        decodedToken = await adminAuth.verifyIdToken(token)
      } catch (error: any) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          },
          { status: 401 }
        )
      }
    } else {
      // Try to get from cookies
      const cookieStore = await cookies()
      const token = cookieStore.get('__session')?.value

      if (!token) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No authentication token provided',
            code: 'NO_TOKEN'
          },
          { status: 401 }
        )
      }

      try {
        decodedToken = await adminAuth.verifyIdToken(token)
      } catch (error: any) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          },
          { status: 401 }
        )
      }
    }

    const uid = decodedToken.uid

    const userDoc = await adminDb.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    return NextResponse.json(
      {
        success: true,
        data: {
          uid,
          fullname: userData?.fullname || '',
          email: userData?.email || '',
          phone: userData?.phone || '',
          createdAt: userData?.createdAt || '',
          roles: userData?.roles || { isCreator: false, isAdmin: false },
          restrictions: userData?.restrictions || {
            isBanned: false,
            isCreatorBanned: false,
            isPaymentBanned: false,
          },
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in whoami:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}