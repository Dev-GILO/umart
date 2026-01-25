import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const uid = request.headers.get('x-user-id');
    const { dob, nin } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!dob || !nin) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    if (userData?.restrictions?.isCreatorBanned) {
      return NextResponse.json(
        { message: 'You are not eligible to become a seller' },
        { status: 403 }
      );
    }

    await userRef.update({
      'roles.isCreator': true,
      sellerInfo: {
        dob,
        nin,
      },
      updatedAt: Timestamp.now(),
    });

    const updatedDoc = await userRef.get();

    return NextResponse.json(updatedDoc.data(), { status: 200 });
  } catch (error) {
    console.error('Become seller error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
