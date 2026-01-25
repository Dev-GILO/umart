'use client'

import React from "react"

import { useState } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useNigerianStates } from '@/hooks/useNigerianStates'

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void
  isLoading?: boolean
}

export interface SearchFilters {
  query: string
  minPrice: number
  maxPrice: number
  location: string
  maxAge: number | null
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const { states } = useNigerianStates()
  const [showFilters, setShowFilters] = useState(false)
  const [query, setQuery] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [location, setLocation] = useState('')
  const [maxAge, setMaxAge] = useState('')

  const hasActiveFilters =
    minPrice || maxPrice || location || maxAge

  const handleSearch = () => {
    onSearch({
      query,
      minPrice: minPrice ? parseInt(minPrice) : 0,
      maxPrice: maxPrice ? parseInt(maxPrice) : Infinity,
      location,
      maxAge: maxAge ? parseInt(maxAge) : null,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleClearFilters = () => {
    setMinPrice('')
    setMaxPrice('')
    setLocation('')
    setMaxAge('')
  }

  return (
    <div className="w-full space-y-4">
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products by brand, model, or keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-4"
              disabled={isLoading}
            />
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          </div>

          {/* Filter Toggle and Search Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 w-full sm:w-auto bg-transparent"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              Filters
              {hasActiveFilters && (
                <span className="ml-auto sm:ml-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                  {[minPrice, maxPrice, location, maxAge].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="pt-4 border-t border-border space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Min Price */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Price (NGN)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 10000"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Max Price */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Price (NGN)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 500000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <div className="relative">
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isLoading}
                    >
                      <option value="">All states</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Product Age */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Age (Years)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 2"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    min="0"
                    step="0.5"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
