import { useEffect, useState, useMemo } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    PieChart as PieChartIcon,
    Loader2,
    RefreshCw,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import type { Income, Expense } from '../../../types';

const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#7C3AED'];

export function FinancialOverviewPage() {
    const [loading, setLoading] = useState(true);
    const [income, setIncome] = useState<Income[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: incomeData } = await supabase
                .from('income')
                .select('*, businesses(business_name)')
                .order('date', { ascending: false });

            const { data: expenseData } = await supabase
                .from('expenses')
                .select('*, businesses(business_name)')
                .order('date', { ascending: false });

            setIncome(incomeData || []);
            setExpenses(expenseData || []);
        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDateRangeStart = () => {
        const now = new Date();
        switch (dateRange) {
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            case 'quarter':
                const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                return quarterStart.toISOString().split('T')[0];
            case 'year':
                return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            default:
                return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        }
    };

    const filteredIncome = useMemo(() => {
        const start = getDateRangeStart();
        return income.filter(i => i.date >= start);
    }, [income, dateRange]);

    const filteredExpenses = useMemo(() => {
        const start = getDateRangeStart();
        return expenses.filter(e => e.date >= start);
    }, [expenses, dateRange]);

    const totalIncome = filteredIncome.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';

    // Payment method breakdown
    const paymentMethods = useMemo(() => {
        const methods: { [key: string]: { income: number; expense: number } } = {};
        filteredIncome.forEach(i => {
            const method = i.payment_method || 'other';
            if (!methods[method]) methods[method] = { income: 0, expense: 0 };
            methods[method].income += Number(i.amount);
        });
        filteredExpenses.forEach(e => {
            const method = e.payment_method || 'other';
            if (!methods[method]) methods[method] = { income: 0, expense: 0 };
            methods[method].expense += Number(e.amount);
        });
        return Object.entries(methods).map(([name, data]) => ({
            name: name.toUpperCase(),
            income: data.income,
            expenses: data.expense,
        }));
    }, [filteredIncome, filteredExpenses]);

    // Income categories
    const incomeCategories = useMemo(() => {
        const categories: { [key: string]: number } = {};
        filteredIncome.forEach(i => {
            const cat = i.category || 'other';
            categories[cat] = (categories[cat] || 0) + Number(i.amount);
        });
        return Object.entries(categories).map(([name, value]) => ({
            name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value
        }));
    }, [filteredIncome]);

    // Expense categories
    const expenseCategories = useMemo(() => {
        const categories: { [key: string]: number } = {};
        filteredExpenses.forEach(e => {
            const cat = e.category || 'other';
            categories[cat] = (categories[cat] || 0) + Number(e.amount);
        });
        return Object.entries(categories).map(([name, value]) => ({
            name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value
        }));
    }, [filteredExpenses]);

    // Daily trend data
    const dailyData = useMemo(() => {
        const days: { [key: string]: { income: number; expenses: number } } = {};
        const start = new Date(getDateRangeStart());
        const now = new Date();

        // Initialize all days
        for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            days[key] = { income: 0, expenses: 0 };
        }

        filteredIncome.forEach(i => {
            if (days[i.date]) days[i.date].income += Number(i.amount);
        });
        filteredExpenses.forEach(e => {
            if (days[e.date]) days[e.date].expenses += Number(e.amount);
        });

        return Object.entries(days).map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('en-ZM', { month: 'short', day: 'numeric' }),
            income: data.income,
            expenses: data.expenses,
        }));
    }, [filteredIncome, filteredExpenses, dateRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-violet-300">Loading financial data...</p>
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
                        <BarChart3 className="w-8 h-8 text-violet-400" />
                        Financial Analytics
                    </h1>
                    <p className="text-violet-300 mt-1">Platform-wide financial performance</p>
                </div>
                <div className="flex gap-2">
                    {/* Date Range Selector */}
                    <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                        {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 text-sm font-medium transition-all ${dateRange === range
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-transparent text-violet-300 hover:bg-violet-500/20'
                                    }`}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchData}
                        className="p-2 rounded-xl text-violet-300 hover:bg-violet-500/20 transition-all"
                        style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-emerald-500 to-green-600">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-violet-300 text-sm mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</p>
                    <p className="text-xs text-violet-400 mt-1">{filteredIncome.length} transactions</p>
                </div>

                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-600">
                            <TrendingDown className="w-6 h-6 text-white" />
                        </div>
                        <ArrowDownRight className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-violet-300 text-sm mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
                    <p className="text-xs text-violet-400 mt-1">{filteredExpenses.length} transactions</p>
                </div>

                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${netProfit >= 0 ? 'from-emerald-500 to-green-600' : 'from-red-500 to-rose-600'}`}>
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        {netProfit >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-red-400" />}
                    </div>
                    <p className="text-violet-300 text-sm mb-1">Net Profit</p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
                    </p>
                    <p className="text-xs text-violet-400 mt-1">{profitMargin}% margin</p>
                </div>

                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-violet-500 to-purple-600">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-violet-300 text-sm mb-1">Avg Transaction</p>
                    <p className="text-2xl font-bold text-white">
                        {formatCurrency(totalIncome / (filteredIncome.length || 1))}
                    </p>
                    <p className="text-xs text-violet-400 mt-1">Per income transaction</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-violet-400" />
                        Daily Trend
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="incomeGradient2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expenseGradient2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                                <XAxis dataKey="date" stroke="#A78BFA" tick={{ fill: '#A78BFA', fontSize: 12 }} />
                                <YAxis stroke="#A78BFA" tick={{ fill: '#A78BFA' }} tickFormatter={(v) => `K${(v / 1000).toFixed(0)}`} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(26, 10, 46, 0.95)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="income" name="Income" stroke="#8B5CF6" fill="url(#incomeGradient2)" strokeWidth={2} />
                                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" fill="url(#expenseGradient2)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-violet-400" />
                        Payment Methods
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paymentMethods}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                                <XAxis dataKey="name" stroke="#A78BFA" tick={{ fill: '#A78BFA' }} />
                                <YAxis stroke="#A78BFA" tick={{ fill: '#A78BFA' }} tickFormatter={(v) => `K${(v / 1000).toFixed(0)}`} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(26, 10, 46, 0.95)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend />
                                <Bar dataKey="income" name="Income" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Categories */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-emerald-400" />
                        Income by Category
                    </h3>
                    <div className="h-80">
                        {incomeCategories.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={incomeCategories}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: '#A78BFA' }}
                                    >
                                        {incomeCategories.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(26, 10, 46, 0.95)',
                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                            borderRadius: '12px',
                                            color: '#fff'
                                        }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-violet-400">No income data</div>
                        )}
                    </div>
                </div>

                {/* Expense Categories */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-red-400" />
                        Expenses by Category
                    </h3>
                    <div className="h-80">
                        {expenseCategories.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseCategories}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: '#A78BFA' }}
                                    >
                                        {expenseCategories.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(26, 10, 46, 0.95)',
                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                            borderRadius: '12px',
                                            color: '#fff'
                                        }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-violet-400">No expense data</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
