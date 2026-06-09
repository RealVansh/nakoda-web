'use server'

import { createClient } from '@/lib/supabase/server'
import { inquirySchema, type ActionResult } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { requireAdmin } from './auth.actions'

const INQUIRY_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const INQUIRY_RATE_LIMIT_MAX = 5
const inquiryAttempts = new Map<string, { count: number; resetAt: number }>()

export type Inquiry = {
  id: string
  customer_name: string
  phone_number: string
  email: string | null
  message: string
  product_id: string | null
  created_at: string
  products?: {
    name: string
  } | null
}

export async function submitInquiry(
  data: z.infer<typeof inquirySchema>,
  honeypot?: string
): Promise<ActionResult> {
  if (honeypot) {
    return { success: true }
  }

  const headersList = await headers()
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  const now = Date.now()
  for (const [key, value] of inquiryAttempts.entries()) {
    if (value.resetAt <= now) {
      inquiryAttempts.delete(key)
    }
  }

  const attempt = inquiryAttempts.get(ipAddress)

  if (attempt && attempt.resetAt > now) {
    if (attempt.count >= INQUIRY_RATE_LIMIT_MAX) {
      return { success: false, error: 'Too many inquiries. Please try again later.' }
    }
    attempt.count += 1
  } else {
    inquiryAttempts.set(ipAddress, {
      count: 1,
      resetAt: now + INQUIRY_RATE_LIMIT_WINDOW_MS,
    })
  }

  const result = inquirySchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('inquiries')
    .insert([result.data])

  if (error) {
    return { success: false, error: 'Could not submit inquiry' }
  }

  revalidatePath('/admin/inquiries')
  return { success: true }
}

export async function getInquiries(): Promise<Inquiry[]> {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inquiries')
    .select(`
      *,
      products(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inquiries:', error)
    return []
  }

  return data as Inquiry[]
}

export async function deleteInquiry(id: string): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/inquiries')
  return { success: true }
}
