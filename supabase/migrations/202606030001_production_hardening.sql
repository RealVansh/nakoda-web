-- Production hardening for Nakoda Web.
-- Apply this in Supabase before promoting the application.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.product_images enable row level security;
alter table public.inquiries enable row level security;

drop policy if exists "Admins can read their admin record" on public.admin_users;
create policy "Admins can read their admin record"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products
  for all
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories
  for all
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Public can read collections" on public.collections;
create policy "Public can read collections"
  on public.collections
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage collections" on public.collections;
create policy "Admins can manage collections"
  on public.collections
  for all
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Public can read product images" on public.product_images;
create policy "Public can read product images"
  on public.product_images
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images"
  on public.product_images
  for all
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Public can submit inquiries" on public.inquiries;
create policy "Public can submit inquiries"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read inquiries" on public.inquiries;
create policy "Admins can read inquiries"
  on public.inquiries
  for select
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can delete inquiries" on public.inquiries;
create policy "Admins can delete inquiries"
  on public.inquiries
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()));

create unique index if not exists categories_slug_unique_idx on public.categories (slug);
create unique index if not exists collections_slug_unique_idx on public.collections (slug);
create unique index if not exists products_slug_unique_idx on public.products (slug);
create index if not exists products_category_created_idx on public.products (category_id, created_at desc);
create index if not exists products_collection_created_idx on public.products (collection_id, created_at desc);
create index if not exists products_featured_created_idx on public.products (featured, created_at desc);
create index if not exists product_images_product_order_idx on public.product_images (product_id, display_order);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
create index if not exists inquiries_product_created_idx on public.inquiries (product_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_images_product_fk'
  ) then
    alter table public.product_images
      add constraint product_images_product_fk
      foreign key (product_id) references public.products(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'inquiries_product_fk'
  ) then
    alter table public.inquiries
      add constraint inquiries_product_fk
      foreign key (product_id) references public.products(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_slug_format_check'
  ) then
    alter table public.products
      add constraint products_slug_format_check
      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'categories_slug_format_check'
  ) then
    alter table public.categories
      add constraint categories_slug_format_check
      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'collections_slug_format_check'
  ) then
    alter table public.collections
      add constraint collections_slug_format_check
      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'product_images_display_order_check'
  ) then
    alter table public.product_images
      add constraint product_images_display_order_check
      check (display_order >= 0);
  end if;
end $$;

drop policy if exists "Public can read product storage images" on storage.objects;
create policy "Public can read product storage images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product storage images" on storage.objects;
create policy "Admins can upload product storage images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and name like 'products/%'
    and exists (select 1 from public.admin_users where user_id = auth.uid())
  );

drop policy if exists "Admins can delete product storage images" on storage.objects;
create policy "Admins can delete product storage images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and name like 'products/%'
    and exists (select 1 from public.admin_users where user_id = auth.uid())
  );
