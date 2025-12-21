import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardStats } from './DashboardStats';
import { RecentTransactions } from './RecentTransactions';
import { FinancialOverviewChart } from './FinancialOverviewChart';
import { Button } from '../../components/ui/Button';
import { debounce } from '../../lib/performance';
import type { Income, Expense } from '../../types';

export function DashboardPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({
        today: { income: 0, expense: 0, net: 0, incomeChange: 0, expenseChange: 0, netChange: 0 },
        week: { income: 0, expense: 0, net: 0, incomeChange: 0, expenseChange: 0, netChange: 0 },
        month: { income: 0, expense: 0, net: 0, unpaidInvoices: 0, incomeChange: 0, expenseChange: 0, netChange: 0 },
    });

    const fetchData = useCallback(async () => {
        if (!user || !profile) return;
        setLoading(true);
        setError(null);

        try {
            // Dates
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString(); // Monday
            const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 6).toISOString(); // Last Monday
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

            // Optimized: Fetch both income and expenses in parallel with minimal data
            const [incomeResult, expenseResult] = await Promise.all([
                supabase
                    .from('income')
                    .select('id, amount, date, description, payment_method, customer_id')
                    .eq('business_id', profile.id)
                    .order('date', { ascending: false })
                    .limit(10), // Only fetch what we display
                supabase
                    .from('expenses')
                    .select('id, amount, date, description, payment_method, category')
                    .eq('business_id', profile.id)
                    .order('date', { ascending: false })
                    .limit(10) // Only fetch what we display
            ]);

            if (incomeResult.error || expenseResult.error) {
                throw new Error(incomeResult.error?.message || expenseResult.error?.message || 'Failed to fetch data');
            }

            const incomeData = incomeResult.data || [];
            const expenseData = expenseResult.data || [];

            // Process Data
            const incomes = incomeData as Income[];
            const expenses = expenseData as Expense[];

            // Combine for recent transactions
            const combined = [
                ...incomes.map(i => ({ ...i, type: 'income' as const })),
                ...expenses.map(e => ({ ...e, type: 'expense' as const }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10);

            setTransactions(combined);

            // Optimized: Calculate stats in parallel
            const [incomeStats, expenseStats] = await Promise.all([
                calculateStats(incomes, todayStart, weekStart, monthStart, yesterdayStart, lastWeekStart, lastMonthStart, lastMonthEnd),
                calculateStats(expenses, todayStart, weekStart, monthStart, yesterdayStart, lastWeekStart, lastMonthStart, lastMonthEnd)
            ]);

            const finalStats = {
                today: {
                    income: incomeStats.today,
                    expense: expenseStats.today,
                    net: incomeStats.today - expenseStats.today,
                    incomeChange: incomeStats.todayChange,
                    expenseChange: expenseStats.todayChange,
                    netChange: (incomeStats.today - expenseStats.today) - (incomeStats.yesterday - expenseStats.yesterday)
                },
                week: {
                    income: incomeStats.week,
                    expense: expenseStats.week,
                    net: incomeStats.week - expenseStats.week,
                    incomeChange: incomeStats.weekChange,
                    expenseChange: expenseStats.weekChange,
                    netChange: (incomeStats.week - expenseStats.week) - (incomeStats.lastWeek - expenseStats.lastWeek)
                },
                month: {
                    income: incomeStats.month,
                    expense: expenseStats.month,
                    net: incomeStats.month - expenseStats.month,
                    unpaidInvoices: 0,
                    incomeChange: incomeStats.monthChange,
                    expenseChange: expenseStats.monthChange,
                    netChange: (incomeStats.month - expenseStats.month) - (incomeStats.lastMonth - expenseStats.lastMonth)
                }
            };

            setStats(finalStats);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [user, profile]);

    // Helper function to calculate stats for a data set
    const calculateStats = async (items: any[], todayStart: string, weekStart: string, monthStart: string,
        yesterdayStart: string, lastWeekStart: string, lastMonthStart: string, lastMonthEnd: string) => {
        const calcForPeriod = (start: string, end?: string) =>
            items.filter(i => i.date >= start && (!end || i.date < end)).reduce((sum, i) => sum + (i.amount || 0), 0);

        const today = calcForPeriod(todayStart);
        const yesterday = calcForPeriod(yesterdayStart, todayStart);
        const week = calcForPeriod(weekStart);
        const lastWeek = calcForPeriod(lastWeekStart, weekStart);
        const month = calcForPeriod(monthStart);
        const lastMonth = calcForPeriod(lastMonthStart, lastMonthEnd);

        const calculatePercentageChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        return {
            today,
            yesterday,
            week,
            lastWeek,
            month,
            lastMonth,
            todayChange: calculatePercentageChange(today, yesterday),
            weekChange: calculatePercentageChange(week, lastWeek),
            monthChange: calculatePercentageChange(month, lastMonth)
        };
    };

    // Debounced fetch for realtime subscriptions
    const debouncedFetch = useMemo(
        () => debounce(fetchData, 300),
        [fetchData]
    );

    useEffect(() => {
        fetchData();

        // Realtime subscription with debouncing
        const channels = supabase.channel('custom-dashboard-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'income' },
                () => debouncedFetch()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'expenses' },
                () => debouncedFetch()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    }, [fetchData, debouncedFetch]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={fetchData}
                            isLoading={loading}
                            leftIcon={RefreshCw}
                            className="text-red-600 border-red-200 hover:bg-red-100"
                        >
                            Retry
                        </Button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between animate-fade-in-up duration-500">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                        <img src="/FinFlow.svg" alt="FinFlow ZM" className="h-12 w-12 object-contain mr-3" />
                        <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            <span className="w-2 h-2 rounded-full bg-purple-600 mr-1.5 animate-pulse"></span>
                            Live Data
                        </span>
                    </h1>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                        Welcome back, <span className="font-bold text-purple-600">{profile?.owner_name || 'User'}</span>! Here's what's happening today.
                    </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-purple-100 dark:border-gray-700 shadow-sm">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="secondary" onClick={fetchData} isLoading={loading} leftIcon={RefreshCw} className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="animate-fade-in-up stagger-1">
                <DashboardStats
                    today={stats.today}
                    week={stats.week}
                    month={stats.month}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 content-stretch animate-fade-in-up stagger-2">
                <FinancialOverviewChart />
                <div className="lg:col-span-1 h-full">
                    <RecentTransactions transactions={transactions} loading={loading} />
                </div>
            </div>
        </div>
    );
}
