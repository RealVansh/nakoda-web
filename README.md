# Nakoda Jewellers - Premium E-commerce Platform

A modern, high-performance web application built for a luxury jewellery store. Features a fully custom admin dashboard, heavily optimized static generation (ISR), and a WhatsApp-first inquiry model.

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Backend & Auth:** Supabase
- **Database:** PostgreSQL (via Supabase)
- **Storage:** Supabase Storage (Product Images)
- **Validation:** Zod + React Hook Form
- **Icons:** Lucide React

## Key Features

- **Storefront:** 
  - Dynamic product catalog with advanced filtering (Categories, Collections, Metals, Occasion)
  - Lightning fast page loads via Next.js ISR (`force-dynamic` for strict real-time routes)
  - SEO optimized with dynamic sitemaps and rich metadata
  - WhatsApp integrated contact model
- **Admin Dashboard:**
  - Secure RLS and server-side middleware protection
  - Full CRUD for Products, Categories, and Collections
  - Drag-and-drop image upload manager
  - Smart "New Arrival" badge expiry engine

## Setup Instructions

### 1. Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the required Supabase and site variables.

### 2. Database Setup (Supabase)
1. Create a new Supabase project.
2. Run all SQL migrations located in the `supabase/migrations/` directory in order.
3. Configure your Supabase Storage bucket (`product-images`) to be public.

### 3. Install & Run
```bash
npm install
npm run dev
```

## Security Model
The application uses strict Row Level Security (RLS). All public data is read-only. 
Admin write operations are restricted entirely to the `public.is_admin()` custom PostgreSQL function, which verifies the user's UUID against the `admin_users` table.

## Deployment
This project is highly optimized for deployment on **Vercel**.
Ensure you inject your 4 environment variables into the Vercel project settings prior to your first build to prevent Next.js static generation errors.
