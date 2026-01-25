'use client'

import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface InvoiceItem {
  productId: string
  quantity: number
  price: number
}

interface PricingSummaryProps {
  items: InvoiceItem[]
  shippingFee: number
  onShippingFeeChange: (fee: number) => void
}

const PLATFORM_FEE_PERCENTAGE = 0.05
const PLATFORM_FEE_BASE = 100

export function PricingSummary({
  items,
  shippingFee,
  onShippingFeeChange,
}: PricingSummaryProps) {
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const platformFee = itemsTotal * PLATFORM_FEE_PERCENTAGE + PLATFORM_FEE_BASE
  const grandTotal = itemsTotal + shippingFee + platformFee

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-2">Shipping Fee</label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={shippingFee}
          onChange={(e) => onShippingFeeChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items Total:</span>
            <span className="font-medium">₦{itemsTotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping Fee:</span>
            <span className="font-medium">
              ₦{shippingFee.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Platform Fee (5% + ₦100):
            </span>
            <span className="font-medium">
              ₦{platformFee.toLocaleString()}
            </span>
          </div>

          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-semibold">Grand Total:</span>
            <span className="font-bold text-lg text-primary">
              ₦{grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
