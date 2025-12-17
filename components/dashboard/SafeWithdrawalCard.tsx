import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, AlertTriangle, X, Calculator, Info } from 'lucide-react';
import { defaultCurrency } from '../../utils/financialUtils';

interface SafeWithdrawalCardProps {
    balance: number; // Total Projected Balance (Saldo + FCL)
    workingCapital: number;
    safeWithdrawal: number;
    capitalDeficit: number; // Actually "Available Capital" (positive = surplus, negative = deficit)
}

export const SafeWithdrawalCard: React.FC<SafeWithdrawalCardProps> = ({
    balance,
    workingCapital,
    safeWithdrawal,
    capitalDeficit
}) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [simulationAmount, setSimulationAmount] = useState<string>('');

    // --- Derived State ---
    const isSafe = capitalDeficit >= 0;
    const simValue = parseFloat(simulationAmount.replace(/\D/g, '')) / 100 || 0;
    const balanceAfterWithdrawal = balance - simValue;
    const isSimSafe = balanceAfterWithdrawal >= workingCapital;

    // --- Styles ---
    const statusColor = isSafe ? 'text-emerald-500' : 'text-rose-500';
    const bgColor = isSafe ? 'bg-emerald-500/10' : 'bg-rose-500/10';
    const borderColor = isSafe ? 'border-emerald-500/20' : 'border-rose-500/20';
    const badgeText = isSafe ? (safeWithdrawal > 0 ? 'Pode retirar' : 'No limite') : 'Não retire';
    const badgeColor = isSafe ? (safeWithdrawal > 0 ? 'bg-emerald-500 text-white' : 'bg-yellow-500 text-black') : 'bg-rose-500 text-white';

    const formatBRL = (val: number) => defaultCurrency(val);

    return (
        <>
            {/* --- CARD --- */}
            <div
                className={`relative overflow-hidden rounded-2xl border ${borderColor} ${bgColor} p-6 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg group`}
                onClick={() => setIsDrawerOpen(true)}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                            <ShieldCheck size={16} className={statusColor} />
                            Retirada Máxima Segura
                            <div className="group/tooltip relative">
                                <Info size={14} className="text-zinc-600 hover:text-zinc-400" />
                                <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 rounded shadow-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-10">
                                    Saldo Projetado - Capital Mínimo = Máximo Disponível
                                </div>
                            </div>
                        </h3>
                        <p className="text-zinc-500 text-xs mt-0.5">Baseado no Saldo + FCL Previsto</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${badgeColor}`}>
                        {badgeText}
                    </span>
                </div>

                <div className="flex flex-col gap-1">
                    <span className={`text-3xl font-bold tracking-tight ${statusColor}`}>
                        {formatBRL(safeWithdrawal)}
                    </span>
                    {!isSafe && (
                        <div className="flex items-center gap-1.5 text-rose-400 text-xs mt-1 bg-rose-500/10 p-1.5 rounded w-fit">
                            <AlertTriangle size={12} />
                            <span>Déficit Capital: {formatBRL(Math.abs(capitalDeficit))}</span>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 text-xs flex items-center gap-1">
                    <Calculator size={14} />
                    Simular
                </div>
            </div>

            {/* --- SIMULATION DRAWER (PORTAL) --- */}
            {isDrawerOpen && typeof document !== 'undefined' && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        onClick={(e) => { e.stopPropagation(); setIsDrawerOpen(false); }}
                    />

                    {/* Drawer Panel */}
                    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-[9999] p-6 flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calculator className="text-gold-500" />
                                Simulação de Retirada
                            </h2>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsDrawerOpen(false); }}
                                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-6 flex-1 overflow-y-auto">

                            {/* Input */}
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 font-medium">Quanto deseja retirar?</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={simulationAmount}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            const num = parseInt(val, 10) / 100;
                                            setSimulationAmount(num ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(num) : '');
                                        }}
                                        placeholder="0,00"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-xl font-bold text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">
                                    Isso não afeta seu saldo real, é apenas uma simulação.
                                </p>
                            </div>

                            <hr className="border-zinc-800" />

                            {/* Results */}
                            <div className="space-y-4">
                                <div className="bg-zinc-950/50 p-4 rounded-xl space-y-3 border border-zinc-800">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Saldo Projetado Atual</span>
                                        <span className="text-white font-medium">{formatBRL(balance)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Capital Mínimo Necessário</span>
                                        <span className="text-zinc-300 font-medium">{formatBRL(workingCapital)}</span>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl border ${isSimSafe ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'} transition-colors`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-sm font-bold ${isSimSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            Após Retirada
                                        </span>
                                        <span className={`text-lg font-bold ${isSimSafe ? 'text-white' : 'text-rose-100'}`}>
                                            {formatBRL(balanceAfterWithdrawal)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs">
                                        {isSimSafe ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <span className="text-emerald-200">Seguro! Mantém o capital de giro.</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                                <span className="text-rose-200">
                                                    Cuidado! Ficará abaixo do capital mínimo em {formatBRL(Math.abs(balanceAfterWithdrawal - workingCapital))}.
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-6 border-t border-zinc-800 bg-zinc-900 pb-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsDrawerOpen(false); }}
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
                            >
                                Fechar Simulação
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
};
