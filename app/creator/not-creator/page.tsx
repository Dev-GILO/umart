import { Metadata } from 'next'
import NotCreatorClient from './client'

export const metadata: Metadata = {
  title: 'Not a Creator - uHomes Mart',
  description: 'You need to sign up as a creator to access this area',
}

export default function NotCreatorPage() {
  return <NotCreatorClient />
}
