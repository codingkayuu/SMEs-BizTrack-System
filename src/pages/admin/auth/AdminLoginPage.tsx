import { useState, useEffect } from 'react';
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

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

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

        try {
            await signIn(data.email, data.password);
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{
            background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 25%, #1a0a2e 50%, #2d1b4e 75%, #1a0a2e 100%)'
        }}>
            {/* Left Side - Hero Section */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(167, 139, 250, 0.2) 0%, transparent 50%)'
                }} />

                {/* Floating Orbs */}
                <div className="absolute top-20 left-20 w-32 h-32 rounded-full animate-pulse" style={{
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                    animation: 'float 6s ease-in-out infinite'
                }} />
                <div className="absolute bottom-40 right-20 w-48 h-48 rounded-full animate-pulse" style={{
                    background: 'radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, transparent 70%)',
                    animation: 'float 8s ease-in-out infinite reverse'
                }} />
                <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(196, 181, 253, 0.25) 0%, transparent 70%)',
                    animation: 'float 7s ease-in-out infinite'
                }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)'
                        }}>
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">BizTrack</h1>
                            <p className="text-violet-300 text-sm font-medium">Admin Portal</p>
                        </div>
                    </div>

                    <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                        Platform<br />
                        <span style={{
                            background: 'linear-gradient(90deg, #A78BFA 0%, #C4B5FD 50%, #DDD6FE 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Command Center</span>
                    </h2>

                    <p className="text-violet-200 text-lg mb-12 max-w-md leading-relaxed">
                        Monitor business performance, manage users, and oversee the entire BizTrack platform from one powerful dashboard.
                    </p>

                    <div className="space-y-4">
                        {[
                            { icon: '📊', text: 'Real-time platform analytics' },
                            { icon: '🏢', text: 'Complete business oversight' },
                            { icon: '💰', text: 'Financial performance tracking' },
                            { icon: '⚙️', text: 'System configuration & control' },
                        ].map((item, index) => (
                            <div key={index} className="flex items-center gap-4 text-violet-100">
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
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
                        }}>
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">BizTrack Admin</h1>
                        </div>
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
                                background: 'rgba(139, 92, 246, 0.2)',
                                border: '1px solid rgba(139, 92, 246, 0.3)'
                            }}>
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                <span className="text-violet-300 text-sm font-medium">Administrator Access</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-violet-300">Sign in to access the admin dashboard</p>
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
                                <label className="block text-sm font-medium text-violet-200 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="admin@biztrack.zm"
                                        className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
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
                                <label className="block text-sm font-medium text-violet-200 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-4 rounded-xl text-white placeholder-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-300 transition-colors"
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
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)',
                                    boxShadow: '0 10px 40px rgba(139, 92, 246, 0.4)'
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
                            <p className="text-violet-400">
                                Need admin access?{' '}
                                <Link
                                    to="/admin/signup"
                                    className="text-violet-300 hover:text-white font-medium transition-colors"
                                >
                                    Request Account
                                </Link>
                            </p>
                        </div>

                        {/* Back to Main App */}
                        <div className="mt-4 text-center">
                            <Link
                                to="/"
                                className="text-violet-400 hover:text-violet-300 transition-colors text-sm"
                            >
                                ← Back to BizTrack Main Site
                            </Link>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-violet-400/60 text-sm mt-8">
                        © 2024 BizTrack Zambia. Secure Admin Access.
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
