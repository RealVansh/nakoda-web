import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { queryOne } from '@/lib/db';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_SECRET = () => process.env.ADMIN_SESSION_SECRET!;

interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
}

interface SessionPayload {
  adminId: string;
  email: string;
}

/**
 * Verify admin login credentials against the D1 database.
 * Returns the admin user's id and email on success, null on failure.
 */
export async function verifyLogin(
  email: string,
  password: string
): Promise<{ id: string; email: string } | null> {
  const admin = await queryOne<AdminUser>(
    'SELECT id, email, password_hash FROM admin_users WHERE email = ?',
    [email]
  );

  if (!admin) return null;

  const isValid = await bcrypt.compare(password, admin.password_hash);
  if (!isValid) return null;

  return { id: admin.id, email: admin.email };
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
 * Get the current admin session from the request cookies.
 * Returns the session payload if valid, null otherwise.
 */
export async function getSession(): Promise<{
  adminId: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
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
