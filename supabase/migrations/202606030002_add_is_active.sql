-- Add is_active flag for drafting products
alter table public.products add column if not exists is_active boolean not null default true;

-- Update RLS Policies for Products
-- 1. Drop the old public read policy
drop policy if exists "Public can read products" on public.products;

-- 2. New Public Read Policy: Only read products where is_active is true
create policy "Public can read active products"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

-- 3. The existing Admin policy ("Admins can manage products" for ALL using exists(admin_users))
-- already allows admins to read ALL products (active and inactive). No change required there.
-- However, just to be explicit if there's any conflict, we ensure admins have a SELECT policy that overrides the public one if needed.
-- The existing ALL policy already grants SELECT using the admin_users check, so it covers `is_active = false`.
