# Technology Stack — Nakoda Web

> **Document Version:** 1.0
> **Last Updated:** 2026-06-03
> **Status:** Approved — Ready for Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Frontend](#2-frontend)
3. [Backend](#3-backend)
4. [Authentication](#4-authentication)
5. [Media Storage](#5-media-storage)
6. [Hosting & Deployment](#6-hosting--deployment)
7. [SEO](#7-seo)
8. [Development Tools](#8-development-tools)
9. [Package List](#9-package-list)
10. [Version Compatibility Matrix](#10-version-compatibility-matrix)

---

## 1. Overview

Nakoda Web is a **premium jewellery showcase and inquiry platform** — not a traditional e-commerce checkout site. The architecture is optimized for:

| Goal | How the Stack Serves It |
|---|---|
| **Visual storytelling** | Next.js Image optimization, Cloudinary CDN, Framer Motion animations |
| **SEO & discoverability** | Server Components (HTML-first), structured data (JSON-LD), next-sitemap |
| **Low operational cost** | Serverless everything — Vercel, Neon Postgres, Cloudinary |
| **Fast iteration** | TypeScript + Prisma type safety, Tailwind rapid UI, Server Actions (no API layer) |
| **Admin simplicity** | Single codebase for storefront + admin portal, Auth.js route protection |

### Architecture Philosophy

```
┌──────────────────────────────────────────────────────────┐
│                      Vercel Edge                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Next.js 15 (App Router)                  │  │
│  │  ┌──────────────┐    ┌───────────────────────┐     │  │
│  │  │   React 19   │    │    Server Actions      │     │  │
│  │  │  Server +    │───▶│  (mutations, uploads,  │     │  │
│  │  │  Client      │    │   revalidation)        │     │  │
│  │  │  Components  │    └──────────┬────────────┘     │  │
│  │  └──────────────┘               │                  │  │
│  └─────────────────────────────────┼──────────────────┘  │
│                                    │                     │
│  ┌─────────────┐   ┌──────────────▼──────┐  ┌────────┐  │
│  │  Auth.js    │   │   Prisma ORM        │  │Cloudi- │  │
│  │  (NextAuth  │   │   (Type-safe DB)    │  │nary    │  │
│  │   v5)       │   └──────────┬──────────┘  │SDK     │  │
│  └─────────────┘              │             └────────┘  │
│                               ▼                         │
│                    ┌──────────────────┐                  │
│                    │ Neon PostgreSQL   │                  │
│                    │ (Serverless)      │                  │
│                    └──────────────────┘                  │
└──────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Rendering strategy | Server Components by default | Minimal JS shipped, SEO-friendly, fast TTFB |
| Data mutations | Server Actions (not API routes) | Type-safe, colocated, progressive enhancement |
| Styling | Tailwind CSS v4 | Utility-first, zero-runtime, design tokens |
| Database access | Prisma ORM | Type-safe queries, auto-generated types, migrations |
| Folder structure | Feature-based under `src/` | Scalable, clear ownership, easy navigation |

---

## 2. Frontend

### 2.1 Next.js 15 (App Router)

| Property | Value |
|---|---|
| **Version** | `15.x` (latest stable) |
| **Router** | App Router (`app/` directory) |
| **Runtime** | Node.js (default) |
| **Rendering** | Server Components by default; Client Components opt-in via `"use client"` |

#### Why Next.js 15

- **Server Components (RSC):** HTML streamed from the server — zero client JS for product listings, category pages, and static content. Critical for SEO and performance on image-heavy jewellery pages.
- **Server Actions:** Replace API routes for all mutations. Type-safe, progressively enhanced, colocated with the UI.
- **File-based Routing:** Convention-driven route structure under `app/` — route groups `(storefront)` and `(admin)` separate concerns cleanly.
- **Built-in Optimizations:** Automatic code splitting, prefetching, font optimization, and the `<Image>` component for responsive images.
- **Metadata API:** Dynamic `generateMetadata()` per page for SEO (title, description, Open Graph, Twitter cards).
- **Streaming & Suspense:** Progressive rendering with `loading.tsx` and `<Suspense>` boundaries for perceived performance.

#### Key Features Used

| Feature | Usage in Nakoda Web |
|---|---|
| App Router | Primary routing with `(storefront)` and `(admin)` route groups |
| Server Components | Product listings, category pages, product detail, homepage |
| Server Actions | Product CRUD, inquiry form submission, image upload, auth |
| `<Image>` component | All product/hero images — responsive, lazy-loaded, optimized |
| Metadata API | Dynamic SEO metadata per product, category, and page |
| Dynamic Routes | `[slug]` for products, `[categorySlug]` for categories |
| Route Groups | `(storefront)` for public site, `(admin)` for admin portal |
| Parallel Routes | Optional — admin dashboard widgets |
| `loading.tsx` | Skeleton UIs for product grids, admin tables |
| `error.tsx` | Graceful error boundaries per route segment |
| `not-found.tsx` | Custom 404 pages for storefront and admin |
| Middleware | Auth guard for `/admin/*` routes |

#### Configuration (`next.config.ts`)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/YOUR_CLOUD_NAME/image/upload/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Support high-res jewellery image uploads
    },
    typedRoutes: true,
  },
};

export default nextConfig;
```

---

### 2.2 React 19

| Property | Value |
|---|---|
| **Version** | `19.x` (latest stable) |
| **Paradigm** | Server Components first, Client Components for interactivity |

#### Why React 19

- **Server Components:** First-class support for RSC — components render on the server with zero client bundle. Perfect for the product catalog and informational pages.
- **Concurrent Features:** Transitions, Suspense, and streaming allow smooth UI updates during navigation and data loading.
- **`use()` Hook:** Read promises and context in render — cleaner async patterns in Client Components.
- **`useActionState()`:** Built-in form action state management — replaces custom loading/error state for Server Action forms.
- **`useOptimistic()`:** Optimistic UI updates for admin CRUD operations.
- **`<form>` Actions:** Native form `action` prop integration with Server Actions for progressive enhancement.

#### Component Strategy

```
Server Components (default)                Client Components ("use client")
─────────────────────────                  ──────────────────────────────
• Product listing pages                    • Mobile navigation menu
• Product detail pages                     • Image gallery / lightbox
• Category pages                           • Inquiry form (with validation)
• Homepage (hero, featured)                • Admin product form
• Admin data tables (read)                 • Search with autocomplete
• Footer, header (static parts)            • Animated components (Framer)
• SEO metadata generation                  • Toast notifications
                                           • Theme/filter toggles
```

#### Error Boundaries

```typescript
// app/(storefront)/error.tsx
"use client";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-4 btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}
```

---

### 2.3 TypeScript

| Property | Value |
|---|---|
| **Version** | `5.x` (latest stable) |
| **Strict Mode** | `true` |
| **Target** | `ES2017` |

#### Why TypeScript

- **Type Safety:** Catch errors at compile time — critical for a project with Prisma-generated types, Server Action payloads, and Zod schemas.
- **Developer Experience:** Autocompletion, refactoring support, and inline documentation across the full stack.
- **Shared Types:** Zod schemas used for both client-side form validation and Server Action input validation — single source of truth.
- **Fewer Runtime Errors:** Strict mode eliminates entire categories of bugs (`strictNullChecks`, `noImplicitAny`, `noUncheckedIndexedAccess`).

#### Configuration (`tsconfig.json`)

```jsonc
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "plugins": [
      { "name": "next" }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

#### Key Strict-Mode Flags

| Flag | Purpose |
|---|---|
| `strict: true` | Enables all strict type-checking options |
| `noUncheckedIndexedAccess` | Forces null checks on array/object index access |
| `noImplicitReturns` | Every code path in a function must return a value |
| `exactOptionalPropertyTypes` | Distinguishes between `undefined` and missing properties |

---

### 2.4 Tailwind CSS v4

| Property | Value |
|---|---|
| **Version** | `4.x` (latest stable) |
| **Config** | CSS-first (no `tailwind.config.js`) |
| **Content Detection** | Automatic (no `content` array needed) |

#### Why Tailwind CSS v4

- **Utility-First:** Rapid UI development without context-switching to CSS files. Essential for iterating quickly on a visually rich jewellery platform.
- **Zero-Runtime:** All styles compiled at build time — no runtime overhead.
- **Design Tokens:** Custom theme tokens via `@theme` directive — gold tones, serif typography, and luxury spacing scale.
- **v4 Specifics:** New CSS-first configuration model, significantly faster builds via Oxide engine, automatic content detection.

#### v4 Key Differences from v3

| v3 | v4 |
|---|---|
| `tailwind.config.js` / `.ts` | CSS-first config via `@theme` in CSS |
| Manual `content` paths | Automatic content detection |
| `@apply` directive | Still supported, but `@theme` preferred for tokens |
| JavaScript plugin API | CSS-native `@plugin` directive |
| PostCSS setup required | Built-in as `@tailwindcss/postcss` or Vite plugin |

#### Custom Design Tokens (`src/app/globals.css`)

```css
@import "tailwindcss";

@theme {
  /* ── Brand Colors ── */
  --color-gold-50: #fef9e7;
  --color-gold-100: #fdf0c4;
  --color-gold-200: #fce49e;
  --color-gold-300: #fad573;
  --color-gold-400: #f7c948;
  --color-gold-500: #d4a017;
  --color-gold-600: #b8860b;
  --color-gold-700: #996515;
  --color-gold-800: #7a5012;
  --color-gold-900: #5c3d0e;
  --color-gold-950: #3d2808;

  --color-rose-gold: #b76e79;
  --color-platinum: #e5e4e2;
  --color-silver: #c0c0c0;

  /* ── Neutral Palette ── */
  --color-cream: #fdfbf7;
  --color-ivory: #fffff0;
  --color-charcoal: #2d2d2d;
  --color-obsidian: #1a1a1a;

  /* ── Semantic Colors ── */
  --color-primary: var(--color-gold-600);
  --color-primary-foreground: #ffffff;
  --color-secondary: var(--color-charcoal);
  --color-secondary-foreground: var(--color-cream);
  --color-accent: var(--color-rose-gold);
  --color-muted: #f5f5f0;
  --color-muted-foreground: #737373;
  --color-destructive: #dc2626;
  --color-destructive-foreground: #ffffff;
  --color-border: #e5e2d9;
  --color-ring: var(--color-gold-400);
  --color-background: #ffffff;
  --color-foreground: var(--color-charcoal);

  /* ── Typography ── */
  --font-heading: "Playfair Display", serif;
  --font-body: "Inter", sans-serif;
  --font-accent: "Cormorant Garamond", serif;

  /* ── Spacing Scale (luxury — generous whitespace) ── */
  --spacing-section: 6rem;
  --spacing-section-sm: 4rem;

  /* ── Border Radius ── */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04);
  --shadow-elevated: 0 20px 40px rgba(0, 0, 0, 0.1);

  /* ── Animations ── */
  --animate-fade-in: fade-in 0.5s ease-out;
  --animate-slide-up: slide-up 0.5s ease-out;

  /* ── Breakpoints ── */
  --breakpoint-xs: 475px;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

#### Usage Examples

```html
<!-- Product Card -->
<div class="group rounded-lg border border-border bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover">
  <h3 class="font-heading text-xl text-secondary">Diamond Solitaire Ring</h3>
  <p class="font-body text-muted-foreground">18K White Gold</p>
</div>

<!-- Hero Section -->
<section class="bg-cream py-section">
  <h1 class="font-heading text-5xl text-gold-800">Timeless Elegance</h1>
</section>
```

---

### 2.5 Framer Motion

| Property | Value |
|---|---|
| **Version** | `12.x` (latest stable) |
| **Bundle Impact** | Tree-shakeable; only imported components are bundled |
| **SSR** | Compatible with Next.js — renders static on server, animates on client |

#### Why Framer Motion

- **Declarative Animations:** Simple prop-based API (`animate`, `initial`, `exit`) — no imperative DOM manipulation.
- **Page Transitions:** Smooth transitions between storefront pages using `AnimatePresence` and layout animations.
- **Scroll Animations:** `useInView` and `whileInView` for revealing product sections on scroll.
- **Gesture Support:** `whileHover`, `whileTap` for interactive product cards and CTA buttons.
- **Performance:** Hardware-accelerated transforms, will-change management, and spring physics.

#### Use Cases

| Component | Animation Type |
|---|---|
| Product card hover | `whileHover` scale + shadow elevation |
| Page transitions | `AnimatePresence` + `motion.div` with slide/fade |
| Hero section | Staggered text reveal on load |
| Image gallery | Lightbox open/close with `layoutId` |
| Scroll sections | `whileInView` fade-up with stagger |
| Mobile nav | Slide-in overlay with backdrop |
| Admin toast | Slide-in from top-right + auto-dismiss |
| Loading skeletons | Pulse shimmer animation |

#### Example: Staggered Product Grid

```tsx
"use client";

import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {children}
    </motion.div>
  );
}

export function ProductCardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}
```

> [!NOTE]
> All Framer Motion components must be Client Components (`"use client"`). Wrap Server Components inside animated Client Component wrappers to preserve the RSC benefits.

---

### 2.6 React Hook Form + Zod

| Property | Value |
|---|---|
| **React Hook Form** | `7.x` (latest stable) |
| **Zod** | `3.x` (latest stable) |
| **Resolver** | `@hookform/resolvers/zod` |

#### Why This Combination

- **Performance:** React Hook Form uses uncontrolled components — minimal re-renders even on complex admin product forms with many fields.
- **Schema Validation:** Zod schemas are the **single source of truth** shared between client-side form validation and Server Action input validation.
- **Type Inference:** `z.infer<typeof schema>` auto-generates TypeScript types — no manual type definitions for form data.
- **Progressive Enhancement:** Forms work without JavaScript via native `<form>` + Server Actions. React Hook Form enhances with instant client-side validation.

#### Shared Schema Pattern

```typescript
// src/features/inquiries/schemas/inquiry.schema.ts
import { z } from "zod";

export const inquirySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(/^[+]?[\d\s-]{10,15}$/, "Please enter a valid phone number"),
  productId: z
    .string()
    .cuid()
    .optional(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be under 1000 characters"),
});

export type InquiryFormData = z.infer<typeof inquirySchema>;
```

```typescript
// Server Action uses the SAME schema
// src/features/inquiries/actions/submit-inquiry.ts
"use server";

import { inquirySchema } from "../schemas/inquiry.schema";

export async function submitInquiry(formData: FormData) {
  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    productId: formData.get("productId"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  // ... save to database
}
```

#### Forms in Nakoda Web

| Form | Location | Fields |
|---|---|---|
| **Inquiry Form** | Storefront — product detail | Name, email, phone, message, productId |
| **Admin Login** | `/admin/login` | Email, password |
| **Product Form** | Admin — create/edit product | Title, description, price, category, images, metals, stones, featured flag |
| **Category Form** | Admin — create/edit category | Name, slug, description, image |
| **Settings Form** | Admin — store settings | Business info, contact details, social links |

---

### 2.7 Lucide React

| Property | Value |
|---|---|
| **Version** | `0.4x` (latest stable) |
| **Icons** | 1,500+ |
| **Bundle Impact** | Tree-shakeable — only imported icons are bundled |

#### Why Lucide React

- **Lightweight:** Each icon is ~1KB. Tree-shaking ensures only used icons are bundled.
- **Consistent Style:** Clean, 24×24 stroke-based icons. Consistent visual language across storefront and admin.
- **Customizable:** Accepts `size`, `color`, `strokeWidth`, and all SVG props.
- **Active Maintenance:** Regular updates, extensive icon set covering all UI needs.

#### Usage Pattern

```tsx
import { Search, ShoppingBag, Heart, Menu, X, ChevronRight } from "lucide-react";

// Consistent sizing via wrapper
<Search className="h-5 w-5 text-muted-foreground" />
```

#### Icons Used by Section

| Section | Icons |
|---|---|
| Navigation | `Menu`, `X`, `Search`, `Phone`, `MapPin` |
| Products | `Heart`, `Share2`, `Eye`, `ChevronRight` |
| Inquiries | `MessageSquare`, `Send`, `Check` |
| Admin | `LayoutDashboard`, `Package`, `FolderOpen`, `Settings`, `LogOut`, `Plus`, `Pencil`, `Trash2`, `Upload` |
| Status | `Loader2` (spinner), `AlertCircle`, `CheckCircle`, `XCircle` |

---

## 3. Backend

### 3.1 Next.js Server Actions

| Property | Value |
|---|---|
| **Pattern** | `"use server"` directive at file top |
| **Location** | `src/features/*/actions/*.ts` |
| **Invocation** | Direct function call from Client Components or `<form action={...}>` |

#### Why Server Actions Over API Routes

| Concern | API Routes | Server Actions ✅ |
|---|---|---|
| Type safety | Manual type casting of `req.body` | End-to-end TypeScript inference |
| Colocation | Separate `/api/` directory | Actions live next to their feature |
| Boilerplate | Request parsing, response formatting | Direct function call/return |
| Progressive enhancement | Requires JavaScript | `<form action={}>` works without JS |
| CSRF protection | Manual implementation | Built-in by Next.js |
| Revalidation | Manual `fetch` + revalidation | `revalidatePath()` / `revalidateTag()` |
| File uploads | Multipart parsing needed | Native `FormData` support |

#### Usage Categories

| Category | Actions | Description |
|---|---|---|
| **Products** | `createProduct`, `updateProduct`, `deleteProduct`, `toggleFeatured` | Full CRUD for admin product management |
| **Categories** | `createCategory`, `updateCategory`, `deleteCategory` | Category management |
| **Inquiries** | `submitInquiry`, `markInquiryRead`, `deleteInquiry` | Customer inquiry lifecycle |
| **Auth** | `signIn`, `signOut` | Authentication flows |
| **Media** | `uploadImage`, `deleteImage` | Cloudinary upload/deletion |

#### Error Handling Pattern

All Server Actions return a standardized `ActionResult` type:

```typescript
// src/lib/types/action-result.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

```typescript
// Example action with error handling
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "../schemas/product.schema";
import type { ActionResult } from "@/lib/types/action-result";

export async function createProduct(formData: FormData): Promise<ActionResult<{ id: string }>> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Validation
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // 3. Database operation
    const product = await prisma.product.create({
      data: parsed.data,
    });

    // 4. Revalidation
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath(`/products/${product.slug}`);

    return { success: true, data: { id: product.id } };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { success: false, error: "Failed to create product. Please try again." };
  }
}
```

#### Revalidation Strategy

| Strategy | When Used |
|---|---|
| `revalidatePath(path)` | After CUD operations — revalidate specific pages |
| `revalidatePath(path, "layout")` | Revalidate all pages sharing a layout |
| `revalidateTag(tag)` | Fine-grained revalidation of tagged `fetch` calls |
| Full path list | After product edit: revalidate product page, listing, homepage, category |

---

### 3.2 Prisma ORM

| Property | Value |
|---|---|
| **Version** | `6.x` (latest stable) |
| **Database** | PostgreSQL (Neon) |
| **Driver** | `@prisma/adapter-neon` (serverless driver) |
| **Schema Location** | `prisma/schema.prisma` |

#### Why Prisma

- **Type-Safe Queries:** Auto-generated TypeScript client from the schema — every query is fully typed.
- **Schema-First:** `schema.prisma` is the single source of truth for the data model. Migrations are generated from schema diffs.
- **Migrations:** `prisma migrate dev` for development, `prisma migrate deploy` for production. Version-controlled SQL migrations.
- **Prisma Studio:** Built-in GUI for browsing and editing data during development.
- **Relation Handling:** Intuitive relation API — includes, nested creates, connect/disconnect.

#### Connection Pooling with Neon

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

> [!IMPORTANT]
> The singleton pattern prevents connection exhaustion during hot-reloading in development. In production, each serverless function invocation creates its own connection via the Neon serverless driver, which uses HTTP-based queries — no persistent TCP connections required.

#### Schema Design (Overview)

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String
  price       Decimal? @db.Decimal(12, 2)
  metalType   String?
  stoneType   String?
  weight      String?
  isFeatured  Boolean  @default(false)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  images      ProductImage[]
  inquiries   Inquiry[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([categoryId])
  @@index([slug])
  @@index([isFeatured])
  @@index([isActive, sortOrder])
}

model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?
  imageUrl    String?
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
  @@index([isActive, sortOrder])
}

model ProductImage {
  id         String  @id @default(cuid())
  url        String
  publicId   String  // Cloudinary public ID for deletion
  altText    String?
  sortOrder  Int     @default(0)
  isPrimary  Boolean @default(false)
  productId  String
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@index([productId])
}

model Inquiry {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String
  message   String
  isRead    Boolean  @default(false)
  productId String?
  product   Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())

  @@index([isRead])
  @@index([productId])
  @@index([createdAt])
}

model User {
  id             String   @id @default(cuid())
  name           String
  email          String   @unique
  hashedPassword String
  role           Role     @default(ADMIN)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum Role {
  ADMIN
  SUPER_ADMIN
}
```

#### Migration Workflow

```bash
# Development: create and apply migration
npx prisma migrate dev --name add_product_table

# Production: apply pending migrations
npx prisma migrate deploy

# Generate client after schema change
npx prisma generate

# Open database GUI
npx prisma studio
```

---

### 3.3 Neon PostgreSQL

| Property | Value |
|---|---|
| **Service** | [Neon](https://neon.tech) |
| **Engine** | PostgreSQL 16 |
| **Driver** | `@neondatabase/serverless` (HTTP/WebSocket) |
| **Connection** | Pooled connection string for serverless environments |

#### Why Neon

- **Serverless-Native:** Designed for serverless deployments — no connection pool management headaches. The serverless driver uses HTTP-based queries.
- **Auto-Scaling:** Compute scales to zero when idle (free tier), scales up under load (paid tier). Perfect for a showcase site with variable traffic.
- **Branching:** Create instant database branches for development and staging — isolated environments that share storage with production (copy-on-write).
- **Free Tier:** Generous free tier suitable for launch: 0.5 GB storage, 100 hours compute/month.
- **Point-in-Time Recovery:** Restore to any point within the retention window — critical for production data safety.

#### Connection Configuration

```bash
# .env
# Pooled connection for application queries (recommended for serverless)
DATABASE_URL="postgresql://user:password@ep-xxx-yyy-123.us-east-2.aws.neon.tech/nakoda_web?sslmode=require"
```

#### Branching Strategy

| Branch | Purpose | Base |
|---|---|---|
| `main` | Production database | — |
| `staging` | Pre-production testing | `main` |
| `dev/<feature>` | Feature development | `main` |

> [!TIP]
> Create a Neon branch per pull request for isolated database testing. Branches are instant (copy-on-write) and cost nothing until data diverges.

---

## 4. Authentication

### Auth.js (NextAuth v5)

| Property | Value |
|---|---|
| **Version** | `5.x` (beta → stable) |
| **Package** | `next-auth@5` |
| **Strategy** | JWT (stateless — no database sessions) |
| **Provider** | Credentials (email + password) |
| **Hashing** | bcrypt (cost factor 12) |

#### Why Auth.js

- **Native Next.js Integration:** First-class App Router support — `auth()` in Server Components, Server Actions, Middleware.
- **Session Management:** JWT-based sessions stored in HTTP-only cookies — no database session table needed.
- **Route Protection:** Middleware-based guard for `/admin/*` routes — runs at the edge before any page code.
- **Minimal Setup:** Single config file at `src/lib/auth.ts`.

#### Why Credentials Provider (Not OAuth)

This is an **admin-only** portal. There are no customer accounts. Admin users are:
- Manually seeded into the database.
- Limited to a small number (1–5 store managers).
- Authenticated via email/password — no need for Google/GitHub OAuth complexity.

#### Configuration (`src/lib/auth.ts`)

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/schemas/login.schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.hashedPassword
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
```

#### Middleware-Based Route Protection (`src/middleware.ts`)

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = req.nextUrl.pathname === "/admin/login";
  const isAuthenticated = !!req.auth;

  if (isAdminRoute && !isLoginPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
```

#### Password Hashing

```typescript
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// Hashing (used in seed script)
const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Verification (used in authorize callback)
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

> [!WARNING]
> Cost factor 12 provides good security (~250ms hash time). Do not reduce below 10 for production. Using `bcryptjs` (pure JS) instead of `bcrypt` (native) for Vercel/serverless compatibility — no native binary compilation needed.

---

## 5. Media Storage

### Cloudinary

| Property | Value |
|---|---|
| **Service** | [Cloudinary](https://cloudinary.com) |
| **SDK** | `cloudinary` (Node.js — server-side only) |
| **Upload Method** | Signed uploads via Server Actions |
| **Delivery** | CDN with automatic format negotiation |

#### Why Cloudinary

- **Image Optimization:** Automatic format selection (WebP/AVIF), quality optimization, and responsive sizing — critical for high-resolution jewellery photography.
- **Transformations via URL:** Resize, crop, and transform images by modifying the URL — no server-side image processing needed.
- **CDN Delivery:** Global CDN ensures fast image loading worldwide.
- **Upload Management:** Folder-based organization, upload presets, and signed uploads for security.
- **Free Tier:** 25 monthly transformations, 25 GB storage, 25 GB bandwidth — sufficient for launch.

#### Configuration

```typescript
// src/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export { cloudinary };
```

#### Upload Strategy

```typescript
// src/features/media/actions/upload-image.ts
"use server";

import { cloudinary } from "@/lib/cloudinary";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/lib/types/action-result";

interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadImage(
  formData: FormData
): Promise<ActionResult<UploadResult>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type and size
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Invalid file type" };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "File size must be under 10MB" };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "nakoda-web/products",
              resource_type: "image",
              quality: "auto:best",
              format: "auto",
              transformation: [
                { width: 2000, height: 2000, crop: "limit" }, // Max dimensions
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result!);
            }
          )
          .end(buffer);
      }
    );

    return {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    };
  } catch (error) {
    console.error("Upload failed:", error);
    return { success: false, error: "Failed to upload image" };
  }
}
```

#### Folder Structure on Cloudinary

```
nakoda-web/
├── products/          # Product images
├── categories/        # Category banner images
├── hero/              # Homepage hero images
└── misc/              # About page, store photos
```

#### Image Delivery via URL Transformations

```typescript
// Generate responsive image URLs
function getOptimizedUrl(publicId: string, width: number): string {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_${width},q_auto,f_auto/${publicId}`;
}

// Usage with Next.js <Image>
<Image
  src={product.images[0].url}
  alt={product.title}
  width={600}
  height={600}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

#### Environment Variables

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name  # For client-side URL generation
```

---

## 6. Hosting & Deployment

### Vercel

| Property | Value |
|---|---|
| **Platform** | [Vercel](https://vercel.com) |
| **Framework Preset** | Next.js (auto-detected) |
| **Build Command** | `npx prisma generate && next build` |
| **Node.js Version** | 20.x |
| **Region** | Auto (or `bom1` for Mumbai — closest to India) |

#### Why Vercel

- **Native Next.js Support:** Built by the same team. Zero-config deployment for all Next.js features including Server Actions, ISR, Middleware, and Image Optimization.
- **Edge Functions:** Middleware runs at the edge — auth checks execute before any page code loads.
- **Preview Deployments:** Every PR gets a unique preview URL — stakeholders review before merging.
- **Automatic HTTPS:** SSL certificates provisioned and renewed automatically.
- **Analytics:** Web Vitals (LCP, FID, CLS) tracking built-in.

#### Environment Configuration

| Environment | Branch | Domain | Purpose |
|---|---|---|---|
| **Production** | `main` | `www.nakodajewellers.com` | Live site |
| **Preview** | Feature branches | `*.vercel.app` | PR reviews |
| **Development** | Local | `localhost:3000` | Local dev |

#### Environment Variables (Vercel Dashboard)

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="generated-random-secret"   # npx auth secret
AUTH_URL="https://www.nakodajewellers.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."

# App
NEXT_PUBLIC_APP_URL="https://www.nakodajewellers.com"
```

#### Build Pipeline

```mermaid
graph LR
    A["git push"] --> B["Vercel Build"]
    B --> C["prisma generate"]
    C --> D["next build"]
    D --> E["Static Pages"]
    D --> F["Server Functions"]
    D --> G["Edge Middleware"]
    E --> H["CDN Deploy"]
    F --> H
    G --> H
    H --> I["Live ✓"]
```

#### Custom Headers (`next.config.ts`)

```typescript
// Security headers
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
      ],
    },
  ];
},
```

---

## 7. SEO

### 7.1 next-sitemap

| Property | Value |
|---|---|
| **Package** | `next-sitemap` |
| **Version** | `4.x` (latest stable) |
| **Output** | `sitemap.xml`, `robots.txt` (generated at build time) |

#### Configuration (`next-sitemap.config.js`)

```javascript
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://www.nakodajewellers.com",
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: "weekly",
  priority: 0.7,
  exclude: ["/admin/*", "/admin"],
  robotsTxtOptions: {
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_APP_URL}/server-sitemap.xml`,
    ],
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*"],
      },
    ],
  },
};
```

#### Dynamic Server Sitemap (`app/server-sitemap.xml/route.ts`)

```typescript
import { getServerSideSitemap } from "next-sitemap";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const fields = [
    ...products.map((product) => ({
      loc: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
      lastmod: product.updatedAt.toISOString(),
      changefreq: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map((category) => ({
      loc: `${process.env.NEXT_PUBLIC_APP_URL}/collections/${category.slug}`,
      lastmod: category.updatedAt.toISOString(),
      changefreq: "weekly" as const,
      priority: 0.7,
    })),
  ];

  return getServerSideSitemap(fields);
}
```

### 7.2 Structured Data (JSON-LD)

Structured data schemas used across the platform:

| Schema | Page | Purpose |
|---|---|---|
| `Organization` | All pages (layout) | Business identity for Google Knowledge Panel |
| `LocalBusiness` | Homepage, contact | Local SEO — store location, hours, contact |
| `Product` | Product detail | Rich snippets in search results |
| `BreadcrumbList` | All inner pages | Breadcrumb trail in search results |
| `WebSite` | Homepage | Sitelinks search box |
| `CollectionPage` | Category pages | Product collection markup |

#### Example: Product JSON-LD

```typescript
// src/features/products/components/product-jsonld.tsx
import type { Product, ProductImage, Category } from "@prisma/client";

interface ProductWithRelations extends Product {
  images: ProductImage[];
  category: Category;
}

export function ProductJsonLd({ product }: { product: ProductWithRelations }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((img) => img.url),
    brand: {
      "@type": "Brand",
      name: "Nakoda Jewellers",
    },
    category: product.category.name,
    material: product.metalType,
    ...(product.price && {
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: product.price.toString(),
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: "Nakoda Jewellers",
        },
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### 7.3 Metadata API

```typescript
// app/(storefront)/products/[slug]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: `${product.title} | Nakoda Jewellers`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images.map((img) => ({
        url: img.url,
        width: 1200,
        height: 630,
        alt: img.altText || product.title,
      })),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description.slice(0, 160),
      images: [product.images[0]?.url],
    },
  };
}
```

---

## 8. Development Tools

### 8.1 ESLint

| Property | Value |
|---|---|
| **Config** | `eslint-config-next` (extends `next/core-web-vitals` + `next/typescript`) |
| **Version** | ESLint 9.x with flat config |

```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
    },
  },
];

export default eslintConfig;
```

### 8.2 Prettier

| Property | Value |
|---|---|
| **Version** | `3.x` |
| **Plugin** | `prettier-plugin-tailwindcss` (automatic class sorting) |

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 8.3 Prisma Studio

```bash
# Launch database GUI on http://localhost:5555
npx prisma studio
```

- Browse all tables with a spreadsheet-like interface
- Create, update, and delete records
- Explore relations visually

### 8.4 VS Code Recommended Extensions

```jsonc
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",       // Tailwind CSS IntelliSense
    "prisma.prisma",                    // Prisma syntax highlighting
    "dbaeumer.vscode-eslint",           // ESLint
    "esbenp.prettier-vscode",           // Prettier
    "ms-vscode.vscode-typescript-next", // TypeScript nightly
    "formulahendry.auto-rename-tag",    // Auto rename HTML/JSX tags
    "christian-kohler.path-intellisense" // Path autocomplete
  ]
}
```

### 8.5 VS Code Settings

```jsonc
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### 8.6 Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "postinstall": "prisma generate"
  }
}
```

---

## 9. Package List

### Production Dependencies

| Package | Version | Category | Purpose |
|---|---|---|---|
| `next` | `15.x` | Framework | React meta-framework — App Router, SSR, SSG, ISR |
| `react` | `19.x` | Core | UI component library |
| `react-dom` | `19.x` | Core | React DOM renderer |
| `next-auth` | `5.x` | Auth | Authentication — sessions, JWT, middleware |
| `bcryptjs` | `3.x` | Auth | Password hashing (pure JS — serverless compatible) |
| `@prisma/client` | `6.x` | Database | Type-safe PostgreSQL client |
| `@prisma/adapter-neon` | `6.x` | Database | Prisma adapter for Neon serverless driver |
| `@neondatabase/serverless` | `0.10.x` | Database | Neon serverless PostgreSQL driver (HTTP/WS) |
| `cloudinary` | `2.x` | Media | Server-side image upload and management SDK |
| `framer-motion` | `12.x` | Animation | Declarative animations, page transitions |
| `react-hook-form` | `7.x` | Forms | Performant form state management |
| `@hookform/resolvers` | `3.x` | Forms | Zod resolver for React Hook Form |
| `zod` | `3.x` | Validation | Schema validation — shared client/server |
| `lucide-react` | `0.4x` | UI | Tree-shakeable SVG icon library |
| `next-sitemap` | `4.x` | SEO | Sitemap and robots.txt generation |
| `clsx` | `2.x` | Utility | Conditional CSS class joining |
| `tailwind-merge` | `3.x` | Utility | Intelligent Tailwind class merging |
| `sonner` | `2.x` | UI | Toast notification library |
| `slugify` | `1.x` | Utility | URL-safe slug generation for products/categories |
| `date-fns` | `4.x` | Utility | Lightweight date formatting (admin timestamps) |

### Development Dependencies

| Package | Version | Category | Purpose |
|---|---|---|---|
| `typescript` | `5.x` | Language | TypeScript compiler and type checking |
| `@types/react` | `19.x` | Types | React type definitions |
| `@types/react-dom` | `19.x` | Types | React DOM type definitions |
| `@types/bcryptjs` | `2.x` | Types | bcryptjs type definitions |
| `@types/node` | `22.x` | Types | Node.js type definitions |
| `prisma` | `6.x` | Database | Prisma CLI — migrations, generation, studio |
| `tailwindcss` | `4.x` | Styling | Utility-first CSS framework |
| `@tailwindcss/postcss` | `4.x` | Styling | PostCSS plugin for Tailwind v4 |
| `postcss` | `8.x` | Styling | CSS post-processing |
| `eslint` | `9.x` | Linting | JavaScript/TypeScript linter |
| `eslint-config-next` | `15.x` | Linting | Next.js-specific ESLint rules |
| `@eslint/eslintrc` | `3.x` | Linting | ESLint flat config compatibility |
| `prettier` | `3.x` | Formatting | Code formatter |
| `prettier-plugin-tailwindcss` | `0.6.x` | Formatting | Automatic Tailwind class sorting |
| `tsx` | `4.x` | Dev | TypeScript execution (for seed scripts) |

---

## 10. Version Compatibility Matrix

This matrix ensures all major dependencies work together without conflicts.

| Dependency | Version | Compatible With | Notes |
|---|---|---|---|
| **Next.js** | `15.x` | React 19, Node 18.18+/20+ | App Router required |
| **React** | `19.x` | Next.js 15, Framer Motion 12 | RSC support |
| **React DOM** | `19.x` | React 19 | Must match React version |
| **TypeScript** | `5.6+` | Next.js 15, Prisma 6 | `moduleResolution: "bundler"` |
| **Tailwind CSS** | `4.x` | PostCSS 8, Next.js 15 | CSS-first config, no `tailwind.config.js` |
| **Framer Motion** | `12.x` | React 19, Next.js 15 | `"use client"` required |
| **Prisma** | `6.x` | Node 18+, PostgreSQL 16, Neon | `driverAdapters` preview feature |
| **Auth.js / NextAuth** | `5.x` | Next.js 15, Prisma 6 | JWT strategy for serverless |
| **React Hook Form** | `7.x` | React 19, Zod 3 | `@hookform/resolvers` bridge |
| **Zod** | `3.x` | TypeScript 5, RHF 7 | `z.infer` for type generation |
| **Node.js** | `20.x` | Next.js 15, Prisma 6, Vercel | LTS recommended |
| **PostgreSQL** | `16` | Prisma 6, Neon | Neon uses PG 16 by default |
| **ESLint** | `9.x` | Next.js 15 | Flat config format |
| **Prettier** | `3.x` | Tailwind CSS 4 plugin | `prettier-plugin-tailwindcss` 0.6+ |

### Node.js Version Requirements

```
Node.js >= 18.18.0 (required by Next.js 15)
Node.js 20.x LTS (recommended for production)
```

### Package Manager

```
npm (default — used for Vercel deployments)
```

---

## Appendix A: Environment Variables Reference

| Variable | Required | Scope | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Server | Neon PostgreSQL pooled connection string |
| `AUTH_SECRET` | ✅ | Server | Random secret for JWT signing (`npx auth secret`) |
| `AUTH_URL` | ✅ | Server | Canonical URL of the application |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Server | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Server | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Server | Cloudinary API secret |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ | Client | Cloudinary cloud name (for URL generation) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Client | Public application URL |

---

## Appendix B: Architecture Decision Records (ADR) Summary

| # | Decision | Status | Date |
|---|---|---|---|
| ADR-001 | Use Server Components by default | ✅ Accepted | 2026-06-03 |
| ADR-002 | Server Actions over API Routes | ✅ Accepted | 2026-06-03 |
| ADR-003 | JWT sessions (no database sessions) | ✅ Accepted | 2026-06-03 |
| ADR-004 | Credentials provider only (no OAuth) | ✅ Accepted | 2026-06-03 |
| ADR-005 | Cloudinary for media (not S3/Vercel Blob) | ✅ Accepted | 2026-06-03 |
| ADR-006 | Neon over Supabase/PlanetScale | ✅ Accepted | 2026-06-03 |
| ADR-007 | Tailwind CSS v4 (CSS-first config) | ✅ Accepted | 2026-06-03 |
| ADR-008 | Feature-based folder structure | ✅ Accepted | 2026-06-03 |
| ADR-009 | No e-commerce checkout in V1 | ✅ Accepted | 2026-06-03 |
| ADR-010 | Framer Motion for animations (not CSS-only) | ✅ Accepted | 2026-06-03 |

---

> **Next Document:** [Project Structure →](./PROJECT_STRUCTURE.md)
