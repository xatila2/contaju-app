
import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PendingApproval: React.FC = () => {
    const { signOut } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={32} className="text-amber-600 dark:text-amber-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        Conta em Análise
                    </h2>

                    <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                        Sua conta foi criada com sucesso e está aguardando aprovação de um administrador para ser liberada.
                        <br /><br />
                        Você receberá um aviso assim que o acesso for concedido.
                    </p>

                    <button
                        onClick={signOut}
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <LogOut size={16} />
                        Sair da conta
                    </button>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 text-center border-t border-zinc-100 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500">
                        Dúvidas? Entre em contato com o suporte.
                    </p>
                </div>
            </div>
        </div>
    );
};
