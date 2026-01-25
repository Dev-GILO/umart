import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

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

    const { refId } = await req.json()

    if (!refId) {
      return NextResponse.json(
        { success: false, error: 'Missing reference ID' },
        { status: 400 }
      )
    }

    const buyerId = decodedToken.uid

    // Fetch reference document
    const refDoc = await adminDb.collection('references').doc(refId).get()

    if (!refDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Reference not found' },
        { status: 404 }
      )
    }

    const refData = refDoc.data()

    // Verify buyer is the one confirming value
    if (refData?.buyerId !== buyerId) {
      return NextResponse.json(
        { success: false, error: 'Only buyer can confirm value received' },
        { status: 403 }
      )
    }

    // Update valueReceived to true
    await adminDb.collection('references').doc(refId).update({
      valueReceived: true,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          refId,
          valueReceived: true,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating transaction value:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update transaction value',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const refId = searchParams.get('refId')

    if (!refId) {
      return NextResponse.json(
        { success: false, error: 'Missing reference ID' },
        { status: 400 }
      )
    }

    // Fetch reference document
    const refDoc = await adminDb.collection('references').doc(refId).get()

    if (!refDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Reference not found' },
        { status: 404 }
      )
    }

    const refData = refDoc.data()

    return NextResponse.json(
      {
        success: true,
        data: {
          refId,
          valueReceived: refData?.valueReceived || false,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching value status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch value status',
      },
      { status: 500 }
    )
  }
}
