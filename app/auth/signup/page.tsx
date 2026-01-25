import { Metadata } from 'next'
import { Suspense } from 'react'
import SignupClient from './client'

export const metadata: Metadata = {
  title: 'Sign Up - uHomes Mart',
  description: 'Create your uHomes Mart account',
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  )
}