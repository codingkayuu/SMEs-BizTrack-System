import { type ElementType } from 'react';
import { ArrowUp, ArrowDown, DollarSign, Wallet } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

interface StatsCardProps {
    title: string;
    amount: number;
    type: 'income' | 'expense' | 'net' | 'neutral';
    icon: ElementType;
}

function StatsCard({ title, amount, type, icon: Icon }: StatsCardProps) {
    const colors = {
        income: 'bg-green-100 text-green-600',
        expense: 'bg-red-100 text-red-600',
        net: amount >= 0 ? 'bg-primary-100 text-primary-600' : 'bg-red-100 text-red-600',
        neutral: 'bg-blue-100 text-blue-600',
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className={cn("text-2xl font-bold mt-1", amount < 0 && type === 'net' ? "text-red-600" : "text-gray-900")}>
                        {formatCurrency(amount)}
                    </h3>
                </div>
                <div className={cn("p-3 rounded-full", colors[type])}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}

interface DashboardStatsProps {
    today: { income: number; expense: number; net: number };
    week: { income: number; expense: number; net: number };
    month: { income: number; expense: number; net: number; unpaidInvoices: number };
}

export function DashboardStats({ today, week, month }: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Today's Focus */}
            <StatsCard
                title="Today's Net Profit"
                amount={today.net}
                type="net"
                icon={Wallet}
            />
            <StatsCard
                title="This Week's Income"
                amount={week.income}
                type="income"
                icon={ArrowUp}
            />

            <StatsCard
                title="This Month's Expenses"
                amount={month.expense}
                type="expense"
                icon={ArrowDown}
            />

            <StatsCard
                title="This Month's Profit"
                amount={month.net}
                type="net"
                icon={DollarSign}
            />
        </div>
    );
}
