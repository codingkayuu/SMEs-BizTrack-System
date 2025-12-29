import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    User,
    Phone,
    Mail,
    MapPin,
    TrendingUp,
    TrendingDown,
    Receipt,
    Users,
    Calendar,
    Loader2,
    DollarSign,
    BarChart2
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
    Cell
} from 'recharts';
import type { BusinessProfile, Income, Expense, Invoice, Customer } from '../../../types';

const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'];

export function BusinessDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [business, setBusiness] = useState<BusinessProfile | null>(null);
    const [income, setIncome] = useState<Income[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchBusinessDetails();
        }
    }, [id]);

    const fetchBusinessDetails = async () => {
        setLoading(true);
        try {
            // Fetch business
            const { data: businessData } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', id)
                .single();

            setBusiness(businessData);

            // Fetch income
            const { data: incomeData } = await supabase
                .from('income')
                .select('*')
                .eq('business_id', id)
                .order('date', { ascending: false });

            setIncome(incomeData || []);

            // Fetch expenses
            const { data: expenseData } = await supabase
                .from('expenses')
                .select('*')
                .eq('business_id', id)
                .order('date', { ascending: false });

            setExpenses(expenseData || []);

            // Fetch invoices
            const { data: invoiceData } = await supabase
                .from('invoices')
                .select('*, customers(name)')
                .eq('business_id', id)
                .order('created_at', { ascending: false });

            setInvoices(invoiceData || []);

            // Fetch customers
            const { data: customerData } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', id);

            setCustomers(customerData || []);

            // Build monthly data
            const now = new Date();
            const monthlyStats: any[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStart = date.toISOString().split('T')[0];
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
                const monthName = date.toLocaleString('default', { month: 'short' });

                const monthIncome = incomeData?.filter(i => i.date >= monthStart && i.date <= monthEnd)
                    .reduce((sum, i) => sum + Number(i.amount), 0) || 0;
                const monthExpense = expenseData?.filter(e => e.date >= monthStart && e.date <= monthEnd)
                    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

                monthlyStats.push({
                    month: monthName,
                    income: monthIncome,
                    expenses: monthExpense,
                });
            }
            setMonthlyData(monthlyStats);

            // Build expense categories
            const categories: { [key: string]: number } = {};
            expenseData?.forEach(expense => {
                const cat = expense.category || 'other';
                categories[cat] = (categories[cat] || 0) + Number(expense.amount);
            });
            setCategoryData(Object.entries(categories).map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
                value
            })));

        } catch (error) {
            console.error('Error fetching business details:', error);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-violet-300">Loading business details...</p>
                </div>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="text-center py-16">
                <Building2 className="w-16 h-16 text-violet-500/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Business not found</h3>
                <Link to="/admin/businesses" className="text-violet-400 hover:text-violet-300">
                    ← Back to Business Directory
                </Link>
            </div>
        );
    }

    const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const profit = totalIncome - totalExpenses;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                to="/admin/businesses"
                className="inline-flex items-center gap-2 text-violet-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Directory
            </Link>

            {/* Business Header */}
            <div className="p-6 rounded-2xl" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold" style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)'
                    }}>
                        {business.business_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{business.business_name}</h1>
                        <div className="flex flex-wrap gap-4 text-violet-300">
                            <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {business.owner_name}
                            </span>
                            <span className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {business.phone_number}
                            </span>
                            {business.email && (
                                <span className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {business.email}
                                </span>
                            )}
                            {business.address && (
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {business.address}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-violet-400 text-sm">Member since</p>
                        <p className="text-white font-semibold">
                            {new Date(business.created_at).toLocaleDateString('en-ZM', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-emerald-500 to-green-600">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-violet-300">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</p>
                </div>

                <div className="p-5 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-600">
                            <TrendingDown className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-violet-300">Total Expenses</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
                </div>

                <div className="p-5 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r ${profit >= 0 ? 'from-emerald-500 to-green-600' : 'from-red-500 to-rose-600'}`}>
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-violet-300">Net Profit</span>
                    </div>
                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                    </p>
                </div>

                <div className="p-5 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-violet-300">Customers</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{customers.length}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-violet-400" />
                        Financial Trend (6 Months)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                                <XAxis dataKey="month" stroke="#A78BFA" tick={{ fill: '#A78BFA' }} />
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
                                <Area type="monotone" dataKey="income" name="Income" stroke="#8B5CF6" fill="url(#incomeGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" fill="url(#expenseGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Categories */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-violet-400" />
                        Expense Breakdown
                    </h3>
                    <div className="h-64">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                        ) : (
                            <div className="h-full flex items-center justify-center text-violet-400">
                                No expense data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Income */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Recent Income ({income.length} total)
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {income.slice(0, 10).map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                                <div>
                                    <p className="text-white font-medium">{item.description || item.category}</p>
                                    <p className="text-violet-400 text-sm">{new Date(item.date).toLocaleDateString()}</p>
                                </div>
                                <span className="text-emerald-400 font-semibold">+{formatCurrency(Number(item.amount))}</span>
                            </div>
                        ))}
                        {income.length === 0 && <p className="text-violet-400 text-center py-4">No income records</p>}
                    </div>
                </div>

                {/* Recent Expenses */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-400" />
                        Recent Expenses ({expenses.length} total)
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {expenses.slice(0, 10).map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                                <div>
                                    <p className="text-white font-medium">{item.description || item.category}</p>
                                    <p className="text-violet-400 text-sm">{new Date(item.date).toLocaleDateString()}</p>
                                </div>
                                <span className="text-red-400 font-semibold">-{formatCurrency(Number(item.amount))}</span>
                            </div>
                        ))}
                        {expenses.length === 0 && <p className="text-violet-400 text-center py-4">No expense records</p>}
                    </div>
                </div>
            </div>

            {/* Invoices */}
            <div className="p-6 rounded-2xl" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-violet-400" />
                    Invoices ({invoices.length} total, {paidInvoices} paid)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-violet-400 border-b border-violet-500/20">
                                <th className="pb-3">Invoice #</th>
                                <th className="pb-3">Customer</th>
                                <th className="pb-3">Amount</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.slice(0, 10).map((invoice) => (
                                <tr key={invoice.id} className="border-b border-violet-500/10">
                                    <td className="py-3 text-white">{invoice.invoice_number}</td>
                                    <td className="py-3 text-violet-300">{(invoice as any).customers?.name || '-'}</td>
                                    <td className="py-3 text-white font-medium">{formatCurrency(Number(invoice.total_amount))}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                                            invoice.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                                                'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-violet-400">{new Date(invoice.date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {invoices.length === 0 && <p className="text-violet-400 text-center py-8">No invoices yet</p>}
                </div>
            </div>
        </div>
    );
}
