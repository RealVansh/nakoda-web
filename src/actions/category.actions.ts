'use server'

import { categorySchema, type ActionResult } from '@/lib/validations'
import { query, execute } from '@/lib/db'
import { revalidatePath } from 'next/cache'
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
    await execute(
      `INSERT INTO categories (id, name, slug, created_at) VALUES (?, ?, ?, datetime('now'))`,
      [id, result.data.name, slug]
    )
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
  return { success: true, data: category }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin()

  try {
    await execute(`DELETE FROM categories WHERE id = ?`, [id])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await query<Category>(
      `SELECT * FROM categories ORDER BY created_at DESC`
    )
    return data
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}
