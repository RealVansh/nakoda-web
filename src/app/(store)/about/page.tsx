import type { Metadata } from 'next'
import { CountUpStats } from '@/components/store/CountUpStats'
import {
  Crown,
  Gem,
  Landmark,
  Warehouse,
  Pencil,
  Hammer,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Factory,
  Clock,
  BadgeCheck,
  PenTool,
  Handshake,
  MessageCircle,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Nakoda Jewellers — Handmade Jewellery Since 2013',
  description:
    'Discover the story behind Nakoda Jewellers — 12+ years of handcrafted jewellery, bangle specialists, antique manufacturing, and trusted wholesale supply.',
  alternates: {
    canonical: '/about',
  },
}

const stats = [
  { value: '12+', label: 'Years of Craftsmanship' },
  { value: '100%', label: 'Handmade Excellence' },
  { value: 'Direct', label: 'From Manufacturer' },
]

const craftsmanshipSteps = [
  {
    icon: Pencil,
    title: 'Design',
    description: 'Every piece begins with a carefully planned design.',
  },
  {
    icon: Hammer,
    title: 'Handcrafting',
    description: 'Skilled artisans bring the design to life by hand.',
  },
  {
    icon: Sparkles,
    title: 'Finishing',
    description: 'Detailed polishing and finishing for a flawless look.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Check',
    description: 'Rigorous inspection before every piece leaves our hands.',
  },
]

const expertiseCards = [
  {
    icon: Crown,
    title: 'Bangle Specialists',
    description:
      'Renowned for intricate, custom bangle designs across traditional and contemporary styles.',
  },
  {
    icon: Gem,
    title: 'Handmade Jewellery',
    description:
      'Every piece is handcrafted by skilled artisans — no mass production, no shortcuts.',
  },
  {
    icon: Landmark,
    title: 'Antique Manufacturing',
    description:
      'Specialized expertise in traditional and antique jewellery manufacturing.',
  },
  {
    icon: Warehouse,
    title: 'Wholesale Supply',
    description:
      'Direct manufacturer-to-business supply for retailers and bulk order partners.',
  },
]

const whyChoose = [
  {
    icon: Factory,
    title: 'Direct Manufacturer',
    description: 'No middlemen. Factory-to-customer pricing.',
  },
  {
    icon: Clock,
    title: '12+ Years Experience',
    description: 'Proven reliability in a trust-driven industry.',
  },
  {
    icon: BadgeCheck,
    title: 'Quality Assurance',
    description: 'Every piece meets strict purity and finishing standards.',
  },
  {
    icon: PenTool,
    title: 'Custom Design Capabilities',
    description: 'Bring your vision, we\'ll craft it by hand.',
  },
  {
    icon: Handshake,
    title: 'Wholesale Support',
    description: 'Dedicated bulk order pipeline for business partners.',
  },
]

export default function AboutPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hi%2C%20I%27m%20interested%20in%20wholesale%20jewellery%20partnership%20with%20Nakoda%20Jewellers.`

  return (
    <div>
      {/* ═══ Section 1: Luxury Hero ═══ */}
      <section className="relative bg-background overflow-hidden pt-40 md:pt-48 pb-32 md:pb-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="h-px w-24 bg-primary mx-auto mb-10" />
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground uppercase font-serif mb-8">
            Crafting Handmade{' '}
            <span className="text-shimmer">Jewellery</span>{' '}
            Since 2013
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Bangle specialists. Antique manufacturers.
            <br className="hidden sm:block" />{' '}
            Trusted by wholesale partners across India.
          </p>
          <div className="h-px w-24 bg-primary mx-auto mt-10" />
        </div>
        {/* Subtle radial background glow */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background pointer-events-none" />
      </section>

      {/* ═══ Section 2: Numbers That Matter ═══ */}
      <section className="py-24 bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <CountUpStats stats={stats} />
        </div>
      </section>

      {/* ═══ Section 3: Built on Trust (Our Story) ═══ */}
      <section className="relative py-32 bg-background overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center md:bg-right bg-no-repeat"
          style={{ backgroundImage: 'url(/images/about-trust-bg.png)' }}
        />
        {/* Dark Gradient Overlay for Readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-background via-background/90 to-background/10 md:to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl text-left">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-medium mb-4">
              Our Story
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground uppercase font-serif mb-8">
              Built on Trust
            </h2>
            <div className="h-px w-16 bg-primary mb-10" />
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              For over 12 years, Nakoda Jewellers has been dedicated to creating
              handcrafted jewellery with a focus on quality, craftsmanship, and
              attention to detail. From specialized bangles to antique and
              contemporary designs, we take pride in delivering jewellery that
              reflects tradition, artistry, and trust.
            </p>
          </div>
        </div>
      </section>



      {/* ═══ Section 4: Our Craftsmanship ═══ */}
      <section className="py-28 bg-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-medium mb-4">
              The Process
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground uppercase font-serif">
              Our Craftsmanship
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-6" />
          </div>

          {/* Desktop: Horizontal Flow */}
          <div className="hidden md:grid grid-cols-4 gap-0 relative">
            {/* Connecting line */}
            <div className="absolute top-12 left-[12.5%] right-[12.5%] h-px bg-border z-0" />

            {craftsmanshipSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="relative z-10 text-center px-6">
                  <div className="w-24 h-24 rounded-full border-2 border-primary/30 bg-background flex items-center justify-center mx-auto mb-6 transition-colors hover:border-primary hover:bg-primary/5">
                    <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground uppercase tracking-wider mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  {index < craftsmanshipSteps.length - 1 && (
                    <ArrowRight className="absolute top-10 -right-3 w-6 h-6 text-primary/40" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile: Vertical Flow */}
          <div className="md:hidden space-y-0">
            {craftsmanshipSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="relative">
                  <div className="flex items-start gap-6">
                    {/* Vertical line + circle */}
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full border-2 border-primary/30 bg-background flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                      </div>
                      {index < craftsmanshipSteps.length - 1 && (
                        <div className="w-px h-12 bg-border mt-2" />
                      )}
                    </div>
                    {/* Text */}
                    <div className="pt-3">
                      <h3 className="text-base font-bold text-foreground uppercase tracking-wider mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ Section 5: Our Expertise ═══ */}
      <section className="py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-medium mb-4">
              What We Do Best
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground uppercase font-serif">
              Our Expertise
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {expertiseCards.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="group border border-border rounded-sm p-8 bg-secondary hover:border-primary/40 transition-all duration-300 hover:bg-primary/5"
                >
                  <div className="w-14 h-14 rounded-full border border-primary/20 flex items-center justify-center mb-6 group-hover:border-primary/50 transition-colors">
                    <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground uppercase tracking-wider mb-3">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ Section 6: Why Choose Nakoda ═══ */}
      <section className="py-28 bg-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-medium mb-4">
              The Nakoda Advantage
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground uppercase font-serif">
              Why Choose Nakoda
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-6" />
          </div>

          <div className="space-y-6">
            {whyChoose.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-5 p-5 border border-border rounded-sm bg-background hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground tracking-wide mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ Section 7: Wholesale CTA ═══ */}
      <section className="relative py-28 bg-background overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="h-px w-16 bg-primary mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground uppercase font-serif mb-6">
            Looking for a Wholesale{' '}
            <span className="text-primary">Jewellery Partner?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
            We offer direct manufacturing rates, custom designs, and reliable
            bulk supply for retailers across India.
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
        {/* Subtle background glow */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background pointer-events-none" />
      </section>
    </div>
  )
}
