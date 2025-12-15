-- =============================================
-- BUSINESSES TABLE (User Business Profiles)
-- =============================================
-- This table stores business information linked to authenticated users.
-- Run this in your Supabase SQL Editor.

-- Create the businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    address TEXT,
    tpin TEXT,
    business_type TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);

-- Enable Row Level Security
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own business profile

-- SELECT: Users can read their own business
CREATE POLICY "Users can view own business"
    ON public.businesses
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Users can create their own business profile
CREATE POLICY "Users can create own business"
    ON public.businesses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own business
CREATE POLICY "Users can update own business"
    ON public.businesses
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own business
CREATE POLICY "Users can delete own business"
    ON public.businesses
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
