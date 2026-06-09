'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema, type ActionResult } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export async function login(
  data: z.infer<typeof loginSchema>
): Promise<ActionResult> {
  const result = loginSchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { success: false, error: 'Invalid email or password' }
  }

  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle()

  if (adminError || !adminUser) {
    await supabase.auth.signOut()
    return { success: false, error: 'You do not have access to the admin portal' }
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/admin')
  redirect('/admin/login')
}

// Utility to protect server actions
// Returns the authenticated Supabase client to avoid stale-token issues
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }

  // Strictly enforce admin_users table lookup
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (adminError || !adminUser) {
    throw new Error('Forbidden: Not an Administrator')
  }
  
  return { user, supabase }
}
