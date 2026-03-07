// app/product/[id]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from './client'

// Next.js 15: params is now a Promise
interface Props {
  params: Promise<{ id: string }>
}

async function getProduct(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return {
      title: 'Product Not Found | U Mart',
      description: 'This product could not be found.',
    }
  }

  const title = `${product.title} | U Mart`
  const description = product.description
    ? product.description.slice(0, 155)
    : `${product.title} — ₦${product.price?.toLocaleString()} · ${product.location}`

  const image =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : null

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: product.title }],
      }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image && { images: [image] }),
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  return <ProductDetailClient product={product} />
}