import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Download, MoreVertical, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Invoice } from '../../types';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import jsPDF from 'jspdf';


export function InvoiceListPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');

    useEffect(() => {
        fetchInvoices();
    }, [user]);

    const fetchInvoices = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*, customer:customers(name)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvoices(data as Invoice[]);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch =
            invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

        return matchesSearch && matchesStatus;
    });



    const generatePDF = (invoice: Invoice) => {
        if (!profile) return;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('INVOICE', 14, 22);
        doc.setFontSize(10);
        doc.text(profile.business_name, 14, 32);
        doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 22);
        doc.text(`Date: ${formatDate(invoice.date)}`, 140, 28);

        // TODO: Fetch items and add table
        doc.save(`invoice-${invoice.invoice_number}.pdf`);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Invoices</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">Manage and track your customer invoices.</p>
                </div>
                <Link
                    to="/invoices/new"
                    className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Invoice
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 stagger-1 animate-fade-in-up">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 border-slate-200 dark:border-gray-700 rounded-xl focus:ring-emerald-600 focus:border-emerald-600 bg-white dark:bg-slate-900 sm:text-sm py-2.5 transition-shadow shadow-sm"
                        placeholder="Search invoice # or customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        className="block w-full border-slate-200 dark:border-gray-700 rounded-xl focus:ring-emerald-600 focus:border-emerald-600 bg-white dark:bg-slate-900 sm:text-sm py-2.5 shadow-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="all">All Status</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden stagger-2 animate-fade-in-up">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4 animate-pulse">
                            <FileText className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No invoices found</h3>
                        <p className="mt-2 text-slate-500 dark:text-gray-400">Get started by creating a new invoice.</p>
                        <Link to="/invoices/new" className="mt-6 inline-block text-emerald-600 font-medium hover:underline">Create your first invoice &rarr;</Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="hidden md:table min-w-full divide-y divide-slate-100 dark:divide-gray-700">
                            <thead className="bg-emerald-50/50 dark:bg-slate-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredInvoices.map((invoice, index) => (
                                    <tr key={invoice.id} style={{ animationDelay: `${index * 50}ms` }} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors animate-fade-in-up">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 hover:text-emerald-700">
                                            <Link to={`/invoices/${invoice.id}`}>{invoice.invoice_number}</Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {formatDate(invoice.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-gray-200 font-medium">
                                            {invoice.customer?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(invoice.total_amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={cn(
                                                "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border",
                                                invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    invoice.status === 'unpaid' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                            )}>
                                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => generatePDF(invoice)}
                                                className="text-slate-400 hover:text-emerald-600 mr-3 transition-colors p-1 hover:bg-emerald-50 rounded-full"
                                                title="Download PDF"
                                            >
                                                <Download className="h-5 w-5" />
                                            </button>
                                            <Link to={`/invoices/${invoice.id}`} className="text-slate-400 hover:text-emerald-600 p-1 hover:bg-emerald-50 rounded-full inline-block align-middle transition-colors">
                                                <MoreVertical className="h-5 w-5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 p-4">
                            {filteredInvoices.map((invoice, index) => (
                                <div
                                    key={invoice.id}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm animate-fade-in-up"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full border",
                                                    invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        invoice.status === 'unpaid' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                            'bg-red-50 text-red-700 border-red-100'
                                                )}>
                                                    {invoice.status.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-slate-500">{formatDate(invoice.date)}</span>
                                            </div>
                                            <Link to={`/invoices/${invoice.id}`} className="block font-bold text-emerald-600 mt-1 hover:underline">
                                                {invoice.invoice_number}
                                            </Link>
                                            <p className="text-sm text-slate-900 dark:text-gray-200 font-medium">
                                                {invoice.customer?.name || 'Unknown'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-lg font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(invoice.total_amount)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-3 mt-3">
                                        <button
                                            onClick={() => generatePDF(invoice)}
                                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 transition-colors"
                                        >
                                            <Download className="h-4 w-4" /> PDF
                                        </button>
                                        <Link
                                            to={`/invoices/${invoice.id}`}
                                            className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                                        >
                                            View Details &rarr;
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
