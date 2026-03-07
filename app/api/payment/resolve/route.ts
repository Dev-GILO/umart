import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    try {
      await adminAuth.verifyIdToken(authHeader.substring(7))
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    // ── Params ────────────────────────────────────────────────────────────────
    const accountNumber = req.nextUrl.searchParams.get('accountNumber')
    const bankCode      = req.nextUrl.searchParams.get('bankCode')

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { success: false, error: 'accountNumber and bankCode are required' },
        { status: 400 }
      )
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        { success: false, error: 'accountNumber must be exactly 10 digits' },
        { status: 400 }
      )
    }

    // ── Proxy to Paystack resolve endpoint ────────────────────────────────────
    const paystackRes = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const paystackData = await paystackRes.json()

    if (!paystackRes.ok || !paystackData.status) {
      // Paystack returns a message field on failure
      return NextResponse.json(
        {
          success: false,
          error: paystackData.message || 'Could not resolve account. Check your details and try again.',
        },
        { status: 422 }
      )
    }

    // paystackData.data = { account_number, account_name, bank_id }
    return NextResponse.json({ success: true, data: paystackData.data })
  } catch (error: any) {
    console.error('[resolve-account] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resolve account' },
      { status: 500 }
    )
  }
}