'use server'

import { productSchema, type ActionResult } from '@/lib/validations'
import { query, queryOne, execute } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { requireAdmin } from './auth.actions'
import { deleteProductImage, uploadProductImage } from '@/lib/r2'

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_UPLOAD_FILES = 10
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

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
  // Parse JSON strings to arrays if needed
  if (typeof product.occasion === 'string') {
    try { product.occasion = JSON.parse(product.occasion) as string[] } catch { product.occasion = [] as unknown as T['occasion'] }
  }
  if (typeof product.badges === 'string') {
    try { product.badges = JSON.parse(product.badges) as string[] } catch { product.badges = [] as unknown as T['badges'] }
  }
  // Convert SQLite integers to booleans
  if ('featured' in product) (product as Record<string, unknown>).featured = Boolean((product as Record<string, unknown>).featured)
  if ('in_stock' in product) (product as Record<string, unknown>).in_stock = Boolean((product as Record<string, unknown>).in_stock)
  if ('is_active' in product) (product as Record<string, unknown>).is_active = Boolean((product as Record<string, unknown>).is_active)

  // Sort images by display_order
  if (product.product_images) {
    product.product_images.sort((a, b) => a.display_order - b.display_order)
  }

  // Smart Badge Removal
  if (Array.isArray(product.badges) && product.badges.includes('New Arrival')) {
    if (!product.new_arrival_until || new Date(product.new_arrival_until) < new Date()) {
      product.badges = product.badges.filter((b: string) => b !== 'New Arrival') as T['badges'] & string[]
    }
  }

  return product
}

function validateImageFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!extension || !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return 'Only JPG, PNG, and WebP images are allowed'
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Only JPG, PNG, and WebP images are allowed'
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Each image must be 5MB or smaller'
  }

  return null
}

/**
 * Fetches images for a list of products and attaches them,
 * along with category/collection relation names from LEFT JOIN aliases.
 */
async function assembleProductsWithImages(products: Record<string, unknown>[]): Promise<ProductWithImages[]> {
  if (products.length === 0) return []

  const productIds = products.map(p => p.id as string)
  const placeholders = productIds.map(() => '?').join(',')

  // Fetch all images for these products
  const images = await query<ProductImage>(
    `SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY display_order`,
    productIds
  )

  // Group images by product_id
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
    // Remove the raw join aliases
    delete (assembled as Record<string, unknown>).category_name
    delete (assembled as Record<string, unknown>).collection_name
    return formatProduct(assembled as unknown as ProductWithImages)
  })
}

/** Base SELECT with LEFT JOINs for category/collection names */
const BASE_SELECT = `
  SELECT p.*, c.name as category_name, col.name as collection_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN collections col ON p.collection_id = col.id
`

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createProduct(
  data: z.infer<typeof productSchema>
): Promise<ActionResult<Product>> {
  await requireAdmin()

  const result = productSchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const id = uuidv4()

  // Calculate new_arrival_until
  let new_arrival_until: string | null = null
  if (result.data.badges?.includes('New Arrival')) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    new_arrival_until = thirtyDaysFromNow.toISOString()
  }

  const d = result.data

  try {
    await execute(
      `INSERT INTO products (
        id, name, slug, description, featured, in_stock, is_active,
        category_id, collection_id, weight_grams, purity, metal_type,
        occasion, badges, seo_title, seo_description,
        new_arrival_until, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        id, d.name, slug, d.description ?? null,
        d.featured ? 1 : 0, d.in_stock !== false ? 1 : 0, d.is_active !== false ? 1 : 0,
        d.category_id ?? null, d.collection_id ?? null,
        d.weight_grams ?? null, d.purity ?? null, d.metal_type ?? null,
        JSON.stringify(d.occasion || []), JSON.stringify(d.badges || []),
        d.seo_title ?? null, d.seo_description ?? null,
        new_arrival_until,
      ]
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[createProduct] DB Error:', message)
    if (message.includes('UNIQUE')) {
      return { success: false, error: 'A product with this slug already exists' }
    }
    return { success: false, error: message }
  }

  const product: Product = {
    id,
    name: d.name,
    slug,
    description: d.description ?? null,
    featured: Boolean(d.featured),
    in_stock: d.in_stock !== false,
    is_active: d.is_active !== false,
    category_id: d.category_id ?? null,
    collection_id: d.collection_id ?? null,
    weight_grams: d.weight_grams ?? null,
    purity: d.purity ?? null,
    metal_type: d.metal_type ?? null,
    occasion: d.occasion || [],
    badges: d.badges || [],
    seo_title: d.seo_title ?? null,
    seo_description: d.seo_description ?? null,
    new_arrival_until,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  return { success: true, data: product }
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof productSchema>
): Promise<ActionResult<Product>> {
  await requireAdmin()

  const result = productSchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  // Calculate new_arrival_until based on checkbox presence
  let new_arrival_until: string | null = null
  if (result.data.badges?.includes('New Arrival')) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    new_arrival_until = thirtyDaysFromNow.toISOString()
  }

  const d = result.data

  try {
    await execute(
      `UPDATE products SET
        name = ?, slug = ?, description = ?, featured = ?, in_stock = ?, is_active = ?,
        category_id = ?, collection_id = ?, weight_grams = ?, purity = ?, metal_type = ?,
        occasion = ?, badges = ?, seo_title = ?, seo_description = ?,
        new_arrival_until = ?, updated_at = datetime('now')
      WHERE id = ?`,
      [
        d.name, slug, d.description ?? null,
        d.featured ? 1 : 0, d.in_stock !== false ? 1 : 0, d.is_active !== false ? 1 : 0,
        d.category_id ?? null, d.collection_id ?? null,
        d.weight_grams ?? null, d.purity ?? null, d.metal_type ?? null,
        JSON.stringify(d.occasion || []), JSON.stringify(d.badges || []),
        d.seo_title ?? null, d.seo_description ?? null,
        new_arrival_until,
        id,
      ]
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }

  // Fetch the updated product to return
  const updated = await queryOne<Product>(
    `SELECT * FROM products WHERE id = ?`,
    [id]
  )

  if (updated) {
    formatProduct(updated)
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)
  revalidatePath(`/products/${slug}`)
  return { success: true, data: updated ?? undefined }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin()

  // First fetch images to delete from R2
  const images = await query<{ image_path: string }>(
    `SELECT image_path FROM product_images WHERE product_id = ?`,
    [id]
  )

  // Delete product (CASCADE handles product_images rows)
  try {
    await execute(`DELETE FROM products WHERE id = ?`, [id])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }

  // Delete images from R2
  if (images.length > 0) {
    for (const img of images) {
      await deleteProductImage(img.image_path)
    }
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Read queries
// ---------------------------------------------------------------------------

export async function getProducts(): Promise<ProductListItem[]> {
  try {
    const products = await query<Record<string, unknown>>(
      `${BASE_SELECT} WHERE p.is_active = 1 ORDER BY p.created_at DESC`
    )
    return assembleProductsWithImages(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function getPaginatedProducts(params: ProductFilterParams = {}): Promise<PaginatedProducts> {
  const {
    page = 1,
    limit = 12,
    categoryId,
    collectionId,
    occasion,
    metalType,
    purity,
    inStock,
    badge,
    sort = 'newest',
    search,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.min(Math.max(1, limit), 48)
  const offset = (safePage - 1) * safeLimit

  // Build WHERE clause dynamically
  const conditions: string[] = ['p.is_active = 1']
  const queryParams: unknown[] = []

  if (categoryId) {
    conditions.push('p.category_id = ?')
    queryParams.push(categoryId)
  }
  if (collectionId) {
    conditions.push('p.collection_id = ?')
    queryParams.push(collectionId)
  }
  if (metalType) {
    conditions.push('p.metal_type = ?')
    queryParams.push(metalType)
  }
  if (purity) {
    conditions.push('p.purity = ?')
    queryParams.push(purity)
  }
  if (inStock !== undefined) {
    conditions.push('p.in_stock = ?')
    queryParams.push(inStock ? 1 : 0)
  }
  if (occasion) {
    conditions.push('p.occasion LIKE ?')
    queryParams.push(`%"${occasion}"%`)
  }

  if (badge === 'New Arrival') {
    conditions.push(`p.badges LIKE '%"New Arrival"%'`)
    conditions.push('p.new_arrival_until >= ?')
    queryParams.push(new Date().toISOString())
  } else if (badge) {
    conditions.push('p.badges LIKE ?')
    queryParams.push(`%"${badge}"%`)
  }

  if (search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)')
    queryParams.push(`%${search}%`, `%${search}%`)
  }

  const whereClause = conditions.join(' AND ')

  // Sorting
  let orderClause: string
  switch (sort) {
    case 'oldest':
      orderClause = 'ORDER BY p.created_at ASC'
      break
    case 'name-asc':
      orderClause = 'ORDER BY p.name ASC'
      break
    case 'name-desc':
      orderClause = 'ORDER BY p.name DESC'
      break
    default:
      orderClause = 'ORDER BY p.created_at DESC'
  }

  try {
    // Count query
    const countResult = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM products p WHERE ${whereClause}`,
      [...queryParams]
    )
    const total = countResult?.count ?? 0

    // Data query
    const products = await query<Record<string, unknown>>(
      `${BASE_SELECT} WHERE ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
      [...queryParams, safeLimit, offset]
    )

    const assembled = await assembleProductsWithImages(products)

    return {
      products: assembled,
      total,
      pages: Math.ceil(total / safeLimit),
    }
  } catch (error) {
    console.error('Error fetching paginated products:', error)
    return { products: [], total: 0, pages: 0 }
  }
}

export async function getProductById(id: string): Promise<ProductWithImages | null> {
  try {
    const product = await queryOne<Record<string, unknown>>(
      `SELECT p.* FROM products p WHERE p.id = ?`,
      [id]
    )

    if (!product) return null

    const images = await query<ProductImage>(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order`,
      [id]
    )

    const assembled = {
      ...product,
      product_images: images,
    } as unknown as ProductWithImages

    return formatProduct(assembled)
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export async function getFeaturedProducts(): Promise<ProductWithImages[]> {
  try {
    const products = await query<Record<string, unknown>>(
      `${BASE_SELECT} WHERE p.is_active = 1 AND p.featured = 1 ORDER BY p.created_at DESC LIMIT 8`
    )
    return assembleProductsWithImages(products)
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<ProductWithImages | null> {
  try {
    const product = await queryOne<Record<string, unknown>>(
      `${BASE_SELECT} WHERE p.is_active = 1 AND p.slug = ?`,
      [slug]
    )

    if (!product) return null

    const images = await query<ProductImage>(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order`,
      [product.id as string]
    )

    const assembled = {
      ...product,
      product_images: images,
      categories: product.category_name ? { name: product.category_name as string } : null,
      collections: product.collection_name ? { name: product.collection_name as string } : null,
    } as unknown as ProductWithImages

    delete (assembled as Record<string, unknown>).category_name
    delete (assembled as Record<string, unknown>).collection_name

    return formatProduct(assembled)
  } catch (error) {
    console.error('Error fetching product by slug:', error)
    return null
  }
}

export async function getNewArrivals(limit = 8): Promise<ProductWithImages[]> {
  try {
    const products = await query<Record<string, unknown>>(
      `${BASE_SELECT}
       WHERE p.is_active = 1
         AND p.badges LIKE '%"New Arrival"%'
         AND p.new_arrival_until >= ?
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [new Date().toISOString(), limit]
    )
    return assembleProductsWithImages(products)
  } catch (error) {
    console.error('Error fetching new arrivals:', error)
    return []
  }
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeProductId: string,
  limit = 4
): Promise<ProductWithImages[]> {
  try {
    let sql = `${BASE_SELECT} WHERE p.is_active = 1 AND p.id != ?`
    const params: unknown[] = [excludeProductId]

    if (categoryId) {
      sql += ' AND p.category_id = ?'
      params.push(categoryId)
    }

    sql += ' ORDER BY p.created_at DESC LIMIT ?'
    params.push(limit)

    const products = await query<Record<string, unknown>>(sql, params)
    return assembleProductsWithImages(products)
  } catch (error) {
    console.error('Error fetching related products:', error)
    return []
  }
}

export async function searchProducts(searchQuery: string, limit = 12): Promise<ProductWithImages[]> {
  try {
    const products = await query<Record<string, unknown>>(
      `${BASE_SELECT}
       WHERE p.is_active = 1
         AND (p.name LIKE ? OR p.description LIKE ?)
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [`%${searchQuery}%`, `%${searchQuery}%`, limit]
    )
    return assembleProductsWithImages(products)
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Image Actions
// ---------------------------------------------------------------------------

export async function addProductImage(
  productId: string,
  imageUrl: string,
  imagePath: string,
  displayOrder: number = 0
): Promise<ActionResult> {
  await requireAdmin()

  if (!z.string().uuid().safeParse(productId).success) {
    return { success: false, error: 'Invalid product' }
  }

  if (!imageUrl.startsWith('https://') || !imagePath.startsWith('products/')) {
    return { success: false, error: 'Invalid image metadata' }
  }

  const id = uuidv4()

  try {
    await execute(
      `INSERT INTO product_images (id, product_id, image_url, image_path, display_order)
       VALUES (?, ?, ?, ?, ?)`,
      [id, productId, imageUrl, imagePath, displayOrder]
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }

  revalidatePath(`/admin/products/${productId}`)
  return { success: true }
}

export async function uploadProductImages(
  productId: string,
  formData: FormData
): Promise<ActionResult<ProductImage[]>> {
  await requireAdmin()

  if (!z.string().uuid().safeParse(productId).success) {
    return { success: false, error: 'Invalid product' }
  }

  const files = formData
    .getAll('images')
    .filter((value): value is File => value instanceof File && value.size > 0)

  if (files.length === 0) {
    return { success: false, error: 'No images selected' }
  }

  if (files.length > MAX_UPLOAD_FILES) {
    return { success: false, error: `Upload up to ${MAX_UPLOAD_FILES} images at a time` }
  }

  for (const file of files) {
    const validationError = validateImageFile(file)
    if (validationError) {
      return { success: false, error: validationError }
    }
  }

  // Get the current highest display_order
  const existing = await queryOne<{ max_order: number | null }>(
    `SELECT MAX(display_order) as max_order FROM product_images WHERE product_id = ?`,
    [productId]
  )

  let nextDisplayOrder = existing?.max_order ?? -1
  const uploadedImages: ProductImage[] = []

  for (const file of files) {
    const uploaded = await uploadProductImage(file)
    if (!uploaded) {
      return { success: false, error: 'Image upload failed' }
    }

    nextDisplayOrder += 1
    const imageId = uuidv4()

    try {
      await execute(
        `INSERT INTO product_images (id, product_id, image_url, image_path, alt_text, display_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [imageId, productId, uploaded.url, uploaded.path, null, nextDisplayOrder]
      )

      uploadedImages.push({
        id: imageId,
        product_id: productId,
        image_url: uploaded.url,
        image_path: uploaded.path,
        alt_text: null,
        display_order: nextDisplayOrder,
      })
    } catch {
      await deleteProductImage(uploaded.path)
      return { success: false, error: 'Could not save image metadata' }
    }
  }

  revalidatePath(`/admin/products/${productId}/edit`)
  revalidatePath('/admin/products')
  revalidatePath('/products')

  return { success: true, data: uploadedImages }
}

export async function removeProductImage(imageId: string): Promise<ActionResult> {
  await requireAdmin()

  if (!z.string().uuid().safeParse(imageId).success) {
    return { success: false, error: 'Invalid image' }
  }

  const image = await queryOne<{ id: string; product_id: string; image_path: string }>(
    `SELECT id, product_id, image_path FROM product_images WHERE id = ?`,
    [imageId]
  )

  if (!image) {
    return { success: false, error: 'Image not found' }
  }

  const storageDeleted = await deleteProductImage(image.image_path)
  if (!storageDeleted) {
    return { success: false, error: 'Could not delete image from storage' }
  }

  try {
    await execute(`DELETE FROM product_images WHERE id = ?`, [imageId])
  } catch {
    return { success: false, error: 'Could not delete image metadata' }
  }

  revalidatePath(`/admin/products/${image.product_id}/edit`)
  revalidatePath('/admin/products')
  revalidatePath('/products')

  return { success: true }
}

export async function getProductSlugs(): Promise<{ slug: string; updated_at: string; created_at: string }[]> {
  try {
    const data = await query<{ slug: string; updated_at: string; created_at: string }>(
      `SELECT slug, updated_at, created_at FROM products WHERE is_active = 1 ORDER BY updated_at DESC`
    )
    return data
  } catch (error) {
    console.error('Error fetching product slugs:', error)
    return []
  }
}
