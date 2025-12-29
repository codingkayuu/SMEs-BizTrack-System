import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, TrendingUp, Trash2, Edit, Loader2, Search, Filter, Download, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { Income, Customer } from '../../types';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { debounce } from '../../lib/performance';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { aiService } from '../../lib/ai';

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
    const { user, profile } = useAuth();
    const { success, error: toastError } = useToast();
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');

    // AI States
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggested, setAiSuggested] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<IncomeFormData>({
        resolver: zodResolver(incomeSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            category: 'product_sale',
            payment_method: 'cash',
        }
    });

    const fetchData = useCallback(async () => {
        if (!user || !profile) {
            setLoading(false);
            return;
        }
        try {
            const [incomeRes, customerRes] = await Promise.all([
                supabase
                    .from('income')
                    .select('id, date, amount, category, payment_method, description, customer_id, customer:customers(name)')
                    .eq('business_id', profile.id)
                    .order('date', { ascending: false })
                    .limit(100),
                supabase
                    .from('customers')
                    .select('id, name')
                    .eq('business_id', profile.id)
            ]);

            if (incomeRes.error) throw incomeRes.error;
            if (customerRes.error) throw customerRes.error;

            setIncomes(incomeRes.data as any[]);
            setCustomers(customerRes.data as any[]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [user, profile]);

    // Search and realtime refresh
    const debouncedFetch = useMemo(
        () => debounce(fetchData, 400),
        [fetchData]
    );

    useEffect(() => {
        fetchData();

        // Realtime subscription
        const channel = supabase.channel('income-list-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'income', filter: `business_id=eq.${profile?.id}` },
                () => debouncedFetch()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData, debouncedFetch, profile?.id]);
    const onSubmit = async (data: IncomeFormData) => {
        if (!user) return;

        if (!profile) {
            toastError("Please create a business profile in Settings before adding income.");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                ...data,
                customer_id: data.customer_id || null, // Handle empty string as null
                business_id: profile.id
            };

            if (editingIncome) {
                const { error } = await supabase.from('income').update(payload).eq('id', editingIncome.id);
                if (error) throw error;
                success("Income updated successfully!");
            } else {
                const { error } = await supabase.from('income').insert([payload]);
                if (error) throw error;
                success("Income added successfully!");
            }

            await fetchData();
            closeModal();
        } catch (error: any) {
            console.error('Error saving income:', error);
            toastError(error.message || "Failed to save income.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            const { error } = await supabase.from('income').delete().eq('id', id);
            if (error) throw error;
            setIncomes(incomes.filter(i => i.id !== id));
            success("Income deleted.");
        } catch (error: any) {
            console.error('Error deleting income:', error);
            toastError("Failed to delete income.");
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
                amount: 0,
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
        setAiSuggested(false);
        reset();
    };

    // AI Categorization Logic
    const watchedDescription = watch('description');

    useEffect(() => {
        if (!watchedDescription || watchedDescription.length < 5 || editingIncome) return;

        const timer = setTimeout(async () => {
            setIsAiLoading(true);
            const prediction = await aiService.predictCategory(watchedDescription);

            if (prediction && prediction.confidence > 0.6) {
                const mappedCategory = aiService.mapToFrontendCategory(
                    prediction.suggested_category,
                    ['product_sale', 'service', 'other']
                );

                if (mappedCategory) {
                    setValue('category', mappedCategory as any);
                    setAiSuggested(true);
                }
            }
            setIsAiLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [watchedDescription, setValue, editingIncome]);

    // Calculate totals with memoization
    const { totalIncome, thisMonthIncome, averageTransaction } = useMemo(() => {
        const total = incomes.reduce((sum, i) => sum + i.amount, 0);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonth = incomes
            .filter(i => i.date.startsWith(currentMonth))
            .reduce((sum, i) => sum + i.amount, 0);

        return {
            totalIncome: total,
            thisMonthIncome: thisMonth,
            averageTransaction: incomes.length > 0 ? total / incomes.length : 0
        };
    }, [incomes]);

    const filteredIncomes = useMemo(() => {
        return incomes.filter(i =>
            i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [incomes, searchTerm]);

    const handleExport = () => {
        const doc = new jsPDF();

        // Header with gradient-like effect
        doc.setFillColor(6, 78, 59); // Dark emerald
        doc.rect(0, 0, 210, 45, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("Income Report", 14, 22);

        // Subtitle
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${profile?.business_name || 'Business'}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 36);

        // Summary Statistics Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary Statistics', 14, 58);

        // Summary stats table
        autoTable(doc, {
            startY: 63,
            theme: 'grid',
            headStyles: {
                fillColor: [16, 185, 129], // Emerald 500
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                fontSize: 11,
                fontStyle: 'bold'
            },
            head: [['Metric', 'Value']],
            body: [
                ['Total Revenue', formatCurrency(totalIncome)],
                ['This Month', formatCurrency(thisMonthIncome)],
                ['Average Transaction', formatCurrency(totalIncome / (filteredIncomes.length || 1))],
                ['Total Transactions', filteredIncomes.length.toString()]
            ],
            columnStyles: {
                0: { cellWidth: 80, fontStyle: 'normal' },
                1: { cellWidth: 80, halign: 'right', textColor: [6, 78, 59] }
            }
        });

        // Detailed Transactions Section
        const detailStartY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Transaction Details', 14, detailStartY);

        const tableColumn = ["Date", "Description", "Customer", "Category", "Method", "Amount"];
        const tableRows = filteredIncomes.map(income => [
            formatDate(income.date),
            income.description || '-',
            income.customer?.name || '-',
            income.category.replace('_', ' '),
            income.payment_method.toUpperCase(),
            formatCurrency(income.amount)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: detailStartY + 5,
            theme: 'striped',
            headStyles: {
                fillColor: [16, 185, 129], // Emerald 500
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            columnStyles: {
                5: { halign: 'right', textColor: [6, 78, 59], fontStyle: 'bold' }
            },
            foot: [[
                { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [6, 78, 59], textColor: [255, 255, 255] } },
                { content: formatCurrency(filteredIncomes.reduce((sum, i) => sum + i.amount, 0)), styles: { halign: 'right', fontStyle: 'bold', fillColor: [6, 78, 59], textColor: [255, 255, 255] } }
            ]],
            footStyles: {
                fillColor: [6, 78, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            }
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Powered by FinFlow ZM - Financial Management System', 14, 285);
            doc.text(`Page ${i} of ${pageCount}`, 200, 285, { align: 'right' });
        }

        doc.save(`income_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="w-2 h-8 rounded-full bg-emerald-600 block"></span>
                        Income
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">Track and manage your revenue streams effectively.</p>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <Button variant="outline" leftIcon={Download} onClick={handleExport}>Export Report</Button>
                    <Button variant="primary" leftIcon={Plus} onClick={() => openModal()}>Add Income</Button>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-1 animate-fade-in-up">
                {/* Total Revenue Card */}
                <Card hoverEffect className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                            <h2 className="text-3xl font-bold text-slate-900">{formatCurrency(totalIncome)}</h2>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">+2.5% vs last month</span>
                    </div>
                </Card>

                {/* This Month Card */}
                <Card hoverEffect className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">This Month</p>
                            <h2 className="text-3xl font-bold text-slate-900">{formatCurrency(thisMonthIncome)}</h2>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                            <Calendar className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> 12% increase
                        </span>
                    </div>
                </Card>

                {/* Average Transaction Card */}
                <Card hoverEffect className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Avg. Transaction</p>
                            <h2 className="text-3xl font-bold text-slate-900">{formatCurrency(averageTransaction)}</h2>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                            <CreditCard className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span className="text-xs text-gray-400">Per recorded transaction</span>
                    </div>
                </Card>
            </div>

            {/* Content Area */}
            <Card className="overflow-hidden border-gray-200 shadow-sm stagger-2 animate-fade-in-up">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="block w-full pl-10 pr-3 py-2 border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:ring-emerald-600 focus:border-emerald-600 bg-white dark:bg-slate-900 dark:text-white transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="ghost" size="sm" leftIcon={Filter} className="flex-1 md:flex-none justify-center">Filter</Button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
                ) : filteredIncomes.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4 animate-pulse">
                            <TrendingUp className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No income records found</h3>
                        <p className="mt-2 text-gray-500 max-w-sm mx-auto">Get started by adding your first income transaction. It will show up here.</p>
                        <Button variant="primary" className="mt-6" onClick={() => openModal()}>Add your first income</Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Desktop Table View */}
                        <table className="hidden md:table min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50 dark:bg-slate-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredIncomes.map((income, index) => (
                                    <tr key={income.id} style={{ animationDelay: `${index * 50}ms` }} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors animate-fade-in-up">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{formatDate(income.date)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-gray-100">
                                            <div className="font-semibold">{income.description || 'Unspecified Income'}</div>
                                            {income.customer && <div className="text-xs text-emerald-600 mt-0.5 font-medium">{income.customer.name}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize border border-slate-200">
                                                {income.category.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{income.payment_method}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-right">+{formatCurrency(income.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-3">
                                                <button onClick={() => openModal(income)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1 hover:bg-emerald-50 rounded-full"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(income.id)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1 hover:bg-emerald-50 rounded-full"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 p-4">
                            {filteredIncomes.map((income, index) => (
                                <div
                                    key={income.id}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm animate-fade-in-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">{formatDate(income.date)}</p>
                                            <h4 className="font-semibold text-slate-900 dark:text-gray-100 mt-1">{income.description || 'Unspecified Income'}</h4>
                                        </div>
                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-sm">
                                            +{formatCurrency(income.amount)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize border border-slate-200">
                                            {income.category.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-slate-400 capitalize">• {income.payment_method}</span>
                                    </div>

                                    {income.customer && (
                                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mb-4 bg-emerald-50/50 p-2 rounded-lg">
                                            <span>Start from:</span>
                                            {income.customer.name}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                                        <button
                                            onClick={() => openModal(income)}
                                            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 py-2 rounded-lg transition-colors"
                                        >
                                            <Edit className="h-4 w-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(income.id)}
                                            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 py-2 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingIncome ? 'Edit Income' : 'Add New Income'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input type="date" {...register('date')} className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-10 px-3" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ZMW)</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">K</span>
                                </div>
                                <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="block w-full pl-7 border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-10" placeholder="0.00" />
                            </div>
                            {errors.amount && <p className="text-red-600 text-xs mt-1">{errors.amount.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                                Category
                                {isAiLoading && <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />}
                                {aiSuggested && !isAiLoading && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full animate-pulse font-bold">AI Suggestion</span>}
                            </label>
                            <select
                                {...register('category')}
                                onChange={(e) => {
                                    register('category').onChange(e);
                                    setAiSuggested(false); // Clear suggestion highlight on manual change
                                }}
                                className={cn(
                                    "block w-full border-slate-200 rounded-lg shadow-sm focus:ring-emerald-600 focus:border-emerald-600 sm:text-sm h-10 px-3 transition-all",
                                    aiSuggested ? "border-emerald-400 ring-1 ring-emerald-400" : ""
                                )}
                            >
                                <option value="product_sale">Product Sale</option>
                                <option value="service">Service</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                            <select {...register('payment_method')} className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-10 px-3">
                                <option value="cash">Cash</option>
                                <option value="mtn">MTN Mobile Money</option>
                                <option value="airtel">Airtel Money</option>
                                <option value="bank">Bank Transfer</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer (Optional)</label>
                        <select {...register('customer_id')} className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-10 px-3">
                            <option value="">No Customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                        <textarea {...register('description')} rows={3} className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-3" placeholder="e.g. Website Design Project" />
                    </div>

                    <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={closeModal} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting} className="w-full sm:w-auto">
                            {submitting ? 'Saving...' : (editingIncome ? 'Update Income' : 'Save Record')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
