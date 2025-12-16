import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

export function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { profile, signOut } = useAuth();
    const location = useLocation();

    return (
        <div className="flex h-screen bg-[#FBF7FF] text-gray-900 font-sans overflow-hidden">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-purple-100 z-20">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-500 hover:bg-purple-50 hover:text-purple-600 rounded-md transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="text-lg font-bold text-gray-900">BizTrack</span>
                    <div className="w-6" />
                </header>

                {/* Desktop Header / Top Bar */}
                <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-white border-b border-purple-100 z-20 sticky top-0">
                    <div className="flex items-center w-full max-w-xl">
                        {/* Search Bar - Visual only for now */}
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border-none rounded-xl leading-5 bg-purple-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 sm:text-sm transition-all duration-200"
                                placeholder="Search transactions, customers..."
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-6 ml-4">
                        <button className="relative p-2 text-gray-400 hover:text-purple-600 transition-colors">
                            <span className="sr-only">View notifications</span>
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-[#7C3AED] ring-2 ring-white" />
                        </button>

                        <div className="relative">
                            <button
                                className="flex items-center space-x-3 focus:outline-none group"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                        {profile?.business_name || 'Business'}
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {profile?.owner_name || 'Admin'}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border-2 border-white shadow-sm group-hover:bg-purple-200 transition-colors">
                                    {profile?.business_name?.charAt(0).toUpperCase() || 'B'}
                                </div>
                            </button>

                            {/* Dropdown */}
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl py-1 ring-1 ring-black ring-opacity-5 z-50 transform opacity-100 scale-100 transition-all duration-200 origin-top-right border border-purple-100">
                                    <div className="px-4 py-3 border-b border-gray-50">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                                    </div>
                                    <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">Settings</a>
                                    <div className="border-t border-gray-50 my-1"></div>
                                    <button
                                        onClick={() => signOut()}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                            {/* Backdrop for dropdown */}
                            {userMenuOpen && (
                                <div className="fixed inset-0 z-40 transform cursor-default" onClick={() => setUserMenuOpen(false)}></div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#FBF7FF] dark:bg-slate-900 p-4 md:p-8 transition-colors duration-200 relative">
                    <div key={location.pathname} className="animate-fade-in-up">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
