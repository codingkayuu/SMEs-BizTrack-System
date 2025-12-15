-- =============================================
-- INCOME TABLE
-- =============================================
-- This table stores income/revenue entries for each business.
-- Run this in your Supabase SQL Editor AFTER 03_create_invoices_tables.sql

-- Create income category enum type
DO $$ BEGIN
    CREATE TYPE income_category AS ENUM ('product_sale', 'service', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payment method enum type
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'mtn', 'airtel', 'bank');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the income table
CREATE TABLE IF NOT EXISTS public.income (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category income_category NOT NULL,
    payment_method payment_method NOT NULL,
    description TEXT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_income_business_id ON public.income(business_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON public.income(date);
CREATE INDEX IF NOT EXISTS idx_income_category ON public.income(category);

-- Enable Row Level Security
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

-- RLS Policies

CREATE POLICY "Users can view own income"
    ON public.income
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create income"
    ON public.income
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own income"
    ON public.income
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

CREATE POLICY "Users can delete own income"
    ON public.income
    FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.income TO authenticated;
GRANT ALL ON public.income TO service_role;
