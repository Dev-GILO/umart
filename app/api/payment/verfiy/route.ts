import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface PaystackResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    customer: {
      email: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const uid = request.headers.get('x-user-id');
    const { reference, productId, sellerId, amount } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!reference || !productId || !sellerId || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = (await paystackResponse.json()) as PaystackResponse;

    if (!paystackData.status || paystackData.data.amount !== amount * 100) {
      return NextResponse.json(
        { message: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Create transaction reference
    const refRef = await adminDb.collection('references').add({
      buyerId: uid,
      sellerId,
      productId,
      amount,
      paystackReference: reference,
      status: 'successful',
      valueConfirmed: false,
      withdrawn: false,
      createdAt: Timestamp.now(),
    });

    // Store in buyer-transactions subcollection
    await adminDb
      .collection('users')
      .doc(uid)
      .collection('buyer-transactions')
      .doc(refRef.id)
      .set({
        referenceId: refRef.id,
        buyerId: uid,
        sellerId,
        productId,
        amount,
        paystackReference: reference,
        status: 'successful',
        valueConfirmed: false,
        withdrawn: false,
        createdAt: Timestamp.now(),
      });

    const refDoc = await refRef.get();

    return NextResponse.json(
      { id: refDoc.id, referenceId: refRef.id, ...refDoc.data() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
