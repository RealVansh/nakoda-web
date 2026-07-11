import { Hono } from 'hono'

type Env = {
  DB: D1Database
  API_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || authHeader !== `Bearer ${c.env.API_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

// Error Handler
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

// ── Categories ──
app.get('/api/categories', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM categories ORDER BY created_at DESC').all()
  return c.json({ results: result.results })
})

app.post('/api/categories', async (c) => {
  const { id, name, slug } = await c.req.json()
  await c.env.DB.prepare(
    "INSERT INTO categories (id, name, slug, created_at) VALUES (?, ?, ?, datetime('now'))"
  ).bind(id, name, slug).run()
  return c.json({ success: true })
})

app.delete('/api/categories/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ── Collections ──
app.get('/api/collections', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM collections ORDER BY created_at DESC').all()
  return c.json({ results: result.results })
})

app.post('/api/collections', async (c) => {
  const { id, name, slug, description } = await c.req.json()
  await c.env.DB.prepare(
    "INSERT INTO collections (id, name, slug, description, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
  ).bind(id, name, slug, description).run()
  return c.json({ success: true })
})

app.delete('/api/collections/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM collections WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ── Products ──

const BASE_SELECT = `
  SELECT p.*, c.name as category_name, col.name as collection_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN collections col ON p.collection_id = col.id
`

async function fetchProductImages(db: D1Database, productIds: string[]) {
  if (productIds.length === 0) return []
  const placeholders = productIds.map(() => '?').join(',')
  const result = await db.prepare(
    `SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY display_order`
  ).bind(...productIds).all()
  return result.results
}

app.get('/api/products', async (c) => {
  const result = await c.env.DB.prepare(`${BASE_SELECT} WHERE p.is_active = 1 ORDER BY p.created_at DESC`).all()
  const images = await fetchProductImages(c.env.DB, result.results.map(p => p.id as string))
  return c.json({ products: result.results, images })
})

app.get('/api/products/admin', async (c) => {
  const result = await c.env.DB.prepare(`${BASE_SELECT} ORDER BY p.created_at DESC`).all()
  const images = await fetchProductImages(c.env.DB, result.results.map(p => p.id as string))
  return c.json({ products: result.results, images })
})

app.post('/api/products/paginated', async (c) => {
  const params = await c.req.json()
  const {
    page = 1,
    limit = 12,
    categoryId,
    collectionId,
    occasion,
    metalType,
    purity,
    inStock,
    badge,
    sort = 'newest',
    search,
  } = params

  const safePage = Math.max(1, page)
  const safeLimit = Math.min(Math.max(1, limit), 48)
  const offset = (safePage - 1) * safeLimit

  const conditions: string[] = ['p.is_active = 1']
  const queryParams: any[] = []

  if (categoryId) { conditions.push('p.category_id = ?'); queryParams.push(categoryId) }
  if (collectionId) { conditions.push('p.collection_id = ?'); queryParams.push(collectionId) }
  if (metalType) { conditions.push('p.metal_type = ?'); queryParams.push(metalType) }
  if (purity) { conditions.push('p.purity = ?'); queryParams.push(purity) }
  if (inStock !== undefined) { conditions.push('p.in_stock = ?'); queryParams.push(inStock ? 1 : 0) }
  if (occasion) { conditions.push('p.occasion LIKE ?'); queryParams.push(`%"${occasion}"%`) }
  if (badge === 'New Arrival') {
    conditions.push(`p.badges LIKE '%"New Arrival"%'`)
    conditions.push('p.new_arrival_until >= ?')
    queryParams.push(new Date().toISOString())
  } else if (badge) {
    conditions.push('p.badges LIKE ?')
    queryParams.push(`%"${badge}"%`)
  }
  if (search) {
    conditions.push('p.id IN (SELECT id FROM products_search WHERE products_search MATCH ?)')
    // Sanitize search query for FTS5 (remove special characters)
    const sanitizedSearch = search.replace(/[^a-zA-Z0-9\s]/g, '')
    queryParams.push(`${sanitizedSearch}*`)
  }

  const whereClause = conditions.join(' AND ')
  let orderClause: string
  switch (sort) {
    case 'oldest': orderClause = 'ORDER BY p.created_at ASC'; break
    case 'name-asc': orderClause = 'ORDER BY p.name ASC'; break
    case 'name-desc': orderClause = 'ORDER BY p.name DESC'; break
    default: orderClause = 'ORDER BY p.created_at DESC'
  }

  const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM products p WHERE ${whereClause}`).bind(...queryParams).first()
  const total = countResult?.count ?? 0

  const result = await c.env.DB.prepare(
    `${BASE_SELECT} WHERE ${whereClause} ${orderClause} LIMIT ? OFFSET ?`
  ).bind(...queryParams, safeLimit, offset).all()

  const images = await fetchProductImages(c.env.DB, result.results.map(p => p.id as string))

  return c.json({ products: result.results, images, total, pages: Math.ceil(Number(total) / safeLimit) })
})

app.get('/api/products/featured', async (c) => {
  const result = await c.env.DB.prepare(
    `${BASE_SELECT} WHERE p.is_active = 1 AND p.featured = 1 ORDER BY p.created_at DESC LIMIT 8`
  ).all()
  const images = await fetchProductImages(c.env.DB, result.results.map(p => p.id as string))
  return c.json({ products: result.results, images })
})

app.post('/api/products/new-arrivals', async (c) => {
  const { limit = 8, dateString } = await c.req.json()
  const result = await c.env.DB.prepare(
    `${BASE_SELECT} WHERE p.is_active = 1 AND p.badges LIKE '%"New Arrival"%' AND p.new_arrival_until >= ? ORDER BY p.created_at DESC LIMIT ?`
  ).bind(dateString, limit).all()
  const images = await fetchProductImages(c.env.DB, result.results.map(p => p.id as string))
  return c.json({ products: result.results, images })
})

app.post('/api/products/related', async (c) => {
  const { categoryId, excludeProductId, limit = 4 } = await c.req.json()
  let sql = `${BASE_SELECT} WHERE p.is_active = 1 AND p.id != ?`
  const params: any[] = [excludeProductId]
  if (categoryId) {
    sql += ' AND p.category_id = ?'
    params.push(categoryId)
  }
  sql += ' ORDER BY p.created_at DESC LIMIT ?'
  params.push(limit)

  const result = await c.env.DB.prepare(sql).bind(...params).all()
  const images = await fetchProductImages(c.env.DB, result.results.map(p => p.id as string))
  return c.json({ products: result.results, images })
})

app.post('/api/products/search', async (c) => {
  const { searchQuery, limit = 12 } = await c.req.json()
  const sanitizedSearch = searchQuery.replace(/[^a-zA-Z0-9\s]/g, '')
  const result = await c.env.DB.prepare(
    `${BASE_SELECT} WHERE p.is_active = 1 AND p.id IN (SELECT id FROM products_search WHERE products_search MATCH ?) ORDER BY p.created_at DESC LIMIT ?`
  ).bind(`${sanitizedSearch}*`, limit).all()
  const images = await fetchProductImages(c.env.DB, result.results.map(p => p.id as string))
  return c.json({ products: result.results, images })
})

app.get('/api/products/slugs', async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT slug, updated_at, created_at FROM products WHERE is_active = 1 ORDER BY updated_at DESC`
  ).all()
  return c.json({ results: result.results })
})

app.get('/api/products/:id', async (c) => {
  const id = c.req.param('id')
  const product = await c.env.DB.prepare(`SELECT p.* FROM products p WHERE p.id = ?`).bind(id).first()
  if (!product) return c.json({ product: null })
  const images = await fetchProductImages(c.env.DB, [id])
  return c.json({ product, images })
})

app.get('/api/products/by-slug/:slug', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(`${BASE_SELECT} WHERE p.is_active = 1 AND p.slug = ?`).bind(slug).first()
  if (!product) return c.json({ product: null })
  const images = await fetchProductImages(c.env.DB, [product.id as string])
  return c.json({ product, images })
})

app.post('/api/products', async (c) => {
  const body = await c.req.json()
  await c.env.DB.prepare(
    `INSERT INTO products (
      id, name, slug, description, featured, in_stock, is_active,
      category_id, collection_id, weight_grams, purity, metal_type,
      occasion, badges, seo_title, seo_description,
      new_arrival_until, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(...body.params).run()
  return c.json({ success: true })
})

app.put('/api/products/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  await c.env.DB.prepare(
    `UPDATE products SET
      name = ?, slug = ?, description = ?, featured = ?, in_stock = ?, is_active = ?,
      category_id = ?, collection_id = ?, weight_grams = ?, purity = ?, metal_type = ?,
      occasion = ?, badges = ?, seo_title = ?, seo_description = ?,
      new_arrival_until = ?, updated_at = datetime('now')
    WHERE id = ?`
  ).bind(...body.params, id).run()
  
  const updated = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first()
  return c.json({ success: true, updated })
})

app.delete('/api/products/:id', async (c) => {
  const id = c.req.param('id')
  const images = await c.env.DB.prepare(`SELECT image_path FROM product_images WHERE product_id = ?`).bind(id).all()
  await c.env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run()
  return c.json({ success: true, images: images.results })
})

app.get('/api/products/images/:productId/max-order', async (c) => {
  const productId = c.req.param('productId')
  const result = await c.env.DB.prepare(
    `SELECT MAX(display_order) as max_order FROM product_images WHERE product_id = ?`
  ).bind(productId).first()
  return c.json({ max_order: result?.max_order ?? null })
})

app.post('/api/products/images', async (c) => {
  const body = await c.req.json()
  const [id, product_id, image_url, image_path, alt_text, fallback_display_order] = body.params
  
  await c.env.DB.prepare(
    `INSERT INTO product_images (id, product_id, image_url, image_path, alt_text, display_order)
     VALUES (?, ?, ?, ?, ?, COALESCE((SELECT MAX(display_order) + 1 FROM product_images WHERE product_id = ?), 0))`
  ).bind(id, product_id, image_url, image_path, alt_text, product_id).run()
  
  return c.json({ success: true })
})

app.get('/api/product-images/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    `SELECT id, product_id, image_path FROM product_images WHERE id = ?`
  ).bind(id).first()
  return c.json({ image: result })
})

app.delete('/api/product-images/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM product_images WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// Authentication
app.post('/api/auth/admin', async (c) => {
  const { email } = await c.req.json()
  const result = await c.env.DB.prepare(
    `SELECT id, password_hash, failed_login_attempts, locked_until FROM admin_users WHERE email = ?`
  ).bind(email).first()
  return c.json({ user: result })
})

app.post('/api/auth/admin/fail', async (c) => {
  const { email } = await c.req.json()
  const user = await c.env.DB.prepare(`SELECT failed_login_attempts FROM admin_users WHERE email = ?`).bind(email).first()
  if (!user) return c.json({ success: false })
  
  const attempts = (user.failed_login_attempts as number) + 1
  let lockedUntil = null
  if (attempts >= 5) {
    lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  }
  
  await c.env.DB.prepare(
    `UPDATE admin_users SET failed_login_attempts = ?, locked_until = ? WHERE email = ?`
  ).bind(attempts, lockedUntil, email).run()
  
  return c.json({ success: true })
})

app.post('/api/auth/admin/success', async (c) => {
  const { email } = await c.req.json()
  await c.env.DB.prepare(
    `UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL WHERE email = ?`
  ).bind(email).run()
  return c.json({ success: true })
})

export default app
