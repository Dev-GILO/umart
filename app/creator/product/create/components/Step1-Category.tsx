'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Step1Props {
  data: {
    category: string
    brand: string
    model: string
  }
  onChange: (data: any) => void
  onNext: () => void
}

const BRAND_WORDS = [
  'Samsung',
  'Apple',
  'Lenovo',
  'HP',
  'Dell',
  'Nike',
  'Puma',
  'Oraimo',
  'JBL',
  'Givenchy',
  'Sony',
  'LG',
  'Infinix',
  'Tecno',
  'Realme',
  'ASUS',
  'Acer',
  'Microsoft',
]

const MODEL_WORDS = [
  'Galaxy S25',
  'iPhone 17 Pro',
  'Slides',
  'EliteBook 7090',
  'XPS 15',
  'Pavilion 15',
  'Infinix Note 40',
  'Tecno Spark 20',
  'Galaxy A15',
  'iPhone 16 Plus',
  'ThinkPad E14',
  'ROG Gaming Laptop',
]

export function Step1Category({ data, onChange, onNext }: Step1Props) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentBrand, setCurrentBrand] = useState(0)
  const [currentModel, setCurrentModel] = useState(0)
  const [isPhoneCategory, setIsPhoneCategory] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBrand((prev) => (prev + 1) % BRAND_WORDS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentModel((prev) => (prev + 1) % MODEL_WORDS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  async function fetchCategories() {
    try {
      const response = await fetch('/api/creator/products/categories')
      const result = await response.json()
      if (result.success) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    const isPhone = categoryId === 'phones'
    setIsPhoneCategory(isPhone)
    onChange({ ...data, category: categoryId })
  }

  const handleBrandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, brand: e.target.value })
  }

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, model: e.target.value })
  }

  const canProceed = data.category && data.brand && data.model

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Step 1: Product Details</CardTitle>
        <CardDescription>Select category and enter brand information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Product Category</label>
          <div className="relative">
            <select
              value={data.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name || cat.id}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {data.category && (
          <>
            {/* Brand Name with Animation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Name</label>
              <div className="relative">
                <Input
                  type="text"
                  value={data.brand}
                  onChange={handleBrandChange}
                  placeholder={BRAND_WORDS[currentBrand]}
                  className="w-full animate-pulse"
                />
                <div className="absolute inset-0 pointer-events-none animate-in fade-out duration-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Examples: {BRAND_WORDS.slice(0, 3).join(', ')}...
              </p>
            </div>

            {/* Model Name with Animation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Model Name</label>
              <div className="relative">
                <Input
                  type="text"
                  value={data.model}
                  onChange={handleModelChange}
                  placeholder={MODEL_WORDS[currentModel]}
                  className="w-full animate-pulse"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Examples: {MODEL_WORDS.slice(0, 3).join(', ')}...
              </p>
            </div>
          </>
        )}
      </CardContent>

      <div className="flex justify-end p-6 border-t border-border">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="w-full sm:w-auto"
        >
          Next Step
        </Button>
      </div>
    </Card>
  )
}
