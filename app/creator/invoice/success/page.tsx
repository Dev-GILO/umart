import { CreatorInvoiceSuccess } from './client'
import { Suspense } from 'react'

export default function InvoiceSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CreatorInvoiceSuccess />
    </Suspense>
  )
}