import { type NextRequest, NextResponse } from 'next/server'

/**
 * Admin route protection middleware.
 * Verifies the admin_session JWT cookie using Web Crypto API (Edge-compatible).
 */

async function verifyJWT(
  token: string,
  secret: string
): Promise<{ adminId: string; email: string } | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null

    // Import the secret key for HMAC-SHA256
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // Verify signature
    const signedInput = encoder.encode(`${headerB64}.${payloadB64}`)
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    )
    const valid = await crypto.subtle.verify('HMAC', cryptoKey, signature, signedInput)
    if (!valid) return null

    // Decode payload
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(payloadJson)

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return { adminId: payload.adminId, email: payload.email }
  } catch {
    return null
  }
}

export async function protectAdminRoutes(request: NextRequest): Promise<NextResponse> {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  if (!isAdminRoute) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!secret) {
    console.error('ADMIN_SESSION_SECRET is not set')
    if (!isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const session = sessionCookie ? await verifyJWT(sessionCookie, secret) : null

  // Protected admin route, no valid session → redirect to login
  if (!isLoginPage && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Login page with valid session → redirect to admin dashboard
  if (isLoginPage && session) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
