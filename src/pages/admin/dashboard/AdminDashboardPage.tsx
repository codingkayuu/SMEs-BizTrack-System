import { useEffect, useState } from 'react';
import {
    Building2,
    TrendingUp,
    TrendingDown,
    Receipt,
    Users,
    DollarSign,
    BarChart2,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
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

    Legend
} from 'recharts';
import type { BusinessProfile } from '../../../types';

interface PlatformStats {
    totalBusinesses: number;
    newBusinessesThisMonth: number;
    totalIncome: number;
    incomeThisMonth: number;
    totalExpenses: number;
    expensesThisMonth: number;
    totalInvoices: number;
    paidInvoices: number;
    unpaidInvoices: number;
    totalCustomers: number;
}

interface RecentActivity {
    id: string;
    type: 'income' | 'expense' | 'business' | 'invoice';
    description: string;
    amount?: number;
    date: string;
    business_name?: string;
}

const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'];

export function AdminDashboardPage() {
    const { adminProfile } = useAdminAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

            // Fetch all businesses
            const { data: businessesData } = await supabase
                .from('businesses')
                .select('*')
                .order('created_at', { ascending: false });

            // Fetch all income
            const { data: incomeData } = await supabase
                .from('income')
                .select('*, businesses(business_name)')
                .order('date', { ascending: false });

            // Fetch all expenses
            const { data: expensesData } = await supabase
                .from('expenses')
                .select('*, businesses(business_name)')
                .order('date', { ascending: false });

            // Fetch all invoices
            const { data: invoicesData } = await supabase
                .from('invoices')
                .select('*, businesses(business_name)')
                .order('created_at', { ascending: false });

            // Fetch all customers
            const { data: customersData } = await supabase
                .from('customers')
                .select('id');

            // Calculate stats
            const totalIncome = incomeData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
            const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
            const incomeThisMonth = incomeData?.filter(i => i.date >= startOfMonth).reduce((sum, i) => sum + Number(i.amount), 0) || 0;
            const expensesThisMonth = expensesData?.filter(e => e.date >= startOfMonth).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
            const newBusinessesThisMonth = businessesData?.filter(b => b.created_at >= startOfMonth).length || 0;
            const paidInvoices = invoicesData?.filter(i => i.status === 'paid').length || 0;
            const unpaidInvoices = invoicesData?.filter(i => i.status !== 'paid').length || 0;

            setStats({
                totalBusinesses: businessesData?.length || 0,
                newBusinessesThisMonth,
                totalIncome,
                incomeThisMonth,
                totalExpenses,
                expensesThisMonth,
                totalInvoices: invoicesData?.length || 0,
                paidInvoices,
                unpaidInvoices,
                totalCustomers: customersData?.length || 0,
            });

            setBusinesses(businessesData || []);

            // Build recent activity
            const activities: RecentActivity[] = [];

            // Add recent income
            incomeData?.slice(0, 5).forEach(income => {
                activities.push({
                    id: income.id,
                    type: 'income',
                    description: income.description || 'Income received',
                    amount: Number(income.amount),
                    date: income.date,
                    business_name: (income.businesses as any)?.business_name
                });
            });

            // Add recent expenses
            expensesData?.slice(0, 5).forEach(expense => {
                activities.push({
                    id: expense.id,
                    type: 'expense',
                    description: expense.description || expense.category,
                    amount: Number(expense.amount),
                    date: expense.date,
                    business_name: (expense.businesses as any)?.business_name
                });
            });

            // Add recent businesses
            businessesData?.slice(0, 3).forEach(business => {
                activities.push({
                    id: business.id,
                    type: 'business',
                    description: `${business.business_name} registered`,
                    date: business.created_at,
                    business_name: business.business_name
                });
            });

            // Sort by date and take top 10
            activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecentActivity(activities.slice(0, 10));

            // Build monthly data for charts (last 6 months)
            const monthlyStats: any[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStart = date.toISOString().split('T')[0];
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
                const monthName = date.toLocaleString('default', { month: 'short' });

                const monthIncome = incomeData?.filter(i => i.date >= monthStart && i.date <= monthEnd)
                    .reduce((sum, i) => sum + Number(i.amount), 0) || 0;
                const monthExpense = expensesData?.filter(e => e.date >= monthStart && e.date <= monthEnd)
                    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

                monthlyStats.push({
                    month: monthName,
                    income: monthIncome,
                    expenses: monthExpense,
                    profit: monthIncome - monthExpense
                });
            }
            setMonthlyData(monthlyStats);

            // Build category data for pie chart
            const categories: { [key: string]: number } = {};
            expensesData?.forEach(expense => {
                const cat = expense.category || 'other';
                categories[cat] = (categories[cat] || 0) + Number(expense.amount);
            });
            setCategoryData(Object.entries(categories).map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
                value
            })));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-ZM', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-violet-300">Loading platform data...</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Businesses',
            value: stats?.totalBusinesses || 0,
            change: `+${stats?.newBusinessesThisMonth || 0} this month`,
            icon: Building2,
            color: 'from-violet-500 to-purple-600',
            trend: 'up'
        },
        {
            title: 'Platform Revenue',
            value: formatCurrency(stats?.totalIncome || 0),
            change: `${formatCurrency(stats?.incomeThisMonth || 0)} this month`,
            icon: TrendingUp,
            color: 'from-emerald-500 to-green-600',
            trend: 'up'
        },
        {
            title: 'Platform Expenses',
            value: formatCurrency(stats?.totalExpenses || 0),
            change: `${formatCurrency(stats?.expensesThisMonth || 0)} this month`,
            icon: TrendingDown,
            color: 'from-red-500 to-rose-600',
            trend: 'down'
        },
        {
            title: 'Total Invoices',
            value: stats?.totalInvoices || 0,
            change: `${stats?.paidInvoices || 0} paid, ${stats?.unpaidInvoices || 0} pending`,
            icon: Receipt,
            color: 'from-amber-500 to-orange-600',
            trend: 'neutral'
        },
        {
            title: 'Total Customers',
            value: stats?.totalCustomers || 0,
            change: 'Across all businesses',
            icon: Users,
            color: 'from-cyan-500 to-blue-600',
            trend: 'up'
        },
        {
            title: 'Net Profit',
            value: formatCurrency((stats?.totalIncome || 0) - (stats?.totalExpenses || 0)),
            change: 'All-time platform profit',
            icon: DollarSign,
            color: (stats?.totalIncome || 0) > (stats?.totalExpenses || 0) ? 'from-emerald-500 to-green-600' : 'from-red-500 to-rose-600',
            trend: (stats?.totalIncome || 0) > (stats?.totalExpenses || 0) ? 'up' : 'down'
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                        Welcome back, {adminProfile?.full_name?.split(' ')[0] || 'Admin'}! 👋
                    </h1>
                    <p className="text-violet-300 mt-1">Here's what's happening across your platform</p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all hover:scale-105"
                    style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                    }}
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Data
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        className="p-6 rounded-2xl transition-all hover:scale-[1.02]"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${card.color}`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                            {card.trend === 'up' && <ArrowUpRight className="w-5 h-5 text-emerald-400" />}
                            {card.trend === 'down' && <ArrowDownRight className="w-5 h-5 text-red-400" />}
                        </div>
                        <h3 className="text-violet-300 text-sm font-medium mb-1">{card.title}</h3>
                        <p className="text-2xl font-bold text-white mb-2">{card.value}</p>
                        <p className="text-xs text-violet-400">{card.change}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Expenses Chart */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-violet-400" />
                        Revenue vs Expenses (6 Months)
                    </h3>
                    <div className="h-80 w-full min-h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                                <XAxis dataKey="month" stroke="#A78BFA" tick={{ fill: '#A78BFA' }} />
                                <YAxis stroke="#A78BFA" tick={{ fill: '#A78BFA' }} tickFormatter={(value) => `K${(value / 1000).toFixed(0)}`} />
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
                                <Area type="monotone" dataKey="income" name="Income" stroke="#8B5CF6" fill="url(#incomeGradient)" strokeWidth={2} />
                                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" fill="url(#expenseGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Category Breakdown */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-violet-400" />
                        Expense Distribution
                    </h3>
                    <div className="h-80 w-full min-h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={{ stroke: '#A78BFA' }}
                                >
                                    {categoryData.map((_, index) => (
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
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Businesses */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-violet-400" />
                        Recent Businesses
                    </h3>
                    <div className="space-y-3">
                        {businesses.slice(0, 5).map((business, index) => (
                            <div
                                key={business.id}
                                className="flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-violet-500/10"
                                style={{ background: 'rgba(139, 92, 246, 0.05)' }}
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{
                                    background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]} 0%, ${COLORS[(index + 1) % COLORS.length]} 100%)`
                                }}>
                                    {business.business_name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{business.business_name}</p>
                                    <p className="text-violet-400 text-sm">{business.owner_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-violet-300 text-xs">Joined</p>
                                    <p className="text-white text-sm">{new Date(business.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                        {businesses.length === 0 && (
                            <p className="text-violet-400 text-center py-8">No businesses registered yet</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-violet-400" />
                        Recent Activity
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {recentActivity.map((activity) => (
                            <div
                                key={`${activity.type}-${activity.id}`}
                                className="flex items-center gap-4 p-3 rounded-xl"
                                style={{ background: 'rgba(139, 92, 246, 0.05)' }}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' :
                                    activity.type === 'expense' ? 'bg-red-500/20 text-red-400' :
                                        activity.type === 'business' ? 'bg-violet-500/20 text-violet-400' :
                                            'bg-amber-500/20 text-amber-400'
                                    }`}>
                                    {activity.type === 'income' && <TrendingUp className="w-5 h-5" />}
                                    {activity.type === 'expense' && <TrendingDown className="w-5 h-5" />}
                                    {activity.type === 'business' && <Building2 className="w-5 h-5" />}
                                    {activity.type === 'invoice' && <Receipt className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm truncate">{activity.description}</p>
                                    <p className="text-violet-400 text-xs">{activity.business_name}</p>
                                </div>
                                <div className="text-right">
                                    {activity.amount && (
                                        <p className={`font-semibold ${activity.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {activity.type === 'income' ? '+' : '-'}{formatCurrency(activity.amount)}
                                        </p>
                                    )}
                                    <p className="text-violet-400 text-xs">{formatDate(activity.date)}</p>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <p className="text-violet-400 text-center py-8">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
