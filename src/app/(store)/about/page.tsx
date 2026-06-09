import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Nakoda',
  description: 'Learn about Nakoda Jewellers, our craftsmanship, trust, and premium jewellery collections.',
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-widest text-foreground uppercase mb-8">About Nakoda</h1>
        <div className="h-1 w-24 bg-primary mx-auto mb-12"></div>
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
          For over two decades, Nakoda Jewellers has been a symbol of trust, elegance, and unparalleled craftsmanship. We specialize in curating the finest gold, diamond, and silver collections that celebrate the beauty of life&apos;s most precious moments.
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Our legacy is built on the foundation of purity and customer satisfaction. Every piece in our store is carefully designed to bring out the inner radiance of the wearer. Welcome to the world of timeless elegance.
        </p>
      </div>
    </div>
  )
}
