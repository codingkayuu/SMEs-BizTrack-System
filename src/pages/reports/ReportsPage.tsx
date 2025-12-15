import { useEffect, useState } from 'react';
import { Download, Loader2, Lightbulb, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportsChart } from './ReportsChart';
import { CategoryBreakdownChart } from './CategoryBreakdownChart';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function ReportsPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<{
        monthly: any[],
        categoryData: any[],
        summary: { totalIncome: number; totalExpense: number; netProfit: number }
    }>({ monthly: [], categoryData: [], summary: { totalIncome: 0, totalExpense: 0, netProfit: 0 } });

    const [dateRange, setDateRange] = useState<'month' | '3months' | 'year'>('year');

    useEffect(() => {
        fetchReportData();
    }, [user, dateRange]); // Refetch when range changes or user changes

    const fetchReportData = async () => {
        if (!user) return;
        setLoading(true); // Set loading true on fetch
        try {
            // Determine start date based on range
            const now = new Date();
            let startDate = new Date();
            if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1);
            else if (dateRange === '3months') startDate.setMonth(now.getMonth() - 3);
            else startDate.setFullYear(now.getFullYear() - 1);

            const startStr = startDate.toISOString();

            const [incomeRes, expenseRes] = await Promise.all([
                supabase.from('income').select('amount, date').eq('user_id', user.id).gte('date', startStr),
                supabase.from('expenses').select('amount, date, category').eq('user_id', user.id).gte('date', startStr)
            ]);

            const incomes = incomeRes.data || [];
            const expenses = expenseRes.data || [];

            // Calculate totals
            const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
            const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
            const netProfit = totalIncome - totalExpense;

            // Group by month
            // We use the date range logic to generate labels
            const getMonthLabels = () => {
                const labels = [];
                const d = new Date(startDate);
                // Adjust to start of month to match logic
                d.setDate(1);
                const endDate = new Date();

                while (d <= endDate) {
                    labels.push(d.toISOString().slice(0, 7)); // YYYY-MM
                    d.setMonth(d.getMonth() + 1);
                }
                return labels;
            };

            const months = getMonthLabels();

            const monthlyData = months.map(month => {
                const inc = incomes.filter(i => i.date.startsWith(month)).reduce((sum, i) => sum + i.amount, 0);
                const exp = expenses.filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + e.amount, 0);
                return {
                    name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }), // Short month name
                    fullName: month,
                    Income: inc,
                    Expense: exp,
                    Profit: inc - exp
                };
            });

            // Category Breakdown
            const categoryMap = new Map<string, number>();
            expenses.forEach(e => {
                const cat = e.category || 'Other';
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + e.amount);
            });

            const categoryData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value,
                color: COLORS[index % COLORS.length]
            })).sort((a, b) => b.value - a.value);

            setReportData({
                monthly: monthlyData,
                categoryData,
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

        // Header
        doc.setFillColor(6, 78, 59); // Emerald 900
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('Financial Report', 14, 25);

        doc.setFontSize(10);
        doc.text(profile.business_name, 200, 20, { align: 'right' });
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 200, 28, { align: 'right' });

        // Summary Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text('Executive Summary', 14, 55);

        autoTable(doc, {
            startY: 60,
            theme: 'grid',
            headStyles: { fillColor: [6, 78, 59] },
            head: [['Total Income', 'Total Expenses', 'Net Profit']],
            body: [[
                formatCurrency(reportData.summary.totalIncome),
                formatCurrency(reportData.summary.totalExpense),
                formatCurrency(reportData.summary.netProfit)
            ]],
        });

        // Monthly Breakdown
        doc.text('Monthly Breakdown', 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            theme: 'striped',
            headStyles: { fillColor: [52, 211, 153] }, // Emerald 400
            head: [['Month', 'Income', 'Expenses', 'Profit']],
            body: reportData.monthly.map(m => [
                m.fullName,
                formatCurrency(m.Income),
                formatCurrency(m.Expense),
                formatCurrency(m.Profit)
            ])
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Generated by BizTrack System', 14, 285);
            doc.text(`Page ${i} of ${pageCount}`, 200, 285, { align: 'right' });
        }

        doc.save(`biztrack_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports</h1>
                    <p className="mt-2 text-sm text-gray-500">Analyze your business performance over time.</p>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as any)}
                            className="pl-9 pr-8 py-2 border-gray-300 rounded-lg text-sm bg-white shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="month">Last 30 Days</option>
                            <option value="3months">Last Quarter</option>
                            <option value="year">Last Year</option>
                        </select>
                    </div>
                    <Button variant="primary" leftIcon={Download} onClick={downloadPDF}>
                        Export PDF
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
            ) : (
                <>
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/30">
                            <p className="text-sm font-medium text-gray-500">Total Income</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(reportData.summary.totalIncome)}</p>
                        </Card>
                        <Card className="p-6 border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50/30">
                            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(reportData.summary.totalExpense)}</p>
                        </Card>
                        <Card className="p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/30">
                            <p className="text-sm font-medium text-gray-500">Net Profit</p>
                            <div className="flex items-center mt-2">
                                <p className={cn("text-2xl font-bold", reportData.summary.netProfit >= 0 ? "text-blue-600" : "text-red-600")}>
                                    {formatCurrency(reportData.summary.netProfit)}
                                </p>
                                {reportData.summary.netProfit > 0 && <TrendingUp className="h-5 w-5 text-blue-500 ml-2" />}
                            </div>
                        </Card>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 content-stretch">
                        <ReportsChart data={reportData.monthly} />
                        <div className="lg:col-span-1 space-y-8">
                            <CategoryBreakdownChart data={reportData.categoryData} />

                            {/* Optimization Tip Card */}
                            <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-lg">
                                <div className="p-6">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <Lightbulb className="h-5 w-5 text-yellow-300" />
                                        <h3 className="font-bold text-lg">Pro Tip</h3>
                                    </div>
                                    <p className="text-indigo-100 text-sm leading-relaxed">
                                        Your highest expense category is <span className="font-bold text-white">{reportData.categoryData[0]?.name || 'N/A'}</span>.
                                        Consider negotiating with suppliers or reviewing your usage to cut costs by up to 15%.
                                    </p>
                                    <button className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors border border-white/20">
                                        View Analysis
                                    </button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
