// app/api/creator/product/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

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

    // Generate product ID
    const productId = `prod_${Date.now()}`

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
