import { getPaginatedProducts } from '@/actions/product.actions'
import { getCategories } from '@/actions/category.actions'
import { getCollections } from '@/actions/collection.actions'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard } from '@/components/store/ProductCard'
import { ProductFilters } from '@/components/store/ProductFilters'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All Jewellery Collections',
  description: 'Browse Nakoda Jewellers products across categories and curated jewellery collections.',
  alternates: {
    canonical: '/products',
  },
  openGraph: {
    title: 'All Jewellery Collections | Nakoda Jewellers',
    description: 'Browse Nakoda Jewellers products across categories and curated jewellery collections.',
    url: '/products',
    type: 'website',
  },
}

type SearchParams = {
  category?: string
  collection?: string
  occasion?: string
  metal?: string
  purity?: string
  inStock?: string
  badge?: string
  sort?: string
  page?: string
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const resolvedParams = await searchParams
  const currentPage = Math.max(1, Number(resolvedParams.page) || 1)
  
  const [{ products, pages, total }, categories, collections] = await Promise.all([
    getPaginatedProducts({
      page: currentPage,
      limit: 12,
      categoryId: resolvedParams.category,
      collectionId: resolvedParams.collection,
      occasion: resolvedParams.occasion,
      metalType: resolvedParams.metal,
      purity: resolvedParams.purity,
      inStock: resolvedParams.inStock === 'true' ? true : undefined,
      badge: resolvedParams.badge,
      sort: (resolvedParams.sort as 'newest' | 'oldest' | 'name-asc' | 'name-desc') || 'newest',
    }),
    getCategories(),
    getCollections(),
  ])

  // Build title based on active filters
  const activeCategory = categories.find(c => c.id === resolvedParams.category)
  const activeCollection = collections.find(c => c.id === resolvedParams.collection)
  const pageTitle = activeCategory?.name || activeCollection?.name || resolvedParams.occasion || resolvedParams.metal || 'All Collections'

  // Build query string preserving all filters for pagination
  function paginationQuery(page: number) {
    const params: Record<string, string> = {}
    if (resolvedParams.category) params.category = resolvedParams.category
    if (resolvedParams.collection) params.collection = resolvedParams.collection
    if (resolvedParams.occasion) params.occasion = resolvedParams.occasion
    if (resolvedParams.metal) params.metal = resolvedParams.metal
    if (resolvedParams.purity) params.purity = resolvedParams.purity
    if (resolvedParams.inStock) params.inStock = resolvedParams.inStock
    if (resolvedParams.badge) params.badge = resolvedParams.badge
    if (resolvedParams.sort) params.sort = resolvedParams.sort
    params.page = String(page)
    return params
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-widest text-foreground uppercase font-serif">
          {pageTitle}
        </h1>
        {total > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {total} {total === 1 ? 'piece' : 'pieces'} found
          </p>
        )}
      </div>

      {/* Layout: Sidebar + Grid */}
      <div className="flex gap-12">
        {/* Filter Sidebar */}
        <Suspense fallback={null}>
          <ProductFilters
            categories={categories.map(c => ({ label: c.name, value: c.id }))}
            collections={collections.map(c => ({ label: c.name, value: c.id }))}
            activeFilters={{
              category: resolvedParams.category,
              collection: resolvedParams.collection,
              occasion: resolvedParams.occasion,
              metal: resolvedParams.metal,
              purity: resolvedParams.purity,
              inStock: resolvedParams.inStock,
              badge: resolvedParams.badge,
              sort: resolvedParams.sort,
            }}
          />
        </Suspense>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter is rendered inside ProductFilters */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    image_url: product.product_images?.[0]?.image_url || null,
                    image_alt: product.product_images?.[0]?.alt_text || product.name,
                    image_url_2: product.product_images?.[1]?.image_url || null,
                    category_name: product.categories?.name || null,
                    metal_type: product.metal_type,
                    purity: product.purity,
                    in_stock: product.in_stock,
                    badges: product.badges,
                  }}
                />
              ))
            ) : (
              <div className="col-span-full py-24 text-center bg-secondary/30 rounded-lg border border-border/50">
                <div className="max-w-md mx-auto px-4">
                  <svg className="w-16 h-16 text-muted-foreground mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="text-xl font-bold text-foreground mb-3 font-serif uppercase tracking-widest">No Pieces Found</h3>
                  <p className="text-muted-foreground mb-8">
                    We couldn&apos;t find any jewellery matching your current filters. Try removing some filters to see more results, or contact us for custom designs.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link 
                      href="/products" 
                      className="w-full sm:w-auto px-6 py-3 border border-border text-foreground hover:border-primary transition-colors text-sm font-medium rounded-sm uppercase tracking-wider"
                    >
                      Clear Filters
                    </Link>
                    <a 
                      href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}?text=Hi,%20I'm%20looking%20for%20a%20specific%20piece%20of%20jewellery%20but%20couldn't%20find%20it%20on%20the%20website.%20Can%20you%20help?`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white transition-colors text-sm font-medium rounded-sm uppercase tracking-wider flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                      Ask on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-4">
              <Link
                href={{
                  pathname: '/products',
                  query: paginationQuery(Math.max(1, currentPage - 1)),
                }}
                aria-disabled={currentPage <= 1}
                className={`px-5 py-2.5 text-sm border border-border rounded-md transition-colors ${
                  currentPage <= 1
                    ? 'pointer-events-none opacity-50 text-muted-foreground'
                    : 'text-foreground hover:border-primary'
                }`}
              >
                Previous
              </Link>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pages}
              </span>
              <Link
                href={{
                  pathname: '/products',
                  query: paginationQuery(Math.min(pages, currentPage + 1)),
                }}
                aria-disabled={currentPage >= pages}
                className={`px-5 py-2.5 text-sm border border-border rounded-md transition-colors ${
                  currentPage >= pages
                    ? 'pointer-events-none opacity-50 text-muted-foreground'
                    : 'text-foreground hover:border-primary'
                }`}
              >
                Next
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
