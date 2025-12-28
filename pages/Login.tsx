import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { Wallet, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debug Check: Verify if Environment Variables are loaded
    React.useEffect(() => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) {
            setError('ERRO CRÍTICO: Variáveis de Ambiente (VITE_SUPABASE_URL) não encontradas. Configure no Vercel!');
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Authenticate with Timeout Protection
            const timeoutPromise = new Promise<{ data: { user: null, session: null }, error: any }>((_, reject) => {
                setTimeout(() => reject(new Error('Tempo limite de conexão excedido. Tente novamente.')), 10000);
            });

            const { data, error: authError } = await Promise.race([
                supabase.auth.signInWithPassword({
                    email,
                    password,
                }),
                timeoutPromise
            ]) as any;

            if (authError) throw authError;

            if (data.user) {
                // 2. Check Approval Status
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('is_approved')
                    .eq('id', data.user.id)
                    .single();

                // If profile exists and is NOT approved
                if (profile && !profile.is_approved) {
                    await supabase.auth.signOut(); // Force signout
                    throw new Error('Sua conta aguarda aprovação do administrador.');
                }

                // Note: If profile doesn't exist (legacy users), we might want to allow access or create one.
                // For strict security, we assume profile must exist or defaults to 'false' if we treat null as false.
                // But typically handle_new_user takes care of new ones. Legacy ones might fail here if not migrated.
            }

            navigate('/');
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

                    {/* Network Diagnostics for User */}
                    <div className="mb-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-500 font-mono">
                        <div className="flex justify-between items-center mb-2">
                            <span>Status da Rede:</span>
                            <button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    const url = import.meta.env.VITE_SUPABASE_URL;
                                    if (!url) { alert('URL não encontrada'); return; }

                                    try {
                                        const start = Date.now();
                                        // Try to fetch the Auth endpoint health or root
                                        const res = await fetch(`${url}/auth/v1/health`, { method: 'GET' });
                                        const time = Date.now() - start;
                                        alert(`Teste de Conexão:\nURL: ${url.substring(0, 15)}...\nStatus: ${res.status} (${res.statusText})\nTempo: ${time}ms\nOK!`);
                                    } catch (err: any) {
                                        alert(`FALHA DE CONEXÃO:\n${err.message}\nVerifique se o Vercel IP não está bloqueado ou se é erro de CORS.`);
                                    }
                                }}
                                className="underline cursor-pointer hover:text-blue-500"
                            >
                                Testar Conexão
                            </button>
                        </div>
                        <div>URL: {import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.substring(0, 20)}...` : 'N/A'}</div>
                    </div>

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
