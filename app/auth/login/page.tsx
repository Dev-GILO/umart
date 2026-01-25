import { Metadata } from 'next'
import { Suspense } from 'react'
import LoginClient from './client'

export const metadata: Metadata = {
  title: 'Login - uHomes Mart',
  description: 'Log in to your uHomes Mart account',
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
