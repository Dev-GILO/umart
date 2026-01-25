'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface CustomerData {
  uid: string
  fullname: string
  email: string
  phone: string
}

interface CustomerInfoProps {
  onCustomerSelect: (customer: CustomerData) => void
}

export function CustomerInfo({ onCustomerSelect }: CustomerInfoProps) {
  const [contactInput, setContactInput] = useState('')
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!contactInput.trim()) {
      setError('Please enter an email or phone number')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Determine if input is email or phone
      const isEmail = contactInput.includes('@')
      const queryParam = isEmail ? 'email' : 'phone'

      const response = await fetch(
        `/api/users/whoami?${queryParam}=${encodeURIComponent(contactInput)}`
      )

      const result = await response.json()

      if (!result.success) {
        setError('Customer not found. Please check the email or phone number.')
        setCustomerData(null)
        return
      }

      setCustomerData(result.data)
      onCustomerSelect(result.data)
    } catch (err: any) {
      setError(err.message || 'Failed to search for customer')
      setCustomerData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Customer Email or Phone Number
        </label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter customer email or phone number"
            value={contactInput}
            onChange={(e) => setContactInput(e.target.value)}
            disabled={loading}
          />
          <Button onClick={handleSearch} disabled={loading} className="w-24">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </div>

      {customerData && (
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Full Name</label>
            <p className="font-medium">{customerData.fullname}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <p className="font-medium text-sm">{customerData.email}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Phone</label>
              <p className="font-medium text-sm">{customerData.phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
