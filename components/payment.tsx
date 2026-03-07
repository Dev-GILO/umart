'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface PaymentButtonProps {
  refId: string
  grandPrice: number
  buyerEmail: string
  buyerName: string
  buyerPhone?: string
  disabled?: boolean
  className?: string
  label?: string
  onSuccess?: () => void
  onClose?: () => void
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''

export function PaymentButton({
  refId,
  grandPrice,
  buyerEmail,
  buyerName,
  buyerPhone,
  disabled = false,
  className,
  label = 'Pay Now',
  onSuccess,
  onClose,
}: PaymentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePay = () => {
    setLoading(true)

    const existingScript = document.getElementById('paystack-inline')
    if (existingScript && typeof window.PaystackPop !== 'undefined') {
      initPaystack()
      return
    }

    toast.loading('Please hold while we set up with the payment provider...', {
      id: 'paystack-loading',
    })

    const script = document.createElement('script')
    script.id = 'paystack-inline'
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => {
      toast.dismiss('paystack-loading')
      initPaystack()
    }
    script.onerror = () => {
      toast.dismiss('paystack-loading')
      toast.error('Failed to load payment provider. Please try again.')
      setLoading(false)
    }
    document.body.appendChild(script)
  }

  const initPaystack = () => {
    if (typeof window.PaystackPop === 'undefined') {
      toast.error('Payment provider unavailable. Please refresh and try again.')
      setLoading(false)
      return
    }

    // Open Paystack directly — no dialog closing, no timeouts, no unmounting.
    // Paystack renders its own iframe over the page with its own close button.
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: buyerEmail,
      amount: Math.round(grandPrice * 100),
      ref: refId,
      currency: 'NGN',
      metadata: {
        custom_fields: [
          { display_name: 'Name', variable_name: 'buyer_name', value: buyerName },
          { display_name: 'Phone', variable_name: 'buyer_phone', value: buyerPhone || '' },
        ],
      },
      onClose: () => {
        setLoading(false)
        toast.warning('You cancelled the payment. Your order is still saved.')
        onClose?.()
      },
      callback: (response: { reference: string }) => {
        setLoading(false)
        toast.success('Payment successful! Redirecting...')
        onSuccess?.()
        router.push(`/payment/success?refId=${response.reference}`)
      },
    })

    handler.openIframe()
  }

  return (
    <Button
      onClick={handlePay}
      disabled={disabled || loading}
      className={className}
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Opening payment...
        </>
      ) : (
        label
      )}
    </Button>
  )
}