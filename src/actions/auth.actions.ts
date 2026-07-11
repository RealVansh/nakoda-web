'use server'

import { loginSchema, type ActionResult } from '@/lib/validations'
import {
  verifyLogin,
  createSessionToken,
  getSession,
  setSessionCookie,
  clearSessionCookie,
} from '@/lib/auth'
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

  const admin = await verifyLogin(data.email, data.password)

  if (!admin) {
    return { success: false, error: 'Invalid email or password' }
  }

  const token = createSessionToken(admin.id, admin.email)
  await setSessionCookie(token)

  revalidatePath('/admin')
  redirect('/admin')
}

export async function logout() {
  await clearSessionCookie()
  revalidatePath('/admin')
  redirect('/admin/login')
}

// Utility to protect server actions
// Returns the authenticated admin info; throws if not authorized
export async function requireAdmin(): Promise<{ adminId: string; email: string }> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  return { adminId: session.adminId, email: session.email }
}
