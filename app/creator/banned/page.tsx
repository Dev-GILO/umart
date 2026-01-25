import { Metadata } from 'next'
import BannedClient from './client'

export const metadata: Metadata = {
  title: 'Account Restricted - uHomes Mart',
  description: 'Your account has been restricted',
}

export default function BannedPage() {
  return <BannedClient />
}
