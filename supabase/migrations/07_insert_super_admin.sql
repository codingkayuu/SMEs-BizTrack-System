-- =============================================
-- INSERT SUPER ADMIN USER
-- =============================================
-- IMPORTANT: Run this AFTER the user has signed up with email: codingkayuu@gmail.com
-- 
-- This script inserts the super admin user into the admin_users table.
-- The user must already exist in auth.users table.
--
-- RUN STEPS:
-- 1. First, sign up at /finflow/admin/login with email: codingkayuu@gmail.com, password: sydney2002
-- 2. Then run this SQL in Supabase SQL Editor:

-- Insert super admin (replace the user_id with actual UUID from auth.users after signup)
INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
SELECT 
    id,
    'codingkayuu@gmail.com',
    'Sydney Mulando',
    'super_admin',
    true
FROM auth.users 
WHERE email = 'codingkayuu@gmail.com'
ON CONFLICT (email) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    updated_at = NOW();
