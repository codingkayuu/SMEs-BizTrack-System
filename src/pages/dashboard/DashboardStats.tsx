import { memo } from 'react';
import { TrendingUp, TrendingDown, Wallet, DollarSign, ShoppingCart, PiggyBank } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';

interface StatsProps {
    today: { income: number; expense: number; net: number; incomeChange: number; expenseChange: number; netChange: number };
    week: { income: number; expense: number; net: number; incomeChange: number; expenseChange: number; netChange: number };
    month: { income: number; expense: number; net: number; unpaidInvoices: number; incomeChange: number; expenseChange: number; netChange: number };
}

const formatPercentage = (change: number) => {
    if (change === 0) return '0.0%';
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
};

const getTrendIcon = (change: number) => {
    const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : TrendingUp;
    return <Icon className="h-3 w-3" />;
};

const getTrendColor = (change: number) => {
    if (change > 0) return 'text-emerald-700 bg-emerald-50';
    if (change < 0) return 'text-emerald-400 bg-emerald-50/50';
    return 'text-slate-500 bg-slate-50';
};

export const DashboardStats = memo(function DashboardStats({ today, week, month }: StatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Today's Net Profit - EMERALD (Primary Brand) */}
            <Card hoverEffect className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Today's Net Profit</p>
                        <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(today.net)}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                        <Wallet className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center">
                    <span className={`inline-flex items-center text-xs font-medium ${getTrendColor(today.netChange)} px-2 py-1 rounded-lg`}>
                        {getTrendIcon(today.netChange)}
                        {formatPercentage(today.netChange)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs yesterday</span>
                </div>
            </Card>

            {/* This Week's Income - EMERALD (Success) */}
            <Card hoverEffect className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">This Week's Income</p>
                        <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(week.income)}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                        <DollarSign className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center">
                    <span className={`inline-flex items-center text-xs font-medium ${getTrendColor(week.incomeChange)} px-2 py-1 rounded-lg`}>
                        {getTrendIcon(week.incomeChange)}
                        {formatPercentage(week.incomeChange)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs last week</span>
                </div>
            </Card>

            {/* This Month's Expenses - SLATE (Warning) */}
            <Card hoverEffect className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">This Month's Expenses</p>
                        <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(month.expense)}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                        <ShoppingCart className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center">
                    <span className={`inline-flex items-center text-xs font-medium ${getTrendColor(month.expenseChange)} px-2 py-1 rounded-lg`}>
                        {getTrendIcon(month.expenseChange)}
                        {formatPercentage(month.expenseChange)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs last month</span>
                </div>
            </Card>

            {/* This Month's Profit - EMERALD (Info) */}
            <Card hoverEffect className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">This Month's Profit</p>
                        <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(month.net)}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                        <PiggyBank className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center">
                    <span className={`inline-flex items-center text-xs font-medium ${getTrendColor(month.netChange)} px-2 py-1 rounded-lg`}>
                        {getTrendIcon(month.netChange)}
                        {formatPercentage(month.netChange)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs last month</span>
                </div>
            </Card>
        </div>
    );
});

