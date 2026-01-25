import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const uid = request.headers.get('x-user-id');
    const { productId, amount, sellerId } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!productId || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get product details
    const productDoc = await adminDb.collection('products').doc(productId).get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    const productData = productDoc.data();
    const finalSellerId = sellerId || productData?.sellerId;

    // Create transaction reference
    const refRef = await adminDb.collection('references').add({
      buyerId: uid,
      sellerId: finalSellerId,
      productId,
      amount,
      status: 'pending',
      valueConfirmed: false,
      withdrawn: false,
      createdAt: Timestamp.now(),
    });

    // Store in buyer's transactions subcollection
    await adminDb
      .collection('users')
      .doc(uid)
      .collection('buyer-transactions')
      .doc(refRef.id)
      .set({
        referenceId: refRef.id,
        buyerId: uid,
        sellerId: finalSellerId,
        productId,
        amount,
        status: 'pending',
        valueConfirmed: false,
        withdrawn: false,
        createdAt: Timestamp.now(),
      });

    const refDoc = await refRef.get();

    return NextResponse.json(
      { id: refDoc.id, ...refDoc.data() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
