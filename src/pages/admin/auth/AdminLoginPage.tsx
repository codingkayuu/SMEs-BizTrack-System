import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function AdminLoginPage() {
    const navigate = useNavigate();
    const { signIn, loading: authLoading, isAdmin } = useAdminAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const isLoadingRef = useRef(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    // Synchronize ref with state to avoid stale closures in safety timeouts
    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    // Redirect if already logged in as admin
    useEffect(() => {
        if (isAdmin && !authLoading) {
            navigate('/admin');
        }
    }, [isAdmin, authLoading, navigate]);

    if (isAdmin && !authLoading) return null;

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        // Safety timeout for the login button state
        const loginTimeout = setTimeout(() => {
            if (isLoadingRef.current) {
                console.warn('[AdminLogin] Login request timed out locally');
                setIsLoading(false);
                setError('Authentication is taking longer than expected. Please check your connection or try again.');
            }
        }, 15000);

        try {
            await signIn(data.email, data.password);
            clearTimeout(loginTimeout);
            navigate('/admin');
        } catch (err: any) {
            clearTimeout(loginTimeout);
            setError(err.message || 'Failed to sign in. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #334155 75%, #0f172a 100%)'
        }}>
            {/* Left Side - Hero Section */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(5, 150, 105, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)'
                }} />

                {/* Floating Orbs */}
                <div className="absolute top-20 left-20 w-32 h-32 rounded-full animate-pulse" style={{
                    background: 'radial-gradient(circle, rgba(5, 150, 105, 0.4) 0%, transparent 70%)',
                    animation: 'float 6s ease-in-out infinite'
                }} />
                <div className="absolute bottom-40 right-20 w-48 h-48 rounded-full animate-pulse" style={{
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
                    animation: 'float 8s ease-in-out infinite reverse'
                }} />
                <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(110, 231, 183, 0.25) 0%, transparent 70%)',
                    animation: 'float 7s ease-in-out infinite'
                }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="mb-8">
                        <h1 className="text-5xl font-black italic text-white tracking-tighter drop-shadow-lg">Trackify</h1>
                        <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 opacity-80">Admin Portal</p>
                    </div>

                    <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                        Platform<br />
                        <span style={{
                            background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Command Center</span>
                    </h2>

                    <p className="text-emerald-50 text-lg mb-12 max-w-md leading-relaxed">
                        Monitor business performance, manage users, and oversee the entire Trackify platform from one powerful dashboard.
                    </p>

                    <div className="space-y-4">
                        {[
                            { icon: '📊', text: 'Real-time platform analytics' },
                            { icon: '🏢', text: 'Complete business oversight' },
                            { icon: '💰', text: 'Financial performance tracking' },
                            { icon: '⚙️', text: 'System configuration & control' },
                        ].map((item, index) => (
                            <div key={index} className="flex items-center gap-4 text-emerald-100">
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-lg">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-10">
                        <h1 className="text-4xl font-black italic text-white tracking-tighter">Trackify</h1>
                        <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1">Admin Access</p>
                    </div>

                    {/* Login Card */}
                    <div className="p-8 rounded-3xl" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{
                                background: 'rgba(5, 150, 105, 0.2)',
                                border: '1px solid rgba(5, 150, 105, 0.3)'
                            }}>
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-300 text-sm font-medium">Administrator Access</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-emerald-300">Sign in to access the admin dashboard</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-emerald-100 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="admin@trackify.zm"
                                        className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-medium text-emerald-100 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-4 rounded-xl text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                style={{
                                    background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #064e3b 100%)',
                                    boxShadow: '0 10px 40px rgba(5, 150, 105, 0.4)'
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5" />
                                        Access Admin Portal
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Signup Link */}
                        <div className="mt-6 text-center">
                            <p className="text-emerald-400">
                                Need admin access?{' '}
                                <Link
                                    to="/admin/signup"
                                    className="text-emerald-300 hover:text-white font-medium transition-colors"
                                >
                                    Request Account
                                </Link>
                            </p>
                        </div>

                        {/* Back to Main App */}
                        <div className="mt-4 text-center">
                            <Link
                                to="/"
                                className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm"
                            >
                                ← Back to Trackify Main Site
                            </Link>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-emerald-400/60 text-sm mt-8">
                        © 2024 Trackify Zambia. Secure Admin Access.
                    </p>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
            `}</style>
        </div>
    );
}
