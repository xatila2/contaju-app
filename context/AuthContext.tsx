import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const initSession = async () => {
            console.log('[AuthDebug] initSession start');
            try {
                // Defensive timeout: If Supabase hangs, we proceed as logged out
                const timeoutPromise = new Promise<{ data: { session: null }, error: any }>((resolve) => {
                    setTimeout(() => resolve({ data: { session: null }, error: new Error("Timeout") }), 5000);
                });

                const { data, error } = await Promise.race([
                    supabase.auth.getSession(),
                    timeoutPromise
                ]);

                console.log('[AuthDebug] getSession result', { hasSession: !!data?.session, error });

                const session = data?.session;
                setSession(session ?? null);
                setUser(session?.user ?? null);

                if (session?.user) {
                    console.log('[AuthDebug] fetching profile for', session.user.id);
                    await fetchProfile(session.user.id);
                    console.log('[AuthDebug] fetchProfile done');
                }
            } catch (e) {
                console.error('[AuthDebug] initSession error', e);
            } finally {
                console.log('[AuthDebug] setting loading false');
                setLoading(false);
            }
        };

        const fetchProfile = async (userId: string) => {
            console.log('[AuthDebug] fetchProfile start query');
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            console.log('[AuthDebug] fetchProfile query result', { data, error });
            if (data) setProfile(data as Profile);
        };

        initSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('[AuthDebug] onAuthStateChange', _event);
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    const isAdmin = profile?.role === 'admin';

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, isAdmin, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
