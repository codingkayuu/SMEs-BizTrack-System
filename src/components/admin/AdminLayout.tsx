import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    BarChart3,
    Receipt,
    Users,
    Megaphone,
    Settings,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    ChevronDown,
    Bell
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    roles?: string[];
    children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        path: '/admin',
        icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
        label: 'Businesses',
        path: '/admin/businesses',
        icon: <Building2 className="w-5 h-5" />,
    },
    {
        label: 'Analytics',
        path: '/admin/analytics',
        icon: <BarChart3 className="w-5 h-5" />,
        children: [
            { label: 'Overview', path: '/admin/analytics' },
            { label: 'Transactions', path: '/admin/transactions' },
        ]
    },
    {
        label: 'Invoices',
        path: '/admin/invoices',
        icon: <Receipt className="w-5 h-5" />,
    },
    {
        label: 'Admin Users',
        path: '/admin/users',
        icon: <Users className="w-5 h-5" />,
        roles: ['super_admin'],
    },
    {
        label: 'Announcements',
        path: '/admin/announcements',
        icon: <Megaphone className="w-5 h-5" />,
        roles: ['super_admin', 'admin'],
    },
    {
        label: 'Settings',
        path: '/admin/settings',
        icon: <Settings className="w-5 h-5" />,
        roles: ['super_admin'],
    },
];

export function AdminLayout() {
    const navigate = useNavigate();
    const { adminProfile, signOut } = useAdminAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/admin/login');
    };

    const toggleExpanded = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(adminProfile?.role || '');
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'from-amber-500 to-orange-500';
            case 'admin':
                return 'from-emerald-500 to-emerald-600';
            default:
                return 'from-slate-500 to-slate-600';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'Super Admin';
            case 'admin':
                return 'Admin';
            case 'analyst':
                return 'Analyst';
            default:
                return role;
        }
    };

    return (
        <div className="min-h-screen flex" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #334155 75%, #0f172a 100%)'
        }}>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-72 transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `} style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                {/* Logo */}
                <div className="h-20 flex items-center justify-between px-6" style={{
                    borderBottom: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-3xl font-black italic text-white tracking-tighter drop-shadow-sm">Trackify</h1>
                            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 opacity-80">Admin Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-emerald-400 hover:text-white p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Admin Profile */}
                <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{
                        background: 'rgba(16, 185, 129, 0.1)'
                    }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{
                            background: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)'
                        }}>
                            {adminProfile?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate text-sm">
                                {adminProfile?.full_name || 'Admin User'}
                            </p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getRoleBadgeColor(adminProfile?.role || 'analyst')}`}>
                                {getRoleLabel(adminProfile?.role || 'analyst')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    {filteredNavItems.map((item) => (
                        <div key={item.path}>
                            {item.children ? (
                                <>
                                    <button
                                        onClick={() => toggleExpanded(item.label)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedItems.includes(item.label) ? 'rotate-180' : ''}`} />
                                    </button>
                                    {expandedItems.includes(item.label) && (
                                        <div className="ml-9 mt-1 space-y-1">
                                            {item.children.map((child) => (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={({ isActive }) => `
                                                        block px-4 py-2 rounded-lg text-sm transition-all
                                                        ${isActive
                                                            ? 'text-white bg-emerald-500/20'
                                                            : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                                                        }
                                                    `}
                                                >
                                                    {child.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    end={item.path === '/admin'}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                        ${isActive
                                            ? 'text-white bg-gradient-to-r from-emerald-600/30 to-emerald-800/30 shadow-lg'
                                            : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10'
                                        }
                                    `}
                                    style={({ isActive }) => isActive ? {
                                        boxShadow: '0 4px 20px rgba(5, 150, 105, 0.2)',
                                        border: '1px solid rgba(5, 150, 105, 0.3)'
                                    } : {}}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </NavLink>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Sign Out */}
                <div className="p-4" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header */}
                <header className="h-20 flex items-center justify-between px-6" style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="hidden lg:block">
                        <h2 className="text-xl font-semibold text-white">Platform Administration</h2>
                        <p className="text-sm text-emerald-400">Monitor and manage your Trackify platform</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button className="relative p-2 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-all">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* Admin Info (Mobile) */}
                        <div className="lg:hidden flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{
                                background: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)'
                            }}>
                                {adminProfile?.full_name?.charAt(0) || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
