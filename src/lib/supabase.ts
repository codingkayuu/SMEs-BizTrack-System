import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'finflow-auth',
            // Optimized for faster login and better performance
            flowType: 'pkce', // More secure and faster
            debug: false, // Disable debug for production
        },
        // Global settings for better performance
        global: {
            headers: {
                'X-Client-Info': 'finflow-web',
            },
            // Optimized fetch settings for faster requests
            fetch: (url, options = {}) => {
                return fetch(url, {
                    ...options,
                    // Shorter timeout for faster failure detection
                    signal: AbortSignal.timeout(30000), // 30 seconds max
                });
            },
        },
        // Real-time settings optimized for performance
        realtime: {
            params: {
                eventsPerSecond: 10, // Limit events for slower connections
            },
        },
        // Database settings for better performance
        db: {
            schema: 'public',
        },
    }
);
