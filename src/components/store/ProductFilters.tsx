'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'

interface FilterOption {
  label: string
  value: string
}

interface ProductFiltersProps {
  categories: FilterOption[]
  collections: FilterOption[]
  activeFilters: {
    category?: string
    collection?: string
    occasion?: string
    metal?: string
    purity?: string
    inStock?: string
    badge?: string
    sort?: string
  }
}

const OCCASION_CHIPS = [
  'Wedding', 'Daily Wear', 'Festive', 'Gifting', 'Office Wear', 'Party', 'Temple', 'Engagement'
]

const METAL_CHIPS = [
  'Gold', 'Silver', 'Diamond', 'Platinum', 'Rose Gold', 'White Gold'
]

const PURITY_CHIPS = ['14K', '18K', '22K', '24K', '925 Silver', '950 Platinum']

const BADGE_CHIPS = ['New Arrival', 'Bestseller', 'Bridal', 'Limited Edition', 'Trending', 'Exclusive']

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Name: A → Z', value: 'name-asc' },
  { label: 'Name: Z → A', value: 'name-desc' },
]

function FilterSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border pb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-sm font-medium text-foreground"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pt-2">{children}</div>}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
        active
          ? 'bg-primary text-white border-primary shadow-[0_0_8px_rgba(212,175,55,0.2)]'
          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

export function ProductFilters({ categories, collections, activeFilters }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when filters change
    params.delete('page')
    router.push(`/products?${params.toString()}`)
    
    // Auto-close mobile drawer on filter selection
    setMobileOpen(false)
  }, [router, searchParams])

  const toggleFilter = useCallback((key: string, value: string) => {
    const current = searchParams.get(key)
    updateFilter(key, current === value ? null : value)
  }, [searchParams, updateFilter])

  const clearAll = useCallback(() => {
    router.push('/products')
  }, [router])

  const activeFilterCount = Object.values(activeFilters).filter(v => v && v !== 'newest').length
  const hasAnyFilter = activeFilterCount > 0

  const filterContent = (
    <div className="space-y-4">
      {/* Active filter count + clear */}
      {hasAnyFilter && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark transition-colors"
        >
          <X className="h-3 w-3" />
          Clear all filters
        </button>
      )}

      {/* Sort */}
      <FilterSection title="Sort By" defaultOpen={true}>
        <div className="space-y-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter('sort', opt.value === 'newest' ? null : opt.value)}
              className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                (activeFilters.sort || 'newest') === opt.value
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category" defaultOpen={true}>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <Chip
              key={c.value}
              label={c.label}
              active={activeFilters.category === c.value}
              onClick={() => toggleFilter('category', c.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Collection */}
      {collections.length > 0 && (
        <FilterSection title="Collection" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {collections.map(c => (
              <Chip
                key={c.value}
                label={c.label}
                active={activeFilters.collection === c.value}
                onClick={() => toggleFilter('collection', c.value)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Occasion */}
      <FilterSection title="Occasion" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {OCCASION_CHIPS.map(occ => (
            <Chip
              key={occ}
              label={occ}
              active={activeFilters.occasion === occ}
              onClick={() => toggleFilter('occasion', occ)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Metal */}
      <FilterSection title="Metal" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {METAL_CHIPS.map(m => (
            <Chip
              key={m}
              label={m}
              active={activeFilters.metal === m}
              onClick={() => toggleFilter('metal', m)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Purity */}
      <FilterSection title="Purity" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {PURITY_CHIPS.map(p => (
            <Chip
              key={p}
              label={p}
              active={activeFilters.purity === p}
              onClick={() => toggleFilter('purity', p)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Badges */}
      <FilterSection title="Tags" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {BADGE_CHIPS.map(b => (
            <Chip
              key={b}
              label={b}
              active={activeFilters.badge === b}
              onClick={() => toggleFilter('badge', b)}
            />
          ))}
        </div>
      </FilterSection>

      {/* In Stock */}
      <FilterSection title="Availability" defaultOpen={false}>
        <div className="flex gap-2">
          <Chip
            label="In Stock Only"
            active={activeFilters.inStock === 'true'}
            onClick={() => toggleFilter('inStock', 'true')}
          />
        </div>
      </FilterSection>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">Filters</h2>
          {filterContent}
        </div>
      </aside>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary transition-colors w-full justify-center"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters & Sort
          {hasAnyFilter && (
            <span className="bg-primary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Sheet */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div
          className={`absolute inset-y-0 right-0 w-full max-w-sm bg-background border-l border-border shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-foreground">Filters</h2>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            {filterContent}
          </div>
        </div>
      </div>
    </>
  )
}
