'use client';
import { useState } from 'react';
import { initializePayment } from './paystack-provider';
import { Button } from '@/components/ui/button';
import { post } from '@/lib/utils/fetcher';

interface PayWithPaystackProps {
  amount: number;
  reference: string;
  productId?: string;
  sellerId?: string;
  buyerEmail?: string;
  onPaymentSuccess?: (referenceId: string) => void;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface PaymentVerificationResponse {
  referenceId: string;
  status: string;
}

export function PayWithPaystack({
  amount,
  reference,
  productId,
  sellerId,
  buyerEmail = 'user@example.com',
  onPaymentSuccess,
  onClose,
  onSuccess,
}: PayWithPaystackProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const ref = `${reference}-${Date.now()}`;

      await initializePayment({
        email: buyerEmail,
        amount,
        reference: ref,
        onSuccess: async (paymentRef) => {
          try {
            // Verify payment on backend if productId and sellerId are provided
            if (productId && sellerId) {
              const result = await post<PaymentVerificationResponse>('/api/payment/verify', {
                reference: paymentRef,
                productId,
                sellerId,
                amount,
              });

              onPaymentSuccess?.(result.referenceId);
            }
            
            onSuccess?.();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed');
          }
        },
        onClose: () => {
          setError('Payment was cancelled');
          onClose?.();
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePayment}
        disabled={loading || !buyerEmail}
        className="w-full"
      >
        {loading ? 'Processing...' : `Pay ₦${amount.toLocaleString()}`}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}