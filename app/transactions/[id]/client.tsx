'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, ChevronLeft, Check } from 'lucide-react'
import { BuyerNav } from '@/components/nav/buyer-nav'
import { PaystackPop } from 'paystack-react' // Declare PaystackPop variable

interface TransactionDetail {
  refId: string
  sellerId: string
  buyerId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  items: Array<{ productName: string; quantity: number; price: number }>
  itemsTotal: number
  shippingFee: number
  platformFee: number
  grandPrice: number
  status: string
  valueReceived: boolean
  withdrawn: boolean
  createdAt: any
}

export function TransactionDetailClient() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [confirmingValue, setConfirmingValue] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
      } else {
        router.push('/auth/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchTransactionDetails = async () => {
      try {
        setLoading(true)
        const user = auth.currentUser
        if (!user) return

        const token = await user.getIdToken()

        // Fetch transaction details
        const response = await fetch(`/api/transactions?id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.error || 'Failed to load transaction')
          return
        }

        setTransaction(result.data)

        // Verify payment status
        const verifyResponse = await fetch(
          `/api/payment/verify?refId=${result.data.refId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const verifyResult = await verifyResponse.json()
        if (verifyResult.success) {
          setPaymentStatus(verifyResult.data.status)
        }
      } catch (err: any) {
        console.error('Error fetching transaction:', err)
        setError(err.message || 'Failed to load transaction')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactionDetails()
  }, [id, isAuthenticated])

  const handleConfirmValueReceived = async () => {
    if (!transaction) return

    try {
      setConfirmingValue(true)
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()

      const response = await fetch('/api/transactions/value', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          refId: transaction.refId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setTransaction((prev) =>
          prev ? { ...prev, valueReceived: true } : null
        )
      } else {
        setError(result.error || 'Failed to confirm value received')
      }
    } catch (err: any) {
      console.error('Error confirming value:', err)
      setError(err.message || 'Failed to confirm value received')
    } finally {
      setConfirmingValue(false)
    }
  }

  const handlePayNow = () => {
    if (!transaction) return
    // Load Paystack inline JS
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    document.body.appendChild(script)

    script.onload = () => {
      // @ts-ignore
      if (typeof window.PaystackPop !== 'undefined') {
        // @ts-ignore
        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: transaction.buyerEmail,
          amount: Math.round(transaction.grandPrice * 100), // Paystack uses cents
          ref: transaction.refId,
          onClose: () => {
            console.log('Payment window closed')
          },
          onSuccess: (response: any) => {
            console.log('Payment successful:', response)
            // Update payment status to success
            updatePaymentStatus()
          },
        })
        handler.openIframe()
      }
    }
  }

  const updatePaymentStatus = async () => {
    try {
      const user = auth.currentUser
      if (!user || !transaction) return

      // In a real scenario, you would verify the payment with Paystack API
      // For now, we'll update the status in Firestore
      setPaymentStatus('success')
    } catch (err) {
      console.error('Error updating payment status:', err)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    let date: Date
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      date = new Date(timestamp.seconds * 1000)
    } else {
      date = new Date(timestamp)
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <BuyerNav />
        <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading transaction...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background">
        <BuyerNav />
        <div className="max-w-2xl mx-auto p-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="p-8 text-center">
            <p className="text-destructive mb-4">{error || 'Transaction not found'}</p>
            <Button onClick={() => router.push('/transactions')}>
              View All Transactions
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <BuyerNav />
      <div className="max-w-2xl mx-auto p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Transaction Details</h1>
          <p className="text-muted-foreground">{transaction.refId}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Payment Status */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Payment Status</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              paymentStatus === 'success'
                ? 'bg-green-500/20 text-green-700'
                : paymentStatus === 'pending'
                ? 'bg-yellow-500/20 text-yellow-700'
                : 'bg-red-500/20 text-red-700'
            }`}>
              {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
            </div>
          </div>

          {paymentStatus === 'pending' && (
            <Button onClick={handlePayNow} className="w-full" size="lg">
              Pay Now
            </Button>
          )}

          {paymentStatus === 'success' && !transaction.valueReceived && (
            <Button
              onClick={handleConfirmValueReceived}
              disabled={confirmingValue}
              className="w-full"
              size="lg"
            >
              {confirmingValue ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Received Value
                </>
              )}
            </Button>
          )}

          {transaction.valueReceived && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">
                  Value received confirmed
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Items */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <div className="space-y-4">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center pb-4 border-b border-border last:border-b-0">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <p className="font-semibold">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Pricing Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Pricing Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items Total</span>
              <span className="font-medium">₦{transaction.itemsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping Fee</span>
              <span className="font-medium">₦{transaction.shippingFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee</span>
              <span className="font-medium">₦{transaction.platformFee.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold">Grand Total</span>
              <span className="font-bold text-lg text-primary">
                ₦{transaction.grandPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Transaction Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction Information</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Created Date</p>
              <p className="font-medium">{formatDate(transaction.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Reference ID</p>
              <p className="font-mono text-xs break-all">{transaction.refId}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
