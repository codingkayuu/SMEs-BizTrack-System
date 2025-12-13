export interface BusinessProfile {
    id: string;
    user_id: string;
    business_name: string;
    owner_name: string;
    phone_number: string;
    email?: string;
    address?: string;
    tpin?: string;
    business_type?: string;
    logo_url?: string;
    created_at: string;
}

export interface Customer {
    id: string;
    business_id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    created_at: string;
}

export interface Invoice {
    id: string;
    business_id: string;
    customer_id: string;
    invoice_number: string;
    date: string;
    due_date: string;
    status: 'unpaid' | 'paid' | 'overdue';
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    payment_method?: string;
    paid_date?: string;
    created_at: string;
    customer?: Customer; // Joined
    items?: InvoiceItem[]; // Joined
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface Income {
    id: string;
    business_id: string;
    date: string;
    amount: number;
    category: 'product_sale' | 'service' | 'other';
    payment_method: 'cash' | 'mtn' | 'airtel' | 'bank';
    description?: string;
    customer_id?: string;
    invoice_id?: string;
    created_at: string;
    customer?: Customer; // Joined
}

export interface Expense {
    id: string;
    business_id: string;
    date: string;
    amount: number;
    category: 'stock' | 'transport' | 'rent' | 'utilities' | 'salaries' | 'marketing' | 'other';
    payment_method: 'cash' | 'mtn' | 'airtel' | 'bank';
    vendor?: string;
    description?: string;
    receipt_url?: string;
    created_at: string;
}
