import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { randomUUID } from 'crypto'

// POST: Create a new product
export async function POST(req: NextRequest) {
  try {
    // Get auth token from header
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
      console.error('Token verification error:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid
    const body = await req.json()

    const {
      category,
      brand,
      model,
      searchKeywords,
      location,
      price,
      condition,
      productAge,
      description,
      defects,
      additionalInfo,
      images,
    } = body

    // Validate required fields (model is optional, brand is mandatory)
    if (!category || !brand || !location || !price || !condition || !productAge) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate collision-safe product ID using UUID
    const productId = `prod_${randomUUID()}`

    // Generate product title from brand and model
    const title = model ? `${brand} ${model}` : brand

    const productData = {
      id: productId,
      userId,
      title,
      category,
      brand,
      model: model || '',
      searchKeywords: Array.isArray(searchKeywords) ? searchKeywords : [],
      location,
      price: parseFloat(price),
      condition,
      productAge: {
        value: productAge.value,
        unit: productAge.unit,
      },
      description: description || '',
      defects: defects || '',
      additionalInfo: additionalInfo || {},
      images: Array.isArray(images) ? images : [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'active',
    }

    // Atomic write to Firestore
    const batch = adminDb.batch()

    // 1. Create product in products collection
    const productRef = adminDb.collection('products').doc(productId)
    batch.set(productRef, productData)

    // 2. Add to productCategories/{categoryId}/products/{productId}
    const categoryProductRef = adminDb
      .collection('productCategories')
      .doc(category)
      .collection('products')
      .doc(productId)
    batch.set(categoryProductRef, {
      ...productData,
      categoryId: category,
    })

    // 3. Add to users/{userId}/products/{productId}
    const userProductRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('products')
      .doc(productId)
    batch.set(userProductRef, productData)

    // 4. Increment user's productsUploaded counter
    const userRef = adminDb.collection('users').doc(userId)
    batch.update(userRef, {
      productsUploaded: FieldValue.increment(1),
    })

    // 5. Update admin analytics (daily, monthly, yearly) — Nigerian timezone (WAT = UTC+1)
    const now = new Date()
    const nigerianTime = new Date(now.getTime() + 60 * 60 * 1000)

    const year = nigerianTime.getUTCFullYear().toString()
    const month = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, '0')}`
    const day = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, '0')}-${String(nigerianTime.getUTCDate()).padStart(2, '0')}`

    const analyticsUpdateData = {
      productsCreated: FieldValue.increment(1),
      lastUpdated: FieldValue.serverTimestamp(),
    }

    const dailyRef = adminDb.collection('admin').doc('analytics').collection('daily').doc(day)
    batch.set(dailyRef, analyticsUpdateData, { merge: true })

    const monthlyRef = adminDb.collection('admin').doc('analytics').collection('monthly').doc(month)
    batch.set(monthlyRef, analyticsUpdateData, { merge: true })

    const yearlyRef = adminDb.collection('admin').doc('analytics').collection('yearly').doc(year)
    batch.set(yearlyRef, analyticsUpdateData, { merge: true })

    // Commit the batch
    await batch.commit()

    return NextResponse.json(
      {
        success: true,
        data: {
          productId,
          message: 'Product created successfully',
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create product',
      },
      { status: 500 }
    )
  }
}