import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = await Promise.resolve(params);
    const categoryId = request.nextUrl.searchParams.get('categoryId');

    const productDoc = await adminDb
      .collection('products')
      .doc(productId)
      .get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    const productCategoryId = productDoc.data()?.categoryId || categoryId;

    let relatedQuery = adminDb
      .collection('products')
      .where('categoryId', '==', productCategoryId)
      .limit(4);

    // If no categoryId, just get any products
    if (!productCategoryId) {
      relatedQuery = adminDb
        .collection('products')
        .limit(4);
    }

    const relatedSnapshot = await relatedQuery.get();

    const related = relatedSnapshot.docs
      .filter(doc => doc.id !== productId)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

    return NextResponse.json(related, { status: 200 });
  } catch (error) {
    console.error('Get related products error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}