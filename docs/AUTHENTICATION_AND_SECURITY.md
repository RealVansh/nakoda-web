# Authentication & Security — Nakoda Web

## 1. Overview
- **Security-first approach**: Next.js App Router combined with Auth.js provides strong out-of-the-box defaults.
- **Auth.js (NextAuth v5)**: Using the latest standard with the `Credentials` provider.
- **Single Admin User**: The platform is not an open e-commerce platform in V1. An admin user is seeded via a script. There is no public registration flow.
- **JWT-based Sessions**: To remain compatible with serverless Edge environments (Vercel), we rely on stateless JWT tokens instead of database-backed sessions.

## 2. Authentication Architecture

### Auth.js Configuration (`src/lib/auth.ts`)
```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email as string },
        });
        
        if (!admin) return null;
        
        const isValid = await bcrypt.compare(
          credentials.password as string,
          admin.password
        );
        
        if (!isValid) return null;
        
        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      const isLoginPage = nextUrl.pathname === '/admin/login';
      
      if (isAdminRoute && !isLoginPage && !isLoggedIn) {
        return Response.redirect(new URL('/admin/login', nextUrl));
      }
      
      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL('/admin', nextUrl));
      }
      
      return true;
    },
  },
});
```

### Middleware Configuration (`middleware.ts`)
The middleware runs on the Edge to instantly protect routes before any Next.js rendering happens.
```typescript
export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/admin/:path*'],
};
```

## 3. Password Security

### Hashing Strategy
- We use the `bcryptjs` library.
- The cost factor is set to `12`, providing a balance between security and performance on serverless functions.
- Passwords are never stored in plain text.

### Admin Seeding Script (`prisma/seed.ts`)
We use a Prisma seed script to initially create the admin.
```typescript
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('your-secure-password', 12);
  
  await prisma.admin.upsert({
    where: { email: 'admin@nakoda.com' },
    update: {},
    create: {
      email: 'admin@nakoda.com',
      password: hashedPassword,
      name: 'Admin',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Password Requirements
If future features allow password changes, validation requires:
- Minimum 8 characters.
- Zod validation on both the client and the server.

## 4. Route Protection

### Middleware-Level Protection
All `/admin/*` routes are intercepted by the `middleware.ts`. If no valid JWT is present, the user is redirected to `/admin/login`. Public store routes are entirely unaffected.

### Server Action Protection
Every Admin-facing Server Action verifies the session before interacting with the database.
```typescript
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}
```

## 5. Environment Variables Security

| Variable | Description | Sensitivity | Example |
|---|---|---|---|
| `DATABASE_URL` | Neon pooled connection | **HIGH** | postgresql://... |
| `DIRECT_DATABASE_URL` | Neon direct connection | **HIGH** | postgresql://... |
| `AUTH_SECRET` | Auth.js JWT enc key | **CRITICAL** | random-32-chars |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | **MEDIUM** | 123456789 |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret| **CRITICAL** | abc123def... |
| `NEXT_PUBLIC_*` | Client-accessible | **PUBLIC** | various |

### Best Practices
- Never commit `.env.local` to GitHub.
- Use the Vercel dashboard to securely provide these variables to the production and preview environments.
- Periodically rotate `AUTH_SECRET` and API keys.

## 6. Cloudinary Security

### Signed Uploads
Images are **never** uploaded directly from the client using unsigned presets. 
Instead, the client sends images to our secure Next.js Server Action, which uses the `CLOUDINARY_API_SECRET` to perform a securely signed upload to the Cloudinary API. This ensures bad actors cannot bypass the system to upload illicit content to our cloud.

## 7. Prisma Security Best Practices

### Connection Security
Neon PostgreSQL enforces SSL (`?sslmode=require`).

### Query Security
Prisma natively prevents SQL injection by treating all inputs as parameters rather than raw strings. We also apply Zod schemas to sanitize lengths and types before hitting Prisma. We only use `select` statements to query what we strictly need, avoiding accidental exposure of `password` hashes in API boundaries.

## 8. CSRF Protection
Next.js Server Actions automatically protect against Cross-Site Request Forgery (CSRF). They inspect the `Origin` header to verify the action request genuinely originated from the deployed Nakoda Web site.

## 9. Input Validation
All forms utilize `React Hook Form` combined with `Zod`. Validation happens transparently on both ends.

## 10. Security Headers
Configured in `next.config.ts`:
```typescript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 11. Security Checklist (Pre-Deployment)
- [ ] `AUTH_SECRET` generated securely (`openssl rand -base64 32`).
- [ ] Production `.env` holds no default dummy values.
- [ ] Admin password changed from the default seeded value.
- [ ] Next.js Security Headers applied.
- [ ] Cloudinary strictly rejects unsigned uploads.
