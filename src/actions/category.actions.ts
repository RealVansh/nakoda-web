'use server'

import { categorySchema, type ActionResult } from '@/lib/validations'
import { apiGet, apiPost, apiDelete } from '@/lib/db'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { requireAdmin } from './auth.actions'

export type Category = {
  id: string
  name: string
  slug: string
  created_at: string
}

export async function createCategory(
  data: z.infer<typeof categorySchema>
): Promise<ActionResult<Category>> {
  await requireAdmin()

  const result = categorySchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  // Auto-generate slug if not provided
  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const id = uuidv4()

  try {
    await apiPost('/api/categories', { id, name: result.data.name, slug })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('UNIQUE')) {
      return { success: false, error: 'A category with this name or slug already exists' }
    }
    return { success: false, error: message }
  }

  const category = {
    id,
    name: result.data.name,
    slug,
    created_at: new Date().toISOString(),
  }

  revalidatePath('/admin/categories')
  revalidateTag('categories', 'default')
  return { success: true, data: category }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    await apiDelete(`/api/categories/${id}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }

  revalidatePath('/admin/categories')
  revalidateTag('categories', 'default')
  return { success: true }
}

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    try {
      const data = await apiGet<{ results: Category[] }>('/api/categories')
      return data.results
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  },
  ['categories-list'],
  { tags: ['categories'] }
)
