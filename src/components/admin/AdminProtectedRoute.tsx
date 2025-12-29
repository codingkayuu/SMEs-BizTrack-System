import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2, ShieldOff } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export function AdminProtectedRoute() {
    const { user, adminProfile, loading, isAdmin } = useAdminAuth();
    const [showSafetySkip, setShowSafetySkip] = useState(false);
    const [forceLoadingOff, setForceLoadingOff] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) setShowSafetySkip(true);
        }, 5000); // Show skip button after 5 seconds
        return () => clearTimeout(timer);
    }, [loading]);

    // Show loading state
    if (loading && !forceLoadingOff) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #1a0a2e 100%)'
            }}>
                <div className="text-center px-4">
                    <div className="relative inline-flex">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)'
                        }}>
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    </div>
                    <p className="text-violet-100 font-medium text-lg mb-2">Verifying admin access...</p>
                    <p className="text-violet-400 text-sm mb-6">Securing your session with specialized platform protocols</p>

                    {showSafetySkip && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <button
                                onClick={() => setForceLoadingOff(true)}
                                className="text-violet-300 hover:text-white transition-colors text-sm border border-violet-500/30 px-4 py-2 rounded-lg bg-violet-500/10"
                            >
                                Taking too long? Click to try anyway
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Not logged in at all
    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    // Logged in but not an admin
    if (!isAdmin || !adminProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{
                background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #1a0a2e 100%)'
            }}>
                <div className="text-center max-w-md p-8 rounded-3xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                        <ShieldOff className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
                    <p className="text-violet-300 mb-6">
                        You don't have permission to access the admin portal.
                        Please contact a super administrator if you believe this is an error.
                    </p>
                    <div className="space-y-3">
                        <a
                            href="/admin/login"
                            className="block w-full py-3 rounded-xl font-semibold text-white transition-all"
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                            }}
                        >
                            Try Different Account
                        </a>
                        <a
                            href="/"
                            className="block w-full py-3 rounded-xl font-semibold text-violet-300 transition-all"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            Go to Main Site
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // User is authenticated and is an admin
    return <Outlet />;
}
