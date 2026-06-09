'use server'

import { createClient } from '@/lib/supabase/server'
import { categorySchema, type ActionResult } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
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
  const { supabase } = await requireAdmin()

  const result = categorySchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  // Auto-generate slug if not provided
  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const { data: category, error } = await supabase
    .from('categories')
    .insert([{ name: result.data.name, slug }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A category with this name or slug already exists' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/categories')
  return { success: true, data: category }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}
