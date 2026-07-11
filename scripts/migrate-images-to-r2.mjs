/**
 * Image Migration Script: Supabase Storage → Cloudflare R2
 * 
 * 1. Connects to D1 to get all product images
 * 2. For each image, downloads it from Supabase
 * 3. Uploads it to Cloudflare R2
 * 4. Updates the D1 record with the new R2 URL
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import { pipeline } from 'stream/promises'

// ── Configuration ──
const D1_API_URL = 'https://nakoda-d1-proxy.nakoda.workers.dev'
const D1_API_SECRET = '2aa42fe540dc14e5cb9d3d6373a385bafb244505ce829bd852ef80bd58317783'

const R2_ENDPOINT = 'https://4541591717849912e82506cc2caae974.r2.cloudflarestorage.com'
const R2_ACCESS_KEY_ID = 'ebb92ae98ee3289e0321cbf094c86aec'
const R2_SECRET_ACCESS_KEY = '17fc0ba24414eb638415dc4ab01a26cd163d03c3274aa375d2bd634291f7c7cb'
const R2_BUCKET_NAME = 'nakoda-images'
const R2_PUBLIC_URL = 'https://pub-dbf3c78b74b243ffa06c1f0b05b10c74.r2.dev'

const SUPABASE_URL = 'https://gstvzplbwluyyctvisha.supabase.co'

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

async function d1Query(sql, params = []) {
  const res = await fetch(`${D1_API_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${D1_API_SECRET}`,
    },
    body: JSON.stringify({ sql, params }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`D1 query failed: ${res.status} ${text}`)
  }
  return res.json()
}

async function migrateImages() {
  console.log('🚀 Starting Image Migration (Supabase → R2)...')
  
  // 1. Get all images from D1
  const response = await d1Query('SELECT * FROM product_images')
  const images = response.results || []
  
  console.log(`Found ${images.length} images to process.`)
  
  for (const img of images) {
    console.log(`\nProcessing image: ${img.id}`)
    
    // Check if it's already an R2 URL
    if (img.image_url.includes('pub-dbf3c78b74b243ffa06c1f0b05b10c74.r2.dev')) {
      console.log('✅ Already migrated to R2, skipping.')
      continue
    }

    try {
      // 2. Download from Supabase
      console.log(`  ⬇️ Downloading from Supabase: ${img.image_url}`)
      const fetchRes = await fetch(img.image_url)
      
      if (!fetchRes.ok) {
        console.error(`  ❌ Failed to download: ${fetchRes.status}`)
        continue
      }
      
      const arrayBuffer = await fetchRes.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType = fetchRes.headers.get('content-type') || 'image/jpeg'
      
      // 3. Upload to R2
      const s3Path = img.image_path // Usually 'products/uuid.jpg'
      console.log(`  ⬆️ Uploading to R2: ${s3Path}`)
      
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: s3Path,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'max-age=31536000',
        })
      )
      
      // 4. Update D1
      const newUrl = `${R2_PUBLIC_URL}/${s3Path}`
      console.log(`  🔄 Updating D1 record to: ${newUrl}`)
      
      await d1Query(
        'UPDATE product_images SET image_url = ? WHERE id = ?',
        [newUrl, img.id]
      )
      
      console.log('  ✅ Done.')
    } catch (err) {
      console.error(`  ❌ Error processing ${img.id}:`, err)
    }
  }
  
  console.log('\n🎉 Image migration complete!')
}

migrateImages().catch(console.error)
