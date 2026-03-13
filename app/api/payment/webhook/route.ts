import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import crypto from 'crypto'

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  const reader = req.body?.getReader()
  if (!reader) return Buffer.alloc(0)
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  return Buffer.concat(chunks)
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await getRawBody(req)
    const signature = req.headers.get('x-paystack-signature')
    const secret = process.env.PAYSTACK_SECRET_KEY || ''

    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex')

    if (hash !== signature) {
      console.warn('[webhook] Invalid Paystack signature — request rejected')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody.toString('utf8'))

    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const data = event.data
    const refId: string = data.reference
    const amountPaid: number = data.amount / 100

    const refDoc = await adminDb.collection('references').doc(refId).get()

    if (!refDoc.exists) {
      console.error(`[webhook] Reference doc not found: ${refId}`)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const refData = refDoc.data()!

    if (refData.status === 'paid') {
      console.log(`[webhook] ${refId} already marked paid — skipping`)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const sellerId: string   = refData.sellerId
    const grandPrice: number = refData.grandPrice ?? amountPaid
    const itemsTotal: number = refData.itemsTotal ?? 0
    const now = Timestamp.now()

    const platformFee: number = parseFloat(((grandPrice * 0.05) + 300).toFixed(2))

    const batch = adminDb.batch()

    batch.update(adminDb.collection('references').doc(refId), {
      status: 'paid',
      updatedAt: now,
    })

    const sellerRef = adminDb.collection('users').doc(sellerId)
    batch.set(
      sellerRef,
      {
        totalEscrowPaid:      FieldValue.increment(grandPrice),
        totalEscrowPaidCount: FieldValue.increment(1),
      },
      { merge: true }
    )

    const escrowTxRef = adminDb
      .collection('admin')
      .doc('escrow')
      .collection('transactions')
      .doc(refId)

    batch.set(escrowTxRef, {
      refId,
      sellerId,
      buyerId:     refData.buyerId,
      itemAmount:  itemsTotal,
      platformFee,
      grandPrice,
      paidAt: now,
    })

    const globalRef = adminDb.collection('admin').doc('global')
    batch.set(
      globalRef,
      {
        totalEscrow:       FieldValue.increment(grandPrice),
        totalPlatformFee:  FieldValue.increment(platformFee),
        totalTransactions: FieldValue.increment(1),
        updatedAt:         FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    const nigerianTime = new Date(Date.now() + 60 * 60 * 1000)
    const year  = nigerianTime.getUTCFullYear().toString()
    const month = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, '0')}`
    const day   = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, '0')}-${String(nigerianTime.getUTCDate()).padStart(2, '0')}`

    const analyticsPayload = {
      totalPaid:        FieldValue.increment(grandPrice),
      totalPlatformFee: FieldValue.increment(platformFee),
      totalPaidCount:   FieldValue.increment(1),
      createdAt:        FieldValue.serverTimestamp(),
      updatedAt:        FieldValue.serverTimestamp(),
    }

    const dailyRef   = adminDb.collection('admin').doc('analytics').collection('daily').doc(day)
    const monthlyRef = adminDb.collection('admin').doc('analytics').collection('monthly').doc(month)
    const yearlyRef  = adminDb.collection('admin').doc('analytics').collection('yearly').doc(year)

    batch.set(dailyRef,   analyticsPayload, { merge: true })
    batch.set(monthlyRef, analyticsPayload, { merge: true })
    batch.set(yearlyRef,  analyticsPayload, { merge: true })

    await batch.commit()

    console.log(`[webhook] Processed charge.success — refId: ${refId}, grandPrice: ₦${grandPrice}, platformFee: ₦${platformFee}`)
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('[webhook] Error processing Paystack event:', error)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}