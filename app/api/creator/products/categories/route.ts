import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

const app = getApps().length > 0 ? getApp() : initializeApp({
  credential: cert(firebaseConfig as any),
})

const db = getFirestore(app)

// GET: Fetch all product categories (public endpoint)
export async function GET(req: NextRequest) {
  try {
    const categoriesSnapshot = await db.collection('productCategories').get()

    const categories = categoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json(
      {
        success: true,
        data: categories,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch categories',
      },
      { status: 500 }
    )
  }
}

// POST: Add new product category (admin only - not exposed to creators)
export async function POST(req: NextRequest) {
  // This endpoint exists but should only be called by admin users
  // For now, we return 403 to restrict access
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint is restricted to administrators',
    },
    { status: 403 }
  )
}
