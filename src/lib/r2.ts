import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload a product image to R2 and return its public URL and storage path.
 */
export async function uploadProductImage(
  file: File
): Promise<{ url: string; path: string } | null> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `products/${uuidv4()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: path,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
      })
    );

    const url = `${process.env.R2_PUBLIC_URL!}/${path}`;
    return { url, path };
  } catch (error) {
    console.error('Failed to upload image to R2:', error);
    return null;
  }
}

/**
 * Delete a product image from R2 by its storage path.
 */
export async function deleteProductImage(path: string): Promise<boolean> {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: path,
      })
    );
    return true;
  } catch (error) {
    console.error('Failed to delete image from R2:', error);
    return false;
  }
}
