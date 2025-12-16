import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Save, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Customer } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const invoiceSchema = z.object({
    customerId: z.string().min(1, "Customer is required"),
    date: z.string(),
    dueDate: z.string(),
    items: z.array(z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.number().min(0, "Price must be positive"),
    })).min(1, "At least one item is required"),
    notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export function InvoiceFormPage() {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [submitting, setSubmitting] = useState(false);

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [{ description: '', quantity: 1, unitPrice: 0 }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const items = watch('items');
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.0; // TODO: Add tax optionality
    const total = subtotal + tax;

    useEffect(() => {
        if (user) {
            fetchCustomers();
            if (isEdit) fetchInvoice();
        }
    }, [user, id]);

    const fetchCustomers = async () => {
        const { data } = await supabase.from('customers').select('*').eq('user_id', user?.id);
        setCustomers(data as Customer[] || []);
    };

    const fetchInvoice = async () => {
        // TODO: Implement edit fetch
    };

    const onSubmit = async (data: InvoiceFormData) => {
        if (!user || !profile) return;
        setSubmitting(true);

        try {
            // Generate Invoice Number (Simple auto-increment logic for MVP)
            // In real app, use DB trigger or robust generation
            const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            const invoiceNumber = `INV-${new Date().getFullYear()}${new Date().getMonth() + 1}-${String((count || 0) + 1).padStart(4, '0')}`;

            // Create Invoice
            const { data: invoice, error: invError } = await supabase
                .from('invoices')
                .insert([{
                    user_id: user.id,
                    business_id: profile.id, // Assuming profile.id maps to business_id logic
                    customer_id: data.customerId,
                    invoice_number: invoiceNumber,
                    date: data.date,
                    due_date: data.dueDate,
                    status: 'unpaid',
                    subtotal,
                    tax_amount: tax,
                    total_amount: total,
                    notes: data.notes
                }])
                .select()
                .single();

            if (invError) throw invError;

            // Create Items
            if (invoice) {
                const invoiceItems = data.items.map(item => ({
                    invoice_id: invoice.id,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    amount: item.quantity * item.unitPrice
                }));

                const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);
                if (itemsError) throw itemsError;
            }

            navigate('/invoices');
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Failed to save invoice');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in-up duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={() => navigate('/invoices')} className="mr-4 text-gray-500 hover:text-[#7C3AED] transition-colors p-2 hover:bg-purple-50 rounded-full">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Header Info */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-purple-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6 stagger-1 animate-fade-in-up">
                    <div className="relative z-10">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Customer</label>
                        <select
                            {...register('customerId')}
                            className="mt-1 block w-full rounded-xl border-gray-200 dark:border-gray-700 shadow-sm focus:border-[#7C3AED] focus:ring-[#7C3AED] bg-white dark:bg-slate-900 sm:text-sm py-3 transition-all"
                        >
                            <option value="">Select a customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.customerId && <p className="mt-1 text-sm text-[#EF4444]">{errors.customerId.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Invoice Date</label>
                            <input type="date" {...register('date')} className="mt-1 block w-full rounded-xl border-gray-200 dark:border-gray-700 shadow-sm focus:border-[#7C3AED] focus:ring-[#7C3AED] bg-white dark:bg-slate-900 sm:text-sm py-3 transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                            <input type="date" {...register('dueDate')} className="mt-1 block w-full rounded-xl border-gray-200 dark:border-gray-700 shadow-sm focus:border-[#7C3AED] focus:ring-[#7C3AED] bg-white dark:bg-slate-900 sm:text-sm py-3 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-purple-100 dark:border-gray-700 stagger-2 animate-fade-in-up">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Items</h3>
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-all hover:border-[#7C3AED]/30">
                                <div className="flex-1">
                                    <input
                                        placeholder="Description"
                                        {...register(`items.${index}.description`)}
                                        className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm py-2"
                                    />
                                </div>
                                <div className="w-24">
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                        className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm py-2"
                                    />
                                </div>
                                <div className="w-32">
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                        className="block w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm focus:border-[#7C3AED] focus:ring-[#7C3AED] sm:text-sm py-2"
                                    />
                                </div>
                                <div className="w-24 py-2 text-right font-bold text-gray-900 dark:text-white">
                                    {formatCurrency((items[index]?.quantity || 0) * (items[index]?.unitPrice || 0))}
                                </div>
                                <button type="button" onClick={() => remove(index)} className="p-2 text-gray-400 hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                        className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                    </button>

                    {/* Totals */}
                    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 flex justify-end">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Tax (0%)</span>
                                <span>{formatCurrency(tax)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                                <span>Total</span>
                                <span className="text-[#7C3AED]">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-purple-100 dark:border-gray-700 stagger-3 animate-fade-in-up">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                    <textarea
                        {...register('notes')}
                        rows={3}
                        className="block w-full rounded-xl border-gray-200 dark:border-gray-700 shadow-sm focus:border-[#7C3AED] focus:ring-[#7C3AED] bg-white dark:bg-slate-900 sm:text-sm p-4 transition-all"
                        placeholder="Payment terms, thank you note, etc."
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center px-8 py-4 border border-transparent rounded-full shadow-lg text-lg font-medium text-white bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7C3AED] disabled:opacity-50 transition-all duration-300"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="-ml-1 mr-3 h-5 w-5" />
                                Save Invoice
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
