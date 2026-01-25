'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { BuyerNav } from '@/components/nav/buyer-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ChevronLeft, ChevronRight, Loader2, MessageCircle } from 'lucide-react'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [contactingLoading, setContactingLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`)
        if (!response.ok) throw new Error('Product not found')
        const result = await response.json()
        setProduct(result.data)
      } catch (err: any) {
        setError(err.message || 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  const handleContactSeller = async () => {
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    if (currentUser.uid === product.userId) {
      alert("You can't chat with yourself!")
      return
    }

    try {
      setContactingLoading(true)
      const token = await currentUser.getIdToken()

      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          sellerId: product.userId,
          productId: product.id,
          productName: product.title,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/chat`)
      } else {
        alert('Failed to create chat')
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      alert('Error creating chat')
    } finally {
      setContactingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <BuyerNav />
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <BuyerNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'The product you are looking for does not exist.'}</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  const images = (product.images || []).filter((img: string) => img && img.trim() !== '')
  const hasMultipleImages = images.length > 1
  const hasImages = images.length > 0

  return (
    <div className="min-h-screen bg-background">
      <BuyerNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
          <ChevronLeft className="w-5 h-5" />
          Back to Results
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {hasImages ? (
                  <Image
                    src={images[currentImageIndex] || "/placeholder.svg"}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}

                {/* Image Navigation */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-black/60 text-white text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Thumbnail Gallery */}
            {hasMultipleImages && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-primary' : 'border-border'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${product.title} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Title and Badge */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-3">{product.title}</h1>
              <Badge variant={product.condition === 'New' ? 'default' : 'secondary'}>
                {product.condition}
              </Badge>
            </div>

            {/* Price */}
            <Card className="p-4 bg-primary/5">
              <p className="text-muted-foreground text-sm mb-1">Price</p>
              <p className="text-3xl font-bold text-primary">
                ₦{product.price.toLocaleString()}
              </p>
            </Card>

            {/* Location */}
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-medium">{product.location}</span>
            </div>

            {/* Product Info */}
            <Card className="p-4 space-y-3">
              {product.brand && (
                <div>
                  <p className="text-sm text-muted-foreground">Brand</p>
                  <p className="font-medium">{product.brand}</p>
                </div>
              )}

              {product.model && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{product.model}</p>
                </div>
              )}

              {product.productAge && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">Product Age</p>
                  <p className="font-medium">
                    {product.productAge.value} {product.productAge.unit}
                  </p>
                </div>
              )}

              {product.category && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium capitalize">{product.category}</p>
                </div>
              )}
            </Card>

            {/* Description */}
            {product.description && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </Card>
            )}

            {/* Defects */}
            {product.defects && (
              <Card className="p-4 border-destructive/50 bg-destructive/5">
                <h3 className="font-semibold mb-2 text-destructive">Known Defects</h3>
                <p className="text-sm text-destructive/90 whitespace-pre-wrap">
                  {product.defects}
                </p>
              </Card>
            )}

            {/* Additional Info */}
            {product.additionalInfo && Object.keys(product.additionalInfo).length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Additional Information</h3>
                <div className="space-y-2">
                  {Object.entries(product.additionalInfo).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">{value as string}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Contact Button */}
            <Button
              className="w-full gap-2"
              onClick={handleContactSeller}
              disabled={contactingLoading}
            >
              {contactingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating chat...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  Contact Seller
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
