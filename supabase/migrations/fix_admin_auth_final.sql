/*
    FINAL ADMIN AUTH FIX - DEEP CLEAN
    =================================
    
    PROBLEM ANALYSIS:
    -----------------
    The "Initializing auth timed out" error occurs because the database query 
    checking for the admin profile is hanging indefinitely.
    
    ROOT CAUSE:
    1. RECURSION: The `admin_users` table had a policy checking `is_super_admin`, 
       which in turn queried `admin_users`, creating an infinite loop.
    2. LOCKS: Previous timed-out attempts have likely left "zombie" connections 
       holding locks on your user row.
    
    SOLUTION:
    This script performs a "Nuclear Option" reset on the security policies:
    1. Forces the helper function `check_is_super_admin` to use SECURITY DEFINER.
       (This allows it to bypass RLS and prevents recursion loops entirely).
    2. Drops ALL existing policies on `admin_users` to ensure no bad rules remain.
    3. Re-creates policies using the "Cycle-Safe" pattern:
       - SELECT: Strictly limited to own user ID (no complex logic).
       - WRITE: Separated by operation (INSERT/UPDATE/DELETE).
*/

-- 1. FIX THE HELPER FUNCTION (Anti-Recursion Shield)
-- Setting SECURITY DEFINER means this runs as the database owner,
-- avoiding infinite RLS loops when checking admin status.
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. WIPE CLEAN (Drop ALL potential conflict policies)
DROP POLICY IF EXISTS "Allow authenticated users to view admin profiles" ON public.admin_users;
DROP POLICY IF EXISTS "Allow users to view own admin profile" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can update own admin profile" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all businesses" ON public.businesses; -- Cleanup related business policy if it exists

-- 3. REBUILD POLICIES (clean, non-recursive rules)

-- A. "READ YOURSELF" (Cycle-Safe Select)
-- Simple, direct comparison. No possibility of recursion.
CREATE POLICY "Allow users to view own admin profile"
ON public.admin_users
FOR SELECT
USING (auth.uid() = user_id);

-- B. "UPDATE YOURSELF"
CREATE POLICY "Users can update own admin profile"
ON public.admin_users
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- C. SUPER ADMIN POWERS (Write-Only)
-- Restricted to specific operations to prevent SELECT recursion
CREATE POLICY "Super admins can delete admin users"
ON public.admin_users
FOR DELETE
USING (public.check_is_super_admin());

CREATE POLICY "Super admins can insert admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (public.check_is_super_admin());

-- D. SUPER ADMIN UPDATE (Managing others)
CREATE POLICY "Super admins can update admin users"
ON public.admin_users
FOR UPDATE
USING (public.check_is_super_admin());

-- Verify the result
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'admin_users';
