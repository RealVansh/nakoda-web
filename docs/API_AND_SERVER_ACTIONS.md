# API & Server Actions — Nakoda Web

## 1. Overview
Next.js 15 App Router promotes the use of Server Components and Server Actions over traditional API Routes. 
Server Actions provide several benefits for Nakoda Web:
- **Type Safety**: End-to-end type safety between the client and server.
- **Progressive Enhancement**: Forms can work without JavaScript.
- **Colocation**: Server Actions can be defined close to the components that use them.
- **Reduced Bundle Size**: The logic for actions remains strictly on the server.

API routes (Route Handlers) are still needed when we require:
- Webhooks from third-party services (e.g., if we integrate payments later).
- Integration with external mobile applications.
- Serving public standard APIs.

## 2. Server Action Patterns

### Action Result Pattern
To ensure robust error handling and standardized responses from Server Actions, we use the `ActionResult` pattern:

```typescript
type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};
```

### Error Handling
- **Try-catch wrapping**: Every database operation or external API call is wrapped in a try-catch block.
- **Zod validation errors**: Client and server use the same Zod schemas. If validation fails, `errors` is populated.
- **Database errors**: Prisma errors are caught and transformed into generic `error` messages to avoid leaking implementation details.

### Revalidation Strategy
- `revalidatePath`: Used for page-level revalidation when a specific route needs to be refreshed (e.g., `revalidatePath('/admin/products')`).
- `revalidateTag`: Used for fine-grained caching. Data fetches can be tagged, and actions can clear those specific tags.

## 3. Product Actions (`src/actions/product.actions.ts`)

### `getProducts`
```typescript
export async function getProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  collectionId?: string;
  featured?: boolean;
  inStock?: boolean;
  sortBy?: 'newest' | 'oldest' | 'name-asc' | 'name-desc';
}): Promise<{ products: ProductWithImages[]; total: number; pages: number }> {
  // Logic: Use prisma.product.findMany with pagination, where clauses based on params, and orderBy.
}
```

### `getProductBySlug`
```typescript
export async function getProductBySlug(slug: string): Promise<ProductWithImages | null> {
  // Logic: Fetch single product by slug with related images and category.
}
```

### `createProduct` (Admin)
```typescript
export async function createProduct(data: z.infer<typeof productSchema>, formData: FormData): Promise<ActionResult<Product>> {
  // Logic: 
  // 1. Validate Admin session
  // 2. Validate input using Zod
  // 3. Create product in DB
  // 4. Upload images to Cloudinary (using helper)
  // 5. Save ProductImages in DB
  // 6. revalidatePath('/admin/products')
}
```

### `updateProduct` (Admin)
```typescript
export async function updateProduct(id: string, data: Partial<z.infer<typeof productSchema>>): Promise<ActionResult<Product>> {
  // Logic: Verify session, validate data, prisma.product.update, revalidate paths
}
```

### `deleteProduct` (Admin)
```typescript
export async function deleteProduct(id: string): Promise<ActionResult> {
  // Logic: Fetch product images, delete from Cloudinary, delete product from DB (cascade deletes images in DB), revalidate paths
}
```

## 4. Category Actions (`src/actions/category.actions.ts`)
```typescript
export async function getCategories(): Promise<Category[]> { /* ... */ }
export async function getCategoryBySlug(slug: string): Promise<Category | null> { /* ... */ }
export async function createCategory(data: z.infer<typeof categorySchema>): Promise<ActionResult<Category>> { /* ... */ }
export async function updateCategory(id: string, data: Partial<z.infer<typeof categorySchema>>): Promise<ActionResult<Category>> { /* ... */ }
export async function deleteCategory(id: string): Promise<ActionResult> { /* ... */ }
```

## 5. Collection Actions (`src/actions/collection.actions.ts`)
```typescript
export async function getCollections(): Promise<Collection[]> { /* ... */ }
export async function getCollectionBySlug(slug: string): Promise<Collection | null> { /* ... */ }
export async function createCollection(data: z.infer<typeof collectionSchema>): Promise<ActionResult<Collection>> { /* ... */ }
export async function updateCollection(id: string, data: Partial<z.infer<typeof collectionSchema>>): Promise<ActionResult<Collection>> { /* ... */ }
export async function deleteCollection(id: string): Promise<ActionResult> { /* ... */ }
```

## 6. Inquiry Actions (`src/actions/inquiry.actions.ts`)
```typescript
export async function submitInquiry(data: z.infer<typeof inquirySchema>): Promise<ActionResult> { /* Public */ }
export async function getInquiries(params: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<{ inquiries: Inquiry[]; total: number }> { /* Admin */ }
export async function getInquiryById(id: string): Promise<Inquiry | null> { /* Admin */ }
export async function markInquiryAsRead(id: string): Promise<ActionResult> { /* Admin */ }
export async function deleteInquiry(id: string): Promise<ActionResult> { /* Admin */ }
export async function getUnreadCount(): Promise<number> { /* Admin */ }
```

## 7. Image Actions (`src/actions/image.actions.ts`)
```typescript
export async function uploadImages(productId: string, formData: FormData): Promise<ActionResult<ProductImage[]>> { /* Upload to Cloudinary */ }
export async function deleteImage(imageId: string): Promise<ActionResult> { /* Delete from Cloudinary + DB */ }
export async function reorderImages(productId: string, imageIds: string[]): Promise<ActionResult> { /* Update displayOrder */ }
export async function updateImageAlt(imageId: string, altText: string): Promise<ActionResult> { /* ... */ }
```

## 8. Auth Actions (`src/actions/auth.actions.ts`)
```typescript
export async function signIn(formData: FormData): Promise<void> { /* calls Auth.js signIn */ }
export async function signOut(): Promise<void> { /* calls Auth.js signOut */ }
export async function getSession(): Promise<Session | null> { /* calls Auth.js auth() */ }
```

## 9. Zod Validation Schemas
Shared between client and server:

```typescript
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  categoryId: z.string().optional(),
  collectionId: z.string().optional(),
  featured: z.boolean().default(false),
  inStock: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50),
});

export const inquirySchema = z.object({
  customerName: z.string().min(2).max(100),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().min(10).max(1000),
  productId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

## 10. Data Fetching Patterns

### Server Component Data Fetching
Data is fetched directly in Server Components without `useEffect` or `useState`.
```typescript
// src/app/(store)/products/page.tsx
import { getProducts } from '@/actions/product.actions';
import { ProductGrid } from '@/components/store/product-grid';

export default async function ProductsPage() {
  const { products, total } = await getProducts({ page: 1, limit: 12 });
  return <ProductGrid products={products} total={total} />;
}
```

### Search & Filter with URL Params
Filters are handled via search params in Server Components.
```typescript
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const { products, total } = await getProducts({ page, categoryId: params.category });
  // ...
}
```

### Form Submission with Server Actions
```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitInquiry } from '@/actions/inquiry.actions';

export function InquiryForm() {
  const form = useForm({ resolver: zodResolver(inquirySchema) });
  
  async function onSubmit(data: z.infer<typeof inquirySchema>) {
    const result = await submitInquiry(data);
    if (result.success) {
      // Show success toast
    }
  }
  // ...
}
```

## 11. Admin Authorization Guard
A helper to ensure actions are only executed by authenticated admins.
```typescript
import { auth } from '@/lib/auth';

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}
```
Every admin action (e.g., `createProduct`) must call `await requireAdmin()` at the very beginning.

## 12. File Upload Handling
For multi-image upload:
1. Client constructs `FormData` appending each `File` object under the `images` key.
2. The Server Action receives `FormData`.
3. Validation checks if the files are images and within size limits.
4. Images are uploaded to Cloudinary using a Node.js stream.
5. Cloudinary URLs and Public IDs are saved to Prisma DB.
6. The action returns the resulting `ProductImage` objects.

## 13. Rate Limiting Considerations
Since the inquiry form is public, we need to prevent spam.
- Implement rate limiting based on IP address.
- Use a lightweight solution like `@upstash/ratelimit` if a Redis instance is available, or an in-memory map for basic throttling.
- Implement a honeypot field in the `InquiryForm` to catch basic bots.
