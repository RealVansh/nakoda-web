import { getProductBySlug } from '@/actions/product.actions'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { ProductGallery } from '@/components/store/ProductGallery'
import { AddToCartButton } from '@/components/store/AddToCartButton'
import { RelatedProducts } from '@/components/store/RelatedProducts'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const description = product.description || `View ${product.name} from Nakoda Jewellers.`
  const primaryImage = product.product_images?.[0]

  return {
    title: product.name,
    description,
    keywords: [
      product.name,
      product.categories?.name,
      product.metal_type,
      ...(product.occasion || []),
      ...(product.badges || []),
      'Nakoda Jewellers',
      'Jewellery'
    ].filter(Boolean) as string[],
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Nakoda Jewellers`,
      description,
      url: `/products/${product.slug}`,
      type: 'website',
      images: primaryImage
        ? [{ url: primaryImage.image_url, alt: primaryImage.alt_text || product.name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Nakoda Jewellers`,
      description,
      images: primaryImage ? [primaryImage.image_url] : [],
    },
  }
}

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const product = await getProductBySlug(resolvedParams.slug)

  if (!product) {
    notFound()
  }

  const images = product.product_images?.map((img) => ({
    url: img.image_url,
    alt: img.alt_text
  })) || []

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nakodajewellers.com'
  const whatsappMessage = encodeURIComponent(`Hi, I'm interested in the ${product.name}.\n\n${siteUrl}/products/${product.slug}\n\nPlease share pricing and availability details.`)
  const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}?text=${whatsappMessage}`
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: images.map((image) => image.url),
    category: product.categories?.name,
    url: `${siteUrl}/products/${product.slug}`,
    brand: {
      '@type': 'Brand',
      name: 'Nakoda Jewellers',
    },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol role="list" className="flex items-center space-x-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li>
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="ml-2 h-5 w-5 flex-shrink-0 text-border">
              <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
            </svg>
          </li>
          <li>
            <Link href="/products" className="hover:text-primary transition-colors ml-2">Shop</Link>
          </li>
          {product.categories && (
            <>
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="ml-2 h-5 w-5 flex-shrink-0 text-border">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
              </li>
              <li>
                <Link href={`/products?category=${product.category_id}`} className="hover:text-primary transition-colors ml-2">
                  {product.categories.name}
                </Link>
              </li>
            </>
          )}
          <li>
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="ml-2 h-5 w-5 flex-shrink-0 text-border">
              <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
            </svg>
          </li>
          <li className="text-foreground ml-2 font-medium" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
        
        {/* Product Gallery */}
        <div className="mb-10 lg:mb-0">
          <ProductGallery images={images} />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>
          
          <div className="mt-3">
            <h2 className="sr-only">Product information</h2>
            <p className="text-muted-foreground uppercase tracking-wider text-sm mb-4">
              {product.categories?.name || 'Collection'}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.metal_type && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-foreground border border-border">
                  {product.metal_type}
                </span>
              )}
              {product.occasion && product.occasion.map((occ: string) => (
                <span key={occ} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/50 text-muted-foreground border border-border">
                  {occ}
                </span>
              ))}
              {product.badges && product.badges.map((badge: string) => (
                <span key={badge} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div className="space-y-6 text-base text-foreground leading-relaxed">
              <p>{product.description || 'No description available for this exquisite piece.'}</p>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-8">
            <h3 className="text-sm font-medium text-foreground mb-4">Product Details</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {product.weight_grams && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">Weight</dt>
                  <dd className="mt-1 text-sm text-foreground">{product.weight_grams} grams</dd>
                </div>
              )}
              {product.purity && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-muted-foreground">Purity</dt>
                  <dd className="mt-1 text-sm text-foreground">{product.purity}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="mt-8 border-t border-border pt-8">
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                product.in_stock ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
                {product.in_stock ? 'In Stock & Available' : 'Currently Unavailable'}
              </span>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <AddToCartButton
              disabled={product.in_stock === false}
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                image_url: product.product_images?.[0]?.image_url || null,
              }}
            />
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-8 rounded-sm text-center transition-colors uppercase tracking-wider text-sm flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Inquire via WhatsApp
            </a>
          </div>

        </div>
      </div>

      {/* Related Products */}
      <Suspense fallback={<div className="mt-16 h-64 flex items-center justify-center text-muted-foreground bg-secondary/20 rounded-md border border-border">Loading related pieces...</div>}>
        <RelatedProducts
          categoryId={product.category_id}
          currentProductId={product.id}
        />
      </Suspense>
    </div>
  )
}
