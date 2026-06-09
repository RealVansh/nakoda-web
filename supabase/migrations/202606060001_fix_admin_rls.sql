-- Fix Row Level Security policies for admin operations
-- Supabase best practice: Use a SECURITY DEFINER function to bypass RLS when checking admin permissions
-- This prevents issues where evaluating a policy on one table queries another table that also has RLS enabled.

-- 1. Create a secure function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$;

-- 2. Update Policies for Products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Update Policies for Categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Update Policies for Collections
DROP POLICY IF EXISTS "Admins can manage collections" ON public.collections;
CREATE POLICY "Admins can manage collections"
  ON public.collections
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Update Policies for Product Images
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images"
  ON public.product_images
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Update Policies for Inquiries
DROP POLICY IF EXISTS "Admins can read inquiries" ON public.inquiries;
CREATE POLICY "Admins can read inquiries"
  ON public.inquiries
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete inquiries" ON public.inquiries;
CREATE POLICY "Admins can delete inquiries"
  ON public.inquiries
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
