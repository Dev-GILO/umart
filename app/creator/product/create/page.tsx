import { Metadata } from 'next'
import CreateProductClient from './client'

export const metadata: Metadata = {
  title: 'Create Product - uHomes Mart',
  description: 'Create and list a new product for sale on uHomes Mart',
}

export default function CreateProductPage() {
  return <CreateProductClient />
}
