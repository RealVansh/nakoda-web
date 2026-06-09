'use server'

import { createClient } from '@/lib/supabase/server'
import { collectionSchema, type ActionResult } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
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
  const { supabase } = await requireAdmin()

  const result = collectionSchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  const slug = result.data.slug || result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const { data: collection, error } = await supabase
    .from('collections')
    .insert([{ ...result.data, slug }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A collection with this name or slug already exists' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/collections')
  return { success: true, data: collection }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/collections')
  return { success: true }
}

export async function getCollections(): Promise<Collection[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching collections:', error)
    return []
  }

  return data
}
