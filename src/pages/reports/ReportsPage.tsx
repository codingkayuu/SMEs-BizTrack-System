import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function ReportsPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<{
        monthly: any[],
        summary: { totalIncome: number; totalExpense: number; netProfit: number }
    }>({ monthly: [], summary: { totalIncome: 0, totalExpense: 0, netProfit: 0 } });

    useEffect(() => {
        fetchReportData();
    }, [user]);

    const fetchReportData = async () => {
        if (!user) return;
        try {
            // Fetch all income and expenses for now (year filter could be added)
            const [incomeRes, expenseRes] = await Promise.all([
                supabase.from('income').select('amount, date').eq('user_id', user.id),
                supabase.from('expenses').select('amount, date').eq('user_id', user.id)
            ]);

            const incomes = incomeRes.data || [];
            const expenses = expenseRes.data || [];

            // Calculate totals
            const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
            const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
            const netProfit = totalIncome - totalExpense;

            // Group by month
            const months = Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                return d.toISOString().slice(0, 7); // YYYY-MM
            }).reverse();

            const monthlyData = months.map(month => {
                const inc = incomes.filter(i => i.date.startsWith(month)).reduce((sum, i) => sum + i.amount, 0);
                const exp = expenses.filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + e.amount, 0);
                return {
                    name: month,
                    Income: inc,
                    Expense: exp,
                    Profit: inc - exp
                };
            });

            setReportData({
                monthly: monthlyData,
                summary: { totalIncome, totalExpense, netProfit }
            });

        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        if (!profile) return;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Financial Report', 14, 20);
        doc.setFontSize(12);
        doc.text(profile.business_name, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);

        doc.text('Summary', 14, 50);
        autoTable(doc, {
            startY: 55,
            head: [['Metric', 'Amount']],
            body: [
                ['Total Income', formatCurrency(reportData.summary.totalIncome)],
                ['Total Expenses', formatCurrency(reportData.summary.totalExpense)],
                ['Net Profit', formatCurrency(reportData.summary.netProfit)],
            ],
        });

        // Monthly breakdown
        doc.text('Monthly Breakdown (Last 12 Months)', 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Month', 'Income', 'Expense', 'Profit']],
            body: reportData.monthly.map(m => [m.name, formatCurrency(m.Income), formatCurrency(m.Expense), formatCurrency(m.Profit)])
        });

        doc.save('financial_report.pdf');
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                <button
                    onClick={downloadPDF}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Income</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(reportData.summary.totalIncome)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2 text-red-600">{formatCurrency(reportData.summary.totalExpense)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Net Profit</p>
                    <p className={cn("text-2xl font-bold mt-2", reportData.summary.netProfit >= 0 ? "text-green-600" : "text-red-600")}>
                        {formatCurrency(reportData.summary.netProfit)}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Income vs Expenses (Last 12 Months)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.monthly} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `K${value / 1000}k`} />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="Income" fill="#00A86B" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}


