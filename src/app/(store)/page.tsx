import { getFeaturedProducts } from '@/actions/product.actions'
import { getCategories } from '@/actions/category.actions'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { MotionSection, MotionItem } from '@/components/store/animations/MotionSection'
import { ProductShowcase } from '@/components/store/ProductShowcase'
import { CountUpStats } from '@/components/store/CountUpStats'

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
  const [featuredProducts, rawCategories] = await Promise.all([
    getFeaturedProducts(),
    getCategories()
  ])

  // Custom sort: Bangles -> Necklaces -> Rings -> Earrings -> Others
  const targetOrder = ['bangle', 'necklace', 'ring', 'earring']
  const categories = [...rawCategories].sort((a, b) => {
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()
    
    let aIndex = targetOrder.findIndex(keyword => aName.includes(keyword))
    let bIndex = targetOrder.findIndex(keyword => bName.includes(keyword))
    
    if (aIndex === -1) aIndex = 99
    if (bIndex === -1) bIndex = 99
    
    if (aIndex !== bIndex) return aIndex - bIndex
    return a.name.localeCompare(b.name) // Sort alphabetically if they are both "others"
  })

  const showcaseProducts = featuredProducts.slice(-6).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image_url: p.product_images?.[0]?.image_url || null,
    image_alt: p.product_images?.[0]?.alt_text || p.name,
    category_name: p.categories?.name || null,
  }))

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hi%2C%20I%27m%20interested%20in%20wholesale%20jewellery%20partnership%20with%20Nakoda%20Jewellers.`

  // Occasion collections
  const occasions = [
    { name: 'Wedding', image: '/images/occasion_wedding.png', href: '/products' },
    { name: 'Daily Wear', image: '/images/occasion_daily.png', href: '/products' },
    { name: 'Festive', image: '/images/occasion_festive.png', href: '/products' },
    { name: 'Gifting', image: '/images/occasion_gifting.png', href: '/products' },
  ]

  // Category image mapping
  const getCategoryImage = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('ring')) return '/images/categories/rings.png'
    if (n.includes('bangle') || n.includes('bracelet')) return '/images/categories/bangles.png'
    if (n.includes('necklace') || n.includes('chain')) return '/images/categories/necklaces.png'
    if (n.includes('earring')) return '/images/categories/earrings.png'
    return '/images/categories/necklaces.png'
  }

  return (
    <div>
      {/* ═══ 1. Hero — Heritage & Depth ═══ */}
      <section className="relative bg-background overflow-hidden border-b border-border lg:min-h-0">
        {/* Subtle gold radial spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,_rgba(212,175,55,0.04)_0%,_transparent_70%)] pointer-events-none z-[1]" />

        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh] lg:min-h-[auto]">
          
          {/* Image Side */}
          <div className="absolute inset-0 lg:relative lg:h-auto w-full bg-secondary overflow-hidden group lg:order-2 z-0">
            <Image 
              src="/images/hero_collection.png"
              alt="Handcrafted antique gold jewellery collection — bangle, earrings and pendant"
              fill
              className="object-cover object-center opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-[2000ms]"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-black/10 lg:bg-gradient-to-r lg:from-background lg:via-transparent lg:to-transparent lg:opacity-60"></div>
          </div>

          {/* Text Side */}
          <div className="flex flex-col justify-end lg:justify-center px-6 sm:px-8 lg:px-16 xl:px-24 pb-16 pt-48 lg:py-32 xl:py-40 relative z-10 lg:order-1 h-full mt-auto lg:mt-0">
            <div className="h-px w-16 bg-primary mb-8 hidden lg:block"></div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white lg:text-foreground uppercase mb-6 font-serif leading-[1.1]">
              Timeless By <br className="hidden lg:block"/>
              <span className="text-shimmer">Design</span>
            </h1>
            <h2 className="text-lg md:text-2xl font-serif text-primary mb-6 lg:mb-8 tracking-wide">
              Exquisite Jewellery for Every Occasion
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-white/90 lg:text-muted-foreground max-w-lg mb-10 lg:mb-12 leading-relaxed">
              From bespoke bridal wear to everyday elegance — crafted with precision, passion, and 12+ years of heritage. Authentic. Traditional. Bespoke.
            </p>
            <div>
              <Link
                href="/products"
                className="inline-block bg-primary hover:bg-primary-dark text-background font-medium py-4 px-10 rounded-sm transition-all text-sm md:text-base uppercase tracking-widest glow-gold btn-gold-sweep cursor-pointer"
              >
                Discover Collection
              </Link>
            </div>
          </div>
          
        </div>
      </section>


      {/* ═══ 2. Our Pride — 3D Product Showcase ═══ */}
      <section className="py-20 lg:py-28 bg-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionSection className="text-center mb-12 lg:mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-medium mb-4">Our Pride</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-widest text-foreground uppercase font-serif">Unique Designs</h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-6"></div>
          </MotionSection>

          {showcaseProducts.length > 0 ? (
            <ProductShowcase products={showcaseProducts} />
          ) : (
            <p className="text-center text-muted-foreground">New collections arriving soon.</p>
          )}

          <MotionSection className="text-center mt-14">
            <Link
              href="/products"
              className="inline-block border border-primary/50 text-primary hover:bg-primary hover:text-background font-medium py-3 px-10 rounded-sm transition-all text-sm uppercase tracking-widest glow-gold btn-gold-sweep cursor-pointer"
            >
              View All Collections
            </Link>
          </MotionSection>
        </div>
      </section>


      {/* ═══ 3. Shop by Category — Expanded Grid ═══ */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionSection className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-widest text-foreground uppercase font-serif">Shop by Category</h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-6"></div>
          </MotionSection>

          <MotionSection stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* 1. Hero Category (Left) */}
            {categories[0] && (
              <MotionItem className="md:col-span-1 lg:col-span-2 md:row-span-2 h-[350px] md:h-full min-h-[400px]">
                <Link href={`/products?category=${categories[0].id}`} className="group block relative w-full h-full overflow-hidden border border-border hover:border-primary/60 transition-colors duration-300 cursor-pointer">
                  <Image 
                    src={getCategoryImage(categories[0].name)} 
                    alt={categories[0].name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 p-8 z-20">
                    <h3 className="text-3xl lg:text-4xl font-bold text-white uppercase tracking-widest font-serif mb-2">
                      {categories[0].name}
                    </h3>
                    <span className="text-primary text-sm uppercase tracking-wider font-medium flex items-center gap-2 group-hover:translate-x-2 transition-transform duration-300">
                      Explore Collection <span aria-hidden="true">&rarr;</span>
                    </span>
                  </div>
                </Link>
              </MotionItem>
            )}

            {/* 2. Top Right Category */}
            {categories[1] && (
              <MotionItem className="h-[250px] lg:h-[300px]">
                <Link href={`/products?category=${categories[1].id}`} className="group block relative w-full h-full overflow-hidden border border-border hover:border-primary/60 transition-colors duration-300 cursor-pointer">
                  <Image 
                    src={getCategoryImage(categories[1].name)} 
                    alt={categories[1].name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <h3 className="text-lg sm:text-xl font-bold text-white border border-primary/50 px-6 py-3 uppercase tracking-widest backdrop-blur-sm bg-black/30 group-hover:bg-primary group-hover:text-background group-hover:border-primary transition-all duration-300">
                      {categories[1].name}
                    </h3>
                  </div>
                </Link>
              </MotionItem>
            )}

            {/* 3. Bottom Right Category */}
            {categories[2] && (
              <MotionItem className="h-[250px] lg:h-[300px]">
                <Link href={`/products?category=${categories[2].id}`} className="group block relative w-full h-full overflow-hidden border border-border hover:border-primary/60 transition-colors duration-300 cursor-pointer">
                  <Image 
                    src={getCategoryImage(categories[2].name)} 
                    alt={categories[2].name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <h3 className="text-lg sm:text-xl font-bold text-white border border-primary/50 px-6 py-3 uppercase tracking-widest backdrop-blur-sm bg-black/30 group-hover:bg-primary group-hover:text-background group-hover:border-primary transition-all duration-300">
                      {categories[2].name}
                    </h3>
                  </div>
                </Link>
              </MotionItem>
            )}
          </MotionSection>

          {categories.length > 3 && (
            <MotionSection className="text-center mt-12 lg:mt-16">
              <Link
                href="/products"
                className="inline-block border border-primary/50 text-primary hover:bg-primary hover:text-background font-medium py-3 px-10 rounded-sm transition-all text-sm uppercase tracking-widest glow-gold btn-gold-sweep cursor-pointer"
              >
                View All Jewellery
              </Link>
            </MotionSection>
          )}
        </div>
      </section>


      {/* ═══ 4. Designed for Every Moment — Occasion Collections ═══ */}
      <section className="py-20 lg:py-28 bg-black border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionSection className="text-center mb-12 lg:mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-medium mb-4">Collections</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-widest text-white uppercase font-serif">Designed for Every Moment</h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-6"></div>
          </MotionSection>

          {/* Asymmetric editorial grid */}
          <MotionSection stagger className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {occasions.map((occasion, index) => (
              <MotionItem key={occasion.name}>
                <Link
                  href={occasion.href}
                  className={`group block relative overflow-hidden border border-border/30 hover:border-primary/40 transition-all duration-500 cursor-pointer ${
                    index === 0 ? 'h-[350px] md:h-[500px]' :
                    index === 1 ? 'h-[350px] md:h-[500px]' :
                    'h-[280px] md:h-[350px]'
                  }`}
                >
                  <Image
                    src={occasion.image}
                    alt={`${occasion.name} jewellery collection`}
                    fill
                    className="object-cover transition-transform duration-[2000ms] group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-20">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white uppercase font-serif tracking-wider mb-2">
                      {occasion.name}
                    </h3>
                    <span className="text-sm text-white/60 uppercase tracking-widest group-hover:text-primary transition-colors duration-300">
                      Explore Collection
                    </span>
                  </div>
                </Link>
              </MotionItem>
            ))}
          </MotionSection>
        </div>
      </section>


      {/* ═══ 5. The Nakoda Difference — Facts ═══ */}
      <section className="py-20 lg:py-28 bg-secondary border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionSection className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-widest text-foreground uppercase font-serif">The Nakoda Difference</h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-6"></div>
          </MotionSection>

          <CountUpStats
            stats={[
              { value: '12+', label: 'Years of Craftsmanship' },
              { value: '500+', label: 'Unique Designs' },
              { value: 'Direct', label: 'Manufacturer' },
              { value: 'Custom', label: 'Orders' },
            ]}
          />
        </div>
      </section>


      {/* ═══ 6. Wholesale CTA ═══ */}
      <section className="relative py-28 bg-background overflow-hidden">
        <MotionSection className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
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
            className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-background font-medium py-4 px-10 rounded-sm transition-all text-base uppercase tracking-wider glow-gold btn-gold-sweep cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            Contact on WhatsApp
          </a>
          <div className="h-px w-16 bg-primary mx-auto mt-12" />
        </MotionSection>
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background pointer-events-none" />
      </section>
    </div>
  )
}
