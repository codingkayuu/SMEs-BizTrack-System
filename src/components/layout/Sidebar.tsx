
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
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
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
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-full w-64 bg-[#064e3b] dark:bg-[#022c22] text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shadow-2xl",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="h-20 flex items-center px-6 border-b border-white/10">
                        <TrendingUp className="h-8 w-8 text-primary-400 mr-3" />
                        <div>
                            <span className="text-xl font-bold tracking-tight">BizTrack</span>
                            <span className="block text-xs text-primary-200 opacity-80">SME Management</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto py-6">
                        <ul className="space-y-1 px-3">
                            {navItems.map((item) => (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        onClick={() => setIsOpen(false)}
                                        className={({ isActive }) => cn(
                                            "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                            isActive
                                                ? "bg-white/10 text-white shadow-lg backdrop-blur-sm"
                                                : "text-primary-100 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {isActive && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-400 rounded-r-full" />
                                                )}
                                                <item.icon className={cn(
                                                    "h-5 w-5 mr-3 transition-transform duration-200 group-hover:scale-110",
                                                    isActive ? "text-primary-400" : "text-primary-300 group-hover:text-primary-200"
                                                )} />
                                                {item.label}
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Sign Out (Bottom) */}
                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={() => signOut()}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 rounded-xl transition-colors"
                        >
                            <LogOut className="h-5 w-5 mr-3" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
