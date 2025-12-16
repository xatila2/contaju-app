import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

interface CyberHeroCardProps {
    balance: number;
    projected: number;
}

export const CyberHeroCard: React.FC<CyberHeroCardProps> = ({ balance, projected }) => {
    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="relative h-full min-h-[220px] rounded-2xl p-8 overflow-hidden flex flex-col justify-between text-white shadow-xl">
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 z-0" />

            {/* Abstract Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <Wallet size={20} className="text-blue-200" />
                    </div>
                    <span className="text-blue-100 font-medium tracking-wide">Saldo Disponível</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                    {formatMoney(balance)}
                </h2>

                <p className="text-blue-200/60 text-sm">
                    Previsão para fim do mês: <span className="text-white font-medium">{formatMoney(projected)}</span>
                </p>
            </div>

            <div className="relative z-10 mt-6">
                <button className="flex items-center gap-2 text-sm font-semibold text-slate-900 bg-white hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                    Ver Extrato <ArrowUpRight size={16} />
                </button>
            </div>
        </div>
    );
};
