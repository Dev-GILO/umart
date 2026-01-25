import { CreatorNav } from '@/components/nav/creator-nav'
import { MyProductsClient } from './client'

export default function MyProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <CreatorNav />
      <MyProductsClient />
    </div>
  )
}
