import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decodedToken

    try {
      decodedToken = await adminAuth.verifyIdToken(token)
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const buyerId = decodedToken.uid
    const { refId } = await req.json()

    if (!refId) {
      return NextResponse.json(
        { success: false, error: 'Missing reference ID' },
        { status: 400 }
      )
    }

    // Fetch the reference document
    const refDoc = await adminDb.collection('references').doc(refId).get()

    if (!refDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const refData = refDoc.data()

    // Verify user is the buyer
    if (refData?.buyerId !== buyerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You are not the buyer' },
        { status: 403 }
      )
    }

    // Verify status is 'paid'
    if (refData?.status !== 'paid') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot confirm value: Transaction status must be paid' 
        },
        { status: 400 }
      )
    }

    // Check if already confirmed
    if (refData?.valueReceived === true) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Value has already been confirmed' 
        },
        { status: 400 }
      )
    }

    // Update valueReceived to true
    await adminDb.collection('references').doc(refId).update({
      valueReceived: true,
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Value received confirmed successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error confirming value received:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to confirm value received',
      },
      { status: 500 }
    )
  }
}