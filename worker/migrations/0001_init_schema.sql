-- Nakoda Jewellery — D1 (SQLite) Schema
-- Equivalent of the original PostgreSQL / Supabase schema.
-- Arrays (occasion, badges) are stored as JSON text strings, e.g. '["Wedding","Festive"]'.

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  in_stock INTEGER NOT NULL DEFAULT 1 CHECK (in_stock IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL,
  weight_grams REAL CHECK (weight_grams >= 0),
  purity TEXT,
  metal_type TEXT,
  occasion TEXT NOT NULL DEFAULT '[]',
  badges TEXT NOT NULL DEFAULT '[]',
  seo_title TEXT,
  seo_description TEXT,
  new_arrival_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_active, featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created_active ON products(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- FTS Search
CREATE VIRTUAL TABLE IF NOT EXISTS products_search USING fts5(
  id UNINDEXED,
  name,
  description
);

CREATE TRIGGER IF NOT EXISTS products_search_insert AFTER INSERT ON products
BEGIN
  INSERT INTO products_search(id, name, description) VALUES (new.id, new.name, new.description);
END;

CREATE TRIGGER IF NOT EXISTS products_search_update AFTER UPDATE ON products
BEGIN
  DELETE FROM products_search WHERE id = old.id;
  INSERT INTO products_search(id, name, description) VALUES (new.id, new.name, new.description);
END;

CREATE TRIGGER IF NOT EXISTS products_search_delete AFTER DELETE ON products
BEGIN
  DELETE FROM products_search WHERE id = old.id;
END;

