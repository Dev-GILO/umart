'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { CreatorNav } from '@/components/nav/creator-nav'
import ConfettiGenerator from 'confetti-js'

export function CreatorInvoiceSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)

  const refId = searchParams.get('refId')
  const grandPrice = searchParams.get('grandPrice')

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true)

    // Load and run confetti library
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/confetti-js'
    script.onload = () => {
      const confettiSettings = {
        target: 'my-canvas',
        max: 80,
        size: 1,
        animate: true,
        props: ['circle', 'square'],
        colors: [[165, 104, 246]],
        clock: 25,
        rotate: true,
        width: window.innerWidth,
        height: window.innerHeight,
      }
      const confetti = new ConfettiGenerator(confettiSettings)
      confetti.render()

      // Stop after 3 seconds
      setTimeout(() => {
        confetti.clear()
      }, 3000)
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <CreatorNav />
      <canvas id="my-canvas" className="fixed inset-0 w-full h-full" />
      <div className="max-w-md mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-24 h-24 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Invoice Created!</h1>
          <p className="text-muted-foreground mb-6">
            Your invoice has been created successfully.
          </p>

          {refId && (
            <div className="bg-muted rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-1">Reference ID:</p>
              <p className="font-mono text-lg font-semibold break-all">{refId}</p>
            </div>
          )}

          {grandPrice && (
            <div className="bg-primary/10 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Grand Total:</p>
              <p className="text-2xl font-bold text-primary">₦{Number(grandPrice).toLocaleString()}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-6">
            You can now share this invoice with your customer for payment.
          </p>

          <div className="space-y-3">
            <Button onClick={() => router.push('/creator/invoice')} className="w-full">
              Create Another Invoice
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/creator/transactions')}
              className="w-full"
            >
              View Transactions
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
