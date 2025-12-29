import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Wallet, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth(); // Get user from context

    // Debug Check: Verify if Environment Variables are loaded
    React.useEffect(() => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) {
            setError('ERRO CRÍTICO: Variáveis de Ambiente (VITE_SUPABASE_URL) não encontradas. Configure no Vercel!');
        }
    }, []);

    // Auto-Redirect if ALREADY logged in (Fixes infinite spinning if handleLogin hangs but AuthContext succeeds)
    React.useEffect(() => {
        if (user) {
            console.log('Login: User detected in context, redirecting...');
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let sessionData = null;
            let profileId = null;

            // 1. Try Standard SDK Login with Short Timeout
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('SDK Timeout')), 5000)
                );

                const { data, error: authError } = await Promise.race([
                    supabase.auth.signInWithPassword({ email, password }),
                    timeoutPromise
                ]) as any;

                if (authError) throw authError;
                sessionData = data;
                profileId = data.user?.id;
            } catch (err: any) {
                console.warn('⚠️ SDK Login failed/timed out, trying Raw Fallback...', err);

                // 2. FALLBACK: Raw Fetch Login
                const url = import.meta.env.VITE_SUPABASE_URL;
                const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

                const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': key,
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || data.error_description || 'Falha no login (Fallback)');
                }

                // Manually set session in SDK
                const { error: setSessionError } = await supabase.auth.setSession({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                });

                if (setSessionError) throw setSessionError;

                sessionData = { user: data.user };
                profileId = data.user?.id;
            }

            // 3. Post-Login Checks
            if (profileId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_approved')
                    .eq('id', profileId)
                    .single();

                if (profile && !profile.is_approved) {
                    await supabase.auth.signOut();
                    throw new Error('Sua conta aguarda aprovação do administrador.');
                }
            }

            // Do NOT navigate manually. Let the useEffect rely on the AuthContext state change.
            // navigate('/');
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials'
                ? 'E-mail ou senha incorretos.'
                : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-center mb-8">
                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-3 rounded-xl shadow-lg shadow-yellow-500/20">
                            <Wallet className="text-black" size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-2">Bem-vindo de volta</h2>
                    <p className="text-center text-zinc-500 dark:text-zinc-400 mb-8 font-medium">Gestão Financeira Inteligente Contaju</p>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-600 dark:text-rose-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-zinc-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-zinc-900 dark:text-white"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-zinc-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-zinc-900 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-zinc-500">
                        Não tem uma conta?{' '}
                        <Link to="/register" className="font-bold text-zinc-900 dark:text-white hover:underline">
                            Criar conta
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
