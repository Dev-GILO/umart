'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Sparkles, Tag } from 'lucide-react'

interface RelatedProduct {
  id: string
  title: string
  image: string | null
  price: number
  location: string
  condition: string
}

const CONDITION_BADGE: Record<string, string> = {
  'New':      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'Like New': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
  'Good':     'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'Fair':     'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  'Damaged':  'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-44 rounded-xl overflow-hidden bg-card border border-border animate-pulse">
      <div className="w-full h-44 bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 rounded-full bg-muted" />
        <div className="h-3 w-1/2 rounded-full bg-muted" />
        <div className="h-4 w-2/5 rounded-full bg-muted mt-2" />
      </div>
    </div>
  )
}

interface Props {
  category: string
  excludeId: string
}

export function MoreProducts({ category, excludeId }: Props) {
  const [products, setProducts] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/products/recommendations?category=${encodeURIComponent(category)}&exclude=${excludeId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setProducts(result.data)
      })
      .catch(() => {/* silently fail */})
      .finally(() => setLoading(false))
  }, [category, excludeId])

  if (!loading && products.length === 0) return null

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          You may also like
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize border border-border">
          {category}
        </span>
      </div>

      {/* Horizontal scroll container */}
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex gap-3 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((product, i) => {
                const condClass = CONDITION_BADGE[product.condition] ?? 'bg-muted text-muted-foreground border-border'

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group flex-shrink-0 w-44 block snap-start fade-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <article className="rounded-xl overflow-hidden bg-card border border-border product-card-hover h-full flex flex-col">
                      {/* Image */}
                      <div className="relative w-full h-44 bg-muted overflow-hidden">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-cover card-img-zoom"
                            sizes="176px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                        <span className={`absolute top-2 left-2 text-[0.6rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border backdrop-blur-sm ${condClass}`}>
                          {product.condition}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-3 flex flex-col gap-1 flex-1">
                        <p className="text-[0.78rem] font-semibold text-card-foreground line-clamp-2 leading-snug">
                          {product.title}
                        </p>
                        <div className="flex items-center gap-1 text-[0.68rem] text-muted-foreground">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{product.location}</span>
                        </div>
                        <p className="mt-auto pt-1.5 text-sm font-extrabold text-primary tracking-tight">
                          ₦{product.price.toLocaleString()}
                        </p>
                      </div>
                    </article>
                  </Link>
                )
              })}
        </div>
      </div>
    </section>
  )
}