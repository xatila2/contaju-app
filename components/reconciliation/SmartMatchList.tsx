import React, { useMemo } from 'react';
import { Transaction, BankStatementItem } from '../../types';
import { Check, AlertCircle, Wand2 } from 'lucide-react';

interface SmartMatchListProps {
    statementItem: BankStatementItem;
    candidates: Transaction[];
    selectedIds: string[];
    onToggleSelect: (txId: string) => void;
    onCreate?: () => void;
}

export const SmartMatchList: React.FC<SmartMatchListProps> = ({ statementItem, candidates, selectedIds, onToggleSelect, onCreate }) => {

    // Scoring Logic
    const scoredCandidates = useMemo(() => {
        return candidates.map(tx => {
            // Base Score
            let score = 100;
            const reasons: string[] = [];

            // 1. Amount Penalties (Heavy)
            const txVal = tx.type === 'expense' ? -tx.amount : tx.amount;
            const amountDiff = Math.abs(statementItem.amount - txVal);
            const amountDiffPercent = (amountDiff / Math.abs(statementItem.amount)) * 100;

            // Penalty: For every 0.1% diff, deduct 1 point (1% diff = 10 points lost)
            const amountPenalty = amountDiffPercent * 10;
            score -= amountPenalty;

            if (amountDiff < 0.01) reasons.push('Valor exato');
            else if (amountDiffPercent < 1) reasons.push(`Dif. ${amountDiffPercent.toFixed(1)}%`);

            // 2. Date Penalties (Medium)
            const stmtDate = new Date(statementItem.date);
            const txDate = new Date(tx.date || tx.launchDate);
            stmtDate.setHours(0, 0, 0, 0);
            txDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.abs((stmtDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));

            // Penalty: 2 points per day off
            const datePenalty = daysDiff * 2;
            score -= datePenalty;

            if (daysDiff === 0) reasons.push('Mesma data');
            else if (daysDiff <= 3) reasons.push(`${daysDiff} dias de dif.`);

            // 3. Name Boost (Bonus)
            const itemTokens = statementItem.description.toLowerCase().split(/[\s\-_]+/);
            const txTokens = (tx.description || '').toLowerCase().split(/[\s\-_]+/);
            const hasTokenMatch = itemTokens.some(t => t.length > 3 && txTokens.includes(t));

            if (hasTokenMatch) {
                score += 5; // Boost slightly
                reasons.push('Nome similar');
            }

            // Cap at 100
            score = Math.min(100, score);
            score = Math.max(0, score);

            return { ...tx, score: Math.round(score), reasons };
        })
            .filter(x => x.score >= 90) // User Requirement: Hide below 90%
            .sort((a, b) => b.score - a.score);
    }, [statementItem, candidates]);

    if (scoredCandidates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <Wand2 className="mb-2 opacity-50" />
                <p className="text-sm mb-4">Nenhum lançamento interno encontrado no período.</p>
                {onCreate && (
                    <button
                        onClick={onCreate}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                    >
                        Criar Lançamento agora
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {scoredCandidates.map(tx => {
                const isSelected = selectedIds.includes(tx.id);
                const qualityColor = tx.score > 80 ? 'text-emerald-500' : tx.score > 50 ? 'text-yellow-500' : 'text-zinc-400';

                return (
                    <div
                        key={tx.id}
                        onClick={() => onToggleSelect(tx.id)}
                        className={`
                            group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                            ${isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                                : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300'
                            }
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1 rounded-full border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-300 text-transparent group-hover:border-zinc-400'}`}>
                                <Check size={12} strokeWidth={4} />
                            </div>
                            <div>
                                <p className={`text-sm font-medium ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                    {tx.description}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs">
                                    <span className="text-zinc-500">{new Date(tx.date || tx.launchDate).toLocaleDateString('pt-BR')}</span>
                                    {tx.score > 0 && (
                                        <span className={`flex items-center gap-1 ${qualityColor} font-bold`}>
                                            {tx.score}% Match
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {tx.reasons.map(r => (
                                        <span key={r} className="text-[10px] px-1.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">{r}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className={`text-sm font-bold ${tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.type === 'expense' ? -tx.amount : tx.amount)}
                            </p>
                            {tx.status === 'reconciled' && <span className="text-[10px] text-emerald-500 font-bold">Já Conciliado</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
