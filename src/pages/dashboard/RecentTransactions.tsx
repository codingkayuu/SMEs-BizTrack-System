import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import type { Income, Expense } from '../../types';

// Union type for display
type Transaction = (Income & { type: 'income' }) | (Expense & { type: 'expense' });

interface RecentTransactionsProps {
    transactions: Transaction[];
    loading?: boolean;
}

export function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
    if (loading) {
        return <div className="h-64 bg-white rounded-xl animate-pulse" />;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</button>
            </div>

            <div className="flex-1 overflow-auto p-0">
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No recent transactions found.
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx) => (
                                <tr key={`${tx.type}-${tx.id}`} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">
                                        {formatDate(tx.date)}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <div className={cn(
                                                "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3",
                                                tx.type === 'income' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{tx.description || (tx.type === 'income' ? 'Income' : 'Expense')}</p>
                                                <p className="text-xs text-gray-500 capitalize">{tx.payment_method}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={cn(
                                        "py-4 px-6 text-sm font-semibold text-right whitespace-nowrap",
                                        tx.type === 'income' ? "text-green-600" : "text-red-600"
                                    )}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
