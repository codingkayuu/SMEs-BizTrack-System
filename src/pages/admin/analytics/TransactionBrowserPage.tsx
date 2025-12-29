import { useEffect, useState, useMemo } from 'react';
import {
    Receipt,
    Search,
    Filter,
    TrendingUp,
    TrendingDown,
    Loader2,
    RefreshCw,
    Download,
    ChevronLeft,
    ChevronRight,
    Building2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { Income, Expense } from '../../../types';

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    date: string;
    amount: number;
    category: string;
    payment_method: string;
    description?: string;
    business_name?: string;
    business_id?: string;
}

const ITEMS_PER_PAGE = 20;

export function TransactionBrowserPage() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterPayment, setFilterPayment] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Fetch income
            const { data: incomeData } = await supabase
                .from('income')
                .select('*, businesses(business_name)')
                .order('date', { ascending: false });

            // Fetch expenses
            const { data: expenseData } = await supabase
                .from('expenses')
                .select('*, businesses(business_name)')
                .order('date', { ascending: false });

            // Combine and format
            const combined: Transaction[] = [
                ...(incomeData || []).map(i => ({
                    id: i.id,
                    type: 'income' as const,
                    date: i.date,
                    amount: Number(i.amount),
                    category: i.category,
                    payment_method: i.payment_method,
                    description: i.description,
                    business_name: (i.businesses as any)?.business_name,
                    business_id: i.business_id,
                })),
                ...(expenseData || []).map(e => ({
                    id: e.id,
                    type: 'expense' as const,
                    date: e.date,
                    amount: Number(e.amount),
                    category: e.category,
                    payment_method: e.payment_method,
                    description: e.description,
                    business_name: (e.businesses as any)?.business_name,
                    business_id: e.business_id,
                })),
            ];

            setTransactions(combined);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const cats = new Set(transactions.map(t => t.category));
        return Array.from(cats);
    }, [transactions]);

    const paymentMethods = useMemo(() => {
        const methods = new Set(transactions.map(t => t.payment_method));
        return Array.from(methods);
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        let result = [...transactions];

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.description?.toLowerCase().includes(query) ||
                t.category.toLowerCase().includes(query) ||
                t.business_name?.toLowerCase().includes(query)
            );
        }

        // Filter by type
        if (filterType !== 'all') {
            result = result.filter(t => t.type === filterType);
        }

        // Filter by category
        if (filterCategory !== 'all') {
            result = result.filter(t => t.category === filterCategory);
        }

        // Filter by payment method
        if (filterPayment !== 'all') {
            result = result.filter(t => t.payment_method === filterPayment);
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'date') {
                comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            } else {
                comparison = a.amount - b.amount;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return result;
    }, [transactions, searchQuery, filterType, filterCategory, filterPayment, sortBy, sortOrder]);

    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Business', 'Description'];
        const rows = filteredTransactions.map(t => [
            t.date,
            t.type,
            t.category,
            t.amount,
            t.payment_method,
            t.business_name || '',
            t.description || ''
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-violet-300">Loading transactions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <Receipt className="w-8 h-8 text-violet-400" />
                        Transaction Browser
                    </h1>
                    <p className="text-violet-300 mt-1">{filteredTransactions.length} transactions found</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all hover:scale-105"
                        style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                        }}
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={fetchTransactions}
                        className="p-2 rounded-xl text-violet-300 hover:bg-violet-500/20 transition-all"
                        style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 rounded-2xl" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative lg:col-span-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value as any); setCurrentPage(1); }}
                        className="px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="income">Income Only</option>
                        <option value="expense">Expenses Only</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={filterCategory}
                        onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                        ))}
                    </select>

                    {/* Payment Method Filter */}
                    <select
                        value={filterPayment}
                        onChange={(e) => { setFilterPayment(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <option value="all">All Methods</option>
                        {paymentMethods.map(method => (
                            <option key={method} value={method}>{method.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-2xl overflow-hidden" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-violet-400 border-b border-violet-500/20">
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                                    Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => { setSortBy('amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                                    Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th className="px-6 py-4">Payment</th>
                                <th className="px-6 py-4">Business</th>
                                <th className="px-6 py-4">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.map((transaction) => (
                                <tr key={`${transaction.type}-${transaction.id}`} className="border-b border-violet-500/10 hover:bg-violet-500/5">
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${transaction.type === 'income'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {transaction.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            {transaction.type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-violet-300">
                                        {transaction.category.replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-semibold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-lg text-xs text-violet-300 uppercase" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                                            {transaction.payment_method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-violet-300">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-violet-500" />
                                            {transaction.business_name || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-violet-400 max-w-xs truncate">
                                        {transaction.description || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {paginatedTransactions.length === 0 && (
                    <div className="text-center py-16">
                        <Receipt className="w-16 h-16 text-violet-500/30 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No transactions found</h3>
                        <p className="text-violet-400">Try adjusting your filters</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-violet-500/20">
                        <p className="text-violet-400 text-sm">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg text-violet-300 hover:bg-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-white px-4">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg text-violet-300 hover:bg-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
