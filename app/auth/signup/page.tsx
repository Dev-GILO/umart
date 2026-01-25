import { Metadata } from 'next'
import SignupClient from './client'

export const metadata: Metadata = {
  title: 'Sign Up - uHomes Mart',
  description: 'Create your uHomes Mart account',
}

export default function SignupPage() {
  return <SignupClient />
}
