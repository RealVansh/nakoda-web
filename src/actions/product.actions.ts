'use server'

import { createClient } from '@/lib/supabase/server'
import { productSchema, type ActionResult } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from './auth.actions'
import { deleteProductImage, uploadProductImage } from '@/lib/supabase/storage'

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

function formatProduct<T extends { product_images?: ProductImage[], badges?: string[], new_arrival_until?: string | null }>(product: T): T {
  if (product.product_images) {
    product.product_images.sort((a, b) => a.display_order - b.display_order)
  }
  
  // Smart Badge Removal
  if (product.badges?.includes('New Arrival')) {
    if (!product.new_arrival_until || new Date(product.new_arrival_until) < new Date()) {
      product.badges = product.badges.filter(b => b !== 'New Arrival')
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

export async function createProduct(
  data: z.infer<typeof productSchema>
): Promise<ActionResult<Product>> {
  const { supabase } = await requireAdmin()

  const result = productSchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  // Calculate new_arrival_until
  let new_arrival_until = null
  if (result.data.badges?.includes('New Arrival')) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    new_arrival_until = thirtyDaysFromNow.toISOString()
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert([{ ...result.data, slug, new_arrival_until }])
    .select()
    .single()

  if (error) {
    console.error('[createProduct] DB Error:', error.code, error.message, error.details, error.hint)
    if (error.code === '23505') {
      return { success: false, error: 'A product with this slug already exists' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  return { success: true, data: product }
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof productSchema>
): Promise<ActionResult<Product>> {
  const { supabase } = await requireAdmin()

  const result = productSchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  // Calculate new_arrival_until based on checkbox presence
  let new_arrival_until = null
  if (result.data.badges?.includes('New Arrival')) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    new_arrival_until = thirtyDaysFromNow.toISOString()
  }

  const { data: product, error } = await supabase
    .from('products')
    .update({ ...result.data, slug, new_arrival_until, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)
  revalidatePath(`/products/${slug}`)
  return { success: true, data: product }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  // First fetch images to delete from storage bucket
  const { data: images } = await supabase
    .from('product_images')
    .select('image_path')
    .eq('product_id', id)

  // Delete product (cascade will handle db rows)
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Delete images from storage bucket
  if (images && images.length > 0) {
    for (const img of images) {
      await deleteProductImage(img.image_path)
    }
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  return { success: true }
}

export async function getProducts(): Promise<ProductListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name),
      collections(name),
      product_images(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return (data as ProductListItem[]).map(formatProduct)
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

  const supabase = await createClient()
  const safePage = Math.max(1, page)
  const safeLimit = Math.min(Math.max(1, limit), 48)
  const from = (safePage - 1) * safeLimit
  const to = from + safeLimit - 1

  let query = supabase
    .from('products')
    .select(`
      *,
      categories(name),
      collections(name),
      product_images(*)
    `, { count: 'exact' })

  if (categoryId) query = query.eq('category_id', categoryId)
  if (collectionId) query = query.eq('collection_id', collectionId)
  if (metalType) query = query.eq('metal_type', metalType)
  if (purity) query = query.eq('purity', purity)
  if (inStock !== undefined) query = query.eq('in_stock', inStock)
  if (occasion) query = query.contains('occasion', [occasion])
  
  if (badge === 'New Arrival') {
    query = query.contains('badges', ['New Arrival']).gte('new_arrival_until', new Date().toISOString())
  } else if (badge) {
    query = query.contains('badges', [badge])
  }
  
  if (search) query = query.textSearch('fts', search, { type: 'websearch' })

  // Sorting
  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'name-asc':
      query = query.order('name', { ascending: true })
      break
    case 'name-desc':
      query = query.order('name', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching paginated products:', error)
    return { products: [], total: 0, pages: 0 }
  }

  const total = count ?? 0

  return {
    products: (data as ProductListItem[]).map(formatProduct),
    total,
    pages: Math.ceil(total / safeLimit),
  }
}

export async function getProductById(id: string): Promise<ProductWithImages | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return formatProduct(data as ProductWithImages)
}

export async function getFeaturedProducts(): Promise<ProductWithImages[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name),
      collections(name),
      product_images(*)
    `)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return (data as ProductWithImages[]).map(formatProduct)
}

export async function getProductBySlug(slug: string): Promise<ProductWithImages | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name),
      collections(name),
      product_images(*)
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching product by slug:', error)
    return null
  }

  return formatProduct(data as ProductWithImages)
}

export async function getNewArrivals(limit = 8): Promise<ProductWithImages[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name),
      collections(name),
      product_images(*)
    `)
    .contains('badges', ['New Arrival'])
    .gte('new_arrival_until', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching new arrivals:', error)
    return []
  }

  return (data as ProductWithImages[]).map(formatProduct)
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeProductId: string,
  limit = 4
): Promise<ProductWithImages[]> {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(`
      *,
      categories(name),
      collections(name),
      product_images(*)
    `)
    .neq('id', excludeProductId)
    .limit(limit)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching related products:', error)
    return []
  }

  return (data as ProductWithImages[]).map(formatProduct)
}

export async function searchProducts(query: string, limit = 12): Promise<ProductWithImages[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name),
      collections(name),
      product_images(*)
    `)
    .textSearch('fts', query, { type: 'websearch' })
    .limit(limit)

  if (error) {
    console.error('Error searching products:', error)
    return []
  }

  return (data as ProductWithImages[]).map(formatProduct)
}

// Image Actions
export async function addProductImage(
  productId: string,
  imageUrl: string,
  imagePath: string,
  displayOrder: number = 0
): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  if (!z.string().uuid().safeParse(productId).success) {
    return { success: false, error: 'Invalid product' }
  }

  if (!imageUrl.startsWith('https://') || !imagePath.startsWith('products/')) {
    return { success: false, error: 'Invalid image metadata' }
  }

  const { error } = await supabase
    .from('product_images')
    .insert([{
      product_id: productId,
      image_url: imageUrl,
      image_path: imagePath,
      display_order: displayOrder
    }])

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/products/${productId}`)
  return { success: true }
}

export async function uploadProductImages(
  productId: string,
  formData: FormData
): Promise<ActionResult<ProductImage[]>> {
  const { supabase } = await requireAdmin()

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

  const { data: existingImages, error: existingError } = await supabase
    .from('product_images')
    .select('display_order')
    .eq('product_id', productId)
    .order('display_order', { ascending: false })
    .limit(1)

  if (existingError) {
    return { success: false, error: 'Could not prepare image upload' }
  }

  let nextDisplayOrder = existingImages?.[0]?.display_order ?? -1
  const uploadedImages: ProductImage[] = []

  for (const file of files) {
    const uploaded = await uploadProductImage(file)
    if (!uploaded) {
      return { success: false, error: 'Image upload failed' }
    }

    nextDisplayOrder += 1

    const { data: image, error } = await supabase
      .from('product_images')
      .insert([{
        product_id: productId,
        image_url: uploaded.url,
        image_path: uploaded.path,
        alt_text: null,
        display_order: nextDisplayOrder,
      }])
      .select()
      .single()

    if (error) {
      await deleteProductImage(uploaded.path)
      return { success: false, error: 'Could not save image metadata' }
    }

    uploadedImages.push(image as ProductImage)
  }

  revalidatePath(`/admin/products/${productId}/edit`)
  revalidatePath('/admin/products')
  revalidatePath('/products')

  return { success: true, data: uploadedImages }
}

export async function removeProductImage(imageId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  if (!z.string().uuid().safeParse(imageId).success) {
    return { success: false, error: 'Invalid image' }
  }

  const { data: image, error: fetchError } = await supabase
    .from('product_images')
    .select('id, product_id, image_path')
    .eq('id', imageId)
    .single()

  if (fetchError || !image) {
    return { success: false, error: 'Image not found' }
  }

  const storageDeleted = await deleteProductImage(image.image_path)
  if (!storageDeleted) {
    return { success: false, error: 'Could not delete image from storage' }
  }

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (error) {
    return { success: false, error: 'Could not delete image metadata' }
  }

  revalidatePath(`/admin/products/${image.product_id}/edit`)
  revalidatePath('/admin/products')
  revalidatePath('/products')

  return { success: true }
}
