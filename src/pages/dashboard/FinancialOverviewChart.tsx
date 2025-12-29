import { memo, useMemo, useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { debounce } from '../../lib/performance';

interface ChartData {
    name: string;
    income: number;
    expense: number;
}

export const FinancialOverviewChart = memo(function FinancialOverviewChart() {
    const { profile } = useAuth();
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    // Memoize chart data generation function
    const generateChartData = useMemo(() => {
        return (incomes: any[], expenses: any[]): ChartData[] => {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const today = new Date();
            const currentDay = today.getDay();

            return days.map((day, index) => {
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() - (currentDay - index - 1));

                const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString();
                const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1).toISOString();

                const dayIncome = incomes
                    .filter(i => i.date >= dayStart && i.date < dayEnd)
                    .reduce((sum, i) => sum + (i.amount || 0), 0);

                const dayExpense = expenses
                    .filter(e => e.date >= dayStart && e.date < dayEnd)
                    .reduce((sum, e) => sum + (e.amount || 0), 0);

                return {
                    name: day,
                    income: dayIncome,
                    expense: dayExpense
                };
            });
        };
    }, []);

    const fetchData = useCallback(async () => {
        if (!profile) return;

        try {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
            weekStart.setHours(0, 0, 0, 0);

            const [incomeResult, expenseResult] = await Promise.all([
                supabase
                    .from('income')
                    .select('amount, date')
                    .eq('business_id', profile.id)
                    .gte('date', weekStart.toISOString())
                    .order('date', { ascending: true }),
                supabase
                    .from('expenses')
                    .select('amount, date')
                    .eq('business_id', profile.id)
                    .gte('date', weekStart.toISOString())
                    .order('date', { ascending: true })
            ]);

            if (incomeResult.error || expenseResult.error) {
                console.error('Chart data fetch error:', incomeResult.error || expenseResult.error);
                return;
            }

            const chartData = generateChartData(incomeResult.data || [], expenseResult.data || []);
            setData(chartData);
        } catch (error) {
            console.error('Error fetching chart data:', error);
        } finally {
            setLoading(false);
        }
    }, [profile, generateChartData]);

    // Debounced fetch to prevent excessive refetches
    const debouncedFetch = useMemo(
        () => debounce(fetchData, 500),
        [fetchData]
    );

    useEffect(() => {
        fetchData();

        // Real-time subscriptions with debouncing
        const incomeChannel = supabase.channel('chart-income-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'income' },
                () => debouncedFetch()
            )
            .subscribe();

        const expenseChannel = supabase.channel('chart-expense-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'expenses' },
                () => debouncedFetch()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(incomeChannel);
            supabase.removeChannel(expenseChannel);
        };
    }, [fetchData, debouncedFetch]);

    if (loading) {
        return (
            <Card className="col-span-1 lg:col-span-2 shadow-sm border-gray-100 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-8">
                    <CardTitle className="text-lg font-bold text-gray-800">Financial Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <div className="text-gray-400">Loading chart data...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-gray-100 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-8">
                <CardTitle className="text-lg font-bold text-slate-800">Financial Overview</CardTitle>
                <div className="flex space-x-2">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-600 text-white border border-emerald-700 shadow-sm">Income</span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">Expenses</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={250}>
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#94a3b8' }}
                                dy={10}
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `K${value / 1000}k`}
                                tick={{ fill: '#94a3b8' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(value: number) => [formatCurrency(value), '']}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#059669"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                animationDuration={1500}
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                stroke="#94a3b8"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
});

