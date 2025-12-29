import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Download, Loader2, Lightbulb, Calendar, TrendingUp, ChevronDown, Sparkles, AlertCircle, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportsChart } from './ReportsChart';
import { CategoryBreakdownChart } from './CategoryBreakdownChart';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { debounce } from '../../lib/performance';
import { aiService } from '../../lib/ai';

// Colors for pie chart - maintaining pale purple theme
const COLORS = ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'];

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

    // AI States
    const [showAI, setShowAI] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState<any[]>([]);
    const [aiForecastMeta, setAiForecastMeta] = useState<{
        incomeTrend: number;
        expenseTrend: number;
        seasonality: string;
    } | null>(null);

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

    const fetchReportData = useCallback(async () => {
        if (!user || !profile) return;
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
                supabase.from('income')
                    .select('amount, date')
                    .eq('business_id', profile.id)
                    .gte('date', startStr),
                supabase.from('expenses')
                    .select('amount, date, category')
                    .eq('business_id', profile.id)
                    .gte('date', startStr)
            ]);

            const incomes = incomeRes.data || [];
            const expenses = expenseRes.data || [];

            // Calculate totals
            const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
            const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
            const netProfit = totalIncome - totalExpense;

            // Grouping Logic
            const isDailyView = dateRange === 'daily' || dateRange === 'week';
            let groupedData = [];

            if (isDailyView) {
                const days = [];
                const d = new Date(startDate);
                const endDate = new Date();
                while (d <= endDate) {
                    days.push(d.toISOString().slice(0, 10));
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
                const months = [];
                const d = new Date(startDate);
                d.setDate(1);
                const endDate = new Date();

                while (d <= endDate) {
                    months.push(d.toISOString().slice(0, 7));
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

            const categoryMap = new Map<string, number>();
            expenses.forEach(e => {
                const cat = e.category || 'Other';
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + e.amount);
            });

            const categoryData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
                value,
                color: COLORS[index % COLORS.length]
            })).sort((a, b) => b.value - a.value);

            if (showAI && incomes.length >= 2 && profile?.id) {
                setAiLoading(true);
                try {
                    const forecast = await aiService.getForecast(profile.id, 30);
                    if (forecast && !forecast.error) {
                        setAiForecastMeta({
                            incomeTrend: forecast.income_trend,
                            expenseTrend: forecast.expense_trend,
                            seasonality: forecast.seasonality
                        });

                        // Group forecast by month to match groupedData
                        const futureData: any[] = [];
                        const months = new Set<string>();

                        forecast.income_forecast.forEach((f: any) => months.add(f.ds.slice(0, 7)));

                        Array.from(months).sort().forEach(month => {
                            const inc = forecast.income_forecast
                                .filter((f: any) => f.ds.startsWith(month))
                                .reduce((sum: number, f: any) => sum + f.yhat, 0);
                            const exp = forecast.expense_forecast
                                .filter((f: any) => f.ds.startsWith(month))
                                .reduce((sum: number, f: any) => sum + f.yhat, 0);

                            futureData.push({
                                name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                                fullName: month,
                                Income: inc,
                                Expense: exp,
                                Profit: inc - exp,
                                isProjected: true
                            });
                        });

                        groupedData = [...groupedData, ...futureData];
                    }
                } catch (err) {
                    console.error("AI Forecast error:", err);
                } finally {
                    setAiLoading(false);
                }
            }

            // Fetch AI Insights (Anomalies)
            if (expenses.length > 0 && profile?.id) {
                const insightsData = await aiService.getInsights(profile.id, expenses);
                if (insightsData && insightsData.insights) {
                    setAiInsights(insightsData.insights);
                }
            }

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
    }, [user, profile, dateRange]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    // Realtime subscription logic
    const fetchDebounced = useMemo(
        () => debounce(fetchReportData, 500),
        [fetchReportData]
    );

    useEffect(() => {
        if (!profile?.id) return;

        const incomeSubscription = supabase.channel('reports-income')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'income', filter: `business_id=eq.${profile.id}` }, () => fetchDebounced())
            .subscribe();

        const expenseSubscription = supabase.channel('reports-expenses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `business_id=eq.${profile.id}` }, () => fetchDebounced())
            .subscribe();

        return () => {
            supabase.removeChannel(incomeSubscription);
            supabase.removeChannel(expenseSubscription);
        };
    }, [profile?.id, fetchDebounced]);

    const downloadPDF = () => {
        if (!profile) return;
        const doc = new jsPDF();

        // Header - Theme Harmonized (Purple)
        doc.setFillColor(124, 58, 237); // Purple 600
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Financial Statement', 14, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(profile.business_name, 200, 20, { align: 'right' });
        doc.text(`Period View: ${rangeLabels[dateRange]}`, 200, 28, { align: 'right' });
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 200, 36, { align: 'right' });

        // Summary Section
        doc.setTextColor(31, 41, 55); // Gray 800
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Performance Summary', 14, 60);

        autoTable(doc, {
            startY: 65,
            theme: 'grid',
            headStyles: {
                fillColor: [124, 58, 237],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            bodyStyles: { fontStyle: 'bold' },
            head: [['Indicator', 'Amount (ZMW)']],
            body: [
                ['Total Revenue', formatCurrency(reportData.summary.totalIncome)],
                ['Total Operational Costs', formatCurrency(reportData.summary.totalExpense)],
                ['Net Surplus / (Deficit)', formatCurrency(reportData.summary.netProfit)]
            ],
            columnStyles: {
                0: { cellWidth: 100 },
                1: { halign: 'right', textColor: [67, 56, 202] }
            }
        });

        // Period Breakdown
        const tableStartY = (doc as any).lastAutoTable.finalY + 15;
        doc.text('Transactions Period Breakdown', 14, tableStartY);
        autoTable(doc, {
            startY: tableStartY + 5,
            theme: 'striped',
            headStyles: { fillColor: [139, 92, 246] }, // Violet 500
            head: [['Period', 'Income', 'Expenses', 'Net Flow']],
            body: reportData.monthly.map(m => [
                m.fullName,
                formatCurrency(m.Income),
                formatCurrency(m.Expense),
                formatCurrency(m.Profit)
            ]),
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right', fontStyle: 'bold' }
            }
        });

        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text('Powered by FinFlow ZM Financial Insights', 14, 285);
            doc.text(`Page ${i} of ${pageCount}`, 200, 285, { align: 'right' });
        }

        doc.save(`FinFlow_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <img src="/FinFlow.svg" alt="FinFlow ZM" className="h-8 w-8 object-contain" />
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
                        variant={showAI ? "primary" : "outline"}
                        leftIcon={TrendingUp}
                        onClick={() => setShowAI(!showAI)}
                        isLoading={aiLoading}
                        className={cn(
                            "rounded-xl shadow-sm transition-all border-purple-100",
                            showAI ? "bg-purple-600 text-white border-transparent" : "text-purple-600 hover:bg-purple-50"
                        )}
                    >
                        {showAI ? "AI Projections ON" : "AI Projections"}
                    </Button>

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
                        <Card className="p-6 border-l-4 border-l-purple-300 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Expenses</p>
                            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{formatCurrency(reportData.summary.totalExpense)}</p>
                        </Card>
                        <Card className="p-6 border-l-4 border-l-purple-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Profit</p>
                            <div className="flex items-center mt-2">
                                <p className={cn("text-3xl font-extrabold", reportData.summary.netProfit >= 0 ? "text-purple-700" : "text-purple-900")}>
                                    {formatCurrency(reportData.summary.netProfit)}
                                </p>
                                {reportData.summary.netProfit > 0 && <TrendingUp className="h-6 w-6 text-purple-700 ml-2" />}
                            </div>
                        </Card>
                    </div>

                    {/* AI Predictive Summary Cards */}
                    {showAI && aiForecastMeta && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-2 animate-in fade-in slide-in-from-top-4 duration-500">
                            <Card className="p-5 border-none bg-purple-900/10 dark:bg-purple-900/30 backdrop-blur-sm shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <TrendingUp className="h-10 w-10 text-purple-600" />
                                </div>
                                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Growth Trend</p>
                                <p className={cn(
                                    "text-2xl font-black",
                                    aiForecastMeta.incomeTrend >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {aiForecastMeta.incomeTrend > 0 ? '+' : ''}{aiForecastMeta.incomeTrend}%
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1">Projected revenue momentum</p>
                            </Card>

                            <Card className="p-5 border-none bg-purple-900/10 dark:bg-purple-900/30 backdrop-blur-sm shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Sparkles className="h-10 w-10 text-purple-600" />
                                </div>
                                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Seasonality Mode</p>
                                <p className="text-2xl font-black text-purple-900 dark:text-purple-100 capitalize">
                                    {aiForecastMeta.seasonality}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1">Patterns detected in history</p>
                            </Card>

                            <Card className="p-5 border-none bg-purple-900/10 dark:bg-purple-900/30 backdrop-blur-sm shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <AlertCircle className="h-10 w-10 text-purple-600" />
                                </div>
                                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Exp. Stability</p>
                                <p className={cn(
                                    "text-2xl font-black",
                                    Math.abs(aiForecastMeta.expenseTrend) < 5 ? "text-green-600" : "text-amber-600"
                                )}>
                                    {Math.abs(aiForecastMeta.expenseTrend) < 5 ? 'High' : 'Moderate'}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1">Expense predictability score</p>
                            </Card>

                            <Card className="p-5 border-none bg-purple-600 text-white shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Target className="h-10 w-10 text-white" />
                                </div>
                                <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest mb-1">Projected Next Month</p>
                                <p className="text-2xl font-black">
                                    {formatCurrency(reportData.monthly.filter(m => m.isProjected)[0]?.Profit || 0)}
                                </p>
                                <p className="text-[10px] text-purple-100 mt-1">AI-calculated net outcome</p>
                            </Card>
                        </div>
                    )}

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
                                        <h3 className="font-bold text-lg">FinFlow ZM Insight</h3>
                                    </div>
                                    <p className="text-purple-100 text-sm leading-relaxed">
                                        {aiInsights.length > 0
                                            ? aiInsights[0].message
                                            : `Your highest expense is ${reportData.categoryData[0]?.name || 'N/A'}. Consider reviewing your budget for this category.`}
                                    </p>
                                    <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
                                        <p className="text-[10px] text-purple-200 uppercase font-bold tracking-widest mb-1">Recommended Action</p>
                                        <p className="text-xs text-white">
                                            {aiInsights.length > 0 ? aiInsights[0].action : "Keep monitoring your spending patterns weekly."}
                                        </p>
                                    </div>
                                    <button className="mt-5 w-full py-2.5 bg-white text-purple-700 hover:bg-purple-50 rounded-xl text-sm font-bold transition-colors shadow-sm">
                                        Learn More
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
