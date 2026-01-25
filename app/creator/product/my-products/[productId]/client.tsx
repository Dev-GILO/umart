'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth } from 'firebase/auth'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react'
import { AdditionalInfo } from '../../create/components/AdditionalInfo'

interface ProductAge {
  value: number
  unit: 'days' | 'months' | 'years'
}

interface ProductData {
  id: string
  title: string
  category: string
  brand: string
  model: string
  location: string
  price: number
  condition: string
  productAge: ProductAge
  description: string
  defects: string
  additionalInfo: Record<string, string | number>
  images: string[]
}

const CONDITIONS = ['New', 'Neatly Used', 'Used', 'Damaged']
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Federal Capital Territory',
]

interface EditProductClientProps {
  productId: string
}

export function EditProductClient({ productId }: EditProductClientProps) {
  const router = useRouter()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProduct()
  }, [])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError('')
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        router.push('/auth/login')
        return
      }

      const token = await user.getIdToken()
      const response = await fetch(`/api/creator/product/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        // Ensure productAge has default values if missing
        const productData = {
          ...result.data,
          productAge: result.data.productAge || { value: 0, unit: 'months' as const },
          additionalInfo: result.data.additionalInfo || {},
          defects: result.data.defects || '',
        }
        setProduct(productData)
      } else {
        setError(result.error || 'Failed to fetch product')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = <K extends keyof ProductData>(
    field: K,
    value: ProductData[K]
  ) => {
    if (product) {
      setProduct({
        ...product,
        [field]: value,
      })
    }
  }

  const handleProductAgeChange = (value: string) => {
    const numValue = parseInt(value) || 0
    if (product) {
      setProduct({
        ...product,
        productAge: { ...product.productAge, value: numValue },
      })
    }
  }

  const handleProductAgeUnitChange = (unit: 'days' | 'months' | 'years') => {
    if (product) {
      setProduct({
        ...product,
        productAge: { ...product.productAge, unit },
      })
    }
  }

  const handleSave = async () => {
    if (!product) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        router.push('/auth/login')
        return
      }

      const token = await user.getIdToken()
      const response = await fetch(`/api/creator/product/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: product.category,
          brand: product.brand,
          model: product.model,
          location: product.location,
          price: parseFloat(product.price as any),
          condition: product.condition,
          productAge: product.productAge,
          description: product.description,
          defects: product.defects,
          additionalInfo: product.additionalInfo,
          images: product.images,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Product updated successfully!')
        setTimeout(() => {
          router.push('/creator/product/my-products')
        }, 2000)
      } else {
        setError(result.error || 'Failed to update product')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-destructive/50 bg-destructive/5 p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
            <div>
              <p className="font-medium text-destructive">Product not found</p>
              <p className="text-sm text-destructive/80 mt-2">
                The product you're trying to edit doesn't exist.
              </p>
              <Link href="/creator/product/my-products" className="mt-4">
                <Button variant="outline" className="bg-transparent">
                  Back to My Products
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <Link href="/creator/product/my-products">
            <Button variant="outline" className="bg-transparent">
              Back
            </Button>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </Card>
        )}

        {/* Success Alert */}
        {success && (
          <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/30 p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Edit your product information
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <div className="relative">
                <select
                  value={product.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select category...</option>
                  <option value="phones">Phones</option>
                  <option value="laptops">Laptops</option>
                  <option value="furniture">Furniture</option>
                  <option value="books">Books</option>
                  <option value="electronics">Electronics</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Brand and Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Input
                  value={product.brand}
                  onChange={(e) => handleFieldChange('brand', e.target.value)}
                  placeholder="e.g., Samsung"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model (Optional)</label>
                <Input
                  value={product.model}
                  onChange={(e) => handleFieldChange('model', e.target.value)}
                  placeholder="e.g., Galaxy S23"
                />
              </div>
            </div>

            {/* Location and Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <div className="relative">
                  <select
                    value={product.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select state...</option>
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (NGN)</label>
                <Input
                  type="number"
                  value={product.price}
                  onChange={(e) => handleFieldChange('price', parseInt(e.target.value) || 0)}
                  placeholder="Enter price"
                  step="1000"
                  min="0"
                />
              </div>
            </div>

            {/* Condition and Product Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Condition</label>
                <div className="relative">
                  <select
                    value={product.condition}
                    onChange={(e) => handleFieldChange('condition', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select condition...</option>
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Product Age</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={product.productAge?.value ?? 0}
                    onChange={(e) => handleProductAgeChange(e.target.value)}
                    placeholder="e.g., 1"
                    min="0"
                  />
                  <div className="relative">
                    <select
                      value={product.productAge?.unit ?? 'months'}
                      onChange={(e) => handleProductAgeUnitChange(e.target.value as 'days' | 'months' | 'years')}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={product.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Describe your product..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Defects */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Known Defects (if any)</label>
              <Textarea
                value={product.defects || ''}
                onChange={(e) => handleFieldChange('defects', e.target.value)}
                placeholder="List any issues..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Additional Info */}
            <AdditionalInfo
              data={product.additionalInfo || {}}
              onChange={(info) => handleFieldChange('additionalInfo', info)}
            />
          </CardContent>

          <div className="flex gap-3 justify-between p-6 border-t border-border">
            <Link href="/creator/product/my-products" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full bg-transparent">
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}