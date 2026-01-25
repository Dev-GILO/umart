import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const uid = request.headers.get('x-user-id');
    const { chatId, productId, amount } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!chatId || !productId || !amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment reference
    const paymentRef = await adminDb.collection('references').add({
      sellerId: uid,
      productId,
      amount,
      status: 'pending',
      valueConfirmed: false,
      withdrawn: false,
      chatId,
      createdAt: Timestamp.now(),
    });

    // Post payment message in chat
    const chatRef = adminDb.collection('chats').doc(chatId);
    await chatRef.collection('messages').add({
      senderId: uid,
      text: `Payment request: ${amount} for product`,
      paymentReferenceId: paymentRef.id,
      type: 'payment',
      createdAt: Timestamp.now(),
    });

    const paymentDoc = await paymentRef.get();

    return NextResponse.json(
      { id: paymentDoc.id, ...paymentDoc.data() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create chat payment error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
