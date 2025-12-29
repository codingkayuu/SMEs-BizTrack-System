import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff, Sparkles, UserPlus } from 'lucide-react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';

const signupSchema = z.object({
    full_name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});

type SignupFormData = z.infer<typeof signupSchema>;

export function AdminSignupPage() {
    const { signUp } = useAdminAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema)
    });

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await signUp(data.email, data.password, data.full_name);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex" style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #334155 75%, #0f172a 100%)'
            }}>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-md text-center">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)'
                        }}>
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4">Account Created!</h1>
                        <p className="text-emerald-300 mb-6">
                            Your admin registration has been submitted. Please wait for a super administrator to activate your account.
                        </p>
                        <div className="p-4 rounded-xl mb-6" style={{
                            background: 'rgba(5, 150, 105, 0.1)',
                            border: '1px solid rgba(5, 150, 105, 0.3)'
                        }}>
                            <p className="text-emerald-200 text-sm">
                                <strong>Note:</strong> New admin accounts require activation by an existing super admin before you can access the portal.
                            </p>
                        </div>
                        <Link
                            to="/admin/login"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:scale-105"
                            style={{
                                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                            }}
                        >
                            Return to Login
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #334155 75%, #0f172a 100%)'
        }}>
            {/* Left Panel - Hero */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 relative overflow-hidden">
                {/* Animated Background Orbs */}
                <div className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-20 animate-pulse" style={{
                    background: 'radial-gradient(circle, #059669 0%, transparent 70%)'
                }} />
                <div className="absolute bottom-32 right-20 w-80 h-80 rounded-full opacity-15 animate-pulse" style={{
                    background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
                    animationDelay: '1s'
                }} />

                <div className="relative z-10">
                    <div className="mb-8">
                        <h1 className="text-5xl font-black italic text-white tracking-tighter drop-shadow-lg">Trackify</h1>
                        <p className="text-emerald-400 text-sm font-bold uppercase tracking-[0.3em] mt-2 opacity-80">Admin Portal</p>
                    </div>

                    <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                        Join the Admin
                        <br />
                        <span className="text-transparent bg-clip-text" style={{
                            backgroundImage: 'linear-gradient(135deg, #059669, #10b981, #6ee7b7)'
                        }}>
                            Team
                        </span>
                    </h2>

                    <p className="text-xl text-emerald-300 mb-8">
                        Request access to manage and monitor the Trackify platform.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            </div>
                            <p className="text-emerald-200">Role-based access control</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                            <p className="text-emerald-200">Secure authentication</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Signup Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-4xl font-black italic text-white tracking-tighter">Trackify</h1>
                        <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1">Admin Account</p>
                    </div>

                    <div className="p-8 rounded-3xl" style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{
                                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                            }}>
                                <UserPlus className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Create Admin Account</h2>
                            <p className="text-emerald-400">Request access to the admin portal</p>
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl mb-6 text-red-400 text-sm" style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-emerald-100 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                                    <input
                                        {...register('full_name')}
                                        type="text"
                                        placeholder="Enter your full name"
                                        className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    />
                                </div>
                                {errors.full_name && (
                                    <p className="mt-1 text-sm text-red-400">{errors.full_name.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-emerald-100 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="admin@company.com"
                                        className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-emerald-100 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create a strong password"
                                        className="w-full pl-12 pr-12 py-4 rounded-xl text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-emerald-100 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                                    <input
                                        {...register('confirmPassword')}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirm your password"
                                        className="w-full pl-12 pr-12 py-4 rounded-xl text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                                style={{
                                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Request Access
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-emerald-400">
                                Already have an account?{' '}
                                <Link to="/admin/login" className="text-emerald-300 hover:text-white font-medium transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
