// app/api/products/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  try {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY || '{}')) })
  } catch {
    console.error('Firebase Admin init failed')
  }
}

const db = getFirestore()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const exclude = searchParams.get('exclude') || ''

    if (!category) {
      return NextResponse.json({ success: false, error: 'category is required' }, { status: 400 })
    }

    const snapshot = await db
      .collection('productCategories')
      .doc(category)
      .collection('products')
      .where('status', '==', 'active')
      .limit(20) // fetch extra to account for excluded item
      .get()

    const products = snapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title || '',
          image: Array.isArray(data.images) && data.images[0] ? data.images[0] : null,
          price: data.price || 0,
          location: data.location || '',
          condition: data.condition || '',
        }
      })
      .filter((p) => p.id !== exclude)
      .slice(0, 8) // return max 8

    return NextResponse.json({ success: true, data: products })
  } catch (error: any) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}