'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Loader2, SearchX, ImageOff } from 'lucide-react'

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

const CONDITION_BADGE: Record<string, string> = {
  'New':      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
  'Like New': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30',
  'Good':     'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
  'Fair':     'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30',
  'Damaged':  'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30',
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 rounded-full bg-muted" />
        <div className="h-3 w-1/2 rounded-full bg-muted" />
        <div className="h-4 w-2/5 rounded-full bg-muted mt-3" />
      </div>
    </div>
  )
}

export function ProductCards({ products, isLoading = false, hasSearched = false }: ProductCardsProps) {

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Searching…</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (!hasSearched) return null

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-xl border border-dashed border-border bg-muted/30 text-center">
        <SearchX className="w-10 h-10 text-muted-foreground/40" />
        <p className="font-semibold text-foreground/70">No results found</p>
        <p className="text-sm text-muted-foreground">Try different keywords or loosen your filters</p>
      </div>
    )
  }

  return (
    <div>
      {/* Results count */}
      <div className="flex items-center gap-1.5 mb-4 text-sm text-muted-foreground">
        <span className="font-bold text-primary">{products.length}</span>
        <span>result{products.length !== 1 ? 's' : ''} found</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((product, i) => {
          const firstImage = product.images?.[0]?.trim() || null
          const condClass = CONDITION_BADGE[product.condition] ?? 'bg-muted text-muted-foreground border border-border'

          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group block fade-up"
              style={{ animationDelay: `${i * 25}ms` }}
            >
              <article className="rounded-xl overflow-hidden bg-card border border-border product-card-hover h-full flex flex-col">
                {/* Image */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {firstImage ? (
                    <Image
                      src={firstImage}
                      alt={product.title}
                      fill
                      className="object-cover card-img-zoom"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 text-[0.6rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full backdrop-blur-sm ${condClass}`}>
                    {product.condition}
                  </span>
                </div>

                {/* Body */}
                <div className="p-3 flex flex-col gap-1 flex-1">
                  <p className="text-[0.8rem] font-semibold text-card-foreground line-clamp-2 leading-snug">
                    {product.title}
                  </p>
                  <div className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{product.location}</span>
                  </div>
                  <p className="mt-auto pt-2 text-[0.9rem] font-extrabold text-primary tracking-tight">
                    ₦{product.price.toLocaleString()}
                  </p>
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </div>
  )
}