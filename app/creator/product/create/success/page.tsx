import { Metadata } from 'next'
import SuccessClient from './client'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Product Created - uHomes Mart',
  description: 'Your product has been successfully created!',
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  )
}
