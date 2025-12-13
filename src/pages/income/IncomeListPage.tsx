import { useEffect, useState } from 'react';
import { Plus, TrendingUp, Trash2, Edit, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Income, Customer } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const incomeSchema = z.object({
    date: z.string(),
    amount: z.number().min(0.01, "Amount must be positive"),
    category: z.enum(['product_sale', 'service', 'other']),
    payment_method: z.enum(['cash', 'mtn', 'airtel', 'bank']),
    description: z.string().optional(),
    customer_id: z.string().optional().or(z.literal('')),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

export function IncomeListPage() {
    const { user } = useAuth();
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<IncomeFormData>({
        resolver: zodResolver(incomeSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            category: 'product_sale',
            payment_method: 'cash',
        }
    });

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        try {
            const [incomeRes, customerRes] = await Promise.all([
                supabase.from('income').select('*, customer:customers(name)').eq('user_id', user.id).order('date', { ascending: false }),
                supabase.from('customers').select('*').eq('user_id', user.id)
            ]);

            if (incomeRes.error) throw incomeRes.error;
            if (customerRes.error) throw customerRes.error;

            setIncomes(incomeRes.data as Income[]);
            setCustomers(customerRes.data as Customer[]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: IncomeFormData) => {
        if (!user) return;
        setSubmitting(true);
        try {
            const payload = {
                ...data,
                customer_id: data.customer_id || null, // Handle empty string as null
                user_id: user.id,
                business_id: user.id // Simplified
            };

            if (editingIncome) {
                const { error } = await supabase.from('income').update(payload).eq('id', editingIncome.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('income').insert([payload]);
                if (error) throw error;
            }

            await fetchData();
            closeModal();
        } catch (error) {
            console.error('Error saving income:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const { error } = await supabase.from('income').delete().eq('id', id);
            if (error) throw error;
            setIncomes(incomes.filter(i => i.id !== id));
        } catch (error) {
            console.error('Error deleting income:', error);
        }
    };

    const openModal = (income?: Income) => {
        if (income) {
            setEditingIncome(income);
            reset({
                date: income.date,
                amount: income.amount,
                category: income.category,
                payment_method: income.payment_method,
                description: income.description || '',
                customer_id: income.customer_id || '',
            });
        } else {
            setEditingIncome(null);
            reset({
                date: new Date().toISOString().split('T')[0],
                amount: undefined, // Let placeholder show
                category: 'product_sale',
                payment_method: 'cash',
                description: '',
                customer_id: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingIncome(null);
        reset();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Income</h1>
                <button
                    onClick={() => openModal()}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income
                </button>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
                ) : incomes.length === 0 ? (
                    <div className="p-12 text-center">
                        <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No income recorded</h3>
                        <p className="mt-1 text-gray-500">Record your first sale or service income.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">category</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {incomes.map((income) => (
                                    <tr key={income.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(income.date)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="font-medium">{income.description || '-'}</div>
                                            {income.customer && <div className="text-xs text-gray-500">{income.customer.name}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{income.category.replace('_', ' ')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{income.payment_method}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">+{formatCurrency(income.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal(income)} className="text-primary-600 hover:text-primary-900 mr-4"><Edit className="h-4 w-4" /></button>
                                            <button onClick={() => handleDelete(income.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={closeModal}><div className="absolute inset-0 bg-gray-500 opacity-75"></div></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{editingIncome ? 'Edit Income' : 'Add Income'}</h3>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date</label>
                                    <input type="date" {...register('date')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Amount (ZMW)</label>
                                    <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2" />
                                    {errors.amount && <p className="text-red-600 text-xs mt-1">{errors.amount.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <select {...register('category')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2">
                                        <option value="product_sale">Product Sale</option>
                                        <option value="service">Service</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                                    <select {...register('payment_method')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2">
                                        <option value="cash">Cash</option>
                                        <option value="mtn">MTN Mobile Money</option>
                                        <option value="airtel">Airtel Money</option>
                                        <option value="bank">Bank Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Customer (Optional)</label>
                                    <select {...register('customer_id')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2">
                                        <option value="">None</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea {...register('description')} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="What was this for?" />
                                </div>
                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button type="submit" disabled={submitting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none sm:col-start-2 sm:text-sm">
                                        {submitting ? 'Saving...' : 'Save'}
                                    </button>
                                    <button type="button" onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
