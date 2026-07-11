import type { MetadataRoute } from 'next'
import { getProductSlugs } from '@/actions/product.actions'
import { getCategories } from '@/actions/category.actions'
import { getCollections } from '@/actions/collection.actions'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nakodajewellers.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections] = await Promise.all([
    getProductSlugs(),
    getCategories(),
    getCollections()
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    lastModified: new Date(product.updated_at || product.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteUrl}/products?category=${cat.id}`,
    lastModified: new Date(cat.created_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((col) => ({
    url: `${siteUrl}/products?collection=${col.id}`,
    lastModified: new Date(col.created_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...collectionRoutes,
    ...productRoutes,
  ]
}
