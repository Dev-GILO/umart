import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, username, fullname, email, phone } = body

    if (!uid || !username || !fullname || !email || !phone) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const userDoc = {
      uid,
      username,
      fullname,
      email,
      phone,
      createdAt: new Date().toISOString(),
      roles: {
        isCreator: false,
        isAdmin: false,
      },
      restrictions: {
        isBanned: false,
        isCreatorBanned: false,
        isPaymentBanned: false,
      },
    }

    await adminDb.collection('users').doc(uid).set(userDoc)

    return NextResponse.json(
      { message: 'User created successfully', data: userDoc },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { message: 'Failed to create user', error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid')

    if (!uid) {
      return NextResponse.json(
        { message: 'UID parameter required' },
        { status: 400 }
      )
    }

    const userDoc = await adminDb.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { data: userDoc.data() },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { message: 'Failed to fetch user', error: error.message },
      { status: 500 }
    )
  }
}
