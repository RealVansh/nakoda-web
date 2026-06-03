# System Architecture — Nakoda Web

> **Version:** 1.0.0
> **Last Updated:** 2026-06-03
> **Status:** Approved for V1 Development
> **Authors:** Nakoda Engineering Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [High-Level Architecture Diagram](#2-high-level-architecture-diagram)
3. [Application Architecture](#3-application-architecture)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Caching Strategy](#5-caching-strategy)
6. [Error Handling Architecture](#6-error-handling-architecture)
7. [State Management](#7-state-management)
8. [Middleware Architecture](#8-middleware-architecture)
9. [Scalability Considerations](#9-scalability-considerations)
10. [Security Architecture](#10-security-architecture)

---

## 1. Overview

Nakoda Web is a **premium jewellery showcase and inquiry platform** designed to present Nakoda's product catalogue to prospective customers and capture purchase inquiries. It is architected as a modern, server-first Next.js 15 application that leverages **React Server Components** and **Server Actions** to deliver a fast, SEO-optimised, and secure user experience — with zero client-side data-fetching libraries and no traditional REST/GraphQL API layer.

### Core Architectural Principles

| Principle | Description |
|---|---|
| **Server-First Rendering** | Default to React Server Components for all data-fetching and layout; use Client Components only for interactivity. |
| **Feature-Based Organisation** | Code is grouped by domain feature (products, categories, collections, inquiries, auth) — not by technical role. |
| **Zero-API Architecture** | No REST/GraphQL endpoints in V1. All mutations flow through type-safe Server Actions; all reads happen in Server Components. |
| **Progressive Enhancement** | Forms work without JavaScript via Server Actions; animations and rich UI layer on top via Framer Motion. |
| **Edge-First Delivery** | Static and ISR pages served from Vercel's Edge CDN; images served via Cloudinary's global CDN. |
| **Showcase — Not E-Commerce** | V1 has no shopping cart, checkout, or payment processing. The platform is a digital showroom with an inquiry/contact workflow. |

### Technology Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack React framework |
| UI Library | React 19 | Component rendering with Server Components |
| Language | TypeScript 5.x | Type safety across the entire stack |
| Styling | Tailwind CSS v4 | Utility-first CSS with design tokens |
| Animation | Framer Motion | Page transitions, scroll reveals, micro-interactions |
| ORM | Prisma ORM | Type-safe database access and migrations |
| Database | Neon PostgreSQL (Serverless) | Managed, auto-scaling relational database |
| Authentication | Auth.js (NextAuth v5) | Admin authentication with JWT sessions |
| Media Storage | Cloudinary | Image upload, transformation, and CDN delivery |
| Deployment | Vercel | Serverless hosting, Edge Network, CI/CD |
| Validation | Zod | Runtime schema validation for forms and actions |

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                    │
│                                                                                │
│  ┌────────────────────────────────┐    ┌────────────────────────────────────┐   │
│  │       PUBLIC STOREFRONT        │    │         ADMIN PORTAL               │   │
│  │                                │    │                                    │   │
│  │  • SSR + Streaming HTML        │    │  • Auth-Protected Routes           │   │
│  │  • Server Components (data)    │    │  • Client Components (forms)       │   │
│  │  • Client Components (UI)      │    │  • Server Actions (mutations)      │   │
│  │  • Framer Motion animations    │    │  • Dashboard + CRUD interfaces     │   │
│  │  • SEO-optimised pages         │    │  • Image upload workflows          │   │
│  └───────────────┬────────────────┘    └──────────────────┬─────────────────┘   │
│                  │                                        │                     │
└──────────────────┼────────────────────────────────────────┼─────────────────────┘
                   │             HTTPS / TLS                │
                   └──────────────────┬─────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          VERCEL EDGE NETWORK                                   │
│                                                                                │
│  ┌──────────────────┐  ┌───────────────────┐  ┌────────────────────────────┐   │
│  │   CDN CACHE       │  │   MIDDLEWARE       │  │   EDGE FUNCTIONS           │   │
│  │                   │  │                    │  │                            │   │
│  │  • Static assets  │  │  • Auth.js guard   │  │  • Route matching          │   │
│  │  • ISR pages      │  │  • /admin/* check  │  │  • Header injection        │   │
│  │  • Image optim.   │  │  • Session verify  │  │  • Redirect logic          │   │
│  │  • Font files     │  │  • Public passthru │  │  • Geolocation (future)    │   │
│  └──────────────────┘  └───────────────────┘  └────────────────────────────┘   │
│                                                                                │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS 15 APPLICATION SERVER                             │
│                        (Vercel Serverless Functions)                            │
│                                                                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                        APP ROUTER (src/app/)                              │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────┐     ┌──────────────────────────────────┐     │  │
│  │  │   (store) Route Group    │     │   (admin) Route Group            │     │  │
│  │  │                         │     │                                  │     │  │
│  │  │  / ............. Home   │     │  /admin ........... Dashboard    │     │  │
│  │  │  /products ...... List  │     │  /admin/products .. CRUD         │     │  │
│  │  │  /products/[slug] Detail│     │  /admin/categories  CRUD         │     │  │
│  │  │  /categories .... List  │     │  /admin/collections CRUD         │     │  │
│  │  │  /categories/[slug]     │     │  /admin/inquiries .. View/Manage │     │  │
│  │  │  /collections ... List  │     │  /admin/login ...... Auth        │     │  │
│  │  │  /collections/[slug]    │     │  /admin/settings ... Config      │     │  │
│  │  │  /about ......... Info  │     └──────────────────────────────────┘     │  │
│  │  │  /contact ....... Form  │                                              │  │
│  │  └─────────────────────────┘                                              │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                       FEATURE MODULES (src/features/)                     │  │
│  │                                                                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐   │  │
│  │  │  products/   │ │ categories/ │ │ collections/ │ │   inquiries/     │   │  │
│  │  │  • actions   │ │ • actions   │ │ • actions    │ │   • actions      │   │  │
│  │  │  • components│ │ • components│ │ • components │ │   • components   │   │  │
│  │  │  • schemas   │ │ • schemas   │ │ • schemas    │ │   • schemas      │   │  │
│  │  │  • types     │ │ • types     │ │ • types      │ │   • types        │   │  │
│  │  │  • queries   │ │ • queries   │ │ • queries    │ │   • queries      │   │  │
│  │  └─────────────┘ └─────────────┘ └──────────────┘ └──────────────────┘   │  │
│  │                                                                           │  │
│  │  ┌─────────────┐ ┌──────────────────────────────────────────────────┐     │  │
│  │  │    auth/     │ │              shared/                            │     │  │
│  │  │  • config    │ │  • components (ui/, layout/)                    │     │  │
│  │  │  • actions   │ │  • lib (db, cloudinary, utils, constants)       │     │  │
│  │  │  • guards    │ │  • hooks (useMediaQuery, useDebounce, etc.)     │     │  │
│  │  └─────────────┘ └──────────────────────────────────────────────────┘     │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌─────────────────────────────┐    ┌────────────────────────────────────────┐  │
│  │       SERVER ACTIONS        │    │       SERVER COMPONENTS                │  │
│  │       (Mutations)           │    │       (Data Fetching)                  │  │
│  │                             │    │                                        │  │
│  │  "use server"               │    │  async function Page()                 │  │
│  │  • Form submissions        │    │  • Direct Prisma queries               │  │
│  │  • CRUD operations         │    │  • No API calls needed                 │  │
│  │  • File uploads            │    │  • Streamed to client                  │  │
│  │  • Revalidation triggers   │    │  • Zero client JS for data             │  │
│  └──────────────┬──────────────┘    └────────────────┬───────────────────────┘  │
│                 │                                    │                          │
└─────────────────┼────────────────────────────────────┼──────────────────────────┘
                  │                                    │
                  ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATA & SERVICES LAYER                                │
│                                                                                │
│  ┌──────────────────────────────────────────┐  ┌────────────────────────────┐   │
│  │            PRISMA ORM                    │  │     CLOUDINARY CDN         │   │
│  │                                          │  │                            │   │
│  │  • Type-safe query builder               │  │  • Image upload API        │   │
│  │  • Schema-driven migrations              │  │  • On-the-fly transforms   │   │
│  │  • Relation eager/lazy loading           │  │  • Auto format (WebP/AVIF) │   │
│  │  • Connection pooling (via Neon)         │  │  • Responsive breakpoints  │   │
│  │  • Transaction support                   │  │  • Global CDN delivery     │   │
│  │                                          │  │  • Signed uploads          │   │
│  └──────────────────┬───────────────────────┘  └────────────────────────────┘   │
│                     │                                                           │
│                     ▼                                                           │
│  ┌──────────────────────────────────────────┐                                   │
│  │          NEON POSTGRESQL                 │                                   │
│  │          (Serverless)                    │                                   │
│  │                                          │                                   │
│  │  • Auto-scaling compute                  │                                   │
│  │  • Branching for dev/staging             │                                   │
│  │  • Connection pooling (pgbouncer)        │                                   │
│  │  • Point-in-time recovery                │                                   │
│  │  • Read replicas (future)                │                                   │
│  └──────────────────────────────────────────┘                                   │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Summary

```
                    ┌─────────────────────────────────┐
                    │         Request Lifecycle        │
                    └─────────────────┬───────────────┘
                                      │
                    ┌─────────────────▼───────────────┐
                    │  1. DNS Resolution (Vercel)      │
                    └─────────────────┬───────────────┘
                                      │
                    ┌─────────────────▼───────────────┐
                    │  2. Edge CDN Cache Check         │
                    │     HIT → Return cached page     │
                    │     MISS → Continue ▼            │
                    └─────────────────┬───────────────┘
                                      │
                    ┌─────────────────▼───────────────┐
                    │  3. Middleware Execution          │
                    │     • Auth check for /admin/*     │
                    │     • Redirect if unauthenticated │
                    │     • Pass through for public     │
                    └─────────────────┬───────────────┘
                                      │
                    ┌─────────────────▼───────────────┐
                    │  4. Server Component Render       │
                    │     • Execute async component     │
                    │     • Prisma DB queries inline     │
                    │     • Stream HTML to client        │
                    └─────────────────┬───────────────┘
                                      │
                    ┌─────────────────▼───────────────┐
                    │  5. Client Hydration              │
                    │     • Hydrate Client Components   │
                    │     • Attach event handlers       │
                    │     • Initialise Framer Motion    │
                    └─────────────────────────────────┘
```

---

## 3. Application Architecture

### 3.1 Route Groups

Next.js 15 App Router uses **route groups** (parenthesised folders) to organise routes without affecting the URL structure and to apply distinct layouts to different sections of the application.

```
src/app/
├── (store)/                    # Public storefront — customer-facing
│   ├── layout.tsx              # Store layout: navbar + footer + animations
│   ├── page.tsx                # Homepage — hero, featured products, CTAs
│   ├── products/
│   │   ├── page.tsx            # Product listing with filters
│   │   └── [slug]/
│   │       └── page.tsx        # Product detail with image gallery
│   ├── categories/
│   │   ├── page.tsx            # Category grid
│   │   └── [slug]/
│   │       └── page.tsx        # Category products listing
│   ├── collections/
│   │   ├── page.tsx            # Collections showcase
│   │   └── [slug]/
│   │       └── page.tsx        # Collection detail with products
│   ├── about/
│   │   └── page.tsx            # About Nakoda — brand story
│   └── contact/
│       └── page.tsx            # Contact/Inquiry form
│
├── (admin)/                    # Admin portal — protected
│   ├── layout.tsx              # Admin layout: sidebar + header + auth guard
│   ├── admin/
│   │   ├── page.tsx            # Dashboard — stats, recent activity
│   │   ├── products/
│   │   │   ├── page.tsx        # Product list (table + search)
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # Create product form
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx# Edit product form
│   │   ├── categories/
│   │   │   ├── page.tsx        # Category management
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # Create category
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx# Edit category
│   │   ├── collections/
│   │   │   ├── page.tsx        # Collection management
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # Create collection
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx# Edit collection
│   │   ├── inquiries/
│   │   │   ├── page.tsx        # Inquiry list + filters
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Inquiry detail view
│   │   ├── settings/
│   │   │   └── page.tsx        # Site settings
│   │   └── login/
│   │       └── page.tsx        # Admin login (public within admin group)
│   │
│   └── ...
│
├── layout.tsx                  # Root layout — html, body, fonts, providers
├── not-found.tsx               # Global 404 page
├── error.tsx                   # Global error boundary
├── loading.tsx                 # Global loading skeleton
└── globals.css                 # Tailwind directives + CSS custom properties
```

#### Route Group Benefits

| Benefit | Description |
|---|---|
| **Separate Layouts** | `(store)` gets the public navbar/footer layout; `(admin)` gets the sidebar/dashboard layout — no conditional rendering needed. |
| **URL Cleanliness** | Route groups don't add path segments — `/products` not `/(store)/products`. |
| **Code Organisation** | Logical separation between public and admin concerns at the filesystem level. |
| **Independent Error Boundaries** | Each group can have its own `error.tsx`, `loading.tsx`, and `not-found.tsx`. |
| **Layout Nesting** | Root layout → Group layout → Page layout provides clean composition without prop-drilling layout state. |

---

### 3.2 Component Architecture

Nakoda Web follows a strict **server-default, client-opt-in** component model. Every component is a React Server Component unless explicitly marked with `"use client"`.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPONENT HIERARCHY                                 │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ROOT LAYOUT (Server Component)                                      │  │
│  │  • HTML document structure                                           │  │
│  │  • Font loading (<link> / next/font)                                 │  │
│  │  • Global providers (ThemeProvider — Client Component wrapper)        │  │
│  │                                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────┐   │  │
│  │  │  GROUP LAYOUT (Server Component)                              │   │  │
│  │  │                                                               │   │  │
│  │  │  (store)/layout.tsx:                                          │   │  │
│  │  │  ├── <Navbar />            ← Client (mobile menu, dropdowns)  │   │  │
│  │  │  ├── <PageTransition />    ← Client (Framer Motion wrapper)   │   │  │
│  │  │  ├── {children}            ← Server (page content)            │   │  │
│  │  │  └── <Footer />            ← Server (static content)          │   │  │
│  │  │                                                               │   │  │
│  │  │  (admin)/layout.tsx:                                          │   │  │
│  │  │  ├── <AdminSidebar />      ← Client (collapsible, active link)│   │  │
│  │  │  ├── <AdminHeader />       ← Client (user menu, notifications)│   │  │
│  │  │  └── {children}            ← Server (page content)            │   │  │
│  │  │                                                               │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐  │   │  │
│  │  │  │  PAGE (Server Component)                                │  │   │  │
│  │  │  │  • Direct database queries via Prisma                   │  │   │  │
│  │  │  │  • Metadata generation (SEO)                            │  │   │  │
│  │  │  │  • Data passed as props to child components             │  │   │  │
│  │  │  │                                                         │  │   │  │
│  │  │  │  ┌──────────────────┐  ┌────────────────────────────┐   │  │   │  │
│  │  │  │  │ Server Component │  │ Client Component           │   │  │   │  │
│  │  │  │  │                  │  │ "use client"               │   │  │   │  │
│  │  │  │  │ <ProductGrid     │  │                            │   │  │   │  │
│  │  │  │  │   products={..}/>│  │ <ImageGallery images={..}/>│   │  │   │  │
│  │  │  │  │                  │  │ <InquiryForm />            │   │  │   │  │
│  │  │  │  │ • Receives data  │  │ <FilterSidebar />          │   │  │   │  │
│  │  │  │  │   as props       │  │ <SearchBar />              │   │  │   │  │
│  │  │  │  │ • Zero JS bundle │  │                            │   │  │   │  │
│  │  │  │  │ • Renders HTML   │  │ • useState / useEffect     │   │  │   │  │
│  │  │  │  │   directly       │  │ • Event handlers           │   │  │   │  │
│  │  │  │  │                  │  │ • Framer Motion            │   │  │   │  │
│  │  │  │  │                  │  │ • Form state (RHF)         │   │  │   │  │
│  │  │  │  └──────────────────┘  └────────────────────────────┘   │  │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘  │   │  │
│  │  └────────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Server Components — Default Choice

Server Components are the **default and preferred** component type. They execute exclusively on the server and send only rendered HTML to the client.

**Use Server Components for:**
- Page-level data fetching (Prisma queries)
- Layout shells and structural markup
- SEO metadata generation (`generateMetadata`)
- Static content (footer, about sections, headings)
- Rendering data grids, product cards (non-interactive)
- Passing serialisable data as props to Client Components

**Key characteristics:**
- `async` / `await` — can directly call Prisma, file system, or any Node.js API
- Zero JavaScript shipped to the client for these components
- Cannot use `useState`, `useEffect`, `useRef`, or browser APIs
- Cannot use event handlers (`onClick`, `onChange`, etc.)
- Can import and render Client Components (but not vice-versa for server-only logic)

#### Client Components — Opt-In for Interactivity

Client Components are marked with the `"use client"` directive at the top of the file. They are hydrated on the client and can use React hooks and browser APIs.

**Use Client Components for:**
- Forms with validation (React Hook Form + Zod)
- Interactive image galleries (swipe, zoom, lightbox)
- Navigation elements (mobile menu toggle, dropdowns)
- Search inputs with debounced filtering
- Modal dialogs and slide-over panels
- Animations (Framer Motion `motion.*` components)
- Filter controls that update URL search params

**Key characteristics:**
- Marked with `"use client"` at file top
- Can use all React hooks (`useState`, `useEffect`, `useRef`, etc.)
- Can attach event handlers
- Props must be serialisable (no functions, Dates must be converted, no Prisma model instances)
- Included in the JavaScript bundle sent to the client

#### Component Composition Patterns

```typescript
// ✅ PATTERN: Server Component fetches data, passes to Client Component
// src/app/(store)/products/[slug]/page.tsx (Server Component)
import { getProductBySlug } from "@/features/products/queries";
import { ProductDetail } from "@/features/products/components/product-detail";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  // Serialize data before passing to Client Component
  return <ProductDetail product={product} />;
}

// ✅ PATTERN: Composition — Server Component wraps Client Component
// Server Component renders structural HTML; Client Component handles gallery
export default async function ProductPage({ params }) {
  const product = await getProductBySlug(params.slug);
  return (
    <section>
      {/* Server-rendered SEO content */}
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {/* Client Component for interactive gallery */}
      <ImageGallery images={product.images} />

      {/* Client Component for inquiry CTA */}
      <InquiryButton productId={product.id} productName={product.name} />
    </section>
  );
}

// ✅ PATTERN: Client Component calls Server Action for mutations
// src/features/products/components/product-form.tsx
"use client";
import { useActionState } from "react";
import { createProduct } from "../actions/create-product";

export function ProductForm() {
  const [state, formAction, isPending] = useActionState(createProduct, null);
  return <form action={formAction}>...</form>;
}
```

#### Props Drilling vs. Context — Decision Matrix

| Scenario | Approach | Rationale |
|---|---|---|
| Page data → direct children | **Props** | Simple, type-safe, no overhead |
| Theme / locale across tree | **Context** (Client Provider at root) | Rarely changes, needed everywhere |
| Auth session in admin | **Props** from layout → page → components | Session fetched once in layout, drilled down |
| UI state (modal open, sidebar) | **Local state** in Client Component | Isolated, doesn't need sharing |
| Filter/search state | **URL search params** | Shareable, bookmarkable, SSR-compatible |
| Deeply nested product data | **Props** with intermediate Server Components | Server Components don't add JS cost |

> **Rule of Thumb:** Prefer props for data and URL params for user-driven state. Reserve React Context for truly global, rarely-changing values (theme, locale). Never use Context for server-fetched data — that's what Server Components are for.

---

### 3.3 Server Actions Architecture

Server Actions replace traditional API routes for all data mutations. They are colocated with their feature modules and follow a consistent pattern across the application.

#### File Organisation

```
src/features/
├── products/
│   ├── actions/
│   │   ├── create-product.ts       # "use server" — creates product + images
│   │   ├── update-product.ts       # "use server" — updates product fields
│   │   ├── delete-product.ts       # "use server" — soft-deletes product
│   │   └── toggle-product-status.ts# "use server" — publish/unpublish
│   ├── schemas/
│   │   ├── product.schema.ts       # Zod schemas for validation
│   │   └── product-filter.schema.ts
│   ├── queries/
│   │   ├── get-products.ts         # Prisma queries for Server Components
│   │   ├── get-product-by-slug.ts
│   │   └── get-featured-products.ts
│   ├── components/
│   │   ├── product-form.tsx        # "use client" — admin create/edit form
│   │   ├── product-card.tsx        # Server Component — display card
│   │   ├── product-grid.tsx        # Server Component — grid layout
│   │   └── product-image-gallery.tsx # "use client" — interactive gallery
│   └── types/
│       └── index.ts                # TypeScript types & interfaces
│
├── categories/
│   ├── actions/
│   │   ├── create-category.ts
│   │   ├── update-category.ts
│   │   └── delete-category.ts
│   ├── schemas/
│   ├── queries/
│   ├── components/
│   └── types/
│
├── collections/
│   ├── actions/ ...
│   ├── schemas/ ...
│   ├── queries/ ...
│   ├── components/ ...
│   └── types/ ...
│
├── inquiries/
│   ├── actions/
│   │   ├── create-inquiry.ts       # Public — customer submits inquiry
│   │   ├── update-inquiry-status.ts# Admin — mark as read/responded
│   │   └── delete-inquiry.ts       # Admin — remove inquiry
│   ├── schemas/
│   ├── queries/
│   ├── components/
│   └── types/
│
└── auth/
    ├── actions/
    │   └── login.ts                # Auth.js signIn action
    └── config/
        └── auth.config.ts          # Auth.js configuration
```

#### Error Handling Pattern — `ActionResult<T>`

All Server Actions return a standardised `ActionResult` type that enables consistent error handling across the application:

```typescript
// src/shared/lib/action-result.ts

export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// Helper constructors
export function actionSuccess<T>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, message };
}

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return { success: false, error, fieldErrors };
}
```

#### Standard Server Action Template

```typescript
// src/features/products/actions/create-product.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/features/auth/config/auth.config";
import { db } from "@/shared/lib/db";
import { uploadToCloudinary } from "@/shared/lib/cloudinary";
import { createProductSchema } from "../schemas/product.schema";
import { actionSuccess, actionError, type ActionResult } from "@/shared/lib/action-result";

export async function createProduct(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult<{ slug: string }>> {
  // 1. Auth guard
  const session = await auth();
  if (!session?.user) {
    return actionError("Unauthorized. Please log in.");
  }

  // 2. Parse & validate
  const raw = Object.fromEntries(formData);
  const parsed = createProductSchema.safeParse(raw);

  if (!parsed.success) {
    return actionError(
      "Validation failed.",
      parsed.error.flatten().fieldErrors
    );
  }

  try {
    // 3. Upload images to Cloudinary
    const imageFiles = formData.getAll("images") as File[];
    const uploadedImages = await Promise.all(
      imageFiles.map((file) => uploadToCloudinary(file, "products"))
    );

    // 4. Create database record
    const product = await db.product.create({
      data: {
        ...parsed.data,
        images: {
          create: uploadedImages.map((img, index) => ({
            url: img.secure_url,
            publicId: img.public_id,
            width: img.width,
            height: img.height,
            sortOrder: index,
          })),
        },
      },
    });

    // 5. Revalidate affected pages
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/admin/products");

    // 6. Return success (caller decides whether to redirect)
    return actionSuccess(
      { slug: product.slug },
      "Product created successfully."
    );
  } catch (error) {
    console.error("[CREATE_PRODUCT]", error);
    return actionError("Failed to create product. Please try again.");
  }
}
```

#### Revalidation Strategy

| Trigger | Revalidation Approach | Paths Affected |
|---|---|---|
| Product created/updated/deleted | `revalidatePath()` | `/products`, `/products/[slug]`, `/`, `/admin/products` |
| Category created/updated/deleted | `revalidatePath()` | `/categories`, `/categories/[slug]`, `/`, `/admin/categories` |
| Collection created/updated/deleted | `revalidatePath()` | `/collections`, `/collections/[slug]`, `/`, `/admin/collections` |
| Inquiry submitted | `revalidatePath()` | `/admin/inquiries` |
| Inquiry status changed | `revalidatePath()` | `/admin/inquiries`, `/admin/inquiries/[id]`, `/admin` (dashboard) |
| Settings changed | `revalidateTag()` | `site-settings` tag on all pages that use settings |

#### File Upload Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                   FILE UPLOAD PIPELINE                          │
│                                                                │
│  ┌──────────────┐     ┌───────────────┐     ┌──────────────┐   │
│  │ Client Form   │────▶│ Server Action  │────▶│ Cloudinary   │   │
│  │               │     │               │     │ Upload API   │   │
│  │ • File input  │     │ • Validate    │     │              │   │
│  │ • Preview     │     │   file type   │     │ • Store orig │   │
│  │ • Drag & drop │     │ • Check size  │     │ • Generate   │   │
│  │ • Multi-file  │     │   (max 10MB)  │     │   public_id  │   │
│  │               │     │ • Convert to  │     │ • Return URL │   │
│  │               │     │   Buffer      │     │ • Return     │   │
│  │               │     │               │     │   dimensions │   │
│  └──────────────┘     └───────────────┘     └──────┬───────┘   │
│                                                     │           │
│                                              ┌──────▼───────┐   │
│                                              │ Prisma DB    │   │
│                                              │              │   │
│                                              │ Save image   │   │
│                                              │ metadata:    │   │
│                                              │ • url        │   │
│                                              │ • publicId   │   │
│                                              │ • width      │   │
│                                              │ • height     │   │
│                                              │ • sortOrder  │   │
│                                              └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Diagrams

### 4.1 Product Browse Flow (Customer)

This is the primary read path — a customer browsing the product catalogue. The entire flow is server-rendered with zero client-side data fetching.

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│ Customer  │     │ Vercel Edge  │     │ Next.js Server   │     │  Neon        │
│ Browser   │     │ Network      │     │ Component        │     │  PostgreSQL  │
└─────┬─────┘     └──────┬───────┘     └────────┬─────────┘     └──────┬───────┘
      │                  │                      │                      │
      │  GET /products   │                      │                      │
      │─────────────────▶│                      │                      │
      │                  │                      │                      │
      │                  │  CDN Cache Miss      │                      │
      │                  │─────────────────────▶│                      │
      │                  │                      │                      │
      │                  │                      │  Prisma Query:       │
      │                  │                      │  db.product.findMany │
      │                  │                      │──────────────────────▶
      │                  │                      │                      │
      │                  │                      │  Product[] + images  │
      │                  │                      │◀──────────────────────
      │                  │                      │                      │
      │                  │                      │  Render React Server │
      │                  │                      │  Components to HTML  │
      │                  │                      │  (with Cloudinary    │
      │                  │                      │   image URLs)        │
      │                  │                      │                      │
      │                  │  Streamed HTML       │                      │
      │                  │◀─────────────────────│                      │
      │                  │                      │                      │
      │                  │  Cache response      │                      │
      │                  │  (ISR: revalidate)   │                      │
      │                  │                      │                      │
      │  HTML + minimal  │                      │                      │
      │  client JS       │                      │                      │
      │◀─────────────────│                      │                      │
      │                  │                      │                      │
      │  Hydrate Client  │                      │                      │
      │  Components only │                      │                      │
      │  (gallery, filters)                     │                      │
      │                  │                      │                      │
```

**Performance characteristics:**
- First paint: ~200–400ms (edge-cached) or ~500–800ms (cache miss)
- JS bundle: Only Client Component code (gallery, filters) — no data-fetching library
- SEO: Full HTML with product data available to crawlers immediately

---

### 4.2 Product Upload Flow (Admin)

This is the primary write path — an admin creating a new product with images.

```
┌───────────┐    ┌──────────────┐    ┌───────────────┐    ┌───────────┐    ┌──────────┐
│   Admin    │    │  Client      │    │ Server Action │    │Cloudinary │    │  Neon    │
│   Browser  │    │  Component   │    │ "use server"  │    │  API      │    │  PG DB   │
└─────┬──────┘    └──────┬───────┘    └───────┬───────┘    └─────┬─────┘    └────┬─────┘
      │                  │                    │                  │               │
      │  Fill form +     │                    │                  │               │
      │  select images   │                    │                  │               │
      │─────────────────▶│                    │                  │               │
      │                  │                    │                  │               │
      │                  │  Client-side       │                  │               │
      │                  │  validation        │                  │               │
      │                  │  (React Hook Form  │                  │               │
      │                  │   + Zod)           │                  │               │
      │                  │                    │                  │               │
      │                  │  Submit FormData   │                  │               │
      │                  │  via Server Action │                  │               │
      │                  │───────────────────▶│                  │               │
      │                  │                    │                  │               │
      │                  │                    │  1. Auth check   │               │
      │                  │                    │     (session)    │               │
      │                  │                    │                  │               │
      │                  │                    │  2. Server-side  │               │
      │                  │                    │     Zod validate │               │
      │                  │                    │                  │               │
      │                  │                    │  3. Upload each  │               │
      │                  │                    │     image file   │               │
      │                  │                    │─────────────────▶│               │
      │                  │                    │                  │               │
      │                  │                    │  Image URLs +    │               │
      │                  │                    │  public_ids      │               │
      │                  │                    │◀─────────────────│               │
      │                  │                    │                  │               │
      │                  │                    │  4. Prisma       │               │
      │                  │                    │     create with  │               │
      │                  │                    │     relations    │               │
      │                  │                    │──────────────────────────────────▶
      │                  │                    │                  │               │
      │                  │                    │  Created product │               │
      │                  │                    │◀──────────────────────────────────
      │                  │                    │                  │               │
      │                  │                    │  5. revalidatePath               │
      │                  │                    │     ("/products")│               │
      │                  │                    │     ("/admin/products")          │
      │                  │                    │     ("/")        │               │
      │                  │                    │                  │               │
      │                  │  ActionResult      │                  │               │
      │                  │  { success: true,  │                  │               │
      │                  │    data: { slug }} │                  │               │
      │                  │◀───────────────────│                  │               │
      │                  │                    │                  │               │
      │  redirect to     │                    │                  │               │
      │  /admin/products │                    │                  │               │
      │◀─────────────────│                    │                  │               │
      │                  │                    │                  │               │
      │  Success toast   │                    │                  │               │
      │◀─────────────────│                    │                  │               │
```

---

### 4.3 Customer Inquiry Flow

This flow handles a customer submitting an inquiry about a product or general contact request. It works without JavaScript (progressive enhancement).

```
┌───────────┐    ┌──────────────────┐    ┌────────────────┐    ┌──────────────┐
│  Customer  │    │  Contact Page    │    │  Server Action  │    │   Neon       │
│  Browser   │    │  (Server + Client│    │  "use server"   │    │   PostgreSQL │
│            │    │   Components)    │    │                 │    │              │
└─────┬──────┘    └────────┬─────────┘    └───────┬─────────┘    └──────┬───────┘
      │                    │                      │                     │
      │  Navigate to       │                      │                     │
      │  /contact          │                      │                     │
      │───────────────────▶│                      │                     │
      │                    │                      │                     │
      │  Render form       │                      │                     │
      │  (SSR HTML)        │                      │                     │
      │◀───────────────────│                      │                     │
      │                    │                      │                     │
      │  Fill form:        │                      │                     │
      │  • Name            │                      │                     │
      │  • Email           │                      │                     │
      │  • Phone           │                      │                     │
      │  • Product (opt.)  │                      │                     │
      │  • Message         │                      │                     │
      │                    │                      │                     │
      │  Submit form       │                      │                     │
      │───────────────────▶│                      │                     │
      │                    │                      │                     │
      │                    │  1. Client-side       │                     │
      │                    │     Zod validation    │                     │
      │                    │     (instant UX)      │                     │
      │                    │                      │                     │
      │                    │  2. formAction()      │                     │
      │                    │─────────────────────▶│                     │
      │                    │                      │                     │
      │                    │                      │  3. Server-side     │
      │                    │                      │     Zod validate    │
      │                    │                      │     (trust no one)  │
      │                    │                      │                     │
      │                    │                      │  4. Prisma create   │
      │                    │                      │     inquiry record  │
      │                    │                      │─────────────────────▶
      │                    │                      │                     │
      │                    │                      │  Inquiry saved      │
      │                    │                      │◀─────────────────────
      │                    │                      │                     │
      │                    │                      │  5. revalidatePath  │
      │                    │                      │     ("/admin/       │
      │                    │                      │      inquiries")    │
      │                    │                      │                     │
      │                    │  ActionResult         │                     │
      │                    │  { success: true }    │                     │
      │                    │◀─────────────────────│                     │
      │                    │                      │                     │
      │  Show success      │                      │                     │
      │  message / reset   │                      │                     │
      │  form              │                      │                     │
      │◀───────────────────│                      │                     │
      │                    │                      │                     │
```

**Progressive Enhancement Note:** If JavaScript is disabled, the `<form action={serverAction}>` still works — the browser submits the form natively, the Server Action processes it, and Next.js re-renders the page with the result.

---

### 4.4 Authentication Flow

Admin authentication uses Auth.js (NextAuth v5) with a Credentials provider, bcrypt password hashing, and JWT-based sessions.

```
┌───────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐
│   Admin    │    │  Login Page  │    │   Auth.js    │    │  bcrypt  │    │  Neon    │
│   Browser  │    │  Client Comp │    │  signIn()    │    │  verify  │    │  PG DB   │
└─────┬──────┘    └──────┬───────┘    └──────┬───────┘    └────┬─────┘    └────┬─────┘
      │                  │                   │                 │               │
      │  GET /admin      │                   │                 │               │
      │  (any protected  │                   │                 │               │
      │   route)         │                   │                 │               │
      │──────────────────┼───────────────────┼─────────────────┼───────────────│
      │                  │                   │                 │               │
      │  Middleware intercepts:              │                 │               │
      │  No session → Redirect to /admin/login                │               │
      │◀──────────────────────────────────────                │               │
      │                  │                   │                 │               │
      │  GET /admin/login│                   │                 │               │
      │─────────────────▶│                   │                 │               │
      │                  │                   │                 │               │
      │  Render login form                   │                 │               │
      │◀─────────────────│                   │                 │               │
      │                  │                   │                 │               │
      │  Enter email +   │                   │                 │               │
      │  password        │                   │                 │               │
      │─────────────────▶│                   │                 │               │
      │                  │                   │                 │               │
      │                  │  signIn(          │                 │               │
      │                  │   "credentials",  │                 │               │
      │                  │   { email, pass })│                 │               │
      │                  │──────────────────▶│                 │               │
      │                  │                   │                 │               │
      │                  │                   │  Find user by   │               │
      │                  │                   │  email          │               │
      │                  │                   │─────────────────────────────────▶
      │                  │                   │                 │               │
      │                  │                   │  User record    │               │
      │                  │                   │  (with hash)    │               │
      │                  │                   │◀─────────────────────────────────
      │                  │                   │                 │               │
      │                  │                   │  bcrypt.compare │               │
      │                  │                   │  (password,     │               │
      │                  │                   │   user.hash)    │               │
      │                  │                   │────────────────▶│               │
      │                  │                   │                 │               │
      │                  │                   │  Match: true    │               │
      │                  │                   │◀────────────────│               │
      │                  │                   │                 │               │
      │                  │                   │  Generate JWT   │               │
      │                  │                   │  session token  │               │
      │                  │                   │  { id, email,   │               │
      │                  │                   │    role, exp }  │               │
      │                  │                   │                 │               │
      │                  │  Set session      │                 │               │
      │                  │  cookie (httpOnly,│                 │               │
      │                  │  secure, sameSite)│                 │               │
      │                  │◀──────────────────│                 │               │
      │                  │                   │                 │               │
      │  Redirect to     │                   │                 │               │
      │  /admin          │                   │                 │               │
      │◀─────────────────│                   │                 │               │
      │                  │                   │                 │               │
      │                  │                   │                 │               │
      │  ═══════════ SUBSEQUENT REQUESTS ══════════════       │               │
      │                  │                   │                 │               │
      │  GET /admin/*    │                   │                 │               │
      │──────────────────┼───────────────────┼─────────────────┼───────────────│
      │                  │                   │                 │               │
      │  Middleware:     │                   │                 │               │
      │  JWT cookie present                  │                 │               │
      │  → Verify token  │                   │                 │               │
      │  → Allow request │                   │                 │               │
      │                  │                   │                 │               │
      │  Render protected page               │                 │               │
      │◀─────────────────│                   │                 │               │
      │                  │                   │                 │               │
```

**Session strategy:** JWT (stateless) — no database sessions table needed. Tokens are stored in `httpOnly`, `secure`, `sameSite=lax` cookies. Token expiry is configurable (default: 24 hours for V1).

---

### 4.5 Image Delivery Flow

Product images are uploaded to Cloudinary and served via its global CDN with automatic format negotiation and responsive transformations.

```
┌───────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐
│  Customer  │    │  Next.js     │    │  Cloudinary   │    │  Cloudinary      │
│  Browser   │    │  <Image />   │    │  Transform    │    │  CDN Edge        │
│            │    │  Component   │    │  Engine       │    │  (Global)        │
└─────┬──────┘    └──────┬───────┘    └───────┬───────┘    └────────┬─────────┘
      │                  │                    │                     │
      │  Page loads with │                    │                     │
      │  product images  │                    │                     │
      │─────────────────▶│                    │                     │
      │                  │                    │                     │
      │                  │  Generate srcSet   │                     │
      │                  │  with Cloudinary   │                     │
      │                  │  URL transforms:   │                     │
      │                  │                    │                     │
      │                  │  /image/upload/    │                     │
      │                  │  f_auto,           │  (auto WebP/AVIF)  │
      │                  │  q_auto,           │  (auto quality)    │
      │                  │  w_400,            │  (responsive width)│
      │                  │  c_fill,           │  (crop mode)       │
      │                  │  ar_1:1/           │  (aspect ratio)    │
      │                  │  products/abc.jpg  │                     │
      │                  │                    │                     │
      │  <img srcset=    │                    │                     │
      │   "...w_400 400w,│                    │                     │
      │    ...w_800 800w,│                    │                     │
      │    ...w_1200     │                    │                     │
      │     1200w"       │                    │                     │
      │◀─────────────────│                    │                     │
      │                  │                    │                     │
      │  Browser selects │                    │                     │
      │  optimal size    │                    │                     │
      │  based on viewport                   │                     │
      │                  │                    │                     │
      │  Request image   │                    │                     │
      │────────────────────────────────────────────────────────────▶│
      │                  │                    │                     │
      │                  │                    │     CDN Cache HIT?  │
      │                  │                    │                     │
      │                  │              ┌─────┴──────┐              │
      │                  │              │  HIT: Serve│              │
      │                  │              │  from edge │              │
      │                  │              │  (< 50ms)  │              │
      │                  │              └─────┬──────┘              │
      │                  │                    │                     │
      │                  │              ┌─────┴──────┐              │
      │                  │              │  MISS:     │              │
      │                  │              │  Transform │              │
      │                  │              │  on-the-fly│              │
      │                  │              │  → cache   │              │
      │                  │              │  → serve   │              │
      │                  │              └─────┬──────┘              │
      │                  │                    │                     │
      │  Optimised image │                    │                     │
      │  (WebP/AVIF,     │                    │                     │
      │   correct size,  │                    │                     │
      │   compressed)    │                    │                     │
      │◀───────────────────────────────────────────────────────────│
      │                  │                    │                     │
```

**Cloudinary URL Transformation Pattern:**

```
https://res.cloudinary.com/<cloud_name>/image/upload/<transformations>/<public_id>.<ext>

Transformations used:
┌─────────────────┬──────────────────────────────────────────────┐
│ Transform       │ Purpose                                      │
├─────────────────┼──────────────────────────────────────────────┤
│ f_auto          │ Auto-negotiate format (WebP, AVIF, JPEG)     │
│ q_auto          │ Auto quality based on content analysis       │
│ w_{width}       │ Responsive width (400, 800, 1200, 1600)      │
│ c_fill          │ Fill mode — crop to exact dimensions          │
│ c_limit         │ Limit mode — scale down, never up             │
│ ar_1:1          │ Square aspect ratio (for grids)               │
│ ar_4:3          │ Landscape aspect ratio (for detail views)     │
│ g_auto          │ Auto gravity — smart crop focusing on subject │
│ e_sharpen:60    │ Subtle sharpening for jewellery detail        │
└─────────────────┴──────────────────────────────────────────────┘
```

---

## 5. Caching Strategy

Nakoda Web employs a multi-layer caching strategy to deliver fast page loads while ensuring content freshness after admin updates.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CACHING LAYERS                                     │
│                                                                            │
│  Layer 1: Browser Cache                                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • Static assets (JS, CSS, fonts): immutable, max-age=31536000      │  │
│  │  • Images via Cloudinary: CDN-controlled, long TTL                  │  │
│  │  • HTML pages: no-cache (always revalidate with server)             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Layer 2: Vercel Edge CDN                                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • ISR pages cached at edge, served until revalidation              │  │
│  │  • Static pages cached indefinitely until next deploy               │  │
│  │  • On-demand revalidation purges specific paths instantly           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Layer 3: Cloudinary CDN                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • Transformed images cached at 40+ global PoPs                     │  │
│  │  • Automatic cache invalidation on image replacement                │  │
│  │  • Format negotiation cached per Accept header variant              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Layer 4: Prisma Query Engine                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  • Connection pooling via Neon's pgbouncer                          │  │
│  │  • Prepared statement caching at the database level                 │  │
│  │  • No application-level query cache in V1 (rely on ISR instead)     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Page-Level Caching Strategy

| Page | Strategy | Revalidation | Rationale |
|---|---|---|---|
| `/` (Homepage) | ISR | `revalidate = 3600` (1hr) + on-demand | Featured products change infrequently; on-demand purge on product update |
| `/products` | ISR | `revalidate = 1800` (30min) + on-demand | Product list changes with CRUD; ISR provides baseline freshness |
| `/products/[slug]` | ISR | `revalidate = 3600` (1hr) + on-demand | Individual products rarely change; on-demand purge on edit |
| `/categories` | ISR | `revalidate = 3600` (1hr) + on-demand | Categories change infrequently |
| `/categories/[slug]` | ISR | `revalidate = 1800` (30min) + on-demand | Products within category may change |
| `/collections` | ISR | `revalidate = 3600` (1hr) + on-demand | Collections change infrequently |
| `/collections/[slug]` | ISR | `revalidate = 1800` (30min) + on-demand | Collection products may change |
| `/about` | Static | Build-time only | Content changes only with deploys |
| `/contact` | Static | Build-time only | Form is client-rendered; page structure is static |
| `/admin/*` | Dynamic | `force-dynamic` | Always fetch fresh data for admin CRUD |

### On-Demand Revalidation via Server Actions

```typescript
// Every mutation Server Action triggers targeted revalidation:

// Product mutation
revalidatePath("/products");           // Product listing
revalidatePath(`/products/${slug}`);   // Specific product page
revalidatePath("/");                   // Homepage (featured products)

// Category mutation
revalidatePath("/categories");
revalidatePath(`/categories/${slug}`);
revalidatePath("/products");           // Products may show category info

// Collection mutation
revalidatePath("/collections");
revalidatePath(`/collections/${slug}`);
revalidatePath("/");                   // Homepage may show collections
```

### Cache Invalidation Flow

```
Admin updates product
        │
        ▼
Server Action executes
        │
        ├── Database updated via Prisma
        │
        ├── revalidatePath("/products")  ──▶  Vercel purges /products from edge cache
        ├── revalidatePath("/products/gold-necklace")  ──▶  Purges specific page
        ├── revalidatePath("/")  ──▶  Purges homepage
        │
        └── Next request to any purged path
            → Server Component re-executes
            → Fresh data from Neon DB
            → New HTML cached at edge
```

---

## 6. Error Handling Architecture

Nakoda Web implements a comprehensive, layered error handling strategy that ensures graceful degradation at every level.

### Error Boundary Hierarchy

```
src/app/
├── error.tsx                    # Global error boundary — catches unhandled errors
├── not-found.tsx                # Global 404 — unmatched routes
├── loading.tsx                  # Global loading skeleton
│
├── (store)/
│   ├── error.tsx                # Store-specific error UI (branded)
│   ├── not-found.tsx            # Store 404 with product suggestions
│   ├── loading.tsx              # Store loading skeleton (shimmer cards)
│   │
│   ├── products/
│   │   ├── error.tsx            # Product listing error (retry button)
│   │   ├── loading.tsx          # Product grid skeleton
│   │   └── [slug]/
│   │       ├── error.tsx        # Product detail error
│   │       ├── not-found.tsx    # "Product not found" page
│   │       └── loading.tsx      # Product detail skeleton
│   │
│   ├── categories/
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── [slug]/
│   │       ├── error.tsx
│   │       ├── not-found.tsx
│   │       └── loading.tsx
│   │
│   └── contact/
│       └── error.tsx            # Contact form error
│
├── (admin)/
│   └── admin/
│       ├── error.tsx            # Admin error boundary (technical details)
│       ├── loading.tsx          # Admin loading state
│       │
│       ├── products/
│       │   ├── error.tsx
│       │   └── loading.tsx
│       │
│       └── inquiries/
│           ├── error.tsx
│           └── loading.tsx
```

### Error Handling Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR HANDLING LAYERS                               │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 1: Input Validation (Preventive)                              │  │
│  │                                                                      │  │
│  │  • Client-side: React Hook Form + Zod (instant feedback)            │  │
│  │  • Server-side: Zod validation in Server Actions (trust no input)   │  │
│  │  • Returns: ActionResult with fieldErrors for form-level display     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 2: Server Action Error Handling (Operational)                  │  │
│  │                                                                      │  │
│  │  • try/catch wrapping all Prisma + Cloudinary operations            │  │
│  │  • Returns: ActionResult<T> with user-friendly error message        │  │
│  │  • Logs: Detailed error to server console (structured logging)      │  │
│  │  • Never: Exposes stack traces or internal details to client         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 3: Route-Level Error Boundaries (error.tsx)                   │  │
│  │                                                                      │  │
│  │  • Catches: Unhandled exceptions in Server Components               │  │
│  │  • Displays: Branded error page with retry button                   │  │
│  │  • Provides: reset() function to re-render the route segment        │  │
│  │  • Logs: Error to monitoring service (future: Sentry)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 4: Not Found Handling (not-found.tsx)                         │  │
│  │                                                                      │  │
│  │  • Triggered by: notFound() calls in Server Components              │  │
│  │  • Displays: Branded 404 page with navigation suggestions           │  │
│  │  • SEO: Returns proper 404 HTTP status code                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 5: Loading States (loading.tsx + Suspense)                    │  │
│  │                                                                      │  │
│  │  • loading.tsx: Automatic loading UI per route segment               │  │
│  │  • <Suspense>: Granular loading boundaries within pages             │  │
│  │  • Skeleton UIs: Shimmer placeholders matching final layout         │  │
│  │  • Streaming: Server Components stream progressively to client      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 6: Global Error Boundary (global-error.tsx)                   │  │
│  │                                                                      │  │
│  │  • Catches: Root layout rendering errors                            │  │
│  │  • Displays: Minimal HTML error page (no layout dependency)         │  │
│  │  • Last resort: Ensures user always sees something meaningful       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error Component Pattern

```typescript
// src/app/(store)/products/error.tsx
"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service (future: Sentry)
    console.error("[PRODUCTS_ERROR]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h2 className="text-2xl font-serif mb-4">Something went wrong</h2>
      <p className="text-muted-foreground mb-6">
        We couldn't load the products. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90"
      >
        Try Again
      </button>
    </div>
  );
}
```

---

## 7. State Management

Nakoda Web follows a **server-first state model** — the vast majority of application state lives on the server and is rendered via Server Components. Client-side state is minimal and purposeful.

### State Management Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT MAP                                │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SERVER STATE (Primary — 80% of application state)                 │    │
│  │                                                                    │    │
│  │  Mechanism: React Server Components + Prisma                      │    │
│  │                                                                    │    │
│  │  • Product catalogue data                                         │    │
│  │  • Category hierarchies                                           │    │
│  │  • Collection groupings                                           │    │
│  │  • Inquiry records                                                │    │
│  │  • Admin dashboard statistics                                     │    │
│  │  • User session data                                              │    │
│  │                                                                    │    │
│  │  How: Server Components fetch directly from DB.                   │    │
│  │       No useState, no useEffect, no SWR, no React Query.         │    │
│  │       Data is rendered to HTML on the server.                     │    │
│  │       Re-fetched on navigation or revalidation.                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  URL STATE (Shareable — 10% of application state)                  │    │
│  │                                                                    │    │
│  │  Mechanism: URL Search Parameters (useSearchParams)               │    │
│  │                                                                    │    │
│  │  • Product filters (category, price range, material, sort)        │    │
│  │  • Search queries (?q=gold+necklace)                              │    │
│  │  • Pagination (?page=2)                                           │    │
│  │  • Active tab in admin views                                      │    │
│  │                                                                    │    │
│  │  How: Client Components read/write URL params.                    │    │
│  │       Server Components read params for data fetching.            │    │
│  │       Enables shareable, bookmarkable, SSR-compatible state.      │    │
│  │       Uses useRouter().push() with shallow updates.               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  FORM STATE (Ephemeral — 5% of application state)                  │    │
│  │                                                                    │    │
│  │  Mechanism: React Hook Form + useActionState                      │    │
│  │                                                                    │    │
│  │  • Form field values (controlled inputs)                          │    │
│  │  • Validation errors (Zod integration)                            │    │
│  │  • Form submission state (pending, success, error)                │    │
│  │  • Dirty/touched field tracking                                   │    │
│  │  • Image upload previews (local blob URLs)                        │    │
│  │                                                                    │    │
│  │  How: React Hook Form manages field state locally.                │    │
│  │       useActionState tracks Server Action response.               │    │
│  │       State is discarded after successful submission.             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  UI STATE (Local — 5% of application state)                        │    │
│  │                                                                    │    │
│  │  Mechanism: useState in Client Components                         │    │
│  │                                                                    │    │
│  │  • Mobile navigation menu (open/closed)                           │    │
│  │  • Modal dialogs (open/closed, which modal)                       │    │
│  │  • Image gallery (current index, zoom level)                      │    │
│  │  • Admin sidebar (collapsed/expanded)                             │    │
│  │  • Toast notifications (queue)                                    │    │
│  │  • Dropdown menus (open/closed)                                   │    │
│  │                                                                    │    │
│  │  How: Local useState in the component that owns the UI.           │    │
│  │       Never lifted beyond the immediate parent.                   │    │
│  │       Never stored in global state or context.                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why No Global State Library?

| Concern | Traditional SPA | Nakoda Web (Server-First) |
|---|---|---|
| Data from API | Redux / Zustand / React Query | Server Components fetch data directly — no client cache needed |
| Data freshness | Polling, stale-while-revalidate | ISR + on-demand revalidation via Server Actions |
| Shared data across pages | Global store | Each page fetches its own data (fast via Prisma + connection pooling) |
| Form state | Global form store | React Hook Form (local to form component) |
| URL-driven state | Redux-router sync | Native URL search params (`useSearchParams`) |
| UI toggles | Context or store | Local `useState` in owning component |

> **Decision:** No Redux, Zustand, Jotai, or React Query in V1. The server-first architecture eliminates the primary use case for these libraries — managing server state on the client.

---

## 8. Middleware Architecture

Next.js middleware runs at the **Vercel Edge** — before any page rendering occurs. Nakoda Web uses middleware exclusively for authentication enforcement.

### Middleware Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                       MIDDLEWARE PIPELINE                            │
│                     (src/middleware.ts)                              │
│                                                                     │
│  Incoming Request                                                   │
│       │                                                             │
│       ▼                                                             │
│  ┌────────────────────────────────────────────┐                     │
│  │  1. Path Matching                          │                     │
│  │                                            │                     │
│  │  matcher: ["/admin/:path*"]                │                     │
│  │                                            │                     │
│  │  Does the request path start with /admin?  │                     │
│  │                                            │                     │
│  │  NO ──▶  PASS THROUGH (no middleware)      │                     │
│  │  YES ──▶ Continue ▼                        │                     │
│  └──────────────────┬─────────────────────────┘                     │
│                     │                                               │
│                     ▼                                               │
│  ┌────────────────────────────────────────────┐                     │
│  │  2. Public Admin Routes Check              │                     │
│  │                                            │                     │
│  │  Is path === "/admin/login"?               │                     │
│  │                                            │                     │
│  │  YES ──▶  Check if already authenticated   │                     │
│  │           ├── YES: Redirect to /admin      │                     │
│  │           └── NO:  PASS THROUGH            │                     │
│  │                                            │                     │
│  │  NO  ──▶  Continue ▼                       │                     │
│  └──────────────────┬─────────────────────────┘                     │
│                     │                                               │
│                     ▼                                               │
│  ┌────────────────────────────────────────────┐                     │
│  │  3. Session Verification                   │                     │
│  │                                            │                     │
│  │  auth() — Auth.js session check            │                     │
│  │                                            │                     │
│  │  • Read JWT from cookie                    │                     │
│  │  • Verify signature                        │                     │
│  │  • Check expiration                        │                     │
│  │                                            │                     │
│  │  Valid session?                             │                     │
│  │                                            │                     │
│  │  YES ──▶  PASS THROUGH                     │                     │
│  │           (attach user info to request)     │                     │
│  │                                            │                     │
│  │  NO  ──▶  REDIRECT to /admin/login         │                     │
│  │           (with callbackUrl param)          │                     │
│  └────────────────────────────────────────────┘                     │
│                                                                     │
└──────────────────────────────────────────────────────────────────────┘
```

### Middleware Implementation

```typescript
// src/middleware.ts

import { auth } from "@/features/auth/config/auth.config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Admin login page — redirect to dashboard if already authenticated
  if (pathname === "/admin/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // All other /admin routes — require authentication
  if (!isLoggedIn) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
```

### Route Protection Matrix

| Route Pattern | Auth Required | Middleware Behaviour |
|---|---|---|
| `/` | No | Middleware skipped (not matched) |
| `/products/*` | No | Middleware skipped |
| `/categories/*` | No | Middleware skipped |
| `/collections/*` | No | Middleware skipped |
| `/contact` | No | Middleware skipped |
| `/about` | No | Middleware skipped |
| `/admin/login` | No (public) | Redirect to `/admin` if already authenticated |
| `/admin` | Yes | Redirect to `/admin/login` if unauthenticated |
| `/admin/products/*` | Yes | Redirect to `/admin/login` if unauthenticated |
| `/admin/categories/*` | Yes | Redirect to `/admin/login` if unauthenticated |
| `/admin/collections/*` | Yes | Redirect to `/admin/login` if unauthenticated |
| `/admin/inquiries/*` | Yes | Redirect to `/admin/login` if unauthenticated |
| `/admin/settings` | Yes | Redirect to `/admin/login` if unauthenticated |

---

## 9. Scalability Considerations

Nakoda Web V1 is designed as a monolithic Next.js application, but the architecture deliberately creates boundaries that support future scaling.

### Current V1 Architecture — Vertical Scaling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        V1: MONOLITH (Current)                              │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Vercel Platform                               │    │
│  │                                                                    │    │
│  │  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │    │
│  │  │  Edge CDN    │  │  Serverless Fns  │  │  Edge Middleware     │   │    │
│  │  │  (Auto)      │  │  (Auto-scale)    │  │  (Global)            │   │    │
│  │  │              │  │                  │  │                      │   │    │
│  │  │  • 0 config  │  │  • 0 to N pods   │  │  • Auth check        │   │    │
│  │  │  • Global    │  │  • Per-request   │  │  • < 1ms overhead    │   │    │
│  │  │  • ISR cache │  │  • Cold start    │  │  • No DB access      │   │    │
│  │  │              │  │    ~50-250ms     │  │                      │   │    │
│  │  └─────────────┘  └──────────────────┘  └──────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Neon PostgreSQL                                  │    │
│  │                                                                    │    │
│  │  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────────┐   │    │
│  │  │  Compute      │  │  Connection     │  │  Storage             │   │    │
│  │  │  (Auto-scale) │  │  Pooling        │  │  (Auto-scale)        │   │    │
│  │  │               │  │  (pgbouncer)    │  │                      │   │    │
│  │  │  • Scale to 0 │  │  • 10K+ conns   │  │  • Separation of    │   │    │
│  │  │  • Scale up   │  │  • Transaction  │  │    compute/storage   │   │    │
│  │  │    on demand   │  │    pooling      │  │  • Auto-scaling      │   │    │
│  │  └──────────────┘  └─────────────────┘  └──────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Cloudinary                                       │    │
│  │                                                                    │    │
│  │  • Unlimited storage (paid plan)                                   │    │
│  │  • Global CDN (40+ PoPs)                                          │    │
│  │  • On-the-fly transformations (auto-scaled)                       │    │
│  │  • No infrastructure management                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scaling Limits & Mitigation

| Component | Current Limit | Mitigation Strategy |
|---|---|---|
| **Vercel Serverless** | 1000 concurrent executions (Pro) | ISR reduces origin hits by 90%+; edge caching absorbs traffic spikes |
| **Neon Database** | Auto-scaling compute; 10K pooled connections | Connection pooling via pgbouncer; read replicas for future scale |
| **Cloudinary** | Based on plan credits | Aggressive CDN caching; optimised transformations reduce compute |
| **Cold Starts** | ~50–250ms per serverless function | Keep functions small; use edge runtime where possible |
| **Build Time** | Scales with page count | Use `generateStaticParams` selectively; defer long-tail pages to ISR |

### Future Scaling Extraction Points

The feature-based architecture creates natural boundaries for future extraction:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FUTURE: POTENTIAL EXTRACTION POINTS                         │
│                                                                            │
│  V1 (Monolith)                    V2+ (If Needed)                          │
│  ─────────────                    ──────────────                            │
│                                                                            │
│  src/features/products/   ──────▶  Product Microservice (API)              │
│  src/features/inquiries/  ──────▶  CRM / Notification Service              │
│  src/features/auth/       ──────▶  Centralised Auth Service (OAuth)        │
│  Cloudinary uploads       ──────▶  Dedicated Media Service                  │
│  Prisma + Neon            ──────▶  Read replicas / Event sourcing           │
│                                                                            │
│  ⚠️  NOTE: These extractions are NOT planned for V1.                       │
│  The feature-based folder structure simply makes them possible              │
│  without a full rewrite if scale demands it in the future.                 │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Performance Budget

| Metric | Target | Measurement |
|---|---|---|
| **Largest Contentful Paint (LCP)** | < 2.5s | Core Web Vitals |
| **First Input Delay (FID)** | < 100ms | Core Web Vitals |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Core Web Vitals |
| **Time to First Byte (TTFB)** | < 200ms (cached), < 800ms (uncached) | Edge CDN + Serverless |
| **JavaScript Bundle (per page)** | < 100 KB (gzipped) | Minimal Client Components |
| **Image Load Time** | < 1s (hero), < 500ms (thumbnails) | Cloudinary CDN + responsive images |

---

## 10. Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY ARCHITECTURE                               │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 1: Transport Security                                        │  │
│  │                                                                     │  │
│  │  ✓ HTTPS enforced on all routes (Vercel default)                   │  │
│  │  ✓ TLS 1.3 with automatic certificate management                  │  │
│  │  ✓ HSTS headers (Strict-Transport-Security)                       │  │
│  │  ✓ Automatic HTTP → HTTPS redirect                                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 2: Edge Security (Middleware)                                 │  │
│  │                                                                     │  │
│  │  ✓ Auth.js middleware for /admin/* route protection                │  │
│  │  ✓ JWT session verification at the edge                            │  │
│  │  ✓ Redirect unauthenticated requests to /admin/login              │  │
│  │  ✓ Session cookies: httpOnly, secure, sameSite=lax                │  │
│  │  ✓ No sensitive data in URL parameters                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 3: Application Security (Server Actions)                      │  │
│  │                                                                     │  │
│  │  ✓ CSRF protection built into Server Actions (origin check)        │  │
│  │  ✓ Server-side Zod validation on ALL mutations (trust no input)    │  │
│  │  ✓ Auth check inside every admin Server Action                     │  │
│  │  ✓ File type + size validation before Cloudinary upload            │  │
│  │  ✓ Parameterised queries via Prisma (SQL injection prevention)     │  │
│  │  ✓ No raw SQL queries                                             │  │
│  │  ✓ Error messages never expose internal details                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 4: Authentication & Authorisation                             │  │
│  │                                                                     │  │
│  │  ✓ bcrypt password hashing (cost factor 12)                        │  │
│  │  ✓ JWT tokens with configurable expiry                             │  │
│  │  ✓ No plaintext passwords stored anywhere                         │  │
│  │  ✓ Session invalidation on logout                                  │  │
│  │  ✓ Role-based access (admin-only in V1; extensible)               │  │
│  │  ✓ Brute-force mitigation via rate limiting (Vercel WAF)          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 5: Data Security                                              │  │
│  │                                                                     │  │
│  │  ✓ Neon PostgreSQL: encryption at rest (AES-256)                   │  │
│  │  ✓ Neon PostgreSQL: encryption in transit (TLS)                    │  │
│  │  ✓ Connection string via environment variable (never in code)      │  │
│  │  ✓ Prisma: parameterised queries prevent SQL injection             │  │
│  │  ✓ Database credentials rotatable via Neon console                 │  │
│  │  ✓ No PII stored beyond inquiry contact details                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 6: Media Security (Cloudinary)                                │  │
│  │                                                                     │  │
│  │  ✓ Signed uploads — server-side signature generation               │  │
│  │  ✓ Upload presets restrict file types (image/jpeg, image/png,      │  │
│  │    image/webp only)                                                │  │
│  │  ✓ Max file size enforced server-side (10 MB)                      │  │
│  │  ✓ Cloudinary API credentials in environment variables             │  │
│  │  ✓ Public IDs generated server-side (no client control)            │  │
│  │  ✓ Delivery URLs use HTTPS                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 7: Environment & Deployment Security                          │  │
│  │                                                                     │  │
│  │  ✓ All secrets in Vercel Environment Variables                     │  │
│  │  ✓ Separate env vars per environment (dev / preview / production)  │  │
│  │  ✓ .env.local never committed to Git (.gitignore)                  │  │
│  │  ✓ NEXT_PUBLIC_ prefix only for truly public values                │  │
│  │  ✓ No secret values exposed to client bundle                      │  │
│  │  ✓ Vercel deployment protection for preview branches               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Environment Variable Isolation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ENVIRONMENT VARIABLES                                  │
│                                                                            │
│  SERVER-ONLY (never exposed to client):                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  DATABASE_URL          = postgresql://...@neon.tech/nakoda_db      │    │
│  │  AUTH_SECRET            = <random-256-bit-secret>                   │    │
│  │  CLOUDINARY_API_KEY     = <api-key>                                │    │
│  │  CLOUDINARY_API_SECRET  = <api-secret>                             │    │
│  │  AUTH_URL               = https://nakodaweb.com                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  PUBLIC (safe to expose to client — prefixed NEXT_PUBLIC_):                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  = <cloud-name>                │    │
│  │  NEXT_PUBLIC_APP_URL                = https://nakodaweb.com       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  ⚠️  Rule: If a variable does NOT start with NEXT_PUBLIC_, it is           │
│     NEVER included in the client JavaScript bundle. This is enforced       │
│     by Next.js at build time.                                              │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Server Action Security Pattern

```typescript
// Every admin Server Action follows this security pattern:

"use server";

import { auth } from "@/features/auth/config/auth.config";
import { actionError } from "@/shared/lib/action-result";

export async function adminMutationAction(formData: FormData) {
  // ┌─────────────────────────────────────────────┐
  // │  STEP 1: Authentication Check               │
  // │  Verify the user has a valid session.        │
  // │  This is REDUNDANT with middleware but        │
  // │  provides defense-in-depth.                  │
  // └─────────────────────────────────────────────┘
  const session = await auth();
  if (!session?.user) {
    return actionError("Unauthorized");
  }

  // ┌─────────────────────────────────────────────┐
  // │  STEP 2: Input Validation                    │
  // │  Parse and validate ALL input with Zod.      │
  // │  Never trust client-side validation alone.   │
  // └─────────────────────────────────────────────┘
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return actionError("Invalid input", parsed.error.flatten().fieldErrors);
  }

  // ┌─────────────────────────────────────────────┐
  // │  STEP 3: Business Logic                      │
  // │  All database operations use Prisma           │
  // │  (parameterised queries — no SQL injection).  │
  // └─────────────────────────────────────────────┘
  try {
    const result = await db.entity.create({ data: parsed.data });
    revalidatePath("/affected-path");
    return actionSuccess(result, "Created successfully");
  } catch (error) {
    // ┌─────────────────────────────────────────────┐
    // │  STEP 4: Error Handling                      │
    // │  Log the full error server-side.             │
    // │  Return a GENERIC message to the client.     │
    // │  Never expose stack traces or DB errors.     │
    // └─────────────────────────────────────────────┘
    console.error("[ACTION_NAME]", error);
    return actionError("An unexpected error occurred");
  }
}
```

### CSRF Protection — Built Into Server Actions

Next.js Server Actions include **automatic CSRF protection**:

```
┌──────────────────────────────────────────────────────────────────┐
│                   CSRF PROTECTION FLOW                          │
│                                                                 │
│  1. Client submits form via Server Action                       │
│                     │                                           │
│                     ▼                                           │
│  2. Next.js automatically validates:                            │
│     ┌────────────────────────────────────────────────────┐      │
│     │  • Origin header matches the application domain    │      │
│     │  • Referer header matches expected origin          │      │
│     │  • Action ID matches a registered Server Action    │      │
│     │  • Request method is POST                          │      │
│     └────────────────────────────────────────────────────┘      │
│                     │                                           │
│                     ▼                                           │
│  3. If validation fails → 403 Forbidden                         │
│     If validation passes → Execute Server Action                │
│                                                                 │
│  ✓ No manual CSRF tokens needed                                │
│  ✓ No additional middleware required                           │
│  ✓ Works with both JS-enabled and no-JS form submissions       │
│                                                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: Technology Decision Records

| Decision | Chosen | Alternatives Considered | Rationale |
|---|---|---|---|
| Framework | Next.js 15 App Router | Remix, Astro, Nuxt | Best RSC support, Vercel-native, largest ecosystem |
| Database | Neon PostgreSQL | Supabase, PlanetScale, Turso | Serverless-native Postgres, branching, Prisma-compatible |
| ORM | Prisma | Drizzle, Kysely, raw SQL | Type safety, migrations, schema-first design, team familiarity |
| Auth | Auth.js (NextAuth v5) | Clerk, Lucia, custom JWT | Open-source, Next.js-native, Credentials provider support |
| Media | Cloudinary | AWS S3 + CloudFront, Uploadthing | Built-in transforms, CDN, Next.js Image loader support |
| Hosting | Vercel | AWS Amplify, Netlify, Railway | Next.js creator, best RSC/ISR support, edge network |
| Styling | Tailwind CSS v4 | CSS Modules, Styled Components, Panda CSS | Performance, utility-first, design system support |
| Validation | Zod | Yup, Valibot, io-ts | TypeScript-first, Server Action integration, small bundle |
| Forms | React Hook Form | Formik, native forms only | Performance, Zod integration, minimal re-renders |
| Animation | Framer Motion | GSAP, CSS animations, Motion One | React-native API, layout animations, gesture support |

---

## Appendix B: Folder Structure Overview

```
nakoda-web/
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Seed script for development
│
├── public/
│   ├── fonts/                    # Custom web fonts
│   ├── images/                   # Static images (logo, icons, og-image)
│   └── favicon.ico
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (store)/              # Public storefront routes
│   │   ├── (admin)/              # Admin portal routes
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Tailwind + global styles
│   │   ├── error.tsx             # Global error boundary
│   │   ├── not-found.tsx         # Global 404
│   │   └── loading.tsx           # Global loading
│   │
│   ├── features/                 # Feature-based modules
│   │   ├── products/
│   │   │   ├── actions/          # Server Actions
│   │   │   ├── components/       # UI components
│   │   │   ├── queries/          # Data fetching functions
│   │   │   ├── schemas/          # Zod validation schemas
│   │   │   └── types/            # TypeScript types
│   │   ├── categories/
│   │   ├── collections/
│   │   ├── inquiries/
│   │   └── auth/
│   │
│   ├── shared/                   # Shared utilities
│   │   ├── components/
│   │   │   ├── ui/               # Base UI components (buttons, inputs, etc.)
│   │   │   └── layout/           # Layout components (navbar, footer, sidebar)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utility libraries
│   │   │   ├── db.ts             # Prisma client singleton
│   │   │   ├── cloudinary.ts     # Cloudinary config + helpers
│   │   │   ├── action-result.ts  # ActionResult type + helpers
│   │   │   ├── utils.ts          # General utilities (cn, formatPrice, etc.)
│   │   │   └── constants.ts      # App-wide constants
│   │   └── types/                # Shared TypeScript types
│   │
│   └── middleware.ts             # Auth middleware
│
├── .env.local                    # Local environment variables (gitignored)
├── .env.example                  # Environment variable template
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
└── docs/                         # Project documentation
    ├── PRD.md                    # Product Requirements Document
    ├── DATABASE_SCHEMA.md        # Database schema documentation
    ├── SYSTEM_ARCHITECTURE.md    # This document
    └── ...
```

---

*This document defines the system architecture for Nakoda Web V1. All architectural decisions prioritise simplicity, performance, and developer experience while maintaining clear boundaries for future scaling. For questions or proposed changes, please open a discussion in the project repository.*
