import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { LayoutDashboard, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
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
                        <div className="bg-zinc-900 dark:bg-white p-3 rounded-xl">
                            <LayoutDashboard className="text-white dark:text-zinc-900" size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-2">Bem-vindo de volta</h2>
                    <p className="text-center text-zinc-500 dark:text-zinc-400 mb-8">Acesse sua conta para gerenciar suas finanças.</p>

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
