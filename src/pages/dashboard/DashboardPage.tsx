import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardStats } from './DashboardStats';
import { RecentTransactions } from './RecentTransactions';
import { FinancialOverviewChart } from './FinancialOverviewChart';
import { Button } from '../../components/ui/Button';
import type { Income, Expense } from '../../types';

export function DashboardPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({
        today: { income: 0, expense: 0, net: 0 },
        week: { income: 0, expense: 0, net: 0 },
        month: { income: 0, expense: 0, net: 0, unpaidInvoices: 0 },
    });

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Dates
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString(); // Monday
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Fetch Income
            const { data: incomeData } = await supabase
                .from('income')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            // Fetch Expenses
            const { data: expenseData } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            // Process Data
            const incomes = (incomeData || []) as Income[];
            const expenses = (expenseData || []) as Expense[];

            // Combine for recent transactions
            const combined = [
                ...incomes.map(i => ({ ...i, type: 'income' as const })),
                ...expenses.map(e => ({ ...e, type: 'expense' as const }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10);

            setTransactions(combined);

            // Calculate Stats
            const calcStats = (items: any[], start: string) =>
                items.filter(i => i.date >= start).reduce((sum, i) => sum + (i.amount || 0), 0);

            const incomeToday = calcStats(incomes, todayStart);
            const expenseToday = calcStats(expenses, todayStart);

            const incomeWeek = calcStats(incomes, weekStart);
            const expenseWeek = calcStats(expenses, weekStart);

            const incomeMonth = calcStats(incomes, monthStart);
            const expenseMonth = calcStats(expenses, monthStart);

            setStats({
                today: { income: incomeToday, expense: expenseToday, net: incomeToday - expenseToday },
                week: { income: incomeWeek, expense: expenseWeek, net: incomeWeek - expenseWeek },
                month: { income: incomeMonth, expense: expenseMonth, net: incomeMonth - expenseMonth, unpaidInvoices: 0 }
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Realtime subscription
        const channels = supabase.channel('custom-dashboard-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'income' },
                () => fetchData()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'expenses' },
                () => fetchData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    }, [user]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between animate-fade-in-up duration-500">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                        Dashboard
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
