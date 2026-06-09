-- Add product weight and purity
alter table public.products
  add column if not exists weight_grams numeric(10,3) null,
  add column if not exists purity text null;
