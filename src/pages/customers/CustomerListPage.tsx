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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <button
                    onClick={() => openModal()}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2"
                        placeholder="Search customers by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
            ) : filteredCustomers.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-lg border border-dashed border-gray-300">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                    <p className="mt-1 text-gray-500">Add your first customer to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.map((customer) => (
                        <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group relative">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                                </div>
                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(customer)} className="text-gray-400 hover:text-primary-600">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(customer.id)} className="text-gray-400 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {customer.phone && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                        <a href={`tel:${customer.phone}`} className="hover:text-primary-600">{customer.phone}</a>
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                        <a href={`mailto:${customer.email}`} className="hover:text-primary-600">{customer.email}</a>
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
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
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                                    </h3>
                                    <div className="mt-4">
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                                <input {...register('name')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2" />
                                                {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                                <input {...register('phone')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                                <input {...register('email')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-2" />
                                                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                                <textarea {...register('address')} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                                <textarea {...register('notes')} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Internal notes..." />
                                            </div>

                                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                                >
                                                    {submitting ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={closeModal}
                                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
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
