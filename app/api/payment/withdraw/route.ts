import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// ── GET — check if a payQueue entry exists for this refId ─────────────────────
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    try {
      await adminAuth.verifyIdToken(authHeader.substring(7))
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const refId = req.nextUrl.searchParams.get('refId')
    if (!refId) {
      return NextResponse.json({ success: false, error: 'refId is required' }, { status: 400 })
    }

    const doc = await adminDb.collection('payQueue').doc(refId).get()

    if (!doc.exists) {
      return NextResponse.json({ success: true, data: null })
    }

    const data = doc.data()!

    // ── Fetch reference to check flagged status ───────────────────────────────
    const refDocForFlag = await adminDb.collection('references').doc(refId).get()
    if (refDocForFlag.exists && refDocForFlag.data()?.flagged) {
      return NextResponse.json(
        { success: false, error: 'This transaction has been flagged and cannot be processed' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        status: data.status,
        payoutAmount: data.payoutAmount,
        pendingAt: data.pendingAt,
        paidAt: data.paidAt ?? null,
      },
    })
  } catch (error: any) {
    console.error('[withdraw GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check withdrawal status' },
      { status: 500 }
    )
  }
}

// ── POST — create a payQueue entry for this refId ─────────────────────────────
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

    const sellerId = decodedToken.uid

    // Body
    const body = await req.json()
    const { refId, bankCode, bankName, accountNumber, accountName } = body

    if (!refId || !bankCode || !bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: refId, bankCode, bankName, accountNumber, accountName' },
        { status: 400 }
      )
    }

    if (accountNumber.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Account number must be 10 digits' },
        { status: 400 }
      )
    }

    // ── Idempotency: block duplicate payQueue entries ─────────────────────────
    const existingDoc = await adminDb.collection('payQueue').doc(refId).get()
    if (existingDoc.exists) {
      const existing = existingDoc.data()!
      return NextResponse.json({
        success: true,
        data: {
          status: existing.status,
          payoutAmount: existing.payoutAmount,
          pendingAt: existing.pendingAt,
          paidAt: existing.paidAt ?? null,
        },
      })
    }

    // ── Fetch the reference doc to get sellerPayout ───────────────────────────
    const refDoc = await adminDb.collection('references').doc(refId).get()

    if (!refDoc.exists) {
      return NextResponse.json({ success: false, error: 'Transaction reference not found' }, { status: 404 })
    }

    const refData = refDoc.data()!

    // Verify this seller owns the transaction
    if (refData.sellerId !== sellerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Guard: must be paid and value confirmed before requesting withdrawal
    if (refData.status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment has not been completed for this transaction' },
        { status: 400 }
      )
    }

    if (!refData.valueReceived) {
      return NextResponse.json(
        { success: false, error: 'Buyer has not confirmed value received yet' },
        { status: 400 }
      )
    }

    if (refData.withdrawn) {
      return NextResponse.json(
        { success: false, error: 'Funds have already been withdrawn for this transaction' },
        { status: 400 }
      )
    }

    // ── Block flagged transactions ─────────────────────────────────────────────
    if (refData.flagged) {
      return NextResponse.json(
        { success: false, error: 'This transaction has been flagged and cannot be processed' },
        { status: 403 }
      )
    }

    const payoutAmount: number = refData.sellerPayout ?? refData.grandPrice ?? 0

    if (payoutAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payout amount' },
        { status: 400 }
      )
    }

    // ── Atomic batch: create payQueue doc + mark reference as withdrawn ───────
    const batch = adminDb.batch()

    const payQueueRef = adminDb.collection('payQueue').doc(refId)
    batch.set(payQueueRef, {
      refId,
      sellerId,
      buyerId: refData.buyerId,
      payoutAmount,
      bankCode,
      bankName,
      accountNumber,
      accountName,
      status: 'pending',
      pendingAt: FieldValue.serverTimestamp(),
      paidAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Mark the reference doc as withdrawn so it can't be claimed again
    const referenceRef = adminDb.collection('references').doc(refId)
    batch.update(referenceRef, {
      withdrawn: true,
      updatedAt: FieldValue.serverTimestamp(),
    })

    await batch.commit()

    // ── Admin analytics cos withdrawal is tricky asf ─────────────────────
    // Runs after batch.commit() in its own try/catch — analytics failure must
    // never roll back a committed withdrawal.
    //
    // update() never touches createdAt (it's absent from the payload), so
    // createdAt is only ever written once — when the period doc is first created.
    // generally avoiding updating createdAt every time one nigga withdraws
    try {
      const nigerianTime = new Date(Date.now() + 60 * 60 * 1000)

      const year  = nigerianTime.getUTCFullYear().toString()
      const month = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, '0')}`
      const day   = `${nigerianTime.getUTCFullYear()}-${String(nigerianTime.getUTCMonth() + 1).padStart(2, '0')}-${String(nigerianTime.getUTCDate()).padStart(2, '0')}`

      const refs = [
        adminDb.collection('admin').doc('analytics').collection('daily').doc(day),
        adminDb.collection('admin').doc('analytics').collection('monthly').doc(month),
        adminDb.collection('admin').doc('analytics').collection('yearly').doc(year),
      ]

      await Promise.all(
        refs.map(async (ref) => {
          try {
            // Doc exists → increment totalWithdrawn + updatedAt, leave createdAt untouched
            await ref.update({
              totalWithdrawn: FieldValue.increment(payoutAmount),
              updatedAt:      FieldValue.serverTimestamp(),
            })
          } catch (err: any) {
            const isNotFound =
              err.code === 5 ||
              err.code === 'NOT_FOUND' ||
              err.message?.includes('NOT_FOUND')

            if (isNotFound) {
              // First withdrawal of this period — create doc and stamp createdAt once
              await ref.set({
                totalWithdrawn: FieldValue.increment(payoutAmount),
                createdAt:      FieldValue.serverTimestamp(),
                updatedAt:      FieldValue.serverTimestamp(),
              }, { merge: true })
            } else {
              throw err
            }
          }
        })
      )

      console.log('[withdraw] Analytics updated:', { day, month, year, payoutAmount })
    } catch (analyticsError) {
      console.error('[withdraw] Error updating analytics:', analyticsError)
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'pending',
          payoutAmount,
          pendingAt: new Date().toISOString(),
          paidAt: null,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[withdraw POST] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit withdrawal' },
      { status: 500 }
    )
  }
}