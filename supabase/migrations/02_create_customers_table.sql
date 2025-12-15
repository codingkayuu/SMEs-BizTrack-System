-- =============================================
-- CUSTOMERS TABLE
-- =============================================
-- This table stores customer information for each business.
-- Run this in your Supabase SQL Editor AFTER 01_create_businesses_table.sql

-- Create the customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access customers belonging to their business

-- SELECT: Users can read customers from their business
CREATE POLICY "Users can view own customers"
    ON public.customers
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

-- INSERT: Users can add customers to their business
CREATE POLICY "Users can create customers"
    ON public.customers
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

-- UPDATE: Users can update their own customers
CREATE POLICY "Users can update own customers"
    ON public.customers
    FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

-- DELETE: Users can delete their own customers
CREATE POLICY "Users can delete own customers"
    ON public.customers
    FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
