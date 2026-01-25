// app/creator/product/my-products/[productId]/page.tsx
import { CreatorNav } from '@/components/nav/creator-nav'
import { EditProductClient } from './client'

interface EditProductPageProps {
  params: Promise<{ productId: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params
  
  return (
    <div className="min-h-screen bg-background">
      <CreatorNav />
      <EditProductClient productId={productId} />
    </div>
  )
}