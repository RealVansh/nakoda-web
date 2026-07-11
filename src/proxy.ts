import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { protectAdminRoutes } from '@/lib/auth-middleware'

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*;
    font-src 'self' data:;
    connect-src 'self' https://*;
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  // Auth protection first
  const authResponse = await protectAdminRoutes(request)
  
  let response = authResponse
  if (!response || response.status === 200 && !response.headers.has('x-middleware-rewrite')) {
     response = NextResponse.next({
       request: { headers: requestHeaders },
     })
  } else {
     // If auth middleware redirected or rewrote, we still append CSP
     response.headers.set('Content-Security-Policy', cspHeader)
     requestHeaders.forEach((v, k) => response.headers.set(k, v))
  }

  response.headers.set('Content-Security-Policy', cspHeader)
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
