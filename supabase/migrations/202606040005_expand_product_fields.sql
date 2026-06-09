-- Phase 1: Expand product fields for premium jewellery UX
-- Adds: metal_type, occasion tags, badges, SEO overrides, and full-text search.

-- ─── New Columns ────────────────────────────────────────────────────────────

alter table public.products
  add column if not exists metal_type text null,
  add column if not exists occasion text[] not null default '{}',
  add column if not exists badges text[] not null default '{}',
  add column if not exists seo_title text null,
  add column if not exists seo_description text null;

-- ─── Indexes for Filtering ─────────────────────────────────────────────────

create index if not exists products_metal_type_idx
  on public.products (metal_type);

create index if not exists products_occasion_gin_idx
  on public.products using gin (occasion);

create index if not exists products_badges_gin_idx
  on public.products using gin (badges);

-- ─── Full-Text Search ───────────────────────────────────────────────────────

alter table public.products
  add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index if not exists products_fts_idx
  on public.products using gin (fts);
