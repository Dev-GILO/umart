import { Metadata } from 'next'
import SuccessClient from './client'

export const metadata: Metadata = {
  title: 'Product Created - uHomes Mart',
  description: 'Your product has been successfully created!',
}

export default function SuccessPage() {
  return <SuccessClient />
}
