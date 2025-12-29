
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    TrendingUp,
    TrendingDown,
    Users,
    PieChart,
    Settings,
    LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Invoices', path: '/invoices' },
    { icon: TrendingUp, label: 'Income', path: '/income' },
    { icon: TrendingDown, label: 'Expenses', path: '/expenses' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: PieChart, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const { signOut } = useAuth();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-full w-72 bg-white text-slate-600 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shadow-xl lg:shadow-none border-r border-slate-100",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full relative z-10">
                    {/* Logo Area */}
                    <div className="h-24 flex items-center px-8">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black italic text-emerald-800 tracking-tighter">
                                Trackify
                            </span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto py-6 px-4">
                        <ul className="space-y-2">
                            {navItems.map((item) => (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        onClick={() => setIsOpen(false)}
                                        className={({ isActive }) => cn(
                                            "flex items-center px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                            isActive
                                                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5 mr-3 transition-colors duration-200",
                                        )} />
                                        <span className="relative z-10">{item.label}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Sign Out (Bottom) */}
                    <div className="p-6 border-t border-slate-50">
                        <button
                            onClick={() => signOut()}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 group"
                        >
                            <LogOut className="h-5 w-5 mr-3 transition-transform group-hover:-translate-x-1" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
