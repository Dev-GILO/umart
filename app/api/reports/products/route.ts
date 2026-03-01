// app/api/reports/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(authHeader.substring(7))
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const { productId, reason, details } = await req.json()

    if (!productId || !reason) {
      return NextResponse.json(
        { success: false, error: 'productId and reason are required' },
        { status: 400 }
      )
    }

    const reportId = `report_${randomUUID()}`

    // Store: reports/products/{productId}/{reportId}
    await adminDb
      .collection('reports')
      .doc('products')
      .collection(productId)
      .doc(reportId)
      .set({
        reportId,
        productId,
        reason,
        details: details?.trim() || null,
        reportedBy: decodedToken.uid,
        createdAt: FieldValue.serverTimestamp(),
        status: 'pending', // pending | reviewed | dismissed
      })

    return NextResponse.json({ success: true, reportId }, { status: 201 })
  } catch (error: any) {
    console.error('Report submission error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit report' },
      { status: 500 }
    )
  }
}