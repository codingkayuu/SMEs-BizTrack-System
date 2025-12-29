-- FINAL ADMIN AUTH RLS FIX
-- This script ensures no infinite recursion occurs during admin profile fetching.

-- 1. Create a SECURITY DEFINER function to check admin status.
-- This bypasses RLS on the table it queries, preventing recursion.
CREATE OR REPLACE FUNCTION public.is_admin_active(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = target_user_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Wipe existing policies to start fresh
DROP POLICY IF EXISTS "Allow users to view own admin profile" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can update own admin profile" ON public.admin_users;

-- 3. Create clean, non-recursive policies for admin_users
DROP POLICY IF EXISTS "admin_users_select_owner" ON public.admin_users;
CREATE POLICY "admin_users_select_owner" 
ON public.admin_users 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_users_select_all_admins" ON public.admin_users;
CREATE POLICY "admin_users_select_all_admins" 
ON public.admin_users 
FOR SELECT 
USING (public.is_admin_active(auth.uid()));

DROP POLICY IF EXISTS "admin_users_update_owner" ON public.admin_users;
CREATE POLICY "admin_users_update_owner" 
ON public.admin_users 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Fix other tables that check admin status
-- We must replace recursive EXISTS checks with function calls.

-- A. Businesses
DROP POLICY IF EXISTS "Admins can view all businesses" ON public.businesses;
CREATE POLICY "Admins can view all businesses"
ON public.businesses
FOR SELECT
USING (public.is_admin_active(auth.uid()));

-- B. Customers
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
CREATE POLICY "Admins can view all customers"
ON public.customers
FOR SELECT
USING (public.is_admin_active(auth.uid()));

-- C. Invoices
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
CREATE POLICY "Admins can view all invoices"
ON public.invoices
FOR SELECT
USING (public.is_admin_active(auth.uid()));

-- D. Invoice Items
DROP POLICY IF EXISTS "Admins can view all invoice items" ON public.invoice_items;
CREATE POLICY "Admins can view all invoice items"
ON public.invoice_items
FOR SELECT
USING (public.is_admin_active(auth.uid()));

-- E. Income
DROP POLICY IF EXISTS "Admins can view all income" ON public.income;
CREATE POLICY "Admins can view all income"
ON public.income
FOR SELECT
USING (public.is_admin_active(auth.uid()));

-- F. Expenses
DROP POLICY IF EXISTS "Admins can view all expenses" ON public.expenses;
CREATE POLICY "Admins can view all expenses"
ON public.expenses
FOR SELECT
USING (public.is_admin_active(auth.uid()));

-- 5. Super Admin management

CREATE OR REPLACE FUNCTION public.is_super_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = target_user_id
    AND role = 'super_admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "admin_users_super_admin_all" ON public.admin_users;
CREATE POLICY "admin_users_super_admin_all" 
ON public.admin_users 
FOR ALL 
USING (public.is_super_admin(auth.uid()));

-- 4. Verify policies
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'admin_users';
