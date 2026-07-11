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

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Generate a presigned URL for direct-to-R2 uploads from the browser.
 */
export async function generatePresignedUploadUrl(
  contentType: string,
  extension: string
): Promise<{ uploadUrl: string; publicUrl: string; path: string } | null> {
  try {
    const ext = extension || 'jpg';
    const path = `products/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: path,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicUrl = `${process.env.R2_PUBLIC_URL!}/${path}`;
    
    return { uploadUrl, publicUrl, path };
  } catch (error) {
    console.error('Failed to generate presigned URL for R2:', error);
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
