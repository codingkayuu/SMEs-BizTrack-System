import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { BusinessProfile } from '../types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: BusinessProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, data: any) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const loadingRef = useRef(true);
    const mountedRef = useRef(true);

    // Sync ref
    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    useEffect(() => {
        mountedRef.current = true;

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mountedRef.current && loadingRef.current) {
                console.warn('[Auth] Initializing auth timed out (10s) - forcing loading to false');
                setLoading(false);
            }
        }, 10000);

        // Check active session
        async function initAuth() {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (!mountedRef.current) return;

                setSession(currentSession);
                setUser(currentSession?.user ?? null);
                if (currentSession?.user) {
                    await fetchProfile(currentSession.user.id);
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
            } finally {
                if (mountedRef.current) setLoading(false);
            }
        }
        initAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
            if (!mountedRef.current) return;

            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.user) {
                await fetchProfile(currentSession.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            mountedRef.current = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    async function fetchProfile(userId: string) {
        try {
            // Use maybeSingle() to avoid errors if profile doesn't exist
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (data) {
                setProfile(data as BusinessProfile);
            } else if (error && error.code !== 'PGRST116') {
                // PGRST116 is "no rows returned" - not an error for us
                console.warn('Profile fetch error:', error);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Don't fail login if profile fetch fails - user can create profile later
        } finally {
            setLoading(false);
        }
    }

    const signIn = async (email: string, password: string) => {
        try {
            // Direct sign-in without timeout race condition
            // Profile will be fetched automatically by the auth state change listener
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Return immediately - profile loading happens in background via listener
            return;
        } catch (error: any) {
            // Provide better error messages for common issues
            if (error.message?.includes('Invalid login credentials')) {
                throw new Error('Invalid email or password. Please try again.');
            } else if (error.message?.includes('Email not confirmed')) {
                throw new Error('Please confirm your email address before signing in.');
            } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection and try again.');
            } else {
                throw new Error(error.message || 'Failed to sign in. Please try again.');
            }
        }
    };

    const signUp = async (email: string, password: string, metadata: any) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Create business profile asynchronously - don't block signup completion
                // If this fails, user can create profile later in settings
                supabase
                    .from('businesses')
                    .insert([{
                        user_id: data.user.id,
                        business_name: metadata.business_name,
                        owner_name: metadata.owner_name,
                        phone_number: metadata.phone,
                    }])
                    .then(({ error: profileError }) => {
                        if (profileError) {
                            console.error('Profile creation error:', profileError);
                            // Don't throw - user can create profile later
                        }
                    });
            }
        } catch (error: any) {
            // Better error messages for signup
            if (error.message?.includes('already registered')) {
                throw new Error('This email is already registered. Please sign in instead.');
            } else if (error.message?.includes('Password should be')) {
                throw new Error('Password must be at least 6 characters long.');
            } else {
                throw new Error(error.message || 'Failed to create account. Please try again.');
            }
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
