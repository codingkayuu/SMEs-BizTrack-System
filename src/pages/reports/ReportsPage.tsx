import { useEffect, useState, useRef } from 'react';
import { Download, Loader2, Lightbulb, Calendar, TrendingUp, ChevronDown } from 'lucide-react';
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

type DateRangeOption = 'daily' | 'week' | 'month' | '3months' | '6months' | 'year';

export function ReportsPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<{
        monthly: any[],
        categoryData: any[],
        summary: { totalIncome: number; totalExpense: number; netProfit: number }
    }>({ monthly: [], categoryData: [], summary: { totalIncome: 0, totalExpense: 0, netProfit: 0 } });

    const [dateRange, setDateRange] = useState<DateRangeOption>('month');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const rangeLabels: Record<DateRangeOption, string> = {
        daily: 'Daily',
        week: '1 Week',
        month: 'Monthly',
        '3months': '3 Months',
        '6months': '6 Months',
        year: '1 Year'
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [user, dateRange]);

    const fetchReportData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Determine start date based on range
            const now = new Date();
            let startDate = new Date();

            switch (dateRange) {
                case 'daily':
                    startDate.setDate(now.getDate() - 1);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case '3months':
                    startDate.setMonth(now.getMonth() - 3);
                    break;
                case '6months':
                    startDate.setMonth(now.getMonth() - 6);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }

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

            // Grouping Logic
            // For 'daily' or 'week', grouping by day makes more sense than month.
            // For 'month' and above, grouping by month is standard.

            const isDailyView = dateRange === 'daily' || dateRange === 'week';

            let groupedData = [];

            if (isDailyView) {
                // Group by Day
                const days = [];
                const d = new Date(startDate);
                const endDate = new Date();
                while (d <= endDate) {
                    days.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
                    d.setDate(d.getDate() + 1);
                }

                groupedData = days.map(day => {
                    const inc = incomes.filter(i => i.date.startsWith(day)).reduce((sum, i) => sum + i.amount, 0);
                    const exp = expenses.filter(e => e.date.startsWith(day)).reduce((sum, e) => sum + e.amount, 0);
                    return {
                        name: new Date(day).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                        fullName: day,
                        Income: inc,
                        Expense: exp,
                        Profit: inc - exp
                    };
                });
            } else {
                // Group by Month
                const months = [];
                const d = new Date(startDate);
                d.setDate(1); // align to start of month
                const endDate = new Date();

                while (d <= endDate) {
                    months.push(d.toISOString().slice(0, 7)); // YYYY-MM
                    d.setMonth(d.getMonth() + 1);
                }

                groupedData = months.map(month => {
                    const inc = incomes.filter(i => i.date.startsWith(month)).reduce((sum, i) => sum + i.amount, 0);
                    const exp = expenses.filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + e.amount, 0);
                    return {
                        name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                        fullName: month,
                        Income: inc,
                        Expense: exp,
                        Profit: inc - exp
                    };
                });
            }

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
                monthly: groupedData,
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
        doc.text('Period Breakdown', 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            theme: 'striped',
            headStyles: { fillColor: [52, 211, 153] }, // Emerald 400
            head: [['Period', 'Income', 'Expenses', 'Profit']],
            body: reportData.monthly.map(m => [
                m.fullName,
                formatCurrency(m.Income),
                formatCurrency(m.Expense),
                formatCurrency(m.Profit)
            ])
        });

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
        <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="w-2 h-8 rounded-full bg-purple-600 block"></span>
                        Financial Reports
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Deep insights into your business performance and growth.</p>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0 relative" ref={dropdownRef}>

                    {/* Custom Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="bg-white dark:bg-slate-800 border border-purple-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-xl shadow-sm hover:bg-purple-50 dark:hover:bg-slate-700 transition-all flex items-center min-w-[160px] justify-between focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2.5 text-purple-600" />
                                {rangeLabels[dateRange]}
                            </span>
                            <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform duration-200", isDropdownOpen ? "transform rotate-180" : "")} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full min-w-[160px] bg-white dark:bg-slate-800 border border-purple-100 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {Object.entries(rangeLabels).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setDateRange(key as DateRangeOption);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 text-sm transition-colors border-l-4",
                                            dateRange === key
                                                ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 font-semibold border-purple-600"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-slate-700 border-transparent"
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        variant="primary"
                        leftIcon={Download}
                        onClick={downloadPDF}
                        className="rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                    >
                        Export PDF
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-96 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-purple-600" /></div>
            ) : (
                <>
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-1 animate-fade-in-up">
                        <Card className="p-6 border-l-4 border-l-purple-500 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Income</p>
                            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{formatCurrency(reportData.summary.totalIncome)}</p>
                        </Card>
                        <Card className="p-6 border-l-4 border-l-pink-500 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Expenses</p>
                            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{formatCurrency(reportData.summary.totalExpense)}</p>
                        </Card>
                        <Card className="p-6 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Profit</p>
                            <div className="flex items-center mt-2">
                                <p className={cn("text-3xl font-extrabold", reportData.summary.netProfit >= 0 ? "text-emerald-600" : "text-pink-600")}>
                                    {formatCurrency(reportData.summary.netProfit)}
                                </p>
                                {reportData.summary.netProfit > 0 && <TrendingUp className="h-6 w-6 text-emerald-600 ml-2" />}
                            </div>
                        </Card>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 content-stretch stagger-2 animate-fade-in-up">
                        <ReportsChart data={reportData.monthly} />
                        <div className="lg:col-span-1 space-y-8">
                            <CategoryBreakdownChart data={reportData.categoryData} />

                            {/* Optimization Tip Card */}
                            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-none shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black opacity-10 rounded-full blur-xl"></div>

                                <div className="p-6 relative z-10">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <Lightbulb className="h-5 w-5 text-yellow-300" />
                                        </div>
                                        <h3 className="font-bold text-lg">BizTrack Tip</h3>
                                    </div>
                                    <p className="text-purple-100 text-sm leading-relaxed">
                                        Your highest expense is <span className="font-bold text-white border-b border-white/30 pb-0.5">{reportData.categoryData[0]?.name || 'N/A'}</span>.
                                        Consider reviewing your suppliers or budget for this category.
                                    </p>
                                    <button className="mt-5 w-full py-2.5 bg-white text-purple-700 hover:bg-purple-50 rounded-xl text-sm font-bold transition-colors shadow-sm">
                                        Optimize Spending
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
