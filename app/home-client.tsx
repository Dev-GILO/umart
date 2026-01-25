'use client'

import { useState } from 'react'
import { BuyerNav } from '@/components/nav/buyer-nav'
import { SearchBar, SearchFilters } from '@/components/home/SearchBar'
import { ProductCards } from '@/components/home/ProductCards'

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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (filters: SearchFilters) => {
    setIsLoading(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams()
      if (filters.query) params.append('q', filters.query)
      if (filters.minPrice > 0) params.append('minPrice', filters.minPrice.toString())
      if (filters.maxPrice !== Infinity) params.append('maxPrice', filters.maxPrice.toString())
      if (filters.location) params.append('location', filters.location)
      if (filters.maxAge) params.append('maxAge', filters.maxAge.toString())

      const response = await fetch(`/api/products?${params}`)
      const result = await response.json()

      if (result.success) {
        setProducts(result.data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <BuyerNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-12">
          <div className="text-center space-y-2 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
              U Mart
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Find quality items at great prices from verified sellers
            </p>
          </div>

          {/* Search Bar */}
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Products */}
        <ProductCards
          products={products}
          isLoading={isLoading}
          hasSearched={hasSearched}
        />
      </div>
    </div>
  )
}
