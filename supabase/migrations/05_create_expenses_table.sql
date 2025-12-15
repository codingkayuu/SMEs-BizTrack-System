-- =============================================
-- EXPENSES TABLE
-- =============================================
-- This table stores expense entries for each business.
-- Run this in your Supabase SQL Editor AFTER 04_create_income_table.sql

-- Create expense category enum type
DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM ('stock', 'transport', 'rent', 'utilities', 'salaries', 'marketing', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category expense_category NOT NULL,
    payment_method payment_method NOT NULL,
    vendor TEXT,
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON public.expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies

CREATE POLICY "Users can view own expenses"
    ON public.expenses
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create expenses"
    ON public.expenses
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own expenses"
    ON public.expenses
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

CREATE POLICY "Users can delete own expenses"
    ON public.expenses
    FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
