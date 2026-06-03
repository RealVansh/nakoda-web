# Image Management — Nakoda Web

## 1. Overview
- **Cloudinary** serves as the unified media storage and CDN platform for Nakoda Web.
- **Why Cloudinary**: It natively supports dynamic on-the-fly transformations (resizing, cropping), format optimization (WebP/AVIF), and high-speed global CDN delivery out of the box, drastically reducing Next.js build times and bandwidth costs.
- **Image Types**: We manage Product Images (galleries), Category Images, Collection Images, and general static assets (like OG Images).

## 2. Cloudinary Configuration

### Account Setup
- Register for a Cloudinary account.
- Extract your `cloud_name`, `api_key`, and `api_secret` from the Cloudinary dashboard.
- Place them in your environment variables.

### Server-Side Configuration
```typescript
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Upload helper for streaming a File directly to Cloudinary
export async function uploadImage(
  file: File,
  folder: string = 'products'
): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `nakoda-web/${folder}`,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      )
      .end(buffer);
  });
}

// Delete helper
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
```

## 3. Folder Organization
Inside Cloudinary, files are cleanly segregated:
```
nakoda-web/
├── products/          # Dynamic product gallery imagery
├── categories/        # Category thumbnail identifiers
├── collections/       # Collection heroic banners
└── general/           # Static overrides and default fallbacks
```

## 4. Image Upload Flow

### Multi-Image Upload for Products
1. Admin selects up to 10 images in the browser.
2. The browser generates quick `URL.createObjectURL` previews for UX.
3. The Admin submits the form. React converts the images to a `FormData` object.
4. The Next.js Server Action (`uploadProductImages`) intercepts the `FormData`.
5. The action validates that the user is an Admin, then processes each file.
6. The files are streamed to Cloudinary in parallel using `Promise.all`.
7. Once Cloudinary URLs and Public IDs are returned, they are saved as `ProductImage` rows in the database, linked to the `productId`.

### Server Action Implementation (`src/actions/image.actions.ts`)
```typescript
'use server';

import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/actions/auth.actions';
import { revalidatePath } from 'next/cache';

export async function uploadProductImages(productId: string, formData: FormData) {
  await requireAdmin();

  try {
    const files = formData.getAll('images') as File[];
    if (!files.length) return { success: false, error: 'No images' };
    if (files.length > 10) return { success: false, error: 'Max 10 images' };

    const maxOrder = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    
    let currentOrder = (maxOrder?.displayOrder ?? -1) + 1;
    const uploaded = [];

    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) continue;
      
      const { url, publicId } = await uploadImage(file, 'products');
      const image = await prisma.productImage.create({
        data: { url, publicId, altText: 'Product image', displayOrder: currentOrder++, productId },
      });
      uploaded.push(image);
    }

    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true, data: uploaded };
  } catch (error) {
    return { success: false, error: 'Upload failed' };
  }
}
```

## 5. Image Optimization & Cloudinary Transformations

Using URL transformation parameters, we generate optimized images without writing complex server-side scaling logic.
- **Auto Quality & Format**: Append `q_auto,f_auto` to URLs. Cloudinary decides the best format (AVIF/WebP) and compression based on the requesting browser.
- **Cropping & Sizing**: `w_600,h_600,c_fill` will crop the image dynamically into a square.

### Utility Function (`src/lib/utils.ts`)
```typescript
export function getOptimizedImageUrl(
  url: string,
  options: { width?: number; height?: number; crop?: 'fill' | 'fit' | 'thumb'; quality?: 'auto' | number } = {}
): string {
  const { width, height, crop = 'fill', quality = 'auto' } = options;
  const transforms = [
    width && `w_${width}`,
    height && `h_${height}`,
    `c_${crop}`,
    `q_${quality}`,
    'f_auto',
  ].filter(Boolean).join(',');
  
  return url.replace('/upload/', `/upload/${transforms}/`);
}
```

## 6. Next.js Image Integration
By tying Cloudinary to Next.js `next/image`, we get the best of both worlds:
```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    ],
  },
};
export default nextConfig;
```

## 7. Admin Image Manager UI Requirements
- A robust drag-and-drop zone.
- Visual display of upload progress.
- Ability to drag thumbnails to adjust the `displayOrder`. The 0th index is the primary thumbnail.
- A garbage bin icon on each thumbnail to trigger the `deleteImage` server action.

## 8. Cleanup Strategy
- When deleting a single `ProductImage`, trigger the `deleteImage(publicId)` Cloudinary action before deleting the DB row.
- When an entire `Product` is deleted, we must iterate over its `ProductImages`, invoke the Cloudinary deletion for each, and then cascade delete the product in the DB.
- Cron jobs or manual scripts might be needed in the future to detect orphan images in Cloudinary without a DB counterpart.
