import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import axios from 'axios' // Import axios here

interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

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

    const sellerId = decodedToken.uid
    const {
      buyerEmail,
      buyerPhone,
      buyerName,
      buyerId,
      items,
      shippingFee,
    } = await req.json()

    // Validate required fields
    if (!buyerId || !items || items.length === 0 || shippingFee === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate totals
    const itemsTotal = items.reduce(
      (sum: number, item: InvoiceItem) => sum + item.price * item.quantity,
      0
    )
    const platformFee = itemsTotal * 0.05 + 100
    const grandPrice = itemsTotal + shippingFee + platformFee

    // Generate reference ID
    const timestamp = Date.now()
    const refId = `umart-ref-${timestamp}`

    // Create reference document in Firestore
    const referenceData = {
      refId,
      sellerId,
      buyerId,
      buyerEmail,
      buyerPhone,
      buyerName,
      items,
      itemsTotal,
      shippingFee,
      platformFee,
      grandPrice,
      status: 'pending',
      valueReceived: false,
      withdrawn: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await adminDb.collection('references').doc(refId).set(referenceData)

    // Create transaction subcollection atomically
    const batch = adminDb.batch()

    // Add to seller's transactions
    const sellerTransactionRef = adminDb
      .collection('users')
      .doc(sellerId)
      .collection('transactions-sell')
      .doc(refId)

    batch.set(sellerTransactionRef, {
      refId,
      type: 'sale',
      buyerId,
      buyerEmail,
      buyerName,
      items,
      itemsTotal,
      shippingFee,
      platformFee,
      grandPrice,
      createdAt: new Date().toISOString(),
    })

    // Add to buyer's transactions
    const buyerTransactionRef = adminDb
      .collection('users')
      .doc(buyerId)
      .collection('transactions-buy')
      .doc(refId)

    batch.set(buyerTransactionRef, {
      refId,
      type: 'purchase',
      sellerId,
      items,
      itemsTotal,
      shippingFee,
      platformFee,
      grandPrice,
      createdAt: new Date().toISOString(),
    })

    await batch.commit()

    // Declare paystackLink variable
    const paystackLink = 'https://paystack.com/link'; // Example URL, replace with actual logic

    return NextResponse.json(
      {
        success: true,
        data: {
          refId,
          grandPrice,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create payment',
      },
      { status: 500 }
    )
  }
}
