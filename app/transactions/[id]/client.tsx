'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, ChevronLeft, CheckCircle, Clock, XCircle } from 'lucide-react'
import { BuyerNav } from '@/components/nav/buyer-nav'

interface TransactionDetail {
  refId: string
  type: string
  sellerId: string
  buyerId: string
  buyerName: string | null
  buyerEmail: string | null
  buyerPhone: string | null
  items: Array<{ productName: string; quantity: number; price: number }>
  itemsTotal: number
  shippingFee: number
  platformFee: number
  grandPrice: number
  status: string
  valueReceived: boolean
  withdrawn: boolean
  createdAt: any
  updatedAt: any
}

export function TransactionDetailClient() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [confirmingValue, setConfirmingValue] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setIsAuthenticated(true)
      else router.push('/auth/login')
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchTransaction = async () => {
      try {
        setLoading(true)
        setError('')
        const user = auth.currentUser
        if (!user) return

        const token = await user.getIdToken()

        // Send both type and refId — route returns full detail when both present
        const response = await fetch(`/api/transactions?type=purchase&refId=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.error || 'Failed to load transaction')
          return
        }

        setTransaction(result.data)
      } catch (err: any) {
        setError(err.message || 'Failed to load transaction')
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [id, isAuthenticated])

  const handleConfirmValueReceived = async () => {
    if (!transaction) return
    try {
      setConfirmingValue(true)
      setConfirmError('')
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()

      const response = await fetch('/api/transactions/value', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refId: transaction.refId }),
      })

      const result = await response.json()

      if (result.success) {
        setTransaction((prev) => prev ? { ...prev, valueReceived: true } : null)
      } else {
        setConfirmError(result.error || 'Failed to confirm value received')
      }
    } catch (err: any) {
      setConfirmError(err.message || 'Failed to confirm value received')
    } finally {
      setConfirmingValue(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—'
    // Firestore timestamps serialized over HTTP use _seconds (underscore)
    const seconds = timestamp._seconds ?? timestamp.seconds
    const date = seconds ? new Date(seconds * 1000) : new Date(timestamp)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { icon: React.ReactNode; classes: string; label: string }> = {
      paid: {
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        classes: 'bg-green-100 text-green-700 border-green-200',
        label: 'Paid',
      },
      pending: {
        icon: <Clock className="w-3.5 h-3.5" />,
        classes: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        label: 'Pending',
      },
      failed: {
        icon: <XCircle className="w-3.5 h-3.5" />,
        classes: 'bg-red-100 text-red-700 border-red-200',
        label: 'Failed',
      },
    }
    const s = map[status] || map.pending
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.classes}`}>
        {s.icon}
        {s.label}
      </span>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <BuyerNav />
        <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading transaction...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Not found / error ─────────────────────────────────────────────────────
  if (!transaction) {
    return (
      <div className="min-h-screen bg-background">
        <BuyerNav />
        <div className="max-w-2xl mx-auto p-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Card className="p-8 text-center space-y-4">
            <XCircle className="w-10 h-10 text-destructive mx-auto" />
            <p className="text-destructive font-medium">{error || 'Transaction not found'}</p>
            <Button variant="outline" onClick={() => router.push('/transactions')}>
              View All Transactions
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const canConfirm = transaction.status === 'paid' && !transaction.valueReceived

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <BuyerNav />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Back + Header */}
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="-ml-2 mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Transaction Details</h1>
              <p className="text-xs text-muted-foreground font-mono mt-1 break-all">{transaction.refId}</p>
            </div>
            <StatusBadge status={transaction.status} />
          </div>
        </div>

        {/* Global error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Items */}
        <Card className="p-6">
          <h2 className="text-base font-semibold mb-4">Items</h2>
          <div className="divide-y divide-border">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₦{item.price.toLocaleString()}</p>
                </div>
                <p className="font-semibold text-sm">₦{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6">
          <h2 className="text-base font-semibold mb-4">Pricing Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Items Total</span>
              <span>₦{transaction.itemsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping Fee</span>
              <span>₦{transaction.shippingFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform Fee (5%)</span>
              <span>₦{transaction.platformFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-border pt-3 mt-1">
              <span>Grand Total</span>
              <span className="text-primary">₦{transaction.grandPrice.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Confirm Value Card */}
        <Card className="p-6">
          <h2 className="text-base font-semibold mb-1">Value Confirmation</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Confirm only after you have received your items and are satisfied. This releases payment to the seller.
          </p>

          {transaction.valueReceived ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <span className="text-green-700 text-sm font-medium">Value confirmed — seller will be paid</span>
            </div>
          ) : (
            <>
              {confirmError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-3">
                  <p className="text-destructive text-xs">{confirmError}</p>
                </div>
              )}
              <Button
                onClick={handleConfirmValueReceived}
                disabled={!canConfirm || confirmingValue}
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
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Value Received
                  </>
                )}
              </Button>
              {!canConfirm && !transaction.valueReceived && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {transaction.status !== 'paid'
                    ? 'Available once payment is completed'
                    : 'Already confirmed'}
                </p>
              )}
            </>
          )}
        </Card>

        {/* Transaction Info */}
        <Card className="p-6">
          <h2 className="text-base font-semibold mb-4">Transaction Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Created</p>
              <p className="font-medium">{formatDate(transaction.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Last Updated</p>
              <p className="font-medium">{formatDate(transaction.updatedAt)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-0.5">Reference ID</p>
              <p className="font-mono text-xs break-all">{transaction.refId}</p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  )
}