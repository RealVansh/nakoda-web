import { getFeaturedProducts } from '@/actions/product.actions'
import { getCategories } from '@/actions/category.actions'
import { ProductCard } from '@/components/store/ProductCard'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle } from 'lucide-react'

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

  const popularPieces = featuredProducts.slice(-4)

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hi%2C%20I%27m%20interested%20in%20wholesale%20jewellery%20partnership%20with%20Nakoda%20Jewellers.`

  return (
    <div>
      {/* ═══ 1. Hero Section (Overlay on Mobile / 50-50 Split on Desktop) ═══ */}
      <section className="relative bg-background overflow-hidden border-b border-border lg:min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh] lg:min-h-[auto]">
          
          {/* Image Side (Background on Mobile, Right Column on Desktop) */}
          <div className="absolute inset-0 lg:relative lg:h-auto w-full bg-secondary overflow-hidden group lg:order-2 z-0">
            <Image 
              src="/images/hero_bangle.png"
              alt="18K Rose Gold Antique Bangle"
              fill
              className="object-cover object-center opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[2000ms]"
              priority
            />
            {/* Dark gradient overlay for mobile readability, fades left on desktop */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-black/10 lg:bg-gradient-to-r lg:from-background lg:via-transparent lg:to-transparent lg:opacity-60"></div>
          </div>

          {/* Text Side (Foreground on Mobile, Left Column on Desktop) */}
          <div className="flex flex-col justify-end lg:justify-center px-6 sm:px-8 lg:px-16 xl:px-24 pb-16 pt-48 lg:py-32 xl:py-40 relative z-10 lg:order-1 h-full mt-auto lg:mt-0">
            <div className="h-px w-16 bg-primary mb-8 hidden lg:block"></div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white lg:text-foreground uppercase mb-6 font-serif leading-[1.1]">
              Handcrafted Jewellery, <br className="hidden lg:block"/>
              Timeless <span className="text-shimmer">Elegance</span>
            </h1>
            <h2 className="text-lg md:text-2xl font-serif text-primary mb-6 lg:mb-8 tracking-wide">
              Exquisite Gold Jewellery for Every Occasion
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-white/90 lg:text-muted-foreground max-w-lg mb-10 lg:mb-12 leading-relaxed">
              From bespoke bridal wear to everyday elegance — crafted with precision, passion, and 12+ years of heritage. Authentic. Traditional. Bespoke.
            </p>
            <div>
              <Link
                href="/products"
                className="inline-block bg-primary hover:bg-primary-dark text-background font-medium py-4 px-10 rounded-sm transition-all text-sm md:text-base uppercase tracking-widest glow-gold"
              >
                Discover Collection
              </Link>
            </div>
          </div>
          
        </div>
      </section>



      {/* ═══ 3. Shop by Category ═══ */}
      <section className="py-24 bg-background animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-widest text-foreground uppercase font-serif">Shop by Category</h2>
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
                <Link key={category.id} href={`/products?category=${category.id}`} className="group block relative h-[400px] overflow-hidden border border-border hover:border-primary/60 transition-colors duration-300">
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

      {/* ═══ 4. Antique Collection Spotlight ═══ */}
      <section className="bg-black overflow-hidden border-y border-border/50 animate-fade-in-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] xl:min-h-[700px]">
          {/* Text Side (Left on Desktop) */}
          <div className="flex items-center justify-center p-8 lg:p-16 xl:p-24 order-2 lg:order-1 relative z-10 bg-black">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white uppercase font-serif mb-6 leading-[1.1]">
                The Antique<br />Collection
              </h2>
              <div className="h-px w-16 bg-primary mb-8 opacity-70"></div>
              <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-10 font-light tracking-wide">
                Heritage-inspired pieces handcrafted using traditional techniques passed down through generations.
              </p>
              <Link
                href="/products"
                className="inline-block border border-primary text-white hover:bg-primary hover:text-background font-medium py-4 px-10 rounded-sm transition-all text-sm uppercase tracking-widest glow-gold"
              >
                Explore Collection
              </Link>
            </div>
          </div>
          
          {/* Image Side (Right on Desktop) */}
          <div className="relative h-[400px] lg:h-auto order-1 lg:order-2 group">
            <Image 
              src="/images/antique_spotlight.png" 
              alt="Antique Collection Spotlight" 
              fill 
              className="object-cover object-center transition-transform duration-[2000ms] group-hover:scale-[1.03]"
            />
          </div>
        </div>
      </section>

      {/* ═══ 5. Crafted By Hand ═══ */}
      <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center bg-black overflow-hidden border-b border-border/50 group animate-fade-in-up">
        <Image 
          src="/images/crafted_sketch.png" 
          alt="Artisan sketching jewellery on workbench" 
          fill
          className="object-cover object-center opacity-60 transition-transform duration-[3000ms] group-hover:scale-105"
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-2xl md:text-3xl lg:text-4xl font-serif text-white leading-relaxed font-light tracking-wide mb-12">
            "Every Nakoda creation begins with a sketch, takes shape in the hands of skilled artisans, and undergoes meticulous finishing before reaching you."
          </p>
          <Link
            href="/about"
            className="inline-block border border-white/50 text-white hover:bg-white hover:text-black font-medium py-4 px-10 rounded-sm transition-all text-sm uppercase tracking-widest"
          >
            Discover Our Story
          </Link>
        </div>
      </section>

      {/* ═══ 5. Featured Products (Most Popular) ═══ */}
      <section className="py-24 bg-secondary animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-medium mb-4">Most Popular</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-widest text-foreground uppercase font-serif">Featured Pieces</h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {popularPieces.length > 0 ? (
              popularPieces.map((product) => (
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

          <div className="text-center mt-14">
            <Link
              href="/products"
              className="inline-block border border-primary/50 text-primary hover:bg-primary hover:text-background font-medium py-3 px-10 rounded-sm transition-all text-sm uppercase tracking-widest glow-gold"
            >
              View All Collections
            </Link>
          </div>
        </div>
      </section>


      {/* ═══ 8. Wholesale CTA ═══ */}
      <section className="relative py-28 bg-secondary overflow-hidden border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="h-px w-16 bg-primary mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground uppercase font-serif mb-6">
            Looking for a Wholesale{' '}
            <span className="text-primary">Jewellery Partner?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
            We offer direct manufacturing rates, custom designs, and reliable bulk supply for retailers across India.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-background font-medium py-4 px-10 rounded-sm transition-all text-base uppercase tracking-wider glow-gold"
          >
            <MessageCircle className="w-5 h-5" />
            Contact on WhatsApp
          </a>
          <div className="h-px w-16 bg-primary mx-auto mt-12" />
        </div>
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background pointer-events-none" />
      </section>
    </div>
  )
}
