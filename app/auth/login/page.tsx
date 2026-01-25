import { Metadata } from 'next'
import LoginClient from './client'

export const metadata: Metadata = {
  title: 'Login - uHomes Mart',
  description: 'Log in to your uHomes Mart account',
}

export default function LoginPage() {
  return <LoginClient />
}
