-- =============================================
-- ADMIN PORTAL TABLES
-- =============================================
-- This migration creates tables for the admin portal.
-- Run this in your Supabase SQL Editor AFTER all other migrations.

-- =============================================
-- 1. ADMIN USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('super_admin', 'admin', 'analyst')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
-- Only admins can view admin users
CREATE POLICY "Admins can view admin users"
    ON public.admin_users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Only super_admin can manage admin users
CREATE POLICY "Super admins can insert admin users"
    ON public.admin_users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
        )
    );

CREATE POLICY "Super admins can update admin users"
    ON public.admin_users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
        )
    );

CREATE POLICY "Super admins can delete admin users"
    ON public.admin_users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
        )
    );

-- =============================================
-- 2. PLATFORM ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.platform_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    starts_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ends_at TIMESTAMPTZ,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'new_users', 'active_users')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.platform_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON public.platform_announcements(starts_at, ends_at);

-- Enable RLS
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active announcements
CREATE POLICY "Users can view active announcements"
    ON public.platform_announcements
    FOR SELECT
    USING (is_active = true AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW()));

-- Admins can view all announcements
CREATE POLICY "Admins can view all announcements"
    ON public.platform_announcements
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Admins can manage announcements
CREATE POLICY "Admins can insert announcements"
    ON public.platform_announcements
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.role IN ('super_admin', 'admin') AND au.is_active = true
        )
    );

CREATE POLICY "Admins can update announcements"
    ON public.platform_announcements
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.role IN ('super_admin', 'admin') AND au.is_active = true
        )
    );

CREATE POLICY "Admins can delete announcements"
    ON public.platform_announcements
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.role IN ('super_admin', 'admin') AND au.is_active = true
        )
    );

-- =============================================
-- 3. PLATFORM SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings
CREATE POLICY "Users can view settings"
    ON public.platform_settings
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only super_admin can manage settings
CREATE POLICY "Super admins can manage settings"
    ON public.platform_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
        )
    );

-- =============================================
-- 4. ADMIN RLS POLICIES FOR VIEWING ALL DATA
-- =============================================
-- Allow admins to view ALL businesses
CREATE POLICY "Admins can view all businesses"
    ON public.businesses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Allow admins to view ALL customers
CREATE POLICY "Admins can view all customers"
    ON public.customers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Allow admins to view ALL invoices
CREATE POLICY "Admins can view all invoices"
    ON public.invoices
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Allow admins to view ALL invoice items
CREATE POLICY "Admins can view all invoice items"
    ON public.invoice_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Allow admins to view ALL income
CREATE POLICY "Admins can view all income"
    ON public.income
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Allow admins to view ALL expenses
CREATE POLICY "Admins can view all expenses"
    ON public.expenses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- =============================================
-- 5. INSERT DEFAULT PLATFORM SETTINGS
-- =============================================
INSERT INTO public.platform_settings (key, value, description) VALUES
    ('platform_name', '"BizTrack Zambia"', 'The name of the platform'),
    ('support_email', '"support@biztrack.zm"', 'Platform support email'),
    ('max_businesses_per_user', '1', 'Maximum businesses a user can create'),
    ('enable_notifications', 'true', 'Enable/disable platform notifications'),
    ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
    ('default_currency', '"ZMW"', 'Default currency for the platform'),
    ('invoice_prefix', '"INV"', 'Default invoice number prefix')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 6. GRANT PERMISSIONS
-- =============================================
GRANT ALL ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
GRANT ALL ON public.platform_announcements TO authenticated;
GRANT ALL ON public.platform_announcements TO service_role;
GRANT ALL ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

-- =============================================
-- 7. FUNCTION TO UPDATE updated_at TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.platform_announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON public.platform_announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
