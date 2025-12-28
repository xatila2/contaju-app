import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, loading } = useAuth();
    const [forceEntry, setForceEntry] = useState(false);

    // Hard Failsafe: If loading takes > 8s, force entry
    useEffect(() => {
        const t = setTimeout(() => {
            if (loading) {
                console.warn("⚠️ PrivateRoute: Force Entry triggered (Time Limit Exceeded)");
                setForceEntry(true);
            }
        }, 8000);
        return () => clearTimeout(t);
    }, [loading]);

    if (loading && !forceEntry) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 gap-4">
                <Loader2 className="animate-spin text-yellow-500" size={48} />
                <p className="text-zinc-500 text-sm animate-pulse">Verificando Credenciais...</p>
                <div className="text-xs text-zinc-400">Aguardando resposta do servidor...</div>
            </div>
        );
    }

    if (!session && !forceEntry) {
        return <Navigate to="/login" replace />;
    }

    // If forced entry but no session, redirect to login is handled by session check above?
    // Wait, if !session and forceEntry is true, we should still redirect to login!
    // If we bypass loading, `session` might still be null.
    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
