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
            {/* Today's Net Profit */}
            <Card hoverEffect className="p-6 relative overflow-hidden group border-emerald-100/50">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Today's Net Profit</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(today.net)}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                        <Wallet className="h-6 w-6 text-emerald-600" />
                    </div>
                </div>
                <div className="mt-4 flex items-center z-10 relative">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs yesterday</span>
                </div>
                {/* Decorative background blob */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent rounded-full opacity-50 group-hover:scale-110 transition-transform" />
            </Card>

            {/* This Week's Income */}
            <Card hoverEffect className="p-6 relative overflow-hidden group border-blue-100/50">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">This Week's Income</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(week.income)}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
                <div className="mt-4 flex items-center z-10 relative">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +5.2%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs last week</span>
                </div>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full opacity-50 group-hover:scale-110 transition-transform" />
            </Card>

            {/* This Month's Expenses */}
            <Card hoverEffect className="p-6 relative overflow-hidden group border-red-100/50">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">This Month's Expenses</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(month.expense)}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                        <ShoppingCart className="h-6 w-6 text-red-600" />
                    </div>
                </div>
                <div className="mt-4 flex items-center z-10 relative">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        +2.4%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs last month</span>
                </div>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-red-50 to-transparent rounded-full opacity-50 group-hover:scale-110 transition-transform" />
            </Card>

            {/* This Month's Profit */}
            <Card hoverEffect className="p-6 relative overflow-hidden group border-purple-100/50">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">This Month's Profit</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(month.net)}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                        <PiggyBank className="h-6 w-6 text-purple-600" />
                    </div>
                </div>
                <div className="mt-4 flex items-center z-10 relative">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        0.0%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs last month</span>
                </div>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent rounded-full opacity-50 group-hover:scale-110 transition-transform" />
            </Card>
        </div>
    );
}
