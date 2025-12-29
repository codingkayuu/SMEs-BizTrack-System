import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AdminUser } from '../types';

interface AdminAuthContextType {
    user: User | null;
    session: Session | null;
    adminProfile: AdminUser | null;
    loading: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshAdminProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
    user: null,
    session: null,
    adminProfile: null,
    loading: true,
    isAdmin: false,
    isSuperAdmin: false,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
    refreshAdminProfile: async () => { },
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Refs for state to avoid stale closure in timeouts/listeners
    const loadingRef = useRef(true);
    const fetchInProgress = useRef<string | null>(null);
    const lastFetchTime = useRef<number>(0);
    const mountedRef = useRef(true);

    // Synchronize ref with state
    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    const isAdmin = !!adminProfile && adminProfile.is_active;
    const isSuperAdmin = isAdmin && adminProfile?.role === 'super_admin';

    useEffect(() => {
        mountedRef.current = true;

        // Safety timeout to prevent infinite loading - reduced to 10s for better UX
        // and made more robust by checking if loading is still true.
        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mountedRef.current && loadingRef.current) {
                console.warn('[AdminAuth] Initializing auth timed out (10s) - forcing loading to false');
                setLoading(false);
            }
        }, 10000);

        async function verifyAndLoad(currentSession: Session | null, source: string) {
            if (!mountedRef.current) return;

            // Check if we already fetched this session recently (within 2 seconds)
            const now = Date.now();
            if (fetchInProgress.current === currentSession?.user?.id && (now - lastFetchTime.current < 2000)) {
                console.log(`[AdminAuth] Skipping redundant fetch from ${source}`);
                // CRITICAL: Ensure loading is false even if we skip
                setLoading(false);
                return;
            }

            console.log(`[AdminAuth] Verifying status from ${source} for:`, currentSession?.user?.id || 'none');

            try {
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    // Lock this fetch
                    fetchInProgress.current = currentSession.user.id;
                    lastFetchTime.current = now;

                    console.log('[AdminAuth] Fetching profile via standard query...');

                    const { data: profile, error } = await supabase
                        .from('admin_users')
                        .select('*')
                        .eq('user_id', currentSession.user.id)
                        .maybeSingle();

                    if (!mountedRef.current) return;

                    if (error) {
                        console.error('[AdminAuth] Profile fetch error:', error);
                        setAdminProfile(null);
                    } else if (profile) {
                        console.log('[AdminAuth] Profile fetched successfully');
                        setAdminProfile(profile as AdminUser);

                        // Use a fire-and-forget update that DOES NOT block the UI
                        setTimeout(async () => {
                            try {
                                await supabase.from('admin_users')
                                    .update({ last_login_at: new Date().toISOString() })
                                    .eq('user_id', currentSession.user.id);
                                console.log('[AdminAuth] Background login update finished');
                            } catch (e) {
                                console.warn('[AdminAuth] Background login update failed', e);
                            }
                        }, 100);
                    } else {
                        console.log('[AdminAuth] No admin profile found');
                        setAdminProfile(null);
                    }
                } else {
                    setAdminProfile(null);
                    fetchInProgress.current = null;
                }
            } catch (err) {
                console.error('[AdminAuth] Profile fetch exception:', err);
                if (mountedRef.current) setAdminProfile(null);
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                    console.log(`[AdminAuth] Auth initialization finished (${source})`);
                }
                fetchInProgress.current = null;
            }
        }

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[AdminAuth] Initial session check complete');
            verifyAndLoad(session, 'getSession');
        }).catch(err => {
            console.error('[AdminAuth] Initial session check failed:', err);
            if (mountedRef.current) setLoading(false);
        });

        // Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[AdminAuth] Auth change event:', event);
            if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
                verifyAndLoad(session, 'onAuthStateChange');
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setAdminProfile(null);
                setLoading(false);
                fetchInProgress.current = null;
            }
        });

        return () => {
            mountedRef.current = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    // Removed the separate fetchAdminProfile function as it's consolidated into verifyAndLoad

    const signIn = async (email: string, password: string) => {
        console.log('[AdminAuth] signIn attempt for:', email);
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            if (!data.session?.user) throw new Error('Authentication failed - no session created.');

            console.log('[AdminAuth] Auth successful, fetching admin profile...');

            // We don't need an explicit refresh here anymore, 
            // as onAuthStateChange will trigger verifyAndLoad
            console.log('[AdminAuth] Sign in successful, waiting for listener to populate profile...');
        } catch (error: any) {
            console.error('[AdminAuth] signIn failed:', error);
            setLoading(false);
            if (error.message?.includes('Invalid login credentials')) {
                throw new Error('Invalid email or password.');
            } else if (error.message?.includes('Email not confirmed')) {
                throw new Error('Please confirm your email address.');
            } else {
                throw new Error(error.message || 'Login failed. Please try again.');
            }
        }
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (error) throw error;

            if (!data.user) throw new Error('Failed to create account.');

            // Success - for admin portal, we don't automatically create the admin_users record
            // since it requires activation/approval. We just resolve normally.
        } catch (error: any) {
            if (error.message?.includes('already registered')) {
                throw new Error('This email is already registered.');
            } else {
                throw new Error(error.message || 'Failed to request access. Please try again.');
            }
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setAdminProfile(null);
    };

    const refreshAdminProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data } = await supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (data) {
                setAdminProfile(data as AdminUser);
            }
        }
    };

    return (
        <AdminAuthContext.Provider value={{
            user,
            session,
            adminProfile,
            loading,
            isAdmin,
            isSuperAdmin,
            signIn,
            signUp,
            signOut,
            refreshAdminProfile
        }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
