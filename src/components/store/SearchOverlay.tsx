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

          {/* Search Panel - Edge to Edge Luxury Dropdown */}
          <div 
            className="fixed top-0 left-0 right-0 z-[90] bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-top-4 duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-heading"
          >
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 shrink-0 relative">
              {/* Close Button */}
              <button
                onClick={close}
                className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded-full hover:bg-secondary/50"
                aria-label="Close search"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Heading */}
              <div className="text-center mb-8">
                <h2 className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">Search</h2>
                <p id="search-heading" className="text-2xl sm:text-3xl font-serif text-foreground tracking-wide">What are you looking for?</p>
              </div>

              {/* Input Row - Pill Design */}
              <div className="flex items-center gap-4 bg-secondary/80 border border-border/80 rounded-full px-6 py-4 max-w-2xl mx-auto focus-within:border-primary/60 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all duration-300">
                <Search className="h-5 w-5 text-primary flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Antique Bangles, Rose Gold Rings..."
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground text-base sm:text-lg outline-none placeholder:text-muted-foreground/40 font-sans"
                  style={{ outline: 'none', boxShadow: 'none' }}
                />
                {query.length > 0 && (
                  <button
                    onClick={() => { setQuery(''); setResults([]) }}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results Area */}
            {query.trim().length >= 2 && (
              <div className="border-t border-border/30 overflow-y-auto w-full">
                <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-12">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground tracking-widest uppercase">Searching collections...</span>
                    </div>
                  ) : results.length > 0 ? (
                    <ul className="space-y-2">
                      {results.map((product, index) => (
                        <li key={product.id}>
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={close}
                            className={`flex items-center gap-5 p-3 rounded-md transition-all duration-300 ${
                              index === activeIndex
                                ? 'bg-secondary border-primary/20'
                                : 'hover:bg-secondary border border-transparent hover:border-border/50'
                            }`}
                          >
                            <div className="relative w-16 h-16 bg-background rounded-sm overflow-hidden flex-shrink-0 border border-border">
                              {product.product_images?.[0]?.image_url ? (
                                <Image
                                  src={product.product_images[0].image_url}
                                  alt={product.name}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                  <Search className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-serif font-bold text-foreground capitalize tracking-wide">
                                {product.name}
                              </p>
                              {product.categories?.name && (
                                <p className="text-xs text-primary uppercase tracking-[0.2em] mt-1">
                                  {product.categories.name}
                                </p>
                              )}
                            </div>
                            <div className="hidden sm:block text-muted-foreground group-hover:text-primary transition-colors pr-2">
                              <span className="text-xs uppercase tracking-widest border-b border-primary/30 pb-0.5">View</span>
                            </div>
                          </Link>
                        </li>
                      ))}
                      <li className="pt-6 mt-4 border-t border-border/50 text-center">
                        <Link
                          href={`/products?search=${encodeURIComponent(query)}`}
                          onClick={close}
                          className="inline-block text-xs text-primary hover:text-background hover:bg-primary border border-primary px-8 py-3 uppercase tracking-[0.2em] transition-all duration-300"
                        >
                          View all results for &ldquo;{query}&rdquo;
                        </Link>
                      </li>
                    </ul>
                  ) : (
                    <div className="px-6 py-16 text-center">
                      <div className="w-16 h-16 rounded-full border border-border/50 flex items-center justify-center mx-auto mb-6">
                        <Search className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-xl font-serif text-foreground tracking-wide mb-2">No pieces found</p>
                      <p className="text-sm text-muted-foreground">
                        We couldn&apos;t find anything for &ldquo;{query}&rdquo;. Try another term or browse our collections.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
