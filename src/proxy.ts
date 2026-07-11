import { type NextRequest } from 'next/server'
import { protectAdminRoutes } from '@/lib/auth-middleware'

export async function proxy(request: NextRequest) {
  return await protectAdminRoutes(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
