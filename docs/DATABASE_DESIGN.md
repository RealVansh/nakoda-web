# Database Design — Nakoda Web

> **Version:** 1.0
> **Last Updated:** 2026-06-03
> **Status:** Production-Ready Draft
> **Maintainer:** Nakoda Web Engineering

---

## Table of Contents

1. [Overview](#1-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Complete Prisma Schema](#3-complete-prisma-schema)
4. [Table Specifications](#4-table-specifications)
5. [Relationships](#5-relationships)
6. [Indexes](#6-indexes)
7. [Database Seeding](#7-database-seeding)
8. [Migration Strategy](#8-migration-strategy)
9. [Query Patterns](#9-query-patterns)
10. [Performance Considerations](#10-performance-considerations)
11. [Data Validation](#11-data-validation)

---

## 1. Overview

### Technology Stack

| Component          | Technology                    | Purpose                                    |
| ------------------ | ----------------------------- | ------------------------------------------ |
| **Database**       | Neon PostgreSQL (serverless)  | Primary data store                         |
| **ORM**            | Prisma ORM v6+               | Schema management, type-safe queries       |
| **Hosting**        | Neon (AWS us-east-1)          | Serverless PostgreSQL with auto-scaling    |
| **Connection**     | Neon Pooler (PgBouncer)       | Connection pooling for serverless          |
| **Migrations**     | Prisma Migrate                | Version-controlled schema migrations       |

### Architecture Principles

- **Schema-First Approach** — The Prisma schema (`prisma/schema.prisma`) is the single source of truth for the database structure. All changes flow through schema → migration → deployment.
- **Serverless-Optimized** — Neon PostgreSQL is chosen specifically for its serverless architecture, which aligns with Vercel's edge/serverless deployment model. The database scales to zero during inactivity and auto-scales under load.
- **Dual Connection URLs** — Neon requires two connection strings:
  - `DATABASE_URL` — Pooled connection via PgBouncer (port `5432` on `*.neon.tech`), used by the application at runtime for all queries.
  - `DIRECT_DATABASE_URL` — Direct connection (port `5432` on `*.neon.tech` with `?sslmode=require`), used exclusively by Prisma Migrate for DDL operations (migrations, introspection).
- **Type Safety End-to-End** — Prisma Client generates TypeScript types directly from the schema, ensuring compile-time safety from database to UI layer.
- **Soft Business Logic** — The database enforces referential integrity and basic constraints. Complex business rules (e.g., inquiry validation, slug generation) are handled at the application layer with Zod schemas.

### Environment Variables

```env
# .env.local (development)
DATABASE_URL="postgresql://user:password@ep-xxx-yyy-123456.us-east-1.aws.neon.tech/nakoda_web?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:password@ep-xxx-yyy-123456.us-east-1.aws.neon.tech/nakoda_web?sslmode=require"

# Production (Vercel Environment Variables)
# DATABASE_URL      → Neon pooled connection string
# DIRECT_DATABASE_URL → Neon direct connection string
```

> **Note:** In Neon, pooled connections use the `-pooler` suffix in the hostname (e.g., `ep-cool-rain-123456-pooler.us-east-1.aws.neon.tech`). Direct connections omit the `-pooler` suffix. Always configure both.

---

## 2. Entity Relationship Diagram

### Full ERD (ASCII)

```
┌────────────────────┐
│       Admin        │
├────────────────────┤
│ id         PK      │
│ email      UQ      │
│ password           │
│ name               │
│ role               │
│ createdAt          │
│ updatedAt          │
└────────────────────┘


┌────────────────────┐         ┌──────────────────────────┐         ┌────────────────────┐
│     Category       │         │        Product           │         │   ProductImage     │
├────────────────────┤         ├──────────────────────────┤         ├────────────────────┤
│ id         PK      │◄───┐    │ id             PK        │    ┌───►│ id         PK      │
│ name       UQ      │    │    │ name                     │    │    │ url                │
│ slug       UQ      │    ├────│ categoryId     FK? ──────│────┘    │ publicId           │
│ image              │    │    │ collectionId   FK? ──────│────┐    │ altText            │
│ imagePublicId      │    │    │ slug           UQ        │    │    │ displayOrder       │
│ description        │    │    │ description              │    │    │ productId    FK    │
│ displayOrder       │    │    │ price                    │    │    │ createdAt          │
│ isActive           │    │    │ weight                   │    │    └────────────────────┘
│ createdAt          │    │    │ sku                      │    │       ▲ 1:N (CASCADE)
│ updatedAt          │    │    │ material                 │    │       │
└────────────────────┘    │    │ featured       Bool      │    │       │
                          │    │ isActive       Bool      │────┘───────┘
                          │    │ inStock        Bool      │
┌────────────────────┐    │    │ createdAt                │         ┌────────────────────┐
│    Collection      │    │    │ updatedAt                │         │     Inquiry        │
├────────────────────┤    │    └──────────────────────────┘         ├────────────────────┤
│ id         PK      │◄──┘              │                          │ id         PK      │
│ name       UQ      │                  │ 1:N (SET NULL)           │ customerName       │
│ slug       UQ      │                  ▼                          │ phoneNumber        │
│ description        │         ┌──────────────────┐                │ email              │
│ image              │         │                  │                │ message            │
│ imagePublicId      │         │                  │                │ productId    FK?   │
│ displayOrder       │         └──────────────────┘                │ status             │
│ isActive           │                                             │ isRead       Bool  │
│ createdAt          │                                             │ adminNotes         │
│ updatedAt          │                                             │ createdAt          │
└────────────────────┘                                             │ updatedAt          │
                                                                   └────────────────────┘
                                                                          ▲
                                                                          │
                                                                   Product ──► Inquiry
                                                                     1:N (SET NULL)
```

### Mermaid ERD

```mermaid
erDiagram
    Admin {
        String id PK
        String email UK
        String password
        String name
        AdminRole role
        DateTime createdAt
        DateTime updatedAt
    }

    Category {
        String id PK
        String name UK
        String slug UK
        String image
        String imagePublicId
        String description
        Int displayOrder
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    Collection {
        String id PK
        String name UK
        String slug UK
        String description
        String image
        String imagePublicId
        Int displayOrder
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    Product {
        String id PK
        String name
        String slug UK
        String description
        Decimal price
        String weight
        String sku
        String material
        Boolean featured
        Boolean isActive
        Boolean inStock
        String categoryId FK
        String collectionId FK
        DateTime createdAt
        DateTime updatedAt
    }

    ProductImage {
        String id PK
        String url
        String publicId
        String altText
        Int displayOrder
        String productId FK
        DateTime createdAt
    }

    Inquiry {
        String id PK
        String customerName
        String phoneNumber
        String email
        String message
        String productId FK
        InquiryStatus status
        Boolean isRead
        String adminNotes
        DateTime createdAt
        DateTime updatedAt
    }

    Category ||--o{ Product : "has many"
    Collection ||--o{ Product : "has many"
    Product ||--o{ ProductImage : "has many"
    Product ||--o{ Inquiry : "has many"
```

---

## 3. Complete Prisma Schema

This is the **production-ready** schema file. Copy this directly to `prisma/schema.prisma`.

```prisma
// ─────────────────────────────────────────────────────────
// Nakoda Web — Prisma Schema
// Database: Neon PostgreSQL (Serverless)
// ─────────────────────────────────────────────────────────

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

// ─────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────

enum AdminRole {
  SUPER_ADMIN
  ADMIN
}

enum InquiryStatus {
  NEW
  IN_PROGRESS
  RESPONDED
  CLOSED
}

// ─────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────

/// Admin users who manage the platform via the admin portal.
/// Authentication is handled via Auth.js with credentials provider.
model Admin {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String    // bcrypt-hashed, never stored in plain text
  name      String
  role      AdminRole @default(ADMIN)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("admins")
}

// ─────────────────────────────────────────────────────────
// CATEGORY
// ─────────────────────────────────────────────────────────

/// Product categories represent the type of jewellery.
/// Examples: Rings, Necklaces, Earrings, Bracelets, Bangles, Pendants.
model Category {
  id            String    @id @default(cuid())
  name          String    @unique
  slug          String    @unique
  image         String?   // Cloudinary URL
  imagePublicId String?   // Cloudinary public ID for deletion
  description   String?   @db.Text
  displayOrder  Int       @default(0)
  isActive      Boolean   @default(true)
  products      Product[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([isActive])
  @@index([displayOrder])
  @@map("categories")
}

// ─────────────────────────────────────────────────────────
// COLLECTION
// ─────────────────────────────────────────────────────────

/// Collections are curated groups of products for marketing/thematic purposes.
/// Examples: Bridal Collection, Festive Season, Daily Wear, Statement Pieces.
model Collection {
  id            String    @id @default(cuid())
  name          String    @unique
  slug          String    @unique
  description   String?   @db.Text
  image         String?   // Cloudinary URL
  imagePublicId String?   // Cloudinary public ID for deletion
  displayOrder  Int       @default(0)
  isActive      Boolean   @default(true)
  products      Product[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([isActive])
  @@index([displayOrder])
  @@map("collections")
}

// ─────────────────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────────────────

/// Core product entity representing a piece of jewellery.
/// Products are showcased on the storefront. Customers cannot purchase
/// directly — they submit inquiries instead (V1 is not e-commerce).
model Product {
  id           String         @id @default(cuid())
  name         String
  slug         String         @unique
  description  String?        @db.Text
  price        Decimal?       @db.Decimal(10, 2)
  weight       String?        // e.g., "12.5g", free-form for flexibility
  sku          String?        @unique
  material     String?        // e.g., "22K Gold", "925 Sterling Silver"
  featured     Boolean        @default(false)
  isActive     Boolean        @default(true)
  inStock      Boolean        @default(true)
  categoryId   String?
  collectionId String?
  category     Category?      @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  collection   Collection?    @relation(fields: [collectionId], references: [id], onDelete: SetNull)
  images       ProductImage[]
  inquiries    Inquiry[]
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@index([categoryId])
  @@index([collectionId])
  @@index([featured])
  @@index([isActive])
  @@index([inStock])
  @@index([slug])
  @@index([createdAt])
  @@map("products")
}

// ─────────────────────────────────────────────────────────
// PRODUCT IMAGE
// ─────────────────────────────────────────────────────────

/// Images associated with a product, stored in Cloudinary.
/// Each product can have multiple images with a defined display order.
/// The first image (displayOrder=0) is considered the primary/hero image.
model ProductImage {
  id           String   @id @default(cuid())
  url          String   // Cloudinary delivery URL
  publicId     String   // Cloudinary public ID (used for transformations & deletion)
  altText      String?  // Accessibility text; auto-generated from product name if empty
  displayOrder Int      @default(0)
  productId    String
  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())

  @@index([productId])
  @@index([productId, displayOrder])
  @@map("product_images")
}

// ─────────────────────────────────────────────────────────
// INQUIRY
// ─────────────────────────────────────────────────────────

/// Customer inquiries submitted via the storefront.
/// An inquiry may or may not be linked to a specific product.
/// General inquiries (e.g., "Do you do custom work?") have no productId.
model Inquiry {
  id           String        @id @default(cuid())
  customerName String
  phoneNumber  String
  email        String?
  message      String        @db.Text
  productId    String?
  product      Product?      @relation(fields: [productId], references: [id], onDelete: SetNull)
  status       InquiryStatus @default(NEW)
  isRead       Boolean       @default(false)
  adminNotes   String?       @db.Text // Internal notes, never shown to customers
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([isRead])
  @@index([status])
  @@index([productId])
  @@index([createdAt])
  @@map("inquiries")
}
```

---

## 4. Table Specifications

### 4.1 Admin

| Field       | Type       | Constraints               | Description                                       | Example Value                          |
| ----------- | ---------- | ------------------------- | ------------------------------------------------- | -------------------------------------- |
| `id`        | `String`   | PK, CUID                  | Unique identifier for the admin                   | `clxyz1234abcd5678efgh`                |
| `email`     | `String`   | Unique, Not Null          | Admin login email address                         | `admin@nakodajewellers.com`            |
| `password`  | `String`   | Not Null                  | Bcrypt-hashed password (cost factor 12)           | `$2b$12$LJ3m4...` (60 chars)          |
| `name`      | `String`   | Not Null                  | Display name for the admin panel                  | `Rajesh Nakoda`                        |
| `role`      | `AdminRole`| Not Null, Default: `ADMIN`| Role-based access level                           | `SUPER_ADMIN`                          |
| `createdAt` | `DateTime` | Not Null, Default: `now()`| Timestamp of account creation                     | `2026-06-03T12:00:00.000Z`            |
| `updatedAt` | `DateTime` | Not Null, Auto-updated    | Timestamp of last modification                    | `2026-06-03T14:30:00.000Z`            |

**PostgreSQL Table Name:** `admins`
**Row Estimate:** 1–5 (very low cardinality)

### 4.2 Category

| Field            | Type       | Constraints               | Description                                         | Example Value                              |
| ---------------- | ---------- | ------------------------- | --------------------------------------------------- | ------------------------------------------ |
| `id`             | `String`   | PK, CUID                  | Unique identifier                                   | `clxyz1234abcd5678efgh`                    |
| `name`           | `String`   | Unique, Not Null          | Display name of the category                        | `Necklaces`                                |
| `slug`           | `String`   | Unique, Not Null          | URL-safe slug (auto-generated from name)            | `necklaces`                                |
| `image`          | `String?`  | Nullable                  | Cloudinary URL for category hero image              | `https://res.cloudinary.com/xxx/image/...` |
| `imagePublicId`  | `String?`  | Nullable                  | Cloudinary public ID for image management           | `nakoda/categories/necklaces`              |
| `description`    | `Text?`    | Nullable                  | SEO-friendly category description                   | `Explore our exquisite collection of...`   |
| `displayOrder`   | `Int`      | Not Null, Default: `0`    | Sort order for UI rendering (ascending)             | `2`                                        |
| `isActive`       | `Boolean`  | Not Null, Default: `true` | Soft-delete / visibility toggle                     | `true`                                     |
| `createdAt`      | `DateTime` | Not Null, Default: `now()`| Timestamp of creation                               | `2026-06-03T12:00:00.000Z`                |
| `updatedAt`      | `DateTime` | Not Null, Auto-updated    | Timestamp of last modification                      | `2026-06-03T14:30:00.000Z`                |

**PostgreSQL Table Name:** `categories`
**Row Estimate:** 6–20 (low cardinality)

### 4.3 Collection

| Field            | Type       | Constraints               | Description                                          | Example Value                              |
| ---------------- | ---------- | ------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| `id`             | `String`   | PK, CUID                  | Unique identifier                                    | `clxyz1234abcd5678efgh`                    |
| `name`           | `String`   | Unique, Not Null          | Display name of the collection                       | `Bridal Collection`                        |
| `slug`           | `String`   | Unique, Not Null          | URL-safe slug                                        | `bridal-collection`                        |
| `description`    | `Text?`    | Nullable                  | Marketing copy for the collection                    | `Timeless pieces for your special day...`  |
| `image`          | `String?`  | Nullable                  | Cloudinary URL for collection banner                 | `https://res.cloudinary.com/xxx/image/...` |
| `imagePublicId`  | `String?`  | Nullable                  | Cloudinary public ID for image management            | `nakoda/collections/bridal`                |
| `displayOrder`   | `Int`      | Not Null, Default: `0`    | Sort order for UI rendering (ascending)              | `1`                                        |
| `isActive`       | `Boolean`  | Not Null, Default: `true` | Soft-delete / visibility toggle                      | `true`                                     |
| `createdAt`      | `DateTime` | Not Null, Default: `now()`| Timestamp of creation                                | `2026-06-03T12:00:00.000Z`                |
| `updatedAt`      | `DateTime` | Not Null, Auto-updated    | Timestamp of last modification                       | `2026-06-03T14:30:00.000Z`                |

**PostgreSQL Table Name:** `collections`
**Row Estimate:** 4–15 (low cardinality)

### 4.4 Product

| Field          | Type       | Constraints                      | Description                                        | Example Value                            |
| -------------- | ---------- | -------------------------------- | -------------------------------------------------- | ---------------------------------------- |
| `id`           | `String`   | PK, CUID                        | Unique identifier                                  | `clxyz1234abcd5678efgh`                  |
| `name`         | `String`   | Not Null                         | Display name of the product                        | `Kundan Bridal Necklace Set`             |
| `slug`         | `String`   | Unique, Not Null                 | URL-safe slug for product page routing             | `kundan-bridal-necklace-set`             |
| `description`  | `Text?`    | Nullable                         | Rich product description (supports line breaks)    | `A stunning 22K gold necklace set...`    |
| `price`        | `Decimal?` | Nullable, Precision: 10, Scale: 2| Price in INR; nullable for "Price on Request"      | `125000.00`                              |
| `weight`       | `String?`  | Nullable                         | Weight with unit (free-form for flexibility)       | `45.2g`                                  |
| `sku`          | `String?`  | Unique, Nullable                 | Stock Keeping Unit for internal tracking           | `NK-BRD-001`                             |
| `material`     | `String?`  | Nullable                         | Primary material description                       | `22K Gold with Kundan`                   |
| `featured`     | `Boolean`  | Not Null, Default: `false`       | Show on homepage featured section                  | `true`                                   |
| `isActive`     | `Boolean`  | Not Null, Default: `true`        | Soft-delete / visibility toggle for storefront     | `true`                                   |
| `inStock`      | `Boolean`  | Not Null, Default: `true`        | Stock availability indicator                       | `true`                                   |
| `categoryId`   | `String?`  | FK → categories.id, Nullable    | Reference to the parent category                   | `clxyz_cat_rings_001`                    |
| `collectionId` | `String?`  | FK → collections.id, Nullable   | Reference to the parent collection                 | `clxyz_col_bridal_001`                   |
| `createdAt`    | `DateTime` | Not Null, Default: `now()`       | Timestamp of creation                              | `2026-06-03T12:00:00.000Z`              |
| `updatedAt`    | `DateTime` | Not Null, Auto-updated           | Timestamp of last modification                     | `2026-06-03T14:30:00.000Z`              |

**PostgreSQL Table Name:** `products`
**Row Estimate:** 50–5,000 (medium cardinality, primary table)

**Design Decisions:**
- `price` is nullable because many jewellery stores use "Price on Request" for high-value items. The UI shows a "Contact for Price" badge when `price` is `null`.
- `weight` is a `String` (not `Decimal`) to support unit formatting like `"45.2g"` or `"3.5 tola"` — common in the Indian jewellery market.
- `sku` is optional and unique — small jewellery stores may not use SKU systems initially.
- `material` is free-form text to accommodate mixed materials like `"22K Gold with Polki and Meenakari"`.
- `categoryId` and `collectionId` are both nullable to allow uncategorized/uncollected products during data entry.

### 4.5 ProductImage

| Field          | Type       | Constraints                   | Description                                           | Example Value                              |
| -------------- | ---------- | ----------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| `id`           | `String`   | PK, CUID                     | Unique identifier                                     | `clxyz1234abcd5678efgh`                    |
| `url`          | `String`   | Not Null                      | Full Cloudinary delivery URL                          | `https://res.cloudinary.com/xxx/image/...` |
| `publicId`     | `String`   | Not Null                      | Cloudinary public ID for API operations               | `nakoda/products/necklace-set-01`          |
| `altText`      | `String?`  | Nullable                      | Accessibility alt text; falls back to product name    | `Kundan Bridal Necklace Set - Front View`  |
| `displayOrder` | `Int`      | Not Null, Default: `0`        | Sort order; `0` = primary/hero image                  | `0`                                        |
| `productId`    | `String`   | FK → products.id, Not Null   | Owning product reference                              | `clxyz_prod_001`                           |
| `createdAt`    | `DateTime` | Not Null, Default: `now()`    | Timestamp of upload                                   | `2026-06-03T12:00:00.000Z`                |

**PostgreSQL Table Name:** `product_images`
**Row Estimate:** 200–25,000 (high cardinality, 3–5 images per product average)

**Design Decisions:**
- `onDelete: Cascade` — When a product is deleted, all its images are automatically removed from the database. The application layer must also trigger Cloudinary deletion using the stored `publicId`.
- `displayOrder` with a compound index on `[productId, displayOrder]` ensures efficient retrieval of ordered images for a specific product.
- No `updatedAt` — images are immutable once uploaded; they are either created or deleted, never modified.

### 4.6 Inquiry

| Field          | Type            | Constraints                     | Description                                          | Example Value                           |
| -------------- | --------------- | ------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| `id`           | `String`        | PK, CUID                       | Unique identifier                                    | `clxyz1234abcd5678efgh`                 |
| `customerName` | `String`        | Not Null                        | Full name of the inquiring customer                  | `Priya Sharma`                          |
| `phoneNumber`  | `String`        | Not Null                        | Contact phone number (stored as string for intl.)    | `+91 98765 43210`                       |
| `email`        | `String?`       | Nullable                        | Optional email for follow-up                         | `priya@example.com`                     |
| `message`      | `Text`          | Not Null                        | Customer's inquiry message                           | `I'm interested in this necklace...`    |
| `productId`    | `String?`       | FK → products.id, Nullable     | Associated product (null for general inquiries)      | `clxyz_prod_001`                        |
| `status`       | `InquiryStatus` | Not Null, Default: `NEW`       | Workflow status for admin tracking                   | `IN_PROGRESS`                           |
| `isRead`       | `Boolean`       | Not Null, Default: `false`     | Quick indicator for unread badge in admin panel      | `false`                                 |
| `adminNotes`   | `Text?`         | Nullable                        | Internal notes added by admin (never shown to user)  | `Called back, interested in custom...`  |
| `createdAt`    | `DateTime`      | Not Null, Default: `now()`      | Timestamp of submission                              | `2026-06-03T12:00:00.000Z`             |
| `updatedAt`    | `DateTime`      | Not Null, Auto-updated          | Timestamp of last admin interaction                  | `2026-06-03T14:30:00.000Z`             |

**PostgreSQL Table Name:** `inquiries`
**Row Estimate:** 10–10,000+ (grows over time)

**Design Decisions:**
- `phoneNumber` is stored as `String`, not an integer type. Phone numbers can have leading zeros, country codes, spaces, and other formatting that would be lost with numeric types.
- `email` is optional because in India, many customers prefer phone-based communication over email.
- `onDelete: SetNull` on `productId` — if a product is deleted, the inquiry record survives with `productId` set to `null`, preserving the customer contact information.
- `status` enum provides a lightweight CRM workflow (`NEW → IN_PROGRESS → RESPONDED → CLOSED`).
- Both `isRead` and `status` exist because they serve different purposes: `isRead` is a binary flag for the notification badge, while `status` tracks the full lifecycle.

---

## 5. Relationships

### 5.1 Category → Products (One-to-Many)

```
Category (1) ──────► (N) Product
             categoryId FK
```

| Property         | Value                                             |
| ---------------- | ------------------------------------------------- |
| **Cardinality**  | One Category has zero or more Products            |
| **FK Field**     | `Product.categoryId`                              |
| **FK Constraint**| Nullable                                          |
| **On Delete**    | `SetNull` — Products become uncategorized         |
| **On Update**    | Cascade (Prisma default)                          |
| **Rationale**    | Deleting a category should not destroy products. Products can be reassigned to another category via the admin panel. |

### 5.2 Collection → Products (One-to-Many)

```
Collection (1) ──────► (N) Product
               collectionId FK
```

| Property         | Value                                             |
| ---------------- | ------------------------------------------------- |
| **Cardinality**  | One Collection has zero or more Products          |
| **FK Field**     | `Product.collectionId`                            |
| **FK Constraint**| Nullable                                          |
| **On Delete**    | `SetNull` — Products lose their collection tag    |
| **On Update**    | Cascade (Prisma default)                          |
| **Rationale**    | Collections are marketing-driven and may be seasonal. When a collection is retired, products remain in the catalog. |

### 5.3 Product → ProductImages (One-to-Many, Cascade)

```
Product (1) ──────► (N) ProductImage
            productId FK (CASCADE DELETE)
```

| Property         | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| **Cardinality**  | One Product has zero or more ProductImages              |
| **FK Field**     | `ProductImage.productId`                                |
| **FK Constraint**| Not Null (every image must belong to a product)         |
| **On Delete**    | `Cascade` — Deleting a product deletes all its images   |
| **On Update**    | Cascade (Prisma default)                                |
| **Rationale**    | Images have no meaning without their parent product. Cascade delete ensures no orphaned image records. **Important:** The application must also call the Cloudinary API to delete the actual image assets before or after the DB deletion. |

**Application-Layer Cleanup:**
```typescript
// Before deleting a product, clean up Cloudinary assets
const images = await prisma.productImage.findMany({
  where: { productId },
  select: { publicId: true },
});

await Promise.all(
  images.map((img) => cloudinary.uploader.destroy(img.publicId))
);

// Now safe to delete the product (images cascade in DB)
await prisma.product.delete({ where: { id: productId } });
```

### 5.4 Product → Inquiries (One-to-Many, SetNull)

```
Product (1) ──────► (N) Inquiry
            productId FK (SET NULL ON DELETE)
```

| Property         | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| **Cardinality**  | One Product has zero or more Inquiries                        |
| **FK Field**     | `Inquiry.productId`                                           |
| **FK Constraint**| Nullable                                                      |
| **On Delete**    | `SetNull` — Inquiry survives with `productId = null`          |
| **On Update**    | Cascade (Prisma default)                                      |
| **Rationale**    | Customer inquiries are business-critical contact records. Even if the product that prompted the inquiry is deleted, the customer's contact info and message must be preserved. Inquiries with `productId = null` are displayed as "General Inquiry" in the admin panel. |

### 5.5 Relationship Summary Matrix

| Parent       | Child         | Cardinality | On Delete  | FK Nullable | Notes                        |
| ------------ | ------------- | ----------- | ---------- | ----------- | ---------------------------- |
| Category     | Product       | 1:N         | `SetNull`  | Yes         | Products become uncategorized|
| Collection   | Product       | 1:N         | `SetNull`  | Yes         | Products lose collection tag |
| Product      | ProductImage  | 1:N         | `Cascade`  | No          | Images deleted with product  |
| Product      | Inquiry       | 1:N         | `SetNull`  | Yes         | Inquiries preserved          |

---

## 6. Indexes

### 6.1 Index Catalog

| Table            | Index Columns                   | Type          | Justification                                                                                    |
| ---------------- | ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `admins`         | `email`                         | Unique        | Login lookup by email — must be fast and enforced unique                                         |
| `categories`     | `name`                          | Unique        | Prevent duplicate category names                                                                 |
| `categories`     | `slug`                          | Unique        | URL routing: `/categories/[slug]` — direct lookup                                               |
| `categories`     | `isActive`                      | B-tree        | Filter active categories for storefront display                                                  |
| `categories`     | `displayOrder`                  | B-tree        | Sort categories by admin-defined order                                                           |
| `collections`    | `name`                          | Unique        | Prevent duplicate collection names                                                               |
| `collections`    | `slug`                          | Unique        | URL routing: `/collections/[slug]` — direct lookup                                              |
| `collections`    | `isActive`                      | B-tree        | Filter active collections for storefront display                                                 |
| `collections`    | `displayOrder`                  | B-tree        | Sort collections by admin-defined order                                                          |
| `products`       | `slug`                          | Unique + Idx  | URL routing: `/products/[slug]` — most critical lookup path                                     |
| `products`       | `sku`                           | Unique        | Internal product identification, admin search                                                    |
| `products`       | `categoryId`                    | B-tree        | Filter products by category (category detail page)                                               |
| `products`       | `collectionId`                  | B-tree        | Filter products by collection (collection detail page)                                           |
| `products`       | `featured`                      | B-tree        | Homepage featured products query: `WHERE featured = true`                                        |
| `products`       | `isActive`                      | B-tree        | Storefront visibility filter: `WHERE isActive = true`                                            |
| `products`       | `inStock`                       | B-tree        | Stock filter: `WHERE inStock = true`                                                             |
| `products`       | `createdAt`                     | B-tree        | Sort by newest products, "New Arrivals" section                                                  |
| `product_images` | `productId`                     | B-tree        | Join/lookup images for a product                                                                 |
| `product_images` | `productId, displayOrder`       | Compound      | Ordered image retrieval for product galleries                                                    |
| `inquiries`      | `isRead`                        | B-tree        | Admin panel: unread inquiry count badge                                                          |
| `inquiries`      | `status`                        | B-tree        | Admin panel: filter inquiries by workflow status                                                 |
| `inquiries`      | `productId`                     | B-tree        | View all inquiries for a specific product                                                        |
| `inquiries`      | `createdAt`                     | B-tree        | Sort inquiries by submission date (most recent first)                                            |

### 6.2 Index Design Rationale

**Why so many indexes on `products`?**
Products are the core entity. The storefront has multiple entry points — homepage (featured), category pages (categoryId), collection pages (collectionId), product detail (slug), and listing pages (pagination by createdAt). Each access pattern benefits from a targeted index. The write volume on products is very low (admin-only CRUD), so the write overhead of maintaining multiple indexes is negligible.

**Why `isActive` indexes on Category/Collection/Product?**
The storefront always filters by `isActive = true`. Without an index, PostgreSQL would perform a full table scan on every public page load. With an index, the query planner can quickly skip inactive records.

**Why a compound index on `[productId, displayOrder]` for ProductImage?**
The most common image query is: *"Get all images for product X, ordered by displayOrder."* A compound index on `(productId, displayOrder)` satisfies this query entirely from the index (covering index for the ORDER BY clause), eliminating a sort operation.

---

## 7. Database Seeding

### Seed Script: `prisma/seed.ts`

```typescript
import { PrismaClient, AdminRole, InquiryStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ─────────────────────────────────────────────────────
  // 1. ADMIN USERS
  // ─────────────────────────────────────────────────────
  console.log("👤 Creating admin users...");

  const adminPassword = await hash("NakodaAdmin@2026", 12);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@nakodajewellers.com" },
    update: {},
    create: {
      email: "admin@nakodajewellers.com",
      password: adminPassword,
      name: "Nakoda Admin",
      role: AdminRole.SUPER_ADMIN,
    },
  });

  console.log(`  ✓ Admin created: ${admin.email} (${admin.role})`);

  // ─────────────────────────────────────────────────────
  // 2. CATEGORIES
  // ─────────────────────────────────────────────────────
  console.log("\n📂 Creating categories...");

  const categoriesData = [
    {
      name: "Rings",
      slug: "rings",
      description:
        "Discover our stunning collection of rings, from elegant solitaires to intricate cocktail rings crafted in gold, diamond, and precious gemstones.",
      displayOrder: 1,
    },
    {
      name: "Necklaces",
      slug: "necklaces",
      description:
        "Explore exquisite necklaces ranging from delicate chains to grand bridal sets, crafted with precision and timeless elegance.",
      displayOrder: 2,
    },
    {
      name: "Earrings",
      slug: "earrings",
      description:
        "From subtle studs to dramatic chandeliers, find earrings that complement every occasion and outfit.",
      displayOrder: 3,
    },
    {
      name: "Bracelets",
      slug: "bracelets",
      description:
        "Adorn your wrists with our curated selection of bracelets, featuring tennis bracelets, charm bracelets, and cuff designs.",
      displayOrder: 4,
    },
    {
      name: "Bangles",
      slug: "bangles",
      description:
        "Traditional and contemporary bangles in gold, diamond, and kundan, perfect for stacking or wearing solo.",
      displayOrder: 5,
    },
    {
      name: "Pendants",
      slug: "pendants",
      description:
        "Elegant pendants that add a touch of sophistication to any ensemble, available in various designs and gemstones.",
      displayOrder: 6,
    },
  ];

  const categories: Record<string, { id: string }> = {};

  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = category;
    console.log(`  ✓ Category: ${category.name}`);
  }

  // ─────────────────────────────────────────────────────
  // 3. COLLECTIONS
  // ─────────────────────────────────────────────────────
  console.log("\n🎨 Creating collections...");

  const collectionsData = [
    {
      name: "Bridal Collection",
      slug: "bridal-collection",
      description:
        "Timeless pieces crafted for the most special day of your life. Our bridal collection features grand necklace sets, maang tikkas, and complete bridal ensembles in 22K gold and kundan.",
      displayOrder: 1,
    },
    {
      name: "Festive Collection",
      slug: "festive-collection",
      description:
        "Celebrate every festival with sparkle and tradition. From Diwali to Navratri, find pieces that honour heritage while embracing modern design.",
      displayOrder: 2,
    },
    {
      name: "Daily Wear",
      slug: "daily-wear",
      description:
        "Lightweight, elegant jewellery designed for everyday wear. Subtle designs that transition seamlessly from office to evening.",
      displayOrder: 3,
    },
    {
      name: "Statement Pieces",
      slug: "statement-pieces",
      description:
        "Bold, eye-catching designs for those who dare to stand out. Heritage-inspired and contemporary statement jewellery for special occasions.",
      displayOrder: 4,
    },
  ];

  const collections: Record<string, { id: string }> = {};

  for (const col of collectionsData) {
    const collection = await prisma.collection.upsert({
      where: { slug: col.slug },
      update: {},
      create: col,
    });
    collections[col.slug] = collection;
    console.log(`  ✓ Collection: ${collection.name}`);
  }

  // ─────────────────────────────────────────────────────
  // 4. PRODUCTS WITH IMAGES
  // ─────────────────────────────────────────────────────
  console.log("\n💎 Creating products...");

  const productsData = [
    {
      name: "Kundan Bridal Necklace Set",
      slug: "kundan-bridal-necklace-set",
      description:
        "A magnificent 22K gold bridal necklace set featuring intricate kundan work with ruby and emerald accents. This heirloom-quality piece includes a statement necklace and matching earrings, perfect for the modern bride who honors tradition.",
      price: 285000.0,
      weight: "68.5g",
      sku: "NK-BRD-001",
      material: "22K Gold with Kundan, Ruby, Emerald",
      featured: true,
      categorySlug: "necklaces",
      collectionSlug: "bridal-collection",
      images: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/kundan-necklace-1.jpg",
          publicId: "nakoda/products/kundan-necklace-1",
          altText: "Kundan Bridal Necklace Set - Front View",
          displayOrder: 0,
        },
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/kundan-necklace-2.jpg",
          publicId: "nakoda/products/kundan-necklace-2",
          altText: "Kundan Bridal Necklace Set - Detail View",
          displayOrder: 1,
        },
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/kundan-necklace-3.jpg",
          publicId: "nakoda/products/kundan-necklace-3",
          altText: "Kundan Bridal Necklace Set - With Earrings",
          displayOrder: 2,
        },
      ],
    },
    {
      name: "Diamond Solitaire Ring",
      slug: "diamond-solitaire-ring",
      description:
        "A classic solitaire engagement ring featuring a brilliant-cut diamond set in 18K white gold. The timeless four-prong setting maximises light reflection for unmatched brilliance.",
      price: 175000.0,
      weight: "4.2g",
      sku: "RG-SOL-001",
      material: "18K White Gold, Diamond (0.75ct)",
      featured: true,
      categorySlug: "rings",
      collectionSlug: "statement-pieces",
      images: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/solitaire-ring-1.jpg",
          publicId: "nakoda/products/solitaire-ring-1",
          altText: "Diamond Solitaire Ring - Top View",
          displayOrder: 0,
        },
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/solitaire-ring-2.jpg",
          publicId: "nakoda/products/solitaire-ring-2",
          altText: "Diamond Solitaire Ring - Side Profile",
          displayOrder: 1,
        },
      ],
    },
    {
      name: "Gold Temple Earrings",
      slug: "gold-temple-earrings",
      description:
        "Handcrafted temple jewellery earrings in 22K gold featuring traditional Lakshmi motifs with intricate granulation work. These jhumka-style earrings are lightweight despite their grand appearance.",
      price: 62000.0,
      weight: "18.3g",
      sku: "ER-TMP-001",
      material: "22K Gold",
      featured: true,
      categorySlug: "earrings",
      collectionSlug: "festive-collection",
      images: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/temple-earrings-1.jpg",
          publicId: "nakoda/products/temple-earrings-1",
          altText: "Gold Temple Earrings - Front View",
          displayOrder: 0,
        },
      ],
    },
    {
      name: "Rose Gold Chain Bracelet",
      slug: "rose-gold-chain-bracelet",
      description:
        "A delicate rose gold chain bracelet with a minimalist design, perfect for daily wear. Features an adjustable clasp for a comfortable fit.",
      price: 18500.0,
      weight: "6.8g",
      sku: "BR-DLY-001",
      material: "18K Rose Gold",
      featured: false,
      categorySlug: "bracelets",
      collectionSlug: "daily-wear",
      images: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/rose-gold-bracelet-1.jpg",
          publicId: "nakoda/products/rose-gold-bracelet-1",
          altText: "Rose Gold Chain Bracelet - Worn View",
          displayOrder: 0,
        },
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/rose-gold-bracelet-2.jpg",
          publicId: "nakoda/products/rose-gold-bracelet-2",
          altText: "Rose Gold Chain Bracelet - Flat Lay",
          displayOrder: 1,
        },
      ],
    },
    {
      name: "Antique Gold Bangles Set",
      slug: "antique-gold-bangles-set",
      description:
        "A set of six antique-finish gold bangles with traditional Indian motifs. Each bangle features hand-carved paisley and floral patterns that tell a story of timeless craftsmanship.",
      price: 145000.0,
      weight: "72.0g",
      sku: "BG-ANT-001",
      material: "22K Gold (Antique Finish)",
      featured: true,
      categorySlug: "bangles",
      collectionSlug: "festive-collection",
      images: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/antique-bangles-1.jpg",
          publicId: "nakoda/products/antique-bangles-1",
          altText: "Antique Gold Bangles Set - Full Set",
          displayOrder: 0,
        },
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/antique-bangles-2.jpg",
          publicId: "nakoda/products/antique-bangles-2",
          altText: "Antique Gold Bangles Set - Detail Carving",
          displayOrder: 1,
        },
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/antique-bangles-3.jpg",
          publicId: "nakoda/products/antique-bangles-3",
          altText: "Antique Gold Bangles Set - Worn View",
          displayOrder: 2,
        },
      ],
    },
    {
      name: "Diamond Heart Pendant",
      slug: "diamond-heart-pendant",
      description:
        "A romantic heart-shaped pendant encrusted with pavé diamonds in 18K white gold. Comes with an 18-inch box chain. The perfect gift for anniversaries and special occasions.",
      price: 42000.0,
      weight: "5.1g",
      sku: "PD-HRT-001",
      material: "18K White Gold, Diamond (0.3ct total)",
      featured: false,
      categorySlug: "pendants",
      collectionSlug: "daily-wear",
      images: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/heart-pendant-1.jpg",
          publicId: "nakoda/products/heart-pendant-1",
          altText: "Diamond Heart Pendant - Front View",
          displayOrder: 0,
        },
      ],
    },
    {
      name: "Polki Choker Necklace",
      slug: "polki-choker-necklace",
      description:
        "A regal polki choker necklace in 22K gold with uncut diamond (polki) stones and emerald drops. This museum-quality piece is handcrafted by master artisans using centuries-old techniques.",
      price: null, // Price on Request
      weight: "95.0g",
      sku: "NK-PLK-001",
      material: "22K Gold, Polki Diamond, Emerald",
      featured: true,
      categorySlug: "necklaces",
      collectionSlug: "bridal-collection",
      images: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/polki-choker-1.jpg",
          publicId: "nakoda/products/polki-choker-1",
          altText: "Polki Choker Necklace - Front View",
          displayOrder: 0,
        },
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/polki-choker-2.jpg",
          publicId: "nakoda/products/polki-choker-2",
          altText: "Polki Choker Necklace - Side View",
          displayOrder: 1,
        },
      ],
    },
    {
      name: "Minimalist Gold Studs",
      slug: "minimalist-gold-studs",
      description:
        "Simple yet elegant 18K gold stud earrings with a brushed matte finish. These versatile studs are perfect for everyday wear and make an excellent first jewellery purchase.",
      price: 8500.0,
      weight: "2.4g",
      sku: "ER-MIN-001",
      material: "18K Gold (Matte Finish)",
      featured: false,
      categorySlug: "earrings",
      collectionSlug: "daily-wear",
      images: [
        {
          url: "https://res.cloudinary.com/demo/image/upload/v1/nakoda/products/gold-studs-1.jpg",
          publicId: "nakoda/products/gold-studs-1",
          altText: "Minimalist Gold Studs - Pair View",
          displayOrder: 0,
        },
      ],
    },
  ];

  for (const productData of productsData) {
    const { images, categorySlug, collectionSlug, ...productFields } =
      productData;

    const product = await prisma.product.upsert({
      where: { slug: productFields.slug },
      update: {},
      create: {
        ...productFields,
        price: productFields.price ? productFields.price : null,
        categoryId: categories[categorySlug]?.id ?? null,
        collectionId: collections[collectionSlug]?.id ?? null,
        images: {
          create: images,
        },
      },
    });

    console.log(
      `  ✓ Product: ${product.name} (${images.length} images)`
    );
  }

  // ─────────────────────────────────────────────────────
  // 5. SAMPLE INQUIRIES
  // ─────────────────────────────────────────────────────
  console.log("\n📩 Creating sample inquiries...");

  const sampleProduct = await prisma.product.findFirst({
    where: { slug: "kundan-bridal-necklace-set" },
  });

  if (sampleProduct) {
    await prisma.inquiry.upsert({
      where: { id: "seed_inquiry_1" },
      update: {},
      create: {
        id: "seed_inquiry_1",
        customerName: "Priya Sharma",
        phoneNumber: "+91 98765 43210",
        email: "priya.sharma@example.com",
        message:
          "I am getting married in December 2026 and I am very interested in the Kundan Bridal Necklace Set. Can I visit your store to try it on? Also, do you offer customisation options?",
        productId: sampleProduct.id,
        status: InquiryStatus.NEW,
        isRead: false,
      },
    });
    console.log("  ✓ Inquiry: Priya Sharma (product-specific)");
  }

  await prisma.inquiry.upsert({
    where: { id: "seed_inquiry_2" },
    update: {},
    create: {
      id: "seed_inquiry_2",
      customerName: "Amit Patel",
      phoneNumber: "+91 87654 32109",
      email: null,
      message:
        "Do you make custom engagement rings? I am looking for a specific design in 18K white gold with a 1-carat diamond. Please call me to discuss.",
      productId: null, // General inquiry
      status: InquiryStatus.NEW,
      isRead: false,
    },
  });
  console.log("  ✓ Inquiry: Amit Patel (general)");

  // ─────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────
  const counts = {
    admins: await prisma.admin.count(),
    categories: await prisma.category.count(),
    collections: await prisma.collection.count(),
    products: await prisma.product.count(),
    productImages: await prisma.productImage.count(),
    inquiries: await prisma.inquiry.count(),
  };

  console.log("\n" + "═".repeat(50));
  console.log("🌱 Seed completed successfully!\n");
  console.log("  📊 Database Summary:");
  console.log(`     Admins:         ${counts.admins}`);
  console.log(`     Categories:     ${counts.categories}`);
  console.log(`     Collections:    ${counts.collections}`);
  console.log(`     Products:       ${counts.products}`);
  console.log(`     Product Images: ${counts.productImages}`);
  console.log(`     Inquiries:      ${counts.inquiries}`);
  console.log("\n" + "═".repeat(50));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

### Package.json Seed Configuration

Add the following to your `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Running the Seed

```bash
# Run seed (uses the "prisma.seed" command from package.json)
npx prisma db seed

# Or reset database and re-seed
npx prisma migrate reset
```

> **Note:** `prisma migrate reset` drops the database, re-applies all migrations, and then runs the seed script. Use with caution — never run in production.

---

## 8. Migration Strategy

### 8.1 Commands Overview

| Command                    | Environment   | Purpose                                                             | Safe for Prod? |
| -------------------------- | ------------- | ------------------------------------------------------------------- | -------------- |
| `npx prisma migrate dev`  | Development   | Create a new migration, apply it, regenerate Prisma Client          | ❌ No           |
| `npx prisma migrate deploy`| Production   | Apply pending migrations (no interactive prompts)                   | ✅ Yes          |
| `npx prisma db push`      | Prototyping   | Sync schema without creating migration files (no migration history) | ❌ No           |
| `npx prisma migrate reset`| Development   | Drop DB, re-apply all migrations, run seed                          | ❌ Never        |
| `npx prisma generate`     | Any           | Regenerate Prisma Client from schema (no DB changes)                | ✅ Yes          |

### 8.2 Development Workflow

```bash
# 1. Edit prisma/schema.prisma
# 2. Create and apply migration
npx prisma migrate dev --name add_material_field_to_products

# 3. Prisma automatically:
#    a. Generates a SQL migration file in prisma/migrations/
#    b. Applies the migration to the dev database
#    c. Regenerates Prisma Client

# 4. Verify the migration file
cat prisma/migrations/20260603_add_material_field_to_products/migration.sql

# 5. Commit the migration to version control
git add prisma/
git commit -m "feat(db): add material field to products"
```

### 8.3 Production Deployment (Vercel)

Migrations are applied during the Vercel build step:

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

**Flow:**
1. Developer pushes code with new migration files to `main` branch.
2. Vercel triggers a build.
3. `prisma generate` regenerates the Prisma Client.
4. `prisma migrate deploy` applies any pending migrations against the Neon production database.
5. `next build` compiles the Next.js application.
6. If any step fails, the build is aborted and nothing is deployed.

### 8.4 Migration Naming Conventions

Use descriptive, snake_case names that follow the pattern:

```
<action>_<entity>_<details>
```

**Examples:**

| Migration Name                              | Description                                |
| ------------------------------------------- | ------------------------------------------ |
| `init`                                      | Initial schema creation                    |
| `add_material_field_to_products`            | Add a new column                           |
| `add_sku_unique_index_to_products`          | Add an index or constraint                 |
| `rename_is_visible_to_is_active`            | Rename a column                            |
| `add_inquiry_status_enum`                   | Add a new enum                             |
| `add_admin_notes_to_inquiries`              | Add optional field to existing table       |
| `create_product_variants_table`             | Create a new table (future V2)             |
| `drop_legacy_price_column`                  | Remove deprecated column                   |

### 8.5 Migration Best Practices

1. **Never edit existing migration files.** Once committed, a migration is immutable. Create a new migration to make corrections.
2. **Always review generated SQL.** Prisma generates SQL from schema diffs. Review the `migration.sql` file before committing to catch unexpected changes (e.g., accidental column drops).
3. **Test migrations locally first.** Apply `prisma migrate dev` on a local database (or Neon dev branch) before deploying to production.
4. **Use Neon branching for testing.** Neon supports database branching — create a branch from production, test the migration, then apply to the real production database.
5. **Backup before major migrations.** For destructive changes (column drops, type changes), create a Neon snapshot/backup first.

### 8.6 Prototyping vs. Migrations

```
┌──────────────────────────────────────────────────────────┐
│                  Schema Change Flow                      │
│                                                          │
│  Prototyping (exploration):                              │
│    schema.prisma ──► prisma db push ──► DB updated       │
│    (no migration files, no history)                      │
│                                                          │
│  Development (committed changes):                        │
│    schema.prisma ──► prisma migrate dev ──► migration/   │
│    (creates SQL file, tracked in git)                    │
│                                                          │
│  Production (deployment):                                │
│    migration/ ──► prisma migrate deploy ──► Neon Prod    │
│    (applies pending SQL files, no interactivity)         │
└──────────────────────────────────────────────────────────┘
```

> **Recommendation:** Use `prisma db push` only in the earliest exploration phase. Switch to `prisma migrate dev` as soon as the schema stabilises. Never use `db push` in production.

---

## 9. Query Patterns

All queries use the Prisma Client. In Nakoda Web's architecture, these are called from **Server Actions** and **Server Components** (not API routes).

### 9.1 Prisma Client Singleton

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

> **Why a singleton?** In development, Next.js hot-reloads modules frequently. Without the singleton pattern, each hot-reload would create a new `PrismaClient` instance, exhausting the database connection pool. The global cache ensures only one instance exists.

### 9.2 Product Queries

#### Get All Active Products with Images and Category (Paginated)

```typescript
// src/features/products/queries/get-products.ts
import { prisma } from "@/lib/prisma";

interface GetProductsParams {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  collectionSlug?: string;
  featured?: boolean;
  search?: string;
}

export async function getProducts({
  page = 1,
  pageSize = 12,
  categorySlug,
  collectionSlug,
  featured,
  search,
}: GetProductsParams = {}) {
  const where = {
    isActive: true,
    inStock: true,
    ...(categorySlug && {
      category: { slug: categorySlug },
    }),
    ...(collectionSlug && {
      collection: { slug: collectionSlug },
    }),
    ...(featured !== undefined && { featured }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { material: { contains: search, mode: "insensitive" as const } },
        { sku: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: { displayOrder: "asc" },
          take: 1, // Only fetch hero image for listing
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

#### Get Featured Products (Homepage)

```typescript
// src/features/products/queries/get-featured-products.ts
export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: {
      featured: true,
      isActive: true,
      inStock: true,
    },
    include: {
      images: {
        orderBy: { displayOrder: "asc" },
        take: 1,
      },
      category: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
```

#### Get Product by Slug (Product Detail Page)

```typescript
// src/features/products/queries/get-product-by-slug.ts
export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { displayOrder: "asc" },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
      collection: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
}
```

#### Get Related Products

```typescript
// src/features/products/queries/get-related-products.ts
export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
) {
  return prisma.product.findMany({
    where: {
      id: { not: productId },
      isActive: true,
      inStock: true,
      ...(categoryId && { categoryId }),
    },
    include: {
      images: {
        orderBy: { displayOrder: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
```

### 9.3 Admin Product CRUD (Server Actions)

#### Create Product with Images

```typescript
// src/features/admin/products/actions/create-product.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
  price?: number;
  weight?: string;
  sku?: string;
  material?: string;
  featured?: boolean;
  categoryId?: string;
  collectionId?: string;
  images: {
    url: string;
    publicId: string;
    altText?: string;
    displayOrder: number;
  }[];
}

export async function createProduct(input: CreateProductInput) {
  const { images, ...productData } = input;

  const product = await prisma.product.create({
    data: {
      ...productData,
      images: {
        create: images,
      },
    },
    include: {
      images: true,
      category: true,
      collection: true,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);

  return product;
}
```

#### Update Product

```typescript
// src/features/admin/products/actions/update-product.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface UpdateProductInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number | null;
  weight?: string;
  sku?: string;
  material?: string;
  featured?: boolean;
  isActive?: boolean;
  inStock?: boolean;
  categoryId?: string | null;
  collectionId?: string | null;
}

export async function updateProduct(input: UpdateProductInput) {
  const { id, ...data } = input;

  const product = await prisma.product.update({
    where: { id },
    data,
    include: {
      images: true,
      category: true,
      collection: true,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);

  return product;
}
```

#### Delete Product with Image Cleanup

```typescript
// src/features/admin/products/actions/delete-product.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

export async function deleteProduct(productId: string) {
  // 1. Fetch all image public IDs before deletion
  const images = await prisma.productImage.findMany({
    where: { productId },
    select: { publicId: true },
  });

  // 2. Delete from Cloudinary (fire-and-forget with error logging)
  await Promise.allSettled(
    images.map((img) => deleteCloudinaryImage(img.publicId))
  );

  // 3. Delete product (images cascade in DB)
  await prisma.product.delete({
    where: { id: productId },
  });

  // 4. Revalidate affected pages
  revalidatePath("/admin/products");
  revalidatePath("/");

  return { success: true };
}
```

### 9.4 Category & Collection Queries

#### Get All Active Categories (with Product Count)

```typescript
// src/features/categories/queries/get-categories.ts
export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          products: {
            where: { isActive: true, inStock: true },
          },
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });
}
```

#### Get Category by Slug with Products

```typescript
// src/features/categories/queries/get-category-by-slug.ts
export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        include: {
          images: {
            orderBy: { displayOrder: "asc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
```

### 9.5 Inquiry Queries

#### Get Unread Inquiries Count (Admin Dashboard Badge)

```typescript
// src/features/admin/inquiries/queries/get-unread-count.ts
export async function getUnreadInquiriesCount() {
  return prisma.inquiry.count({
    where: { isRead: false },
  });
}
```

#### Get All Inquiries (Admin Panel, Paginated)

```typescript
// src/features/admin/inquiries/queries/get-inquiries.ts
export async function getInquiries({
  page = 1,
  pageSize = 20,
  status,
  isRead,
}: {
  page?: number;
  pageSize?: number;
  status?: InquiryStatus;
  isRead?: boolean;
} = {}) {
  const where = {
    ...(status && { status }),
    ...(isRead !== undefined && { isRead }),
  };

  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inquiry.count({ where }),
  ]);

  return {
    inquiries,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

#### Submit Inquiry (Public Storefront Action)

```typescript
// src/features/inquiries/actions/submit-inquiry.ts
"use server";

import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/features/inquiries/schemas";

export async function submitInquiry(formData: FormData) {
  const rawData = {
    customerName: formData.get("customerName"),
    phoneNumber: formData.get("phoneNumber"),
    email: formData.get("email") || undefined,
    message: formData.get("message"),
    productId: formData.get("productId") || undefined,
  };

  // Validate with Zod
  const validated = inquirySchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const inquiry = await prisma.inquiry.create({
    data: validated.data,
  });

  return { success: true, inquiryId: inquiry.id };
}
```

#### Mark Inquiry as Read

```typescript
// src/features/admin/inquiries/actions/mark-as-read.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markInquiryAsRead(inquiryId: string) {
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { isRead: true },
  });

  revalidatePath("/admin/inquiries");
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus,
  adminNotes?: string
) {
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      status,
      isRead: true,
      ...(adminNotes !== undefined && { adminNotes }),
    },
  });

  revalidatePath("/admin/inquiries");
}
```

### 9.6 Admin Dashboard Queries

#### Dashboard Statistics

```typescript
// src/features/admin/dashboard/queries/get-dashboard-stats.ts
export async function getDashboardStats() {
  const [
    totalProducts,
    activeProducts,
    totalCategories,
    totalCollections,
    totalInquiries,
    unreadInquiries,
    recentInquiries,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.collection.count({ where: { isActive: true } }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { isRead: false } }),
    prisma.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { name: true, slug: true },
        },
      },
    }),
  ]);

  return {
    totalProducts,
    activeProducts,
    totalCategories,
    totalCollections,
    totalInquiries,
    unreadInquiries,
    recentInquiries,
  };
}
```

---

## 10. Performance Considerations

### 10.1 Connection Pooling

Neon uses PgBouncer for connection pooling. This is critical in serverless environments where each function invocation might otherwise open a new database connection.

```
┌────────────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Vercel Serverless     │     │  Neon PgBouncer   │     │  Neon        │
│  Functions             │────►│  (Connection      │────►│  PostgreSQL  │
│  (many instances)      │     │   Pooler)          │     │  (single DB) │
└────────────────────────┘     └──────────────────┘     └──────────────┘
    Hundreds of                    Limited pool              1 database
    concurrent                     (e.g., 50                 instance
    invocations                    connections)
```

**Configuration:**
- `DATABASE_URL` points to the **pooled** endpoint (hostname with `-pooler`).
- `DIRECT_DATABASE_URL` points to the **direct** endpoint (for migrations only).
- Prisma automatically uses the pooled URL for all queries at runtime.

### 10.2 Select Only Needed Fields

For listing pages, avoid fetching full product descriptions:

```typescript
// ❌ Bad — fetches everything including large text fields
const products = await prisma.product.findMany({
  include: { images: true, category: true },
});

// ✅ Good — select only what the listing card needs
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    slug: true,
    price: true,
    material: true,
    images: {
      select: { url: true, altText: true },
      orderBy: { displayOrder: "asc" },
      take: 1,
    },
    category: {
      select: { name: true, slug: true },
    },
  },
});
```

### 10.3 Pagination

Never load all products at once. Always paginate:

```typescript
// Offset-based pagination (simple, good for admin panels)
const products = await prisma.product.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: "desc" },
});

// Cursor-based pagination (better for infinite scroll on storefront)
const products = await prisma.product.findMany({
  take: pageSize,
  skip: cursor ? 1 : 0, // Skip the cursor item itself
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: "desc" },
});
```

### 10.4 N+1 Query Prevention

The N+1 problem occurs when you fetch a list of records and then make individual queries for each record's relations.

```typescript
// ❌ N+1 Problem
const products = await prisma.product.findMany();
for (const product of products) {
  const images = await prisma.productImage.findMany({
    where: { productId: product.id },
  }); // N additional queries!
}

// ✅ Solved with `include` (single query with JOIN)
const products = await prisma.product.findMany({
  include: {
    images: {
      orderBy: { displayOrder: "asc" },
    },
  },
});
```

### 10.5 Index Usage Verification

In development, enable Prisma query logging to verify indexes are being used:

```typescript
// src/lib/prisma.ts (development only)
export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});
```

To verify index usage directly in PostgreSQL:

```sql
-- Check if a query uses an index
EXPLAIN ANALYZE
SELECT * FROM products
WHERE "categoryId" = 'clxyz123' AND "isActive" = true
ORDER BY "createdAt" DESC
LIMIT 12;

-- Expected output should show "Index Scan" or "Index Only Scan"
-- NOT "Seq Scan" (sequential scan = full table scan)
```

### 10.6 Caching Strategy

Since Nakoda Web uses Server Components, Next.js caches rendered output by default (static rendering). For dynamic data:

```typescript
// In Server Components — use Next.js caching
import { unstable_cache } from "next/cache";

export const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });
  },
  ["categories"],
  { revalidate: 3600 } // Revalidate every hour
);
```

### 10.7 Performance Checklist

| Concern                    | Strategy                                     | Status  |
| -------------------------- | -------------------------------------------- | ------- |
| Connection pooling         | Neon PgBouncer via pooled URL                | ✅       |
| N+1 queries                | Use `include`/`select` in all queries        | ✅       |
| Over-fetching              | Use `select` for listing pages               | ✅       |
| Missing indexes            | All FK columns and filter columns indexed    | ✅       |
| Full table scans           | `isActive` filter with index on all tables   | ✅       |
| Unbounded queries          | Pagination on all listing endpoints          | ✅       |
| Client singleton           | Global singleton pattern in `src/lib/prisma` | ✅       |
| Development logging        | Query logging enabled in dev mode            | ✅       |
| Image query optimization   | `take: 1` for listing, full for detail       | ✅       |
| Compound sort              | `[productId, displayOrder]` index on images  | ✅       |

---

## 11. Data Validation

Nakoda Web uses a **three-layer validation** strategy to ensure data integrity:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Validation Layers                           │
│                                                                 │
│  Layer 1: Client-Side (React Hook Form + Zod)                  │
│    → Instant feedback, prevents invalid form submissions        │
│    → Can be bypassed (never trust client alone)                 │
│                                                                 │
│  Layer 2: Server-Side (Zod in Server Actions)                  │
│    → Authoritative validation, cannot be bypassed               │
│    → Same Zod schemas shared with client for consistency        │
│                                                                 │
│  Layer 3: Database-Level (Prisma + PostgreSQL)                 │
│    → Final safety net: unique constraints, FK refs, NOT NULL    │
│    → Catches bugs in application code                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 11.1 Zod Schemas (Shared Between Client and Server)

```typescript
// src/features/products/schemas.ts
import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name must not exceed 200 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(200, "Slug must not exceed 200 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z
    .string()
    .max(5000, "Description must not exceed 5000 characters")
    .optional()
    .nullable(),
  price: z
    .number()
    .positive("Price must be a positive number")
    .max(99999999.99, "Price exceeds maximum value")
    .optional()
    .nullable(),
  weight: z
    .string()
    .max(50, "Weight must not exceed 50 characters")
    .optional()
    .nullable(),
  sku: z
    .string()
    .max(50, "SKU must not exceed 50 characters")
    .regex(
      /^[A-Z0-9-]+$/,
      "SKU must contain only uppercase letters, numbers, and hyphens"
    )
    .optional()
    .nullable(),
  material: z
    .string()
    .max(200, "Material must not exceed 200 characters")
    .optional()
    .nullable(),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  inStock: z.boolean().default(true),
  categoryId: z.string().cuid().optional().nullable(),
  collectionId: z.string().cuid().optional().nullable(),
});

export const productImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().min(1, "Public ID is required"),
  altText: z.string().max(300).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductImageFormData = z.infer<typeof productImageSchema>;
```

```typescript
// src/features/inquiries/schemas.ts
import { z } from "zod";

export const inquirySchema = z.object({
  customerName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must not exceed 20 characters")
    .regex(
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/,
      "Please enter a valid phone number"
    ),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must not exceed 2000 characters"),
  productId: z.string().cuid().optional().nullable(),
});

export type InquiryFormData = z.infer<typeof inquirySchema>;
```

```typescript
// src/features/categories/schemas.ts
import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must not exceed 100 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug must not exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional()
    .nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
```

### 11.2 Database-Level Constraints

| Constraint Type | Examples                                           | Enforced By     |
| --------------- | -------------------------------------------------- | --------------- |
| **NOT NULL**    | `product.name`, `inquiry.customerName`             | PostgreSQL      |
| **UNIQUE**      | `admin.email`, `product.slug`, `category.name`     | PostgreSQL      |
| **FOREIGN KEY** | `product.categoryId → category.id`                 | PostgreSQL      |
| **ON DELETE**   | Cascade (images), SetNull (inquiries)              | PostgreSQL      |
| **DEFAULT**     | `product.featured = false`, `inquiry.isRead = false` | PostgreSQL    |
| **TYPE**        | `price DECIMAL(10,2)`, `description TEXT`          | PostgreSQL      |
| **ENUM**        | `AdminRole`, `InquiryStatus`                       | PostgreSQL      |

### 11.3 Validation Flow Example (Inquiry Submission)

```
Customer fills form     React Hook Form         Server Action           Prisma / PostgreSQL
on storefront           + Zod validates         validates again         enforces constraints
                        client-side             server-side
       │                       │                       │                       │
       ▼                       ▼                       ▼                       ▼
  ┌──────────┐          ┌──────────┐           ┌──────────┐           ┌──────────┐
  │ Form     │──────────│ Zod      │───────────│ Zod      │───────────│ NOT NULL  │
  │ Input    │  submit  │ Schema   │  action   │ Schema   │  create   │ UNIQUE    │
  │          │──────────│ (client) │───────────│ (server) │───────────│ FK REF    │
  └──────────┘          └──────────┘           └──────────┘           └──────────┘
       │                    │                       │                       │
       │              Invalid? Show                Invalid? Return         Invalid?
       │              inline errors               error response          Throw PrismaError
       │              immediately                                         (caught by app)
```

### 11.4 Error Handling for Database Constraints

```typescript
// src/lib/prisma-errors.ts
import { Prisma } from "@prisma/client";

export function handlePrismaError(error: unknown): {
  message: string;
  field?: string;
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        // Unique constraint violation
        const target = (error.meta?.target as string[]) ?? [];
        const field = target[0] ?? "field";
        return {
          message: `A record with this ${field} already exists.`,
          field,
        };
      }
      case "P2003": {
        // Foreign key constraint violation
        return {
          message: "Referenced record does not exist.",
          field: error.meta?.field_name as string,
        };
      }
      case "P2025": {
        // Record not found
        return {
          message: "Record not found.",
        };
      }
      default:
        return {
          message: "A database error occurred.",
        };
    }
  }

  return {
    message: "An unexpected error occurred.",
  };
}
```

---

## Appendix A: Quick Reference

### Prisma CLI Commands

```bash
# Schema & Client
npx prisma generate           # Regenerate Prisma Client
npx prisma format             # Format schema file
npx prisma validate           # Validate schema syntax

# Database
npx prisma db push            # Push schema to DB (no migration)
npx prisma db pull            # Introspect DB into schema
npx prisma db seed            # Run seed script

# Migrations
npx prisma migrate dev        # Create & apply migration (dev)
npx prisma migrate deploy     # Apply pending migrations (prod)
npx prisma migrate reset      # Reset DB & re-apply all migrations
npx prisma migrate status     # Show migration status

# Studio
npx prisma studio             # Open visual DB editor (port 5555)
```

### File Structure

```
nakoda-web/
├── prisma/
│   ├── schema.prisma          # Database schema (source of truth)
│   ├── seed.ts                # Seed script
│   └── migrations/            # Auto-generated migration files
│       ├── 20260603_init/
│       │   └── migration.sql
│       └── migration_lock.toml
├── src/
│   ├── lib/
│   │   ├── prisma.ts          # Prisma Client singleton
│   │   └── prisma-errors.ts   # Error handling utilities
│   └── features/
│       ├── products/
│       │   ├── schemas.ts     # Zod validation schemas
│       │   └── queries/       # Server-side query functions
│       ├── categories/
│       │   ├── schemas.ts
│       │   └── queries/
│       ├── collections/
│       │   ├── schemas.ts
│       │   └── queries/
│       ├── inquiries/
│       │   ├── schemas.ts
│       │   └── actions/       # Server Actions
│       └── admin/
│           ├── products/
│           │   └── actions/
│           ├── inquiries/
│           │   ├── queries/
│           │   └── actions/
│           └── dashboard/
│               └── queries/
└── .env.local                 # DATABASE_URL, DIRECT_DATABASE_URL
```

### Environment Setup Checklist

- [ ] Create Neon project and database
- [ ] Copy pooled connection string → `DATABASE_URL`
- [ ] Copy direct connection string → `DIRECT_DATABASE_URL`
- [ ] Add both to `.env.local` and Vercel Environment Variables
- [ ] Run `npx prisma generate` to create Prisma Client
- [ ] Run `npx prisma migrate dev --name init` for initial migration
- [ ] Run `npx prisma db seed` to populate sample data
- [ ] Verify with `npx prisma studio`

---

> **Document End**
> This database design is for Nakoda Web V1 (Showcase/Inquiry Platform).
> Future versions may add: Product Variants, Wishlists, Customer Accounts, Order Management, Payment Integration.
