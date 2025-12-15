import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Building2, Phone, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import confetti from 'canvas-confetti';

const signupSchema = z.object({
    businessName: z.string().min(2, 'Business name is required'),
    ownerName: z.string().min(2, 'Owner name is required'),
    phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupPage() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    });

    const password = watch('password');
    const businessName = watch('businessName');

    const getStrength = (pass: string | undefined) => {
        if (!pass) return 0;
        let s = 0;
        if (pass.length > 5) s += 1;
        if (pass.length > 8) s += 1;
        if (/[A-Z]/.test(pass)) s += 1;
        if (/[0-9]/.test(pass)) s += 1;
        return s;
    };

    const strength = getStrength(password);
    const strengthLabels = ["Weak 😬", "Fair 😐", "Good 🙂", "Strong 🔒", "Super! 🚀"];
    const strengthColors = ["#E5E7EB", "#EF4444", "#F59E0B", "#22C55E", "#16A34A"];

    const onSubmit = async (data: SignupFormData) => {
        setLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('businesses')
                    .insert([{
                        user_id: authData.user.id,
                        business_name: data.businessName,
                        owner_name: data.ownerName,
                        phone_number: data.phoneNumber,
                    }]);

                if (!profileError) {
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

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
                {/* Hero Background Image */}
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

                {/* Content */}
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
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: 700,
                        color: 'white',
                        lineHeight: 1.1,
                        marginBottom: '24px'
                    }}>
                        Join 50,000+ Zambian businesses growing with us.
                    </h1>
                    <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>
                        Experience the future of business management. Fast, secure, and built for growth.
                    </p>
                </div>

                <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {['🚀 Boost Efficiency', '📊 Real-time Analytics', '🇿🇲 Local Compliance'].map((item) => (
                        <div key={item} style={{
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(8px)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 500,
                        }}>
                            {item}
                        </div>
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
                overflowY: 'auto',
            }}>
                <div style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
                    <h2 style={{
                        fontSize: '36px',
                        fontWeight: 700,
                        color: '#111827',
                        marginBottom: '8px'
                    }}>
                        Start your journey.
                    </h2>
                    <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '32px' }}>
                        Create your account in seconds.
                    </p>

                    {error && (
                        <div style={{
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '24px',
                        }}>
                            <p style={{ color: '#DC2626', fontSize: '14px', margin: 0 }}>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Business Name */}
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <Building2 size={20} style={iconStyle('businessName')} />
                            <input
                                {...register('businessName')}
                                style={inputStyle('businessName', !!errors.businessName)}
                                onFocus={() => setFocusedField('businessName')}
                                onBlur={() => setFocusedField(null)}
                                placeholder=" "
                            />
                            <label style={labelStyle('businessName', !!businessName)}>Business Name</label>
                            {errors.businessName && (
                                <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>
                                    {errors.businessName.message}
                                </p>
                            )}
                        </div>

                        {/* Business Name Feedback */}
                        {businessName && businessName.length > 2 && (
                            <div style={{
                                background: '#F0FDF4',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                marginTop: '-12px',
                            }}>
                                <p style={{ color: '#16A34A', fontSize: '14px', margin: 0, fontWeight: 500 }}>
                                    ✨ Nice! <strong>{businessName}</strong> sounds professional.
                                </p>
                            </div>
                        )}

                        {/* Owner Name & Phone Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ position: 'relative' }}>
                                <User size={20} style={iconStyle('ownerName')} />
                                <input
                                    {...register('ownerName')}
                                    style={inputStyle('ownerName', !!errors.ownerName)}
                                    onFocus={() => setFocusedField('ownerName')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder=" "
                                />
                                <label style={labelStyle('ownerName', !!watch('ownerName'))}>Owner Name</label>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Phone size={20} style={iconStyle('phoneNumber')} />
                                <input
                                    {...register('phoneNumber')}
                                    style={inputStyle('phoneNumber', !!errors.phoneNumber)}
                                    onFocus={() => setFocusedField('phoneNumber')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder=" "
                                />
                                <label style={labelStyle('phoneNumber', !!watch('phoneNumber'))}>Phone Number</label>
                            </div>
                        </div>

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
                            <label style={labelStyle('email', !!watch('email'))}>Email address</label>
                        </div>

                        {/* Password */}
                        <div style={{ position: 'relative', marginBottom: '8px' }}>
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

                        {/* Password Strength */}
                        {password && password.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                    {[1, 2, 3, 4].map((step) => (
                                        <div
                                            key={step}
                                            style={{
                                                flex: 1,
                                                height: '6px',
                                                borderRadius: '3px',
                                                backgroundColor: strength >= step ? strengthColors[strength] : '#E5E7EB',
                                                transition: 'all 0.3s ease',
                                            }}
                                        />
                                    ))}
                                </div>
                                <p style={{
                                    textAlign: 'right',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: strength < 2 ? '#EF4444' : strength < 3 ? '#F59E0B' : '#16A34A',
                                }}>
                                    {strengthLabels[strength]}
                                </p>
                            </div>
                        )}

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
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '32px', color: '#6B7280' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: '#E65A2B', fontWeight: 600, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </p>
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
