'use client'

import Image from 'next/image'
import Link from 'next/link'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    image_url: string | null
    image_alt: string
    image_url_2?: string | null
    category_name: string | null
    metal_type?: string | null
    purity?: string | null
    in_stock?: boolean
    badges?: string[]
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const specLabel = [product.purity, product.metal_type].filter(Boolean).join(' ')
  
  return (
    <div className="group block h-full">
      <Link href={`/products/${product.slug}`} className="block h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-secondary mb-5 rounded-sm border border-transparent group-hover:border-primary/50 group-hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] transition-all duration-700">
          {product.image_url ? (
            <>
              {/* Primary image */}
              <Image
                src={product.image_url}
                alt={product.image_alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className={`object-cover object-center transition-all duration-500 ${
                  product.image_url_2 ? 'group-hover:opacity-0' : 'group-hover:scale-105'
                }`}
              />
              {/* Second image on hover */}
              {product.image_url_2 && (
                <Image
                  src={product.image_url_2}
                  alt={`${product.image_alt} - alternate view`}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full w-full text-muted-foreground text-sm">
              No Image
            </div>
          )}

          {/* Badge tags (top-left) */}
          {product.badges && product.badges.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10">
              {product.badges.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary text-background rounded-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Stock indicator (top-right) */}
          {product.in_stock === false && (
            <div className="absolute top-2 right-2 z-10">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-900/80 text-red-200 rounded-sm">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col items-center text-center px-2 flex-grow">
          <h3 className="text-base font-bold text-foreground font-serif tracking-wide leading-snug">{product.name}</h3>
          
          {(product.category_name || specLabel) && (
            <div className="flex items-center gap-2 mt-2 mb-4">
              {product.category_name && (
                <span className="text-sm text-muted-foreground">{product.category_name}</span>
              )}
              {product.category_name && specLabel && (
                <span className="text-xs text-border">•</span>
              )}
              {specLabel && (
                <span className="text-sm text-primary font-medium">{specLabel}</span>
              )}
            </div>
          )}
          
          <div className="mt-auto pt-2">
            <span className="inline-block border-b border-primary/40 text-xs uppercase tracking-widest text-primary font-semibold pb-1 opacity-60 group-hover:opacity-100 group-hover:border-primary transition-all duration-300">
              View Details
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}
