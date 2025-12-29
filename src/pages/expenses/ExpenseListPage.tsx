import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, TrendingDown, Trash2, Edit, Loader2, Search, Filter, Download, DollarSign, Calendar, PieChart } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { debounce } from '../../lib/performance';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { aiService } from '../../lib/ai';
import { cn } from '../../lib/utils';

const expenseSchema = z.object({
    date: z.string(),
    amount: z.number().min(0.01, "Amount must be positive"),
    category: z.string().min(1, "Category is required"),
    payment_method: z.enum(['cash', 'mtn', 'airtel', 'bank']),
    description: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const EXPENSE_CATEGORIES = [
    { label: 'Inventory', value: 'inventory' },
    { label: 'Rent', value: 'rent' },
    { label: 'Salaries', value: 'salaries' },
    { label: 'Utilities', value: 'utilities' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Software', value: 'software' },
    { label: 'Transport', value: 'transport' },
    { label: 'Office Supplies', value: 'office_supplies' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Other', value: 'other' }
];

export function ExpenseListPage() {
    const { user, profile } = useAuth();
    const { success, error: toastError } = useToast();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');

    // AI States
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggested, setAiSuggested] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            category: 'inventory',
            payment_method: 'cash',
        }
    });

    const fetchData = useCallback(async () => {
        if (!user || !profile) {
            setLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('id, date, amount, category, payment_method, description')
                .eq('business_id', profile.id)
                .order('date', { ascending: false })
                .limit(100);

            if (error) throw error;
            setExpenses(data as any[]);
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
        const channel = supabase.channel('expense-list-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'expenses', filter: `business_id=eq.${profile?.id}` },
                () => debouncedFetch()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData, debouncedFetch, profile?.id]);

    const onSubmit = async (data: ExpenseFormData) => {
        if (!user) return;
        if (!profile) {
            toastError("Please create a business profile in Settings before adding expenses.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...data,
                business_id: profile.id
            };

            if (editingExpense) {
                const { error } = await supabase.from('expenses').update(payload).eq('id', editingExpense.id);
                if (error) throw error;
                success("Expense updated successfully!");
            } else {
                const { error } = await supabase.from('expenses').insert([payload]);
                if (error) throw error;
                success("Expense added successfully!");
            }

            await fetchData();
            closeModal();
        } catch (error: any) {
            console.error('Error saving expense:', error);
            toastError(error.message || "Failed to save expense.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            setExpenses(expenses.filter(e => e.id !== id));
            success("Expense deleted.");
        } catch (error: any) {
            console.error('Error deleting expense:', error);
            toastError("Failed to delete expense.");
        }
    };

    const openModal = (expense?: Expense) => {
        if (expense) {
            setEditingExpense(expense);
            reset({
                date: expense.date,
                amount: expense.amount,
                category: expense.category,
                payment_method: expense.payment_method,
                description: expense.description || '',
            });
        } else {
            setEditingExpense(null);
            reset({
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                category: 'inventory',
                payment_method: 'cash',
                description: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
        setAiSuggested(false);
        reset();
    };

    // AI Categorization Logic
    const watchedDescription = watch('description');

    useEffect(() => {
        if (!watchedDescription || watchedDescription.length < 5 || editingExpense) return;

        const timer = setTimeout(async () => {
            setIsAiLoading(true);
            const prediction = await aiService.predictCategory(watchedDescription);

            if (prediction && prediction.confidence > 0.6) {
                const mappedCategory = aiService.mapToFrontendCategory(
                    prediction.suggested_category,
                    EXPENSE_CATEGORIES.map(c => c.value)
                );

                if (mappedCategory) {
                    setValue('category', mappedCategory);
                    setAiSuggested(true);
                }
            }
            setIsAiLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [watchedDescription, setValue, editingExpense]);

    // Calculate totals with memoization
    const { totalExpenses, thisMonthExpenses, averageExpense } = useMemo(() => {
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonth = expenses
            .filter(e => e.date.startsWith(currentMonth))
            .reduce((sum, e) => sum + e.amount, 0);

        return {
            totalExpenses: total,
            thisMonthExpenses: thisMonth,
            averageExpense: expenses.length > 0 ? total / expenses.length : 0
        };
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e =>
            e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [expenses, searchTerm]);

    const handleExport = () => {
        const doc = new jsPDF();

        // Header with gradient-like effect
        doc.setFillColor(5, 150, 105); // Emerald 600
        doc.rect(0, 0, 210, 45, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("Expense Report", 14, 22);

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
                ['Total Expenses', formatCurrency(totalExpenses)],
                ['This Month', formatCurrency(thisMonthExpenses)],
                ['Average Expense', formatCurrency(totalExpenses / (filteredExpenses.length || 1))],
                ['Total Transactions', filteredExpenses.length.toString()]
            ],
            columnStyles: {
                0: { cellWidth: 80, fontStyle: 'normal' },
                1: { cellWidth: 80, halign: 'right', textColor: [5, 150, 105] }
            }
        });

        // Detailed Transactions Section
        const detailStartY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Transaction Details', 14, detailStartY);

        const tableColumn = ["Date", "Category", "Description", "Method", "Amount"];
        const tableRows = filteredExpenses.map(expense => [
            formatDate(expense.date),
            expense.category,
            expense.description || '-',
            expense.payment_method.toUpperCase(),
            formatCurrency(expense.amount)
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
            alternateRowStyles: { fillColor: [236, 253, 245] }, // Light emerald
            columnStyles: {
                4: { halign: 'right', textColor: [5, 150, 105], fontStyle: 'bold' }
            },
            foot: [[
                { content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [5, 150, 105], textColor: [255, 255, 255] } },
                { content: formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0)), styles: { halign: 'right', fontStyle: 'bold', fillColor: [5, 150, 105], textColor: [255, 255, 255] } }
            ]],
            footStyles: {
                fillColor: [5, 150, 105],
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

        doc.save(`expense_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="w-2 h-8 rounded-full bg-emerald-600 block"></span>
                        Expenses
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">View and manage your business spending.</p>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <Button variant="outline" leftIcon={Download} onClick={handleExport}>Export Report</Button>
                    <Button variant="primary" leftIcon={Plus} onClick={() => openModal()}>Record Expense</Button>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-1 animate-fade-in-up">
                {/* Total Expenses Card */}
                <Card hoverEffect className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Expenses</p>
                            <h2 className="text-3xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</h2>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">+5% vs last month</span>
                    </div>
                </Card>

                {/* This Month Card */}
                <Card hoverEffect className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">This Month</p>
                            <h2 className="text-3xl font-bold text-slate-900">{formatCurrency(thisMonthExpenses)}</h2>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                            <Calendar className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" /> 5% increase
                        </span>
                    </div>
                </Card>

                {/* Top Category Card */}
                <Card hoverEffect className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Top Category</p>
                            <h2 className="text-xl font-bold text-gray-900 truncate">Avg: {formatCurrency(averageExpense)}</h2>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-2xl text-gray-600 shadow-sm">
                            <PieChart className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span className="text-xs text-gray-400">Highest spending area</span>
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
                            placeholder="Search expenses..."
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
                ) : filteredExpenses.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4 animate-pulse">
                            <TrendingDown className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No expenses recorded</h3>
                        <p className="mt-2 text-gray-500 max-w-sm mx-auto">Keep track of where your money goes. Record your first expense.</p>
                        <Button variant="primary" className="mt-6" onClick={() => openModal()}>Record Expense</Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Desktop Table View */}
                        <table className="hidden md:table min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50 dark:bg-slate-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredExpenses.map((expense, index) => (
                                    <tr key={expense.id} style={{ animationDelay: `${index * 50}ms` }} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors animate-fade-in-up">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{formatDate(expense.date)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 dark:border-emerald-900/20">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-gray-300">
                                            {expense.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{expense.payment_method}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-right">-{formatCurrency(expense.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-3">
                                                <button onClick={() => openModal(expense)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1 hover:bg-emerald-50 rounded-full"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(expense.id)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1 hover:bg-emerald-50 rounded-full"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 p-4">
                            {filteredExpenses.map((expense, index) => (
                                <div
                                    key={expense.id}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm animate-fade-in-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">{formatDate(expense.date)}</p>
                                            <h4 className="font-semibold text-slate-900 dark:text-gray-100 mt-1">{expense.description || 'Unspecified Expense'}</h4>
                                        </div>
                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-sm">
                                            -{formatCurrency(expense.amount)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 dark:border-emerald-900/20">
                                            {expense.category}
                                        </span>
                                        <span className="text-xs text-slate-400 capitalize">• {expense.payment_method}</span>
                                    </div>

                                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                                        <button
                                            onClick={() => openModal(expense)}
                                            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 py-2 rounded-lg transition-colors"
                                        >
                                            <Edit className="h-4 w-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
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
                title={editingExpense ? 'Edit Expense' : 'Record Expense'}
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
                                    setAiSuggested(false);
                                }}
                                className={cn(
                                    "block w-full border-slate-200 rounded-lg shadow-sm focus:ring-emerald-600 focus:border-emerald-600 sm:text-sm h-10 px-3 transition-all",
                                    aiSuggested ? "border-emerald-400 ring-1 ring-emerald-400" : ""
                                )}
                            >
                                {EXPENSE_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                        <textarea {...register('description')} rows={3} className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-3" placeholder="e.g. Office rent for January" />
                    </div>

                    <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={closeModal} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting} className="w-full sm:w-auto">
                            {submitting ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Record Expense')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
