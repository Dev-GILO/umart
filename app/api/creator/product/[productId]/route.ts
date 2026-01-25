import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

// GET: Fetch a specific product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
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

    const userId = decodedToken.uid
    const { productId } = await params

    // Fetch product from user's collection to verify ownership
    const productDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('products')
      .doc(productId)
      .get()

    if (!productDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    }

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch product',
      },
      { status: 500 }
    )
  }
}

// PATCH: Update a specific product
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
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

    const userId = decodedToken.uid
    const { productId } = await params
    const body = await req.json()

    // Fetch original product to get old category
    const originalDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('products')
      .doc(productId)
      .get()

    if (!originalDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const originalData = originalDoc.data() as any
    const oldCategory = originalData.category
    const newCategory = body.category || oldCategory

    // Generate title if brand or model changed
    const title = body.model ? `${body.brand} ${body.model}` : body.brand

    const updateData = {
      ...body,
      title,
      updatedAt: Timestamp.now(),
    }

    // Atomic write to update all product references
    const batch = adminDb.batch()

    // 1. Update in main products collection
    const mainProductRef = adminDb.collection('products').doc(productId)
    batch.update(mainProductRef, updateData)

    // 2. Update in user's products collection
    const userProductRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('products')
      .doc(productId)
    batch.update(userProductRef, updateData)

    // 3. Handle category change if needed
    if (oldCategory !== newCategory) {
      // Delete from old category
      const oldCategoryRef = adminDb
        .collection('productCategories')
        .doc(oldCategory)
        .collection('products')
        .doc(productId)
      batch.delete(oldCategoryRef)

      // Add to new category
      const newCategoryRef = adminDb
        .collection('productCategories')
        .doc(newCategory)
        .collection('products')
        .doc(productId)
      batch.set(newCategoryRef, {
        ...updateData,
        categoryId: newCategory,
      })
    } else {
      // Update in same category
      const categoryRef = adminDb
        .collection('productCategories')
        .doc(newCategory)
        .collection('products')
        .doc(productId)
      batch.update(categoryRef, updateData)
    }

    // Commit the batch
    await batch.commit()

    return NextResponse.json(
      {
        success: true,
        data: {
          productId,
          message: 'Product updated successfully',
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update product',
      },
      { status: 500 }
    )
  }
}

// PUT: Update product status (active/inactive)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
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

    const userId = decodedToken.uid
    const { productId } = await params
    const { status } = await req.json()

    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Verify ownership
    const productDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('products')
      .doc(productId)
      .get()

    if (!productDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const productData = productDoc.data() as any
    const category = productData.category

    // Atomic update across all collections
    const batch = adminDb.batch()

    const updateData = {
      status,
      updatedAt: Timestamp.now(),
    }

    // Update in all three locations
    batch.update(adminDb.collection('products').doc(productId), updateData)
    batch.update(
      adminDb
        .collection('users')
        .doc(userId)
        .collection('products')
        .doc(productId),
      updateData
    )
    batch.update(
      adminDb
        .collection('productCategories')
        .doc(category)
        .collection('products')
        .doc(productId),
      updateData
    )

    await batch.commit()

    return NextResponse.json(
      {
        success: true,
        data: {
          productId,
          status,
          message: `Product marked as ${status}`,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating product status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update product status',
      },
      { status: 500 }
    )
  }
}