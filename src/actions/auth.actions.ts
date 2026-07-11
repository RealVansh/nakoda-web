'use server'

import { loginSchema, type ActionResult } from '@/lib/validations'
import {
  getAdminByEmail,
  verifyLoginPassword,
  createSessionToken,
  getSession,
  setSessionCookie,
  clearSessionCookie,
} from '@/lib/auth'
import { apiPost } from '@/lib/db'
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

  const admin = await getAdminByEmail(data.email)
  if (!admin) {
    return { success: false, error: 'Invalid email or password' }
  }

  // Check lockout
  if (admin.locked_until) {
    const lockedUntilTime = new Date(admin.locked_until).getTime()
    if (Date.now() < lockedUntilTime) {
      const minutes = Math.ceil((lockedUntilTime - Date.now()) / 60000)
      return { success: false, error: `Account locked. Please try again in ${minutes} minutes.` }
    }
  }

  const isValid = await verifyLoginPassword(data.password, admin.password_hash)

  if (!isValid) {
    // Notify worker of failed attempt
    await apiPost('/api/auth/admin/fail', { email: data.email })
    return { success: false, error: 'Invalid email or password' }
  }

  // Notify worker of success
  await apiPost('/api/auth/admin/success', { email: data.email })

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
