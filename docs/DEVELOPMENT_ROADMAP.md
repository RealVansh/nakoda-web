# Development Roadmap — Nakoda Web

## 1. Overview
Nakoda Web is to be developed in an agile, phased approach. The focus for V1 is entirely on creating a premium digital showcase and a robust admin CMS. E-commerce checkout capabilities are deferred to future versions.
Estimated timeline for V1: **~4 to 5 weeks** (assuming 1-2 full-time developers).

## 2. Phase 0: Foundation (Days 1-3)
**Goal:** Setup tooling, repository, and backend infrastructure.
- Initialize Next.js 15 + Tailwind CSS v4 repository.
- Setup ESLint, Prettier, and TypeScript configuration.
- Provision Neon PostgreSQL database and Cloudinary account.
- Build the initial `schema.prisma` file with Admin, Product, Category, and Inquiry models.
- Set up Auth.js with the credentials provider.
- Implement the `auth.ts` logic and middleware protection.

## 3. Phase 1: Core Architecture & Actions (Days 4-7)
**Goal:** Build out the data layer so the UI has a functional backend.
- Write Zod validation schemas for all entities.
- Implement Server Actions for Products (CRUD).
- Implement Server Actions for Categories & Collections.
- Implement Server Actions for Inquiries.
- Set up the Cloudinary image upload pipeline (`uploadImage` action).
- Thoroughly test all actions manually or via simple scripts.

## 4. Phase 2: The Admin Portal (Days 8-14)
**Goal:** Deliver a fully functional CMS for store owners.
- Build the Admin layout, sidebar, and dashboard overview.
- Build the Auth login screen.
- Build the Product management tables with sorting/pagination.
- Build the Product Create/Edit forms using React Hook Form + Zod.
- **Complex Feature**: Build the drag-and-drop Image Upload manager within the Product form.
- Build the Category and Collection management screens.
- Build the Customer Inquiry viewing system (Mark as Read, Delete).

## 5. Phase 3: The Public Storefront (Days 15-21)
**Goal:** Deliver the high-fidelity, premium user experience.
- Build the shared components: Header, Footer, Breadcrumbs, Product Cards.
- Implement the Homepage: Hero section with Framer Motion, Featured Categories, Latest Collections.
- Implement the Global Product Listing Page: Grid view, Filters (Category/Collection), Pagination, Search.
- Implement the Product Detail Page: Image galleries, descriptive text, WhatsApp "Inquire Now" button, embedded Inquiry form.
- Build static pages: About Us, Store Location & Hours.

## 6. Phase 4: Polish, SEO & Performance (Days 22-25)
**Goal:** Ensure the site is fast, accessible, and ranks well on Google.
- Add comprehensive Metadata generation (`generateMetadata` API) for products and categories.
- Integrate `next-sitemap` to auto-generate `sitemap.xml` and `robots.txt`.
- Add JSON-LD Structured Data (`Product`, `LocalBusiness`).
- Run Lighthouse audits. Optimize image sizes and fonts. Add loading skeletons (`loading.tsx`) and error boundaries (`error.tsx`).

## 7. Phase 5: Launch & Handoff (Days 26-28)
**Goal:** Deploy to production and train the client.
- Deploy to Vercel and connect the custom domain.
- Run production database migrations and seeding.
- Perform end-to-end testing (submit a fake inquiry, upload a real product).
- Document a quick-start guide for the jewelry store owner on how to use the Admin panel.

## 8. Future Roadmap (Post-V1)

### V2: The E-Commerce Transition
- Add a persistent Shopping Cart.
- Integrate a payment gateway (e.g., Stripe, Razorpay).
- Build the Checkout flow.
- Add an Order Management system to the Admin portal.

### V3: Customer Engagement
- Allow customer account creation (OAuth or Email).
- Allow users to favorite items (Wishlist).
- Implement order history tracking for customers.
- Integrate email marketing opt-ins.

### V4: Enterprise Scale
- Inventory tracking (automatically mark items out of stock).
- Multiple admin roles (Owner vs. Data Entry Clerk).
- Advanced analytics dashboard (Most viewed items, conversion rates).
