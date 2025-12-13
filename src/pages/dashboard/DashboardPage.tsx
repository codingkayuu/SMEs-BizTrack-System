import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardStats } from './DashboardStats';
import { RecentTransactions } from './RecentTransactions';
import type { Income, Expense } from '../../types';
import { cn } from '../../lib/utils';

export function DashboardPage() {
    const { user } = useAuth();
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
                .eq('user_id', user.id) // Note: RLS should handle this, but adding for safety if schema varies
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
            // Implementation detail: Filter and sum based on dates
            // For brevity, using simple filters here. In production, consider DB aggregation or better dates.

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
    }, [user]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">Overview of your business performance.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            <DashboardStats
                today={stats.today}
                week={stats.week}
                month={stats.month}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400">
                        Chart Component Coming Soon
                    </div>
                </div>

                <div className="lg:col-span-1 h-full">
                    <RecentTransactions transactions={transactions} loading={loading} />
                </div>
            </div>
        </div>
    );
}
