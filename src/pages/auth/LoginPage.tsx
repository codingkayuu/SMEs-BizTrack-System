import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

import { useToast } from '../../contexts/ToastContext';

// ...

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const from = location.state?.from?.pathname || '/';

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) throw authError;
            success('Successfully logged in!');
            navigate(from, { replace: true });
        } catch (err: any) {
            toastError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const email = watch('email');
    const password = watch('password');

    const inputStyle = (field: string, hasError: boolean) => ({
        width: '100%',
        height: '56px',
        padding: '16px 16px 8px 48px',
        fontSize: '16px',
        border: `2px solid ${hasError ? '#EF4444' : focusedField === field ? '#00A86B' : '#E5E7EB'}`,
        borderRadius: '12px',
        outline: 'none',
        backgroundColor: focusedField === field ? '#FFFFFF' : '#F9FAFB',
        transition: 'all 0.2s ease',
        boxShadow: focusedField === field ? '0 0 0 4px rgba(0, 168, 107, 0.1)' : 'none',
        fontFamily: 'Inter, sans-serif',
    });

    const labelStyle = (field: string, hasValue: boolean) => ({
        position: 'absolute' as const,
        left: '48px',
        top: hasValue || focusedField === field ? '8px' : '18px',
        fontSize: hasValue || focusedField === field ? '12px' : '16px',
        color: focusedField === field ? '#00A86B' : '#6B7280',
        transition: 'all 0.2s ease',
        pointerEvents: 'none' as const,
        fontWeight: focusedField === field ? 600 : 400,
    });

    const iconStyle = (field: string) => ({
        position: 'absolute' as const,
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: focusedField === field ? '#00A86B' : '#9CA3AF',
        transition: 'color 0.2s ease',
    });

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            {/* Left Side - Hero */}
            <div style={{
                width: '50%',
                background: 'linear-gradient(135deg, #14532D 0%, #166534 50%, #000000 100%)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '48px',
            }}>
                <img
                    src="/auth-hero.png"
                    alt=""
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.3,
                        mixBlendMode: 'overlay',
                    }}
                />

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(8px)',
                            padding: '8px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}>
                            <img src="/vite.svg" alt="Logo" style={{ height: '32px', width: '32px' }} />
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>BizTrack Zambia</span>
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 10, maxWidth: '480px' }}>
                    {/* Star Rating */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <svg key={i} style={{ width: '20px', height: '20px', fill: '#E65A2B' }} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                    <blockquote style={{
                        fontSize: '32px',
                        fontWeight: 500,
                        color: 'white',
                        lineHeight: 1.3,
                        marginBottom: '24px'
                    }}>
                        "This system transformed how we track our finances. It's built for Zambian businesses."
                    </blockquote>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(230, 90, 43, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FB923C',
                            fontSize: '18px',
                            fontWeight: 700,
                            border: '1px solid rgba(230, 90, 43, 0.3)',
                        }}>
                            MK
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: 'white' }}>Mulenga Kapwepwe</div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>CEO, Lusaka Logistics</div>
                        </div>
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '24px' }}>
                    {[
                        { icon: <CheckCircle2 size={16} />, text: 'Secure' },
                        { icon: <CheckCircle2 size={16} />, text: 'Local' },
                        { icon: <CheckCircle2 size={16} />, text: 'Reliable' },
                    ].map((item) => (
                        <span key={item.text} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '14px',
                        }}>
                            <span style={{ color: '#E65A2B' }}>{item.icon}</span>
                            {item.text}
                        </span>
                    ))}
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{
                width: '50%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '48px 64px',
                backgroundColor: 'white',
            }}>
                <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                    <h2 style={{
                        fontSize: '36px',
                        fontWeight: 700,
                        color: '#111827',
                        marginBottom: '8px'
                    }}>
                        Welcome back!
                    </h2>
                    <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '40px' }}>
                        Let's build your business.
                    </p>

                    {/* Toast handles errors now */}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Email */}
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <Mail size={20} style={iconStyle('email')} />
                            <input
                                {...register('email')}
                                type="email"
                                style={inputStyle('email', !!errors.email)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                placeholder=" "
                            />
                            <label style={labelStyle('email', !!email)}>Email address</label>
                        </div>

                        {/* Password */}
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <Lock size={20} style={iconStyle('password')} />
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                style={{ ...inputStyle('password', !!errors.password), paddingRight: '48px' }}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                placeholder=" "
                            />
                            <label style={labelStyle('password', !!password)}>Password</label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#9CA3AF',
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* Remember & Forgot */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                        }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        accentColor: '#00A86B',
                                        cursor: 'pointer',
                                    }}
                                />
                                <span style={{ fontSize: '14px', color: '#374151' }}>Remember me</span>
                            </label>
                            <a href="#" style={{ fontSize: '14px', color: '#E65A2B', fontWeight: 600, textDecoration: 'none' }}>
                                Forgot password?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                height: '56px',
                                background: 'linear-gradient(135deg, #16A34A 0%, #00A86B 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 8px 24px rgba(0, 168, 107, 0.3)',
                                transition: 'all 0.2s ease',
                                opacity: loading ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '32px 0',
                        gap: '16px',
                    }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
                        <span style={{ fontSize: '14px', color: '#9CA3AF' }}>New here?</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
                    </div>

                    {/* Create Account Link */}
                    <Link
                        to="/signup"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '48px',
                            border: '2px solid #E5E7EB',
                            borderRadius: '12px',
                            color: '#374151',
                            fontSize: '16px',
                            fontWeight: 500,
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Create your account
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
