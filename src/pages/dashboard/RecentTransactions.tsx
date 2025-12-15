import { ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import type { Income, Expense } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

// Union type for display
type Transaction = (Income & { type: 'income' }) | (Expense & { type: 'expense' });

interface RecentTransactionsProps {
    transactions: Transaction[];
    loading?: boolean;
}

export function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
    if (loading) {
        return <Card className="h-full min-h-[400px] animate-pulse bg-gray-50 border-gray-100" />;
    }

    return (
        <Card className="h-full flex flex-col shadow-sm border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-4">
                <CardTitle className="text-lg font-bold text-gray-800">Recent Transactions</CardTitle>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                    View All
                </button>
            </CardHeader>

            <CardContent className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-gray-200">
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <FileText className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-base font-medium text-gray-900">No Recent Transactions</h3>
                        <p className="mt-1 text-sm text-gray-500 max-w-xs">Start tracking your business by recording your first sale or expense.</p>
                        <button className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
                            + Record Transaction
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {transactions.map((tx) => (
                            <div
                                key={`${tx.type}-${tx.id}`}
                                className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors group cursor-default"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={cn(
                                        "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm",
                                        tx.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                    )}>
                                        {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-800 transition-colors">
                                            {tx.description || (tx.type === 'income' ? 'Income' : 'Expense')}
                                        </p>
                                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                            <span>{formatDate(tx.date)}</span>
                                            <span className="mx-1.5">•</span>
                                            <span className="capitalize">{tx.payment_method?.replace('_', ' ') || 'Cash'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={cn(
                                    "text-sm font-bold tabular-nums",
                                    tx.type === 'income' ? "text-emerald-600" : "text-gray-900"
                                )}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
