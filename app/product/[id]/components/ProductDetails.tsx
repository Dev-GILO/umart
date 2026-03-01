'use client'

import { MapPin, Clock, Tag, Layers, AlertTriangle } from 'lucide-react'

interface Product {
  title: string
  brand?: string
  model?: string
  price: number
  condition: string
  location: string
  description?: string
  defects?: string
  productAge?: { value: number; unit: string }
  category?: string
}

const CONDITION_STYLES: Record<string, { cls: string; dot: string }> = {
  'New':      { cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
  'Like New': { cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',               dot: 'bg-sky-500' },
  'Good':     { cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',       dot: 'bg-amber-500' },
  'Fair':     { cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',   dot: 'bg-orange-500' },
  'Damaged':  { cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',               dot: 'bg-red-500' },
}

export function ProductDetails({ product }: { product: Product }) {
  const cond = CONDITION_STYLES[product.condition] ?? {
    cls: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  }

  return (
    <div className="space-y-5">

      {/* ── Title + condition ──────────────────── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${cond.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cond.dot}`} />
            {product.condition}
          </span>
          {product.category && (
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full capitalize border border-border">
              {product.category}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {product.title}
        </h1>
      </div>

      {/* ── Price ──────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-primary/5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Price</p>
        <p className="text-4xl font-extrabold tracking-tight text-primary">
          ₦{product.price.toLocaleString()}
        </p>
      </div>

      {/* ── Quick meta row ─────────────────────── */}
      <div className="grid grid-cols-2 gap-3">

        <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 border border-border px-3.5 py-3">
          <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">Location</p>
            <p className="text-sm font-medium text-foreground">{product.location}</p>
          </div>
        </div>

        {product.productAge && (
          <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 border border-border px-3.5 py-3">
            <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">Age</p>
              <p className="text-sm font-medium text-foreground">
                {product.productAge.value} {product.productAge.unit}
              </p>
            </div>
          </div>
        )}

        {product.brand && (
          <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 border border-border px-3.5 py-3">
            <Tag className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">Brand</p>
              <p className="text-sm font-medium text-foreground">{product.brand}</p>
            </div>
          </div>
        )}

        {product.model && (
          <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 border border-border px-3.5 py-3">
            <Layers className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">Model</p>
              <p className="text-sm font-medium text-foreground">{product.model}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Description ────────────────────────── */}
      {product.description && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {product.description}
          </p>
        </div>
      )}

      {/* ── Defects ────────────────────────────── */}
      {product.defects && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">Known Defects</h3>
          </div>
          <p className="text-sm text-destructive/80 whitespace-pre-wrap leading-relaxed">
            {product.defects}
          </p>
        </div>
      )}
    </div>
  )
}