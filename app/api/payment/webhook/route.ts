import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import crypto from 'crypto'

// ── Disable Next.js body parsing so the raw body can be read for HMAC
export const config = {
  api: { bodyParser: false },
}

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

    // ── Verify Paystack HMAC signature ────────────────────────────────────────
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex')

    if (hash !== signature) {
      console.warn('[webhook] Invalid Paystack signature — request rejected')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody.toString('utf8'))

    // ── Only handle successful charge events ──────────────────────────────────
    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const data = event.data
    const refId: string = data.reference          // we set this to refId on Paystack setup
    const amountPaid: number = data.amount / 100  // Paystack sends kobo → convert to Naira

    // ── Fetch the reference document ──────────────────────────────────────────
    const refDoc = await adminDb.collection('references').doc(refId).get()

    if (!refDoc.exists) {
      console.error(`[webhook] Reference doc not found: ${refId}`)
      // Return 200 so Paystack doesn't retry — we just log the miss
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const refData = refDoc.data()!

    // Guard: idempotency check
    if (refData.status === 'paid') {
      console.log(`[webhook] ${refId} already marked paid — skipping`)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const sellerId: string  = refData.sellerId
    const grandPrice: number = refData.grandPrice ?? amountPaid
    const itemsTotal: number = refData.itemsTotal ?? 0
    const now = Timestamp.now()

    // ── Platform fee: 5% of grand price + ₦300 flat ──────────────────────────
    // Calculated fresh from grandPrice to keep analytics consistent regardless
    // of what was stored on the reference doc at order time.
    const platformFee: number = parseFloat(((grandPrice * 0.05) + 300).toFixed(2))

    // ── Build all atomic writes in a single batch ─────────────────────────────
    const batch = adminDb.batch()

    // 1. Mark reference as paid
    batch.update(adminDb.collection('references').doc(refId), {
      status: 'paid',
      updatedAt: now,
    })

    // 2. Update seller's escrow totals in users/{sellerId}
    const sellerRef = adminDb.collection('users').doc(sellerId)
    batch.set(
      sellerRef,
      {
        totalEscrowPaid:      FieldValue.increment(grandPrice), // running Naira balance paid into escrow
        totalEscrowPaidCount: FieldValue.increment(1),          // count of completed escrow payments
      },
      { merge: true }
    )

    // 3. Store per-transaction record in admin/escrow/transactions/{refId}
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
      platformFee, // recalculated value stored with the transaction
      grandPrice,
      paidAt: now,
    })

    // 4. Admin global totals — all-time cumulative at admin/global
    //    Stores: total money paid into escrow, total platform fee earned, total transaction count
    const globalRef = adminDb.collection('admin').doc('global')
    batch.set(
      globalRef,
      {
        totalEscrow:          FieldValue.increment(grandPrice),   // all-time escrow paid in (₦)
        totalPlatformFee:     FieldValue.increment(platformFee),  // all-time platform fee earned (₦)
        totalTransactions:    FieldValue.increment(1),            // all-time transaction count
        updatedAt:            FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    // 5. Admin analytics — daily / monthly / yearly
    //    Each period doc accumulates totals for that window.
    const nigerianTime = new Date(Date.now() + 60 * 60 * 1000) // WAT = UTC+1

    const year  = nigerianTime.getUTCFullYear().toString()
    const month = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, '0')}`
    const day   = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, '0')}-${String(nigerianTime.getUTCDate()).padStart(2, '0')}`

    const analyticsPayload = {
      totalPaid:        FieldValue.increment(grandPrice),  // escrow paid in for this period (₦)
      totalPlatformFee: FieldValue.increment(platformFee), // platform fee earned this period (₦)
      totalPaidCount:   FieldValue.increment(1),           // number of payments this period
      createdAt:        FieldValue.serverTimestamp(),      // set naturally on first write per period
      updatedAt:        FieldValue.serverTimestamp(),      // refreshed on every write
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
    // Return 200 so Paystack doesn't retry on server errors — log for investigation
    return NextResponse.json({ received: true }, { status: 200 })
  }
}