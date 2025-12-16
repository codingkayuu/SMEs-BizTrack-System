import { TrendingUp, TrendingDown, Wallet, DollarSign, ShoppingCart, PiggyBank } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';

interface StatsProps {
    today: { income: number; expense: number; net: number };
    week: { income: number; expense: number; net: number };
    month: { income: number; expense: number; net: number; unpaidInvoices: number };
}

export function DashboardStats({ today, week, month }: StatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Today's Net Profit - PURPLE (Primary Brand) */}
            <Card hoverEffect className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Today's Net Profit</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(today.net)}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                        <Wallet className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center">
                    <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs yesterday</span>
                </div>
            </Card>

            {/* This Week's Income - EMERALD (Success) */}
            <Card hoverEffect className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">This Week's Income</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(week.income)}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                        <DollarSign className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center">
                    <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +5.2%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs last week</span>
                </div>
            </Card>

            {/* This Month's Expenses - PINK/RED (Warning) */}
            <Card hoverEffect className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">This Month's Expenses</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(month.expense)}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                        <ShoppingCart className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center">
                    <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        +2.4%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs last month</span>
                </div>
            </Card>

            {/* This Month's Profit - BLUE/INDIGO (Info) */}
            <Card hoverEffect className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">This Month's Profit</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(month.net)}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <PiggyBank className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center">
                    <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                        0.0%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs last month</span>
                </div>
            </Card>
        </div>
    );
}
