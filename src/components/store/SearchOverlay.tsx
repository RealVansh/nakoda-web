'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { searchProducts } from '@/actions/product.actions'

interface SearchResult {
  id: string
  name: string
  slug: string
  product_images?: { image_url: string; alt_text?: string }[]
  categories?: { name: string } | null
}

export function SearchOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
        setResults([])
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const data = await searchProducts(searchQuery, 5)
      setResults(data as SearchResult[])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    setActiveIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleSearch(value), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      window.location.href = `/products/${results[activeIndex].slug}`
    }
  }

  const close = () => {
    setIsOpen(false)
    setQuery('')
    setResults([])
    setActiveIndex(-1)
  }

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-foreground hover:text-primary transition-colors cursor-pointer"
        aria-label="Search products"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
            onClick={close}
          />

          {/* Search Panel - Command Palette Style */}
          <div className="fixed top-4 left-4 right-4 sm:top-[15vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-[640px] z-[90] bg-background border border-border/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-4 sm:px-6 py-5 shrink-0">
              {/* Input Row */}
              <div className="flex items-center gap-4">
                <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for products, categories..."
                  className="flex-1 bg-transparent text-foreground text-lg font-light outline-none placeholder:text-muted-foreground/50 font-sans"
                />
                <button
                  onClick={close}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Results */}
              {query.trim().length >= 2 && (
                <div className="border-t border-border/50 overflow-y-auto bg-secondary/20">
                  {isLoading ? (
                    <div className="flex items-center gap-3 px-6 py-8">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Searching collections...</span>
                    </div>
                  ) : results.length > 0 ? (
                    <ul className="space-y-1">
                      {results.map((product, index) => (
                        <li key={product.id}>
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={close}
                            className={`flex items-center gap-4 p-3 rounded-md transition-colors ${
                              index === activeIndex
                                ? 'bg-secondary'
                                : 'hover:bg-secondary'
                            }`}
                          >
                            <div className="relative w-12 h-12 bg-secondary rounded-sm overflow-hidden flex-shrink-0">
                              {product.product_images?.[0]?.image_url ? (
                                <Image
                                  src={product.product_images[0].image_url}
                                  alt={product.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                  <Search className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground capitalize truncate">
                                {product.name}
                              </p>
                              {product.categories?.name && (
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                                  {product.categories.name}
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                      <li className="pt-2 border-t border-border mt-2">
                        <Link
                          href={`/products?search=${encodeURIComponent(query)}`}
                          onClick={close}
                          className="block text-center text-sm text-primary hover:text-primary-dark py-2 font-medium transition-colors"
                        >
                          View all results for &ldquo;{query}&rdquo;
                        </Link>
                      </li>
                    </ul>
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-base font-medium text-foreground mb-1">No pieces found</p>
                      <p className="text-sm text-muted-foreground">
                        We couldn&apos;t find anything for &ldquo;{query}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
