'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Search, SlidersHorizontal, X, ChevronDown, MapPin, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNigerianStates } from '@/hooks/useNigerianStates'

export interface SearchFilters {
  query: string
  minPrice: number
  maxPrice: number
  location: string
  maxAge: number | null
}

interface Suggestion {
  id: string
  title: string
  location: string
  price: number
  image: string | null
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void
  isLoading?: boolean
}

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 350

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const { states } = useNigerianStates()

  // ── Filter state ──────────────────────────────────────────────────────────
  const [showFilters, setShowFilters]  = useState(false)
  const [query, setQuery]              = useState('')
  const [minPrice, setMinPrice]        = useState('')
  const [maxPrice, setMaxPrice]        = useState('')
  const [location, setLocation]        = useState('')
  const [maxAge, setMaxAge]            = useState('')

  // ── Suggestion state ──────────────────────────────────────────────────────
  const [suggestions, setSuggestions]       = useState<Suggestion[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  const activeFilterCount = [minPrice, maxPrice, location, maxAge].filter(Boolean).length

  // Search button enabled when query ≥ MIN_QUERY_LENGTH OR filters are active
  const canSearch = query.length >= MIN_QUERY_LENGTH || activeFilterCount > 0

  // ── Close suggestions on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setActiveSuggestion(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Debounced suggestion fetch ────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      setSuggestLoading(true)
      const res = await fetch(`/api/products?suggest=true&q=${encodeURIComponent(q)}`)
      const result = await res.json()
      if (result.success) {
        setSuggestions(result.data)
        setShowSuggestions(result.data.length > 0)
      }
    } catch {
      // silently fail — suggestions are non-critical
    } finally {
      setSuggestLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchSuggestions])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const buildFilters = (): SearchFilters => ({
    query,
    minPrice:  minPrice  ? parseInt(minPrice)  : 0,
    maxPrice:  maxPrice  ? parseInt(maxPrice)  : Infinity,
    location,
    maxAge:    maxAge    ? parseInt(maxAge)    : null,
  })

  const handleSearch = () => {
    if (!canSearch) return
    setShowSuggestions(false)
    setActiveSuggestion(-1)
    onSearch(buildFilters())
  }

  const handleSuggestionClick = (s: Suggestion) => {
    setQuery(s.title)
    setShowSuggestions(false)
    setActiveSuggestion(-1)
    onSearch({
      query:    s.title,
      minPrice: minPrice ? parseInt(minPrice) : 0,
      maxPrice: maxPrice ? parseInt(maxPrice) : Infinity,
      location,
      maxAge:   maxAge ? parseInt(maxAge) : null,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion((p) => Math.min(p + 1, suggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion((p) => Math.max(p - 1, -1))
        return
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        setActiveSuggestion(-1)
        return
      }
      if (e.key === 'Enter' && activeSuggestion >= 0) {
        handleSuggestionClick(suggestions[activeSuggestion])
        return
      }
    }
    if (e.key === 'Enter' && canSearch) handleSearch()
  }

  const handleClear = () => {
    setMinPrice('')
    setMaxPrice('')
    setLocation('')
    setMaxAge('')
  }

  const clearQuery = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="w-full space-y-3">

      {/* ── Main search row ───────────────────────────────────────────────── */}
      <div className="relative">
        <div
          className={`
            flex items-center gap-2 rounded-xl border bg-card shadow-sm px-3 py-2
            transition-all duration-150
            ${showSuggestions
              ? 'border-ring ring-2 ring-ring/20 rounded-b-none border-b-transparent'
              : 'border-border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'
            }
          `}
        >
          {/* Search icon — pulses while fetching suggestions */}
          <Search
            className={`w-4 h-4 flex-shrink-0 transition-colors ${
              suggestLoading ? 'text-primary animate-pulse' : 'text-muted-foreground'
            }`}
          />

          {/* Query input */}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by brand, model, or keyword…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveSuggestion(-1)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0 && query.length >= MIN_QUERY_LENGTH) {
                setShowSuggestions(true)
              }
            }}
            disabled={isLoading}
            autoComplete="off"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50 min-w-0"
          />

          {/* Char counter hint — visible until MIN_QUERY_LENGTH reached */}
          {query.length > 0 && query.length < MIN_QUERY_LENGTH && (
            <span className="text-[0.65rem] text-muted-foreground flex-shrink-0 tabular-nums">
              {MIN_QUERY_LENGTH - query.length} more
            </span>
          )}

          {/* Clear query */}
          {query && (
            <button
              onClick={clearQuery}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Divider */}
          <span className="w-px h-5 bg-border flex-shrink-0" />

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-1 disabled:opacity-50 flex-shrink-0"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className={`w-4 h-4 transition-colors ${showFilters ? 'text-primary' : ''}`} />
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 text-[0.6rem] font-bold rounded-full bg-primary text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search button — disabled until canSearch */}
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={isLoading || !canSearch}
            className="rounded-lg px-4 flex-shrink-0 transition-all"
          >
            {isLoading ? 'Searching…' : 'Search'}
          </Button>
        </div>

        {/* ── Suggestions dropdown ────────────────────────────────────────── */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="
              absolute left-0 right-0 z-50
              rounded-b-xl border border-t-0 border-ring/40
              bg-card shadow-lg overflow-hidden
            "
          >
            <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                Suggestions
              </span>
            </div>

            <ul role="listbox" className="pb-1">
              {suggestions.map((s, i) => (
                <li key={s.id} role="option" aria-selected={i === activeSuggestion}>
                  <button
                    onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
                    onClick={() => handleSuggestionClick(s)}
                    onMouseEnter={() => setActiveSuggestion(i)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 text-left
                      transition-colors duration-100
                      ${i === activeSuggestion ? 'bg-muted' : 'hover:bg-muted/60'}
                    `}
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                      {s.image ? (
                        <Image
                          src={s.image}
                          alt={s.title}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Search className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate leading-tight">
                        {/* Highlight matched portion */}
                        {highlightMatch(s.title, query)}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-[0.68rem] text-muted-foreground truncate">
                          {s.location}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <p className="text-sm font-bold text-primary flex-shrink-0">
                      ₦{s.price.toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>

            <div className="px-3 py-2 border-t border-border">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSearch}
                className="text-xs font-semibold text-primary hover:underline"
              >
                See all results for &ldquo;{query}&rdquo; →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Filter panel ─────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Min Price (₦)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                disabled={isLoading}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Max Price (₦)
              </label>
              <Input
                type="number"
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                disabled={isLoading}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                State
              </label>
              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50 cursor-pointer"
                >
                  <option value="">All states</option>
                  {states.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Max Age (yrs)
              </label>
              <Input
                type="number"
                placeholder="Any"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                min="0"
                step="0.5"
                disabled={isLoading}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex justify-end pt-1 border-t border-border">
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Highlight matching substring in suggestion title ─────────────────────────
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/15 text-primary rounded-sm font-semibold not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}