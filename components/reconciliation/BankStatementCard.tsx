import React, { useState } from 'react';
import { BankStatementItem } from '../../types';
import { ChevronDown, ChevronUp, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

interface BankStatementCardProps {
    item: BankStatementItem;
    isSelected: boolean;
    onSelect: () => void;
}

export const BankStatementCard: React.FC<BankStatementCardProps> = ({ item, isSelected, onSelect }) => {
    const [expanded, setExpanded] = useState(false);

    // Advanced Parsing Logic
    const parseDescription = (raw: string) => {
        let clean = raw
            .replace(/Transferência Pix/gi, 'Pix')
            .replace(/Pagamento de Boleto/gi, 'Boleto')
            .replace(/Compra Cartão/gi, 'Cartão')
            .replace(/DEBITO/gi, '')
            .replace(/CREDITO/gi, '')
            .replace(/\d{2}\/\d{2}/, '') // Remove dates like 12/05
            .trim();

        // Extract likely name (mock logic, improves with regex)
        // If "Pix - Name", split
        let main = clean;
        let sub = '';

        if (clean.includes('-')) {
            const parts = clean.split('-');
            main = parts[1].trim();
            sub = parts[0].trim();
        }

        if (main.length < 3) main = raw; // Fallback

        return { main, sub };
    };

    const { main, sub } = parseDescription(item.description);

    return (
        <div
            onClick={onSelect}
            className={`
                relative cursor-pointer transition-all duration-200 border rounded-lg p-3 group
                ${isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-md transform scale-[1.01] z-10'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm'
                }
            `}
        >
            <div className="flex justify-between items-start gap-3">
                {/* Icon / Leading */}
                <div className={`
                    mt-1 p-2 rounded-full shrink-0 flex items-center justify-center
                    ${item.isReconciled
                        ? 'bg-indigo-600 text-white'
                        : (item.amount < 0
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600')
                    }
                `}>
                    {item.isReconciled ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate" title={item.description}>
                            {main}
                        </h4>
                        <span className={`text-sm font-bold whitespace-nowrap ${item.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                        </span>
                    </div>

                    <div className="flex justify-between items-end mt-1">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {sub || 'Transação Bancária'} • {new Date(item.date).toLocaleDateString('pt-BR')}
                        </p>

                        {/* Expand Button (memo) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                            className="text-[10px] text-zinc-400 hover:text-indigo-500 flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-zinc-700"
                        >
                            {expanded ? 'Menos' : 'Ver original'} {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 font-mono bg-zinc-50 dark:bg-zinc-950/50 p-2 rounded">
                    {item.description}
                    {item.memo && <div className="mt-1 text-zinc-400">{item.memo}</div>}
                    <div className="mt-1 text-[10px] text-zinc-300 flex items-center gap-1">
                        FITID: {item.fitid || 'N/A'} <LinkIcon size={8} />
                    </div>
                </div>
            )}

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white ring-2 ring-white dark:ring-zinc-900 shadow-sm animate-in zoom-in">
                    <ArrowRight size={12} strokeWidth={3} />
                </div>
            )}
        </div>
    );
};

const LinkIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
);
