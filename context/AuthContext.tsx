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
    authStatus: string;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    signOut: async () => { },
    authStatus: '',
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const [authStatus, setAuthStatus] = useState('Inicializando...');

    useEffect(() => {
        let mounted = true;

        // WATCHDOG: The final authority.
        // If loading is still true after 5 seconds, FORCE it to false.
        const watchdog = setTimeout(() => {
            if (mounted && loading) {
                console.warn('⚠️ AuthContext Watchdog: Forcing loading completion.');
                setAuthStatus('Tempo limite excedido. Liberando...');
                setLoading(false);
            }
        }, 5000);

        const initSession = async () => {
            console.log('[AuthDebug] initSession start');
            setAuthStatus('Verificando Sessão (Supabase)...');
            try {
                // Short timeout for initial session check
                const timeoutPromise = new Promise<{ data: { session: null }, error: any }>((resolve) => {
                    setTimeout(() => resolve({ data: { session: null }, error: new Error("Timeout") }), 3000);
                });

                const { data, error } = await Promise.race([
                    supabase.auth.getSession(),
                    timeoutPromise
                ]);

                if (!mounted) return;

                console.log('[AuthDebug] getSession result', { hasSession: !!data?.session, error });

                const session = data?.session;
                setSession(session ?? null);
                setUser(session?.user ?? null);

                if (session?.user) {
                    setAuthStatus(`Usuário encontrado: ${session.user.email}. Buscando perfil...`);
                    // Fetch profile with strict timeout
                    try {
                        const profilePromise = fetchProfile(session.user.id);
                        const profileTimeout = new Promise((resolve) => setTimeout(resolve, 3000));
                        await Promise.race([profilePromise, profileTimeout]);
                    } catch (e) {
                        console.error("Profile fetch race error", e);
                    }
                } else {
                    setAuthStatus('Sessão não encontrada.');
                }
            } catch (e) {
                console.error('[AuthDebug] initSession error', e);
                setAuthStatus('Erro na inicialização.');
            } finally {
                if (mounted) {
                    setAuthStatus('Concluído.');
                    setLoading(false);
                }
            }
        };

        const fetchProfile = async (userId: string) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single(); // Requires fix_profile_policy.sql to be safe
                if (mounted && data) setProfile(data as Profile);
            } catch (e) {
                console.error('Profile fetch error', e);
            }
        };

        // Initialize immediately
        initSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            console.log('[AuthDebug] onAuthStateChange', _event);
            setAuthStatus(`Evento de Auth: ${_event}`);

            // If we receive an event, we trust it more than initSession
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
            // Ensure we unblock
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(watchdog);
        };
    }, []);

    const signOut = async () => {
        setAuthStatus('Saindo...');
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
        setUser(null);
    };

    const isAdmin = profile?.role === 'admin';

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, isAdmin, signOut, authStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
