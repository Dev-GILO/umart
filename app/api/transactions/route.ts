import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

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
    const refId = searchParams.get('id')

    if (!refId) {
      return NextResponse.json(
        { success: false, error: 'Missing transaction ID' },
        { status: 400 }
      )
    }

    // Fetch transaction details from references collection
    const refDoc = await adminDb.collection('references').doc(refId).get()

    if (!refDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const refData = refDoc.data()

    // Verify user has access to this transaction
    const userId = decodedToken.uid
    if (refData?.buyerId !== userId && refData?.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to this transaction' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          refId: refData?.refId,
          sellerId: refData?.sellerId,
          buyerId: refData?.buyerId,
          buyerName: refData?.buyerName,
          buyerEmail: refData?.buyerEmail,
          buyerPhone: refData?.buyerPhone,
          items: refData?.items || [],
          itemsTotal: refData?.itemsTotal || 0,
          shippingFee: refData?.shippingFee || 0,
          platformFee: refData?.platformFee || 0,
          grandPrice: refData?.grandPrice || 0,
          status: refData?.status,
          valueReceived: refData?.valueReceived,
          withdrawn: refData?.withdrawn,
          createdAt: refData?.createdAt,
          updatedAt: refData?.updatedAt,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transaction',
      },
      { status: 500 }
    )
  }
}
