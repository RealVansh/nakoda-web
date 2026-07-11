/**
 * Migration Script: Supabase → Cloudflare D1
 * 
 * This script:
 * 1. Reads the D1 schema and creates tables via the Worker API
 * 2. Exports data from Supabase (categories, collections, products, product_images, admin_users)
 * 3. Imports data into D1
 * 4. Creates the admin user with bcrypt hashed password
 * 
 * Usage: node scripts/migrate-to-d1.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Configuration ──
const SUPABASE_URL = 'https://gstvzplbwluyyctvisha.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdHZ6cGxid2x1eXljdHZpc2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODQ4MDQsImV4cCI6MjA5NjA2MDgwNH0.Si23W-uU4FyW_ZXeDhkKuh-gJy2Xg1uEJecjIPIjwQ8'

const D1_API_URL = 'https://nakoda-d1-proxy.nakoda.workers.dev'
const D1_API_SECRET = '2aa42fe540dc14e5cb9d3d6373a385bafb244505ce829bd852ef80bd58317783'

// Admin user to create
const ADMIN_EMAIL = 'nakoda566@gmail.com'
const ADMIN_PASSWORD_HASH = '$2b$12$TNc5CFsCxUTk8.K8EJUnWeWz2VmSrLd.DrJV0RpOHRKkYv4WHPMXi'

// ── Helpers ──

async function supabaseQuery(table, select = '*', filters = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${filters}`
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase query failed for ${table}: ${res.status} ${text}`)
  }
  return res.json()
}

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

async function d1Batch(queries) {
  const res = await fetch(`${D1_API_URL}/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${D1_API_SECRET}`,
    },
    body: JSON.stringify({ queries }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`D1 batch failed: ${res.status} ${text}`)
  }
  return res.json()
}

function generateUUID() {
  return crypto.randomUUID()
}

// ── Step 1: Create Tables ──
async function createTables() {
  console.log('\n📋 Step 1: Creating D1 tables...')
  
  const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')
  
  // Remove comment lines, then split by semicolons
  const cleanedSchema = schema
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
  
  const statements = cleanedSchema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  for (const sql of statements) {
    try {
      await d1Query(sql + ';')
      console.log(`  ✅ Executed: ${sql.substring(0, 60)}...`)
    } catch (err) {
      console.error(`  ❌ Failed: ${sql.substring(0, 60)}...`)
      console.error(`     Error: ${err.message}`)
    }
  }
}

// ── Step 2: Migrate Categories ──
async function migrateCategories() {
  console.log('\n📂 Step 2: Migrating categories...')
  
  const categories = await supabaseQuery('categories')
  console.log(`  Found ${categories.length} categories in Supabase`)
  
  for (const cat of categories) {
    await d1Query(
      'INSERT OR IGNORE INTO categories (id, name, slug, created_at) VALUES (?, ?, ?, ?)',
      [cat.id, cat.name, cat.slug, cat.created_at]
    )
    console.log(`  ✅ ${cat.name}`)
  }
}

// ── Step 3: Migrate Collections ──
async function migrateCollections() {
  console.log('\n📁 Step 3: Migrating collections...')
  
  const collections = await supabaseQuery('collections')
  console.log(`  Found ${collections.length} collections in Supabase`)
  
  for (const col of collections) {
    await d1Query(
      'INSERT OR IGNORE INTO collections (id, name, slug, description, created_at) VALUES (?, ?, ?, ?, ?)',
      [col.id, col.name, col.slug, col.description, col.created_at]
    )
    console.log(`  ✅ ${col.name}`)
  }
}

// ── Step 4: Migrate Products ──
async function migrateProducts() {
  console.log('\n💍 Step 4: Migrating products...')
  
  const products = await supabaseQuery('products')
  console.log(`  Found ${products.length} products in Supabase`)
  
  for (const p of products) {
    await d1Query(
      `INSERT OR IGNORE INTO products (
        id, name, slug, description, featured, in_stock, is_active,
        category_id, collection_id, weight_grams, purity, metal_type,
        occasion, badges, seo_title, seo_description, new_arrival_until,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.name, p.slug, p.description,
        p.featured ? 1 : 0,
        p.in_stock ? 1 : 0,
        p.is_active ? 1 : 0,
        p.category_id, p.collection_id,
        p.weight_grams, p.purity, p.metal_type,
        JSON.stringify(p.occasion || []),
        JSON.stringify(p.badges || []),
        p.seo_title, p.seo_description, p.new_arrival_until,
        p.created_at, p.updated_at,
      ]
    )
    console.log(`  ✅ ${p.name}`)
  }
}

// ── Step 5: Migrate Product Images ──
async function migrateProductImages() {
  console.log('\n🖼️  Step 5: Migrating product images...')
  
  const images = await supabaseQuery('product_images')
  console.log(`  Found ${images.length} product images in Supabase`)
  
  for (const img of images) {
    await d1Query(
      'INSERT OR IGNORE INTO product_images (id, product_id, image_url, image_path, alt_text, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      [img.id, img.product_id, img.image_url, img.image_path, img.alt_text, img.display_order]
    )
    console.log(`  ✅ Image for product ${img.product_id}`)
  }
}

// ── Step 6: Create Admin User ──
async function createAdminUser() {
  console.log('\n👤 Step 6: Creating admin user...')
  
  const id = generateUUID()
  await d1Query(
    'INSERT OR IGNORE INTO admin_users (id, email, password_hash, created_at) VALUES (?, ?, ?, datetime(\'now\'))',
    [id, ADMIN_EMAIL, ADMIN_PASSWORD_HASH]
  )
  console.log(`  ✅ Admin user created: ${ADMIN_EMAIL}`)
}

// ── Step 7: Verify ──
async function verify() {
  console.log('\n🔍 Step 7: Verifying migration...')
  
  const cats = await d1Query('SELECT COUNT(*) as count FROM categories')
  const cols = await d1Query('SELECT COUNT(*) as count FROM collections')
  const prods = await d1Query('SELECT COUNT(*) as count FROM products')
  const imgs = await d1Query('SELECT COUNT(*) as count FROM product_images')
  const admins = await d1Query('SELECT COUNT(*) as count FROM admin_users')
  
  console.log(`  Categories:     ${cats.results[0].count}`)
  console.log(`  Collections:    ${cols.results[0].count}`)
  console.log(`  Products:       ${prods.results[0].count}`)
  console.log(`  Product Images: ${imgs.results[0].count}`)
  console.log(`  Admin Users:    ${admins.results[0].count}`)
}

// ── Main ──
async function main() {
  console.log('🚀 Starting Supabase → Cloudflare D1 Migration')
  console.log('================================================')
  
  try {
    await createTables()
    await migrateCategories()
    await migrateCollections()
    await migrateProducts()
    await migrateProductImages()
    await createAdminUser()
    await verify()
    
    console.log('\n================================================')
    console.log('✅ Migration complete!')
    console.log('\n⚠️  NOTE: Product images are still served from Supabase URLs.')
    console.log('   They will continue to work as long as Supabase is unpaused.')
    console.log('   To fully migrate images to R2, run: node scripts/migrate-images-to-r2.mjs')
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    process.exit(1)
  }
}

main()
