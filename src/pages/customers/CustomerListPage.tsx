import { useEffect, useState } from 'react';
import { Plus, Search, Users, Phone, Mail, MapPin, Trash2, Edit, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Customer } from '../../types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema for Add/Edit Customer
const customerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal('')),
    address: z.string().optional(),
    notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export function CustomerListPage() {
    const { user, profile } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form setup
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema)
    });

    useEffect(() => {
        fetchCustomers();
    }, [user, profile]);

    const fetchCustomers = async () => {
        if (!user || !profile) return;
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', profile.id)
                .order('name');

            if (error) throw error;
            setCustomers(data as Customer[]);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: CustomerFormData) => {
        if (!user || !profile) return;
        setSubmitting(true);
        try {
            if (editingCustomer) {
                const { error } = await supabase
                    .from('customers')
                    .update(data)
                    .eq('id', editingCustomer.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('customers')
                    .insert([{ ...data, business_id: profile.id }]);
                if (error) throw error;
            }

            await fetchCustomers();
            closeModal();
        } catch (error) {
            console.error('Error saving customer:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) throw error;
            setCustomers(customers.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Failed to delete customer. They may have linked invoices.');
        }
    };

    const openModal = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            reset({
                name: customer.name,
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                notes: customer.notes || '',
            });
        } else {
            setEditingCustomer(null);
            reset({ name: '', phone: '', email: '', address: '', notes: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        reset();
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in-up duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Customers</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">Manage your client relationships and details.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Customer
                </button>
            </div>

            {/* Search */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 stagger-1 animate-fade-in-up">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 border-slate-200 dark:border-gray-700 rounded-xl focus:ring-emerald-600 focus:border-emerald-600 bg-white dark:bg-slate-900 sm:text-sm py-3 transition-shadow"
                        placeholder="Search customers by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                </div>
            ) : filteredCustomers.length === 0 ? (
                <div className="p-16 text-center bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-emerald-200 dark:border-gray-700 backdrop-blur-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4 animate-pulse">
                        <Users className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No customers found</h3>
                    <p className="mt-2 text-slate-500 dark:text-gray-400">Add your first customer to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-2 animate-fade-in-up">
                    {filteredCustomers.map((customer, index) => (
                        <div
                            key={customer.id}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden animate-fade-in-up"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-600 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 font-bold text-lg">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{customer.name}</h3>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(customer)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(customer.id)} className="p-2 text-slate-400 hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-slate-50 dark:border-gray-700/50">
                                {customer.phone && (
                                    <div className="flex items-center text-sm text-slate-600 dark:text-gray-400">
                                        <Phone className="h-4 w-4 mr-3 text-emerald-400" />
                                        <a href={`tel:${customer.phone}`} className="hover:text-emerald-600 transition-colors">{customer.phone}</a>
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center text-sm text-slate-600 dark:text-gray-400">
                                        <Mail className="h-4 w-4 mr-3 text-emerald-400" />
                                        <a href={`mailto:${customer.email}`} className="hover:text-emerald-600 transition-colors truncate">{customer.email}</a>
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-center text-sm text-slate-600 dark:text-gray-400">
                                        <MapPin className="h-4 w-4 mr-3 text-emerald-400" />
                                        <span className="truncate">{customer.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeModal}>
                            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8 animate-in zoom-in-95 duration-200">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-2xl leading-6 font-bold text-slate-900 dark:text-white mb-6">
                                        {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                                    </h3>
                                    <div className="mt-4">
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Name</label>
                                                <input {...register('name')} className="block w-full border-slate-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-emerald-600 focus:border-emerald-600 bg-slate-50/50 dark:bg-slate-900 sm:text-sm py-3 transition-all" placeholder="Customer Name" />
                                                {errors.name && <p className="text-[#EF4444] text-xs mt-1">{errors.name?.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Phone</label>
                                                <input {...register('phone')} className="block w-full border-slate-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-emerald-600 focus:border-emerald-600 bg-slate-50/50 dark:bg-slate-900 sm:text-sm py-3 transition-all" placeholder="+260..." />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Email</label>
                                                <input {...register('email')} className="block w-full border-slate-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-emerald-600 focus:border-emerald-600 bg-slate-50/50 dark:bg-slate-900 sm:text-sm py-3 transition-all" placeholder="email@example.com" />
                                                {errors.email && <p className="text-[#EF4444] text-xs mt-1">{errors.email?.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Address</label>
                                                <textarea {...register('address')} rows={2} className="block w-full border-slate-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-emerald-600 focus:border-emerald-600 bg-slate-50/50 dark:bg-slate-900 sm:text-sm p-3 transition-all" placeholder="Physical Address" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Notes</label>
                                                <textarea {...register('notes')} rows={3} className="block w-full border-slate-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-emerald-600 focus:border-emerald-600 bg-slate-50/50 dark:bg-slate-900 sm:text-sm p-3 transition-all" placeholder="Internal notes..." />
                                            </div>

                                            <div className="mt-8 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-800 text-base font-medium text-white hover:from-emerald-700 hover:to-emerald-900 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 sm:w-auto sm:text-sm disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                                                >
                                                    {submitting ? 'Saving...' : 'Save Customer'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={closeModal}
                                                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 dark:border-gray-600 shadow-sm px-6 py-3 bg-white dark:bg-slate-700 text-base font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
