'use server'

import { collectionSchema, type ActionResult } from '@/lib/validations'
import { apiGet, apiPost, apiDelete } from '@/lib/db'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { requireAdmin } from './auth.actions'

export type Collection = {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export async function createCollection(
  data: z.infer<typeof collectionSchema>
): Promise<ActionResult<Collection>> {
  await requireAdmin()

  const result = collectionSchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  // Auto-generate slug if not provided
  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const id = uuidv4()

  try {
    await apiPost('/api/collections', { id, name: result.data.name, slug, description: result.data.description ?? null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('UNIQUE')) {
      return { success: false, error: 'A collection with this name or slug already exists' }
    }
    return { success: false, error: message }
  }

  const collection = {
    id,
    name: result.data.name,
    slug,
    description: result.data.description ?? null,
    created_at: new Date().toISOString(),
  }

  revalidatePath('/admin/collections')
  revalidateTag('collections', 'default')
  return { success: true, data: collection }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    await apiDelete(`/api/collections/${id}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }

  revalidatePath('/admin/collections')
  revalidateTag('collections', 'default')
  return { success: true }
}

export const getCollections = unstable_cache(
  async (): Promise<Collection[]> => {
    try {
      const data = await apiGet<{ results: Collection[] }>('/api/collections')
      return data.results
    } catch (error) {
      console.error('Error fetching collections:', error)
      return []
    }
  },
  ['collections-list'],
  { tags: ['collections'] }
)
