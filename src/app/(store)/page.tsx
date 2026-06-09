import { getFeaturedProducts } from '@/actions/product.actions'
import { getCategories } from '@/actions/category.actions'
import { ProductCard } from '@/components/store/ProductCard'
import type { Metadata } from 'next'
import Link from 'next/link'

import Image from 'next/image'

export const revalidate = 60 // ISR cache for 60 seconds

export const metadata: Metadata = {
  title: 'Premium Jewellery Collections',
  description: 'Explore featured handcrafted jewellery pieces and curated categories from Nakoda Jewellers.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Nakoda Jewellers',
    description: 'Explore featured handcrafted jewellery pieces and curated categories from Nakoda Jewellers.',
    type: 'website',
    url: '/',
  },
}

export default async function StoreHomepage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories()
  ])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden min-h-[85vh] flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center w-full py-32">
          {/* Decorative gold line */}
          <div className="h-px w-24 bg-primary mx-auto mb-10"></div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-foreground uppercase mb-8 font-serif text-shimmer">
            Timeless Elegance
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-14 leading-relaxed">
            Discover our exclusive collection of handcrafted jewellery designed to make every moment unforgettable.
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary hover:bg-primary-dark text-background font-medium py-4 px-10 rounded-sm transition-all text-lg uppercase tracking-wider glow-gold"
          >
            Explore Collection
          </Link>
        </div>
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background pointer-events-none"></div>
      </section>

      {/* Featured Products */}
      <section className="py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-widest text-foreground uppercase font-serif">Featured Pieces</h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    image_url: product.product_images?.[0]?.image_url || null,
                    image_alt: product.product_images?.[0]?.alt_text || product.name,
                    category_name: product.categories?.name || null,
                  }}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground col-span-full">New collections arriving soon.</p>
            )}
          </div>

          <div className="mt-16 text-center">
            <Link 
              href="/products" 
              className="inline-flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase"
            >
              View All Collections
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-28 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-widest text-foreground uppercase font-serif">Shop by Category</h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories
              .sort((a, b) => {
                const aName = a.name.toLowerCase()
                const bName = b.name.toLowerCase()
                
                const getPriority = (name: string) => {
                  if (name === 'rings' || name === 'ring') return 1
                  if (name === 'necklaces' || name === 'necklace') return 2
                  if (name === 'bangles' || name === 'bracelets') return 3
                  return 4
                }
                
                return getPriority(aName) - getPriority(bName)
              })
              .slice(0, 3)
              .map((category) => {
              const nameLower = category.name.toLowerCase()
              const bgImage = nameLower.includes('ring') 
                ? '/images/categories/rings.png' 
                : nameLower.includes('bangle') || nameLower.includes('bracelet') 
                  ? '/images/categories/bangles.png' 
                  : '/images/categories/necklaces.png'

              return (
                <Link key={category.id} href={`/products?category=${category.id}`} className="group block relative h-96 overflow-hidden border border-border hover:border-primary/60 transition-colors duration-300">
                  <Image 
                    src={bgImage} 
                    alt={category.name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                  <div className="absolute inset-0 bg-primary/5 z-10"></div>
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <h3 className="text-2xl font-bold text-white border border-primary/50 px-8 py-4 uppercase tracking-widest backdrop-blur-sm bg-black/30 group-hover:bg-primary group-hover:text-background group-hover:border-primary transition-all duration-300">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
