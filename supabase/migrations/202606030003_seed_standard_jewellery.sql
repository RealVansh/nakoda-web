-- Seed standard categories
insert into public.categories (name, slug) values
  ('Rings', 'rings'),
  ('Necklaces', 'necklaces'),
  ('Earrings', 'earrings'),
  ('Bangles', 'bangles'),
  ('Bracelets', 'bracelets'),
  ('Pendants', 'pendants'),
  ('Chains', 'chains'),
  ('Mangalsutra', 'mangalsutra'),
  ('Nose Pins', 'nose-pins'),
  ('Anklets', 'anklets');

-- Seed standard collections
insert into public.collections (name, slug) values
  ('Bridal Collection', 'bridal-collection'),
  ('Daily Wear', 'daily-wear'),
  ('Men''s Collection', 'mens-collection'),
  ('Temple Jewellery', 'temple-jewellery'),
  ('Antique Collection', 'antique-collection'),
  ('Festive Collection', 'festive-collection');
