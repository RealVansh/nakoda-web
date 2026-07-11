'use server'

import { collectionSchema, type ActionResult } from '@/lib/validations'
import { query, execute } from '@/lib/db'
import { revalidatePath } from 'next/cache'
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

  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const id = uuidv4()

  try {
    await execute(
      `INSERT INTO collections (id, name, slug, description, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
      [id, result.data.name, slug, result.data.description ?? null]
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('UNIQUE')) {
      return { success: false, error: 'A collection with this name or slug already exists' }
    }
    return { success: false, error: message }
  }

  const collection: Collection = {
    id,
    name: result.data.name,
    slug,
    description: result.data.description ?? null,
    created_at: new Date().toISOString(),
  }

  revalidatePath('/admin/collections')
  return { success: true, data: collection }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    await execute(`DELETE FROM collections WHERE id = ?`, [id])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }

  revalidatePath('/admin/collections')
  return { success: true }
}

export async function getCollections(): Promise<Collection[]> {
  try {
    const data = await query<Collection>(
      `SELECT * FROM collections ORDER BY created_at DESC`
    )
    return data
  } catch (error) {
    console.error('Error fetching collections:', error)
    return []
  }
}
