import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2,
    Search,
    Filter,
    Eye,
    MoreVertical,
    Loader2,
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Download
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { BusinessProfile } from '../../../types';

interface BusinessWithStats extends BusinessProfile {
    totalIncome: number;
    totalExpenses: number;
    customerCount: number;
    invoiceCount: number;
}

export function BusinessListPage() {
    const [loading, setLoading] = useState(true);
    const [businesses, setBusinesses] = useState<BusinessWithStats[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'revenue'>('date');
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const fetchBusinesses = async () => {
        setLoading(true);
        try {
            // Fetch all businesses
            const { data: businessesData, error } = await supabase
                .from('businesses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch stats for each business
            const businessesWithStats: BusinessWithStats[] = await Promise.all(
                (businessesData || []).map(async (business) => {
                    // Get income total
                    const { data: incomeData } = await supabase
                        .from('income')
                        .select('amount')
                        .eq('business_id', business.id);

                    // Get expense total
                    const { data: expenseData } = await supabase
                        .from('expenses')
                        .select('amount')
                        .eq('business_id', business.id);

                    // Get customer count
                    const { count: customerCount } = await supabase
                        .from('customers')
                        .select('*', { count: 'exact', head: true })
                        .eq('business_id', business.id);

                    // Get invoice count
                    const { count: invoiceCount } = await supabase
                        .from('invoices')
                        .select('*', { count: 'exact', head: true })
                        .eq('business_id', business.id);

                    return {
                        ...business,
                        totalIncome: incomeData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0,
                        totalExpenses: expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
                        customerCount: customerCount || 0,
                        invoiceCount: invoiceCount || 0,
                    };
                })
            );

            setBusinesses(businessesWithStats);
        } catch (error) {
            console.error('Error fetching businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBusinesses = useMemo(() => {
        let result = [...businesses];

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(b =>
                b.business_name.toLowerCase().includes(query) ||
                b.owner_name.toLowerCase().includes(query) ||
                b.email?.toLowerCase().includes(query) ||
                b.phone_number.includes(query)
            );
        }

        // Filter by type
        if (filterType !== 'all') {
            result = result.filter(b => b.business_type === filterType);
        }

        // Sort
        switch (sortBy) {
            case 'name':
                result.sort((a, b) => a.business_name.localeCompare(b.business_name));
                break;
            case 'revenue':
                result.sort((a, b) => b.totalIncome - a.totalIncome);
                break;
            case 'date':
            default:
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        return result;
    }, [businesses, searchQuery, sortBy, filterType]);

    const businessTypes = useMemo(() => {
        const types = new Set(businesses.map(b => b.business_type).filter(Boolean));
        return Array.from(types);
    }, [businesses]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getHealthScore = (income: number, expenses: number) => {
        if (income === 0 && expenses === 0) return { label: 'New', color: 'bg-slate-500' };
        const ratio = income / (expenses || 1);
        if (ratio >= 1.5) return { label: 'Excellent', color: 'bg-emerald-500' };
        if (ratio >= 1) return { label: 'Good', color: 'bg-green-500' };
        if (ratio >= 0.7) return { label: 'Fair', color: 'bg-amber-500' };
        return { label: 'At Risk', color: 'bg-red-500' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-violet-300">Loading businesses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-violet-400" />
                        Business Directory
                    </h1>
                    <p className="text-violet-300 mt-1">{businesses.length} registered businesses</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchBusinesses}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-violet-300 font-medium transition-all hover:bg-violet-500/20"
                        style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 rounded-2xl flex flex-col sm:flex-row gap-4" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                    <input
                        type="text"
                        placeholder="Search businesses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    />
                </div>

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <option value="date">Sort by Date</option>
                    <option value="name">Sort by Name</option>
                    <option value="revenue">Sort by Revenue</option>
                </select>

                {/* Filter by type */}
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <option value="all">All Types</option>
                    {businessTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            {/* Business Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBusinesses.map((business) => {
                    const health = getHealthScore(business.totalIncome, business.totalExpenses);
                    const profit = business.totalIncome - business.totalExpenses;

                    return (
                        <div
                            key={business.id}
                            className="p-6 rounded-2xl transition-all hover:scale-[1.02]"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{
                                        background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
                                    }}>
                                        {business.business_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">{business.business_name}</h3>
                                        <p className="text-violet-400 text-sm">{business.owner_name}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${health.color}`}>
                                    {health.label}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-xs">Revenue</span>
                                    </div>
                                    <p className="text-white font-semibold">{formatCurrency(business.totalIncome)}</p>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                                    <div className="flex items-center gap-2 text-red-400 mb-1">
                                        <TrendingDown className="w-4 h-4" />
                                        <span className="text-xs">Expenses</span>
                                    </div>
                                    <p className="text-white font-semibold">{formatCurrency(business.totalExpenses)}</p>
                                </div>
                            </div>

                            {/* Profit */}
                            <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                                <div className="flex items-center justify-between">
                                    <span className="text-violet-300 text-sm">Net Profit</span>
                                    <span className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                                    </span>
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center justify-between text-sm text-violet-400 mb-4">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{business.customerCount} customers</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(business.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <Link
                                to={`/admin/businesses/${business.id}`}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-all hover:scale-105"
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                                }}
                            >
                                <Eye className="w-4 h-4" />
                                View Details
                            </Link>
                        </div>
                    );
                })}
            </div>

            {filteredBusinesses.length === 0 && (
                <div className="text-center py-16">
                    <Building2 className="w-16 h-16 text-violet-500/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No businesses found</h3>
                    <p className="text-violet-400">
                        {searchQuery ? 'Try adjusting your search criteria' : 'No businesses have registered yet'}
                    </p>
                </div>
            )}
        </div>
    );
}
