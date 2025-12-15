-- =============================================
-- INVOICES AND INVOICE_ITEMS TABLES
-- =============================================
-- These tables store invoice data and line items.
-- Run this in your Supabase SQL Editor AFTER 02_create_customers_table.sql

-- Create invoice status enum type
DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('unpaid', 'paid', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status DEFAULT 'unpaid' NOT NULL,
    subtotal DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    total_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    notes TEXT,
    payment_method TEXT,
    paid_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Create the invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1 NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for INVOICES

CREATE POLICY "Users can view own invoices"
    ON public.invoices
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create invoices"
    ON public.invoices
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own invoices"
    ON public.invoices
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

CREATE POLICY "Users can delete own invoices"
    ON public.invoices
    FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for INVOICE_ITEMS

CREATE POLICY "Users can view own invoice items"
    ON public.invoice_items
    FOR SELECT
    USING (
        invoice_id IN (
            SELECT i.id FROM public.invoices i
            JOIN public.businesses b ON i.business_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create invoice items"
    ON public.invoice_items
    FOR INSERT
    WITH CHECK (
        invoice_id IN (
            SELECT i.id FROM public.invoices i
            JOIN public.businesses b ON i.business_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own invoice items"
    ON public.invoice_items
    FOR UPDATE
    USING (
        invoice_id IN (
            SELECT i.id FROM public.invoices i
            JOIN public.businesses b ON i.business_id = b.id
            WHERE b.user_id = auth.uid()
        )
    )
    WITH CHECK (
        invoice_id IN (
            SELECT i.id FROM public.invoices i
            JOIN public.businesses b ON i.business_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own invoice items"
    ON public.invoice_items
    FOR DELETE
    USING (
        invoice_id IN (
            SELECT i.id FROM public.invoices i
            JOIN public.businesses b ON i.business_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
GRANT ALL ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
