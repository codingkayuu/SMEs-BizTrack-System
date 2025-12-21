import { memo, useCallback, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, FileText, Trash2 } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import type { Income, Expense } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

// Union type for display
type Transaction = (Income & { type: 'income' }) | (Expense & { type: 'expense' });

interface RecentTransactionsProps {
    transactions: Transaction[];
    loading?: boolean;
}

export const RecentTransactions = memo(function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = useCallback(async (transaction: Transaction) => {
        if (!confirm(`Are you sure you want to delete this ${transaction.type}?`)) return;

        setDeletingId(transaction.id);
        try {
            const { error } = await supabase
                .from(transaction.type === 'income' ? 'income' : 'expenses')
                .delete()
                .eq('id', transaction.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Failed to delete transaction. Please try again.');
        } finally {
            setDeletingId(null);
        }
    }, []);

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
                                        tx.type === 'income' ? "bg-purple-100 text-purple-700" : "bg-purple-50 text-purple-400"
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
                                <div className="flex items-center space-x-3">
                                    <div className={cn(
                                        "text-sm font-bold tabular-nums",
                                        tx.type === 'income' ? "text-purple-700" : "text-gray-900"
                                    )}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(tx)}
                                        disabled={deletingId === tx.id}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg hover:bg-purple-50 text-purple-500 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={`Delete ${tx.type}`}
                                    >
                                        {deletingId === tx.id ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

