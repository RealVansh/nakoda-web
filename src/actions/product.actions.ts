'use server'

import { productSchema, type ActionResult } from '@/lib/validations'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/db'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { requireAdmin } from './auth.actions'
import { deleteProductImage } from '@/lib/r2'



export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  featured: boolean
  in_stock: boolean
  is_active: boolean
  category_id: string | null
  collection_id: string | null
  weight_grams: number | null
  purity: string | null
  metal_type: string | null
  occasion: string[]
  badges: string[]
  seo_title: string | null
  seo_description: string | null
  new_arrival_until: string | null
  created_at: string
  updated_at: string
}

export type ProductImage = {
  id: string
  product_id: string
  image_url: string
  image_path: string
  alt_text: string | null
  display_order: number
}

export type RelationName = {
  name: string
}

export type ProductWithImages = Product & {
  product_images: ProductImage[]
  categories?: RelationName | null
  collections?: RelationName | null
}

export type ProductListItem = ProductWithImages

export type PaginatedProducts = {
  products: ProductListItem[]
  total: number
  pages: number
}

export type ProductFilterParams = {
  page?: number
  limit?: number
  categoryId?: string
  collectionId?: string
  occasion?: string
  metalType?: string
  purity?: string
  inStock?: boolean
  badge?: string
  sort?: 'newest' | 'oldest' | 'name-asc' | 'name-desc'
  search?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatProduct<T extends { product_images?: ProductImage[], badges?: string | string[], occasion?: string | string[], new_arrival_until?: string | null }>(product: T): T {
  if (typeof product.occasion === 'string') {
    try { product.occasion = JSON.parse(product.occasion) as string[] } catch { product.occasion = [] as unknown as T['occasion'] }
  }
  if (typeof product.badges === 'string') {
    try { product.badges = JSON.parse(product.badges) as string[] } catch { product.badges = [] as unknown as T['badges'] }
  }
  if ('featured' in product) (product as Record<string, unknown>).featured = Boolean((product as Record<string, unknown>).featured)
  if ('in_stock' in product) (product as Record<string, unknown>).in_stock = Boolean((product as Record<string, unknown>).in_stock)
  if ('is_active' in product) (product as Record<string, unknown>).is_active = Boolean((product as Record<string, unknown>).is_active)

  if (product.product_images) {
    product.product_images.sort((a, b) => a.display_order - b.display_order)
  }

  if (Array.isArray(product.badges) && product.badges.includes('New Arrival')) {
    if (!product.new_arrival_until || new Date(product.new_arrival_until) < new Date()) {
      product.badges = product.badges.filter((b: string) => b !== 'New Arrival') as T['badges'] & string[]
    }
  }

  return product
}



function assembleProductsWithImages(products: Record<string, unknown>[], images: ProductImage[]): ProductWithImages[] {
  if (products.length === 0) return []
  const imageMap = new Map<string, ProductImage[]>()
  for (const img of images) {
    if (!imageMap.has(img.product_id)) imageMap.set(img.product_id, [])
    imageMap.get(img.product_id)!.push(img)
  }

  return products.map(p => {
    const assembled = {
      ...p,
      product_images: imageMap.get(p.id as string) || [],
      categories: p.category_name ? { name: p.category_name as string } : null,
      collections: p.collection_name ? { name: p.collection_name as string } : null,
    }
    delete (assembled as Record<string, unknown>).category_name
    delete (assembled as Record<string, unknown>).collection_name
    return formatProduct(assembled as unknown as ProductWithImages)
  })
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createProduct(
  data: z.infer<typeof productSchema>
): Promise<ActionResult<Product>> {
  await requireAdmin()

  const result = productSchema.safeParse(data)
  if (!result.success) return { success: false, errors: result.error.flatten().fieldErrors }

  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const id = uuidv4()

  let new_arrival_until: string | null = null
  if (result.data.badges?.includes('New Arrival')) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    new_arrival_until = thirtyDaysFromNow.toISOString()
  }

  const d = result.data
  try {
    await apiPost('/api/products', {
      params: [
        id, d.name, slug, d.description ?? null,
        d.featured ? 1 : 0, d.in_stock !== false ? 1 : 0, d.is_active !== false ? 1 : 0,
        d.category_id ?? null, d.collection_id ?? null,
        d.weight_grams ?? null, d.purity ?? null, d.metal_type ?? null,
        JSON.stringify(d.occasion || []), JSON.stringify(d.badges || []),
        d.seo_title ?? null, d.seo_description ?? null,
        new_arrival_until,
      ]
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('UNIQUE')) return { success: false, error: 'A product with this slug already exists' }
    return { success: false, error: message }
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  revalidateTag('products', 'default')
  revalidateTag('categories', 'default')
  revalidateTag('collections', 'default')
  return { success: true, data: { id, name: d.name, slug } as unknown as Product }
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof productSchema>
): Promise<ActionResult<Product>> {
  await requireAdmin()

  const result = productSchema.safeParse(data)
  if (!result.success) return { success: false, errors: result.error.flatten().fieldErrors }

  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  let new_arrival_until: string | null = null
  if (result.data.badges?.includes('New Arrival')) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    new_arrival_until = thirtyDaysFromNow.toISOString()
  }

  const d = result.data
  try {
    const response = await apiPut<{ updated: Product }>(`/api/products/${id}`, {
      params: [
        d.name, slug, d.description ?? null,
        d.featured ? 1 : 0, d.in_stock !== false ? 1 : 0, d.is_active !== false ? 1 : 0,
        d.category_id ?? null, d.collection_id ?? null,
        d.weight_grams ?? null, d.purity ?? null, d.metal_type ?? null,
        JSON.stringify(d.occasion || []), JSON.stringify(d.badges || []),
        d.seo_title ?? null, d.seo_description ?? null,
        new_arrival_until,
      ]
    })
    
    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${id}`)
    revalidatePath(`/products/${slug}`)
    revalidateTag('products', 'default')
    revalidateTag(`product-${slug}`, 'default')
    revalidateTag(`product-id-${id}`, 'default')
    
    return { success: true, data: response.updated ? formatProduct(response.updated) : undefined }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin()
  
  try {
    const response = await apiDelete<{ images: { image_path: string }[] }>(`/api/products/${id}`)
    
    if (response.images && response.images.length > 0) {
      for (const img of response.images) {
        await deleteProductImage(img.image_path)
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  revalidateTag('products', 'default')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Read queries
// ---------------------------------------------------------------------------

export const getProducts = unstable_cache(
  async (): Promise<ProductListItem[]> => {
    try {
      const data = await apiGet<{ products: Record<string, unknown>[], images: ProductImage[] }>('/api/products')
      return assembleProductsWithImages(data.products, data.images)
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  },
  ['products-list-v2'],
  { tags: ['products'] }
)

export async function getAdminProducts(): Promise<ProductListItem[]> {
  await requireAdmin()
  try {
    const data = await apiGet<{ products: Record<string, unknown>[], images: ProductImage[] }>('/api/products/admin', { cache: 'no-store' })
    return assembleProductsWithImages(data.products, data.images)
  } catch (error) {
    console.error('Error fetching admin products:', error)
    return []
  }
}

export const getPaginatedProducts = unstable_cache(
  async (params: ProductFilterParams = {}): Promise<PaginatedProducts> => {
    try {
      const data = await apiPost<{ products: Record<string, unknown>[], images: ProductImage[], total: number, pages: number }>('/api/products/paginated', params)
      return {
        products: assembleProductsWithImages(data.products, data.images),
        total: data.total,
        pages: data.pages,
      }
    } catch (error) {
      console.error('Error fetching paginated products:', error)
      return { products: [], total: 0, pages: 0 }
    }
  },
  ['products-paginated-v2'],
  { tags: ['products'] }
)

export async function getProductById(id: string): Promise<ProductWithImages | null> {
  await requireAdmin() // Added for security to protect draft products
  try {
    const data = await apiGet<{ product: Record<string, unknown> | null, images: ProductImage[] }>(`/api/products/${id}`, { cache: 'no-store' })
    if (!data.product) return null
    
    const assembled = {
      ...data.product,
      product_images: data.images,
    } as unknown as ProductWithImages
    
    return formatProduct(assembled)
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    return null
  }
}

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductWithImages | null> => {
    try {
      const data = await apiGet<{ product: Record<string, unknown> | null, images: ProductImage[] }>(`/api/products/by-slug/${slug}`)
      if (!data.product) return null

      const assembled = {
        ...data.product,
        product_images: data.images,
        categories: data.product.category_name ? { name: data.product.category_name as string } : null,
        collections: data.product.collection_name ? { name: data.product.collection_name as string } : null,
      } as unknown as ProductWithImages

      delete (assembled as Record<string, unknown>).category_name
      delete (assembled as Record<string, unknown>).collection_name

      return formatProduct(assembled)
    } catch (error) {
      console.error('Error fetching product by slug:', error)
      return null
    }
  },
  ['product-by-slug-v2'],
  { tags: ['products'] }
)

export const getFeaturedProducts = unstable_cache(
  async (): Promise<ProductWithImages[]> => {
    try {
      const data = await apiGet<{ products: Record<string, unknown>[], images: ProductImage[] }>('/api/products/featured')
      return assembleProductsWithImages(data.products, data.images)
    } catch (error) {
      console.error('Error fetching featured products:', error)
      return []
    }
  },
  ['products-featured-v2'],
  { tags: ['products'] }
)

export const getNewArrivals = unstable_cache(
  async (limit = 8): Promise<ProductWithImages[]> => {
    try {
      const data = await apiPost<{ products: Record<string, unknown>[], images: ProductImage[] }>('/api/products/new-arrivals', { 
        limit, 
        dateString: new Date().toISOString() 
      })
      return assembleProductsWithImages(data.products, data.images)
    } catch (error) {
      console.error('Error fetching new arrivals:', error)
      return []
    }
  },
  ['products-new-arrivals-v2'],
  { tags: ['products'] }
)

export const getRelatedProducts = unstable_cache(
  async (
    categoryId: string | null,
    excludeProductId: string,
    limit = 4
  ): Promise<ProductWithImages[]> => {
    try {
      const data = await apiPost<{ products: Record<string, unknown>[], images: ProductImage[] }>('/api/products/related', { 
        categoryId, excludeProductId, limit 
      })
      return assembleProductsWithImages(data.products, data.images)
    } catch (error) {
      console.error('Error fetching related products:', error)
      return []
    }
  },
  ['products-related-v2'],
  { tags: ['products'] }
)

export async function searchProducts(searchQuery: string, limit = 12): Promise<ProductWithImages[]> {
  try {
    const data = await apiPost<{ products: Record<string, unknown>[], images: ProductImage[] }>('/api/products/search', { 
      searchQuery, limit 
    })
    return assembleProductsWithImages(data.products, data.images)
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

export const getProductSlugs = unstable_cache(
  async (): Promise<{ slug: string; updated_at: string; created_at: string }[]> => {
    try {
      const data = await apiGet<{ results: { slug: string; updated_at: string; created_at: string }[] }>('/api/products/slugs')
      return data.results
    } catch (error) {
      console.error('Error fetching product slugs:', error)
      return []
    }
  },
  ['product-slugs-v2'],
  { tags: ['products'] }
)

// ---------------------------------------------------------------------------
// Image Actions
// ---------------------------------------------------------------------------

export async function addProductImage(
  productId: string,
  imageUrl: string,
  imagePath: string,
): Promise<ActionResult<ProductImage>> {
  await requireAdmin()

  if (!z.string().uuid().safeParse(productId).success) return { success: false, error: 'Invalid product' }
  if (!imageUrl.startsWith('https://') || !imagePath.startsWith('products/')) return { success: false, error: 'Invalid image metadata' }

  const id = uuidv4()
  
  try {
    await apiPost('/api/products/images', {
      params: [id, productId, imageUrl, imagePath, null, 0] // displayOrder is ignored by worker SQL
    })

    const newImage: ProductImage = {
      id,
      product_id: productId,
      image_url: imageUrl,
      image_path: imagePath,
      alt_text: null,
      display_order: 0, // This will be outdated on client until refresh, but fine for now
    }

    revalidatePath(`/admin/products/${productId}/edit`)
    revalidatePath('/admin/products')
    revalidatePath('/products')
    revalidateTag('products', 'default')
    
    return { success: true, data: newImage }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export async function removeProductImage(imageId: string): Promise<ActionResult> {
  await requireAdmin()

  if (!z.string().uuid().safeParse(imageId).success) return { success: false, error: 'Invalid image' }

  try {
    const data = await apiGet<{ image: { id: string; product_id: string; image_path: string } | null }>(`/api/product-images/${imageId}`)
    if (!data.image) return { success: false, error: 'Image not found' }

    const storageDeleted = await deleteProductImage(data.image.image_path)
    if (!storageDeleted) return { success: false, error: 'Could not delete image from storage' }

    await apiDelete(`/api/product-images/${imageId}`)

    revalidatePath(`/admin/products/${data.image.product_id}/edit`)
    revalidatePath('/admin/products')
    revalidatePath('/products')
    revalidateTag('products', 'default')

    return { success: true }
  } catch {
    return { success: false, error: 'Could not delete image metadata' }
  }
}
