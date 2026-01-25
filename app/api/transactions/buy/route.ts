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

    const buyerId = decodedToken.uid

    // Fetch all transactions from buyer's transactions-buy subcollection
    const transactionsSnapshot = await adminDb
      .collection('users')
      .doc(buyerId)
      .collection('transactions-buy')
      .orderBy('createdAt', 'desc')
      .get()

    const transactions = []

    for (const doc of transactionsSnapshot.docs) {
      const data = doc.data()
      transactions.push({
        id: doc.id,
        refId: data.refId,
        sellerId: data.sellerId,
        items: data.items || [],
        itemsTotal: data.itemsTotal || 0,
        shippingFee: data.shippingFee || 0,
        platformFee: data.platformFee || 0,
        grandPrice: data.grandPrice || 0,
        createdAt: data.createdAt,
      })
    }

    return NextResponse.json(
      { success: true, data: transactions },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching buyer transactions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transactions',
      },
      { status: 500 }
    )
  }
}
