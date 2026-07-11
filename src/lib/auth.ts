import { cache } from 'react';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { apiPost } from '@/lib/db';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_SECRET = () => process.env.ADMIN_SESSION_SECRET!;

interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  failed_login_attempts: number;
  locked_until: string | null;
}

interface SessionPayload {
  adminId: string;
  email: string;
}

/**
 * Fetch admin login credentials against the D1 database.
 * Returns the admin user on success, null on failure.
 */
export async function getAdminByEmail(
  email: string
): Promise<AdminUser | null> {
  try {
    const data = await apiPost<{ user: AdminUser | null }>('/api/auth/admin', { email });
    return data.user || null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

/**
 * Verify admin login credentials.
 */
export async function verifyLoginPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Create a signed JWT session token for an admin user.
 */
export function createSessionToken(adminId: string, email: string): string {
  return jwt.sign({ adminId, email } as SessionPayload, SESSION_SECRET(), {
    expiresIn: '7d',
  });
}

/**
 * Verify and decode a JWT session token.
 * Returns the payload on success, null if invalid or expired.
 */
export function verifySessionToken(
  token: string
): { adminId: string; email: string } | null {
  try {
    const payload = jwt.verify(token, SESSION_SECRET()) as SessionPayload;
    return { adminId: payload.adminId, email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Verifies if the admin user still exists in the database.
 * Wrapped in React cache to avoid duplicate DB calls in the same render pass.
 */
const checkAdminExists = cache(async (email: string) => {
  try {
    const data = await apiPost<{ user: AdminUser | null }>('/api/auth/admin', { email });
    return !!data.user;
  } catch {
    return false;
  }
});

/**
 * Get the current admin session from the request cookies.
 * Returns the session payload if valid and user exists, null otherwise.
 */
export async function getSession(): Promise<{
  adminId: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  
  const payload = verifySessionToken(token);
  if (!payload) return null;

  // Revalidate against DB to ensure account wasn't deleted/disabled
  const exists = await checkAdminExists(payload.email);
  if (!exists) return null;

  return payload;
}

/**
 * Set the admin session cookie with the given token.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear the admin session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
