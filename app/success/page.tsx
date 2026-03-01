import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BuyerNav } from '@/components/nav/buyer-nav'

export const metadata = {
  title: 'Payment Successful — Umart',
  description: 'Your payment was received successfully',
}

// This is a server component — refId comes from searchParams
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ refId?: string }>
}) {
  const { refId } = await searchParams

  return (
    <div className="min-h-screen bg-background">
      <BuyerNav />
      <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Your payment has been received and is held securely in escrow. The seller will
          be notified and your items will be on their way.
        </p>

        {refId && (
          <Card className="w-full p-4 mb-8 text-left">
            <p className="text-xs text-muted-foreground mb-1">Reference ID</p>
            <p className="font-mono text-sm break-all">{refId}</p>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button asChild className="flex-1" size="lg">
            <Link href="/transactions">View My Transactions</Link>
          </Button>
          {refId && (
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href={`/transactions/${refId}`}>View This Transaction</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}