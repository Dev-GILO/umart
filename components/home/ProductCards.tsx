'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Loader2 } from 'lucide-react'

interface Product {
  id: string
  title: string
  brand: string
  model?: string
  images: string[]
  location: string
  price: number
  condition: string
}

interface ProductCardsProps {
  products: Product[]
  isLoading?: boolean
  hasSearched?: boolean
}

export function ProductCards({
  products,
  isLoading = false,
  hasSearched = false,
}: ProductCardsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Searching products...</p>
        </div>
      </div>
    )
  }

  if (hasSearched && products.length === 0) {
    return (
      <Card className="p-8 sm:p-12 text-center">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search filters or search terms
          </p>
        </div>
      </Card>
    )
  }

  if (!hasSearched) {
    return (
      <Card className="p-8 sm:p-12 text-center">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Start searching</h3>
          <p className="text-muted-foreground">
            Use the search bar above to find products
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => {
        const hasValidImage = product.images?.[0] && product.images[0].trim() !== ''
        
        return (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group cursor-pointer"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
              {/* Image Container */}
              <div className="relative w-full aspect-square bg-muted overflow-hidden">
                {hasValidImage ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-muted-foreground text-sm">No image</span>
                  </div>
                )}

                {/* Condition Badge */}
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={
                      product.condition === 'New'
                        ? 'default'
                        : product.condition === 'Damaged'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {product.condition}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Title */}
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{product.location}</span>
                </div>

                {/* Price */}
                <div className="pt-2 border-t border-border">
                  <p className="text-lg font-bold text-primary">
                    ₦{product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}