-- Drop the problematic ALL policy causing recursion on SELECT
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;

-- Drop new policies if they were already created (fixing 'already exists' error)
DROP POLICY IF EXISTS "Super admins can delete admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;

-- Re-create specific policies for write operations only
-- This ensures that SELECT (used in login) never triggers the recursive check
CREATE POLICY "Super admins can delete admin users"
ON public.admin_users
FOR DELETE
USING (public.check_is_super_admin());

CREATE POLICY "Super admins can insert admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (public.check_is_super_admin());

-- Note: UPDATE is already covered by "Users can update own admin profile"
-- But we should also allow Super Admins to update others if needed
CREATE POLICY "Super admins can update admin users"
ON public.admin_users
FOR UPDATE
USING (public.check_is_super_admin());
