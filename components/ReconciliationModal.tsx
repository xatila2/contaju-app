
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calculator, ArrowRight, Plus, AlertCircle } from 'lucide-react';
import { Transaction, BankStatementItem, Category } from '../types'; // Update Import

interface ReconciliationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (adjustments: { interest: number; penalty: number; discount: number; newTransaction?: Transaction }) => void;
    statementLine: BankStatementItem | null; // Updated Type
    selectedTransactions: Transaction[];
    categories?: Category[];
    selectedBankId?: string;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
    isOpen, onClose, onConfirm, statementLine, selectedTransactions, categories = [], selectedBankId
}) => {
    const [interest, setInterest] = useState(0);
    const [penalty, setPenalty] = useState(0);
    const [discount, setDiscount] = useState(0);

    // New Transaction State (Resolution)
    const [newTxDesc, setNewTxDesc] = useState('');
    const [newTxCategoryId, setNewTxCategoryId] = useState('');

    // Category Search State
    const [categorySearch, setCategorySearch] = useState('');
    const [isCategoryListOpen, setIsCategoryListOpen] = useState(false);
    const [showResolutionForm, setShowResolutionForm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setInterest(0);
            setPenalty(0);
            setDiscount(0);
            setNewTxDesc(statementLine ? `Ajuste: ${statementLine.description}` : '');
            setNewTxCategoryId('');
            setCategorySearch(''); // Reset search
            setIsCategoryListOpen(false);
            setShowResolutionForm(false);
        }
    }, [isOpen, statementLine]);

    if (!isOpen || !statementLine) return null;

    // Calculate Totals
    // Sum of selected internal transactions (Absolute values usually, but we need to respect sign?)
    // Basic logic: Statement is -100 (Expense). Txs should be Expenses summing to 100.
    // Let's use signed math.
    const stmtVal = statementLine.amount;
    const isExpense = stmtVal < 0;

    const txsTotalSigned = selectedTransactions.reduce((acc, t) => {
        const val = t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount);
        return acc + val;
    }, 0);

    // Adjustments are usually positive numbers extracted from the flow.
    // If Expense: Total Cost = Tx + Interest + Penalty - Discount
    // If Income: Total Received = Tx + Interest + Penalty - Discount ??
    // Actually, Interest/Penalty on Expense INCREASES the outflow.
    // Interest/Penalty on Income INCREASES the inflow? No.
    // Let's stick to "Unexplained Difference".

    // Simplest approach: Target = Statement Amount.
    // Current = Txs Total.
    // Remaining = Target - Current.

    const remaining = stmtVal - txsTotalSigned;

    // Adjustments modify the logical "Internal Total" to match Statement?
    // Internal + Adj = Statement?
    // E.g. Statement -105. Tx -100. Interest -5.
    // -100 + (-5) = -105. Match.

    // So we need to enable user to input adjustments to BRIDGE the gap.
    // BUT the modal UI puts inputs for Interest/Penalty separately.
    // Let's rely on the "Difference" display.

    // We will treat inputs as absolute values and apply sign based on context.
    // If expense: Interest is an added expense (negative). Discount is a reduction of expense (positive).
    const adjNet = isExpense
        ? -(Math.abs(interest) + Math.abs(penalty)) + Math.abs(discount)
        : (Math.abs(interest) + Math.abs(penalty)) - Math.abs(discount); // Income: Interest adds to received? Usually interest received.
    // Wait, "Juros/Multa" on Income usually means we RECEIVED more (User paid late).
    // "Desconto" on Income means we RECEIVED less.

    const calculatedTotal = txsTotalSigned + adjNet;
    const finalDifference = stmtVal - calculatedTotal; // Should be 0

    const isBalanced = Math.abs(finalDifference) < 0.01;

    const handleConfirm = () => {
        let newTransaction: Transaction | undefined = undefined;

        // If user wants to create a transaction for the remaining difference explicitly
        if (!isBalanced && showResolutionForm && newTxCategoryId) {
            // Create a transaction that fills the gap
            newTransaction = {
                id: `tx-res-${Date.now()}`,
                description: newTxDesc,
                amount: Math.abs(finalDifference),
                type: finalDifference > 0 ? 'income' : 'expense', // Sign determines type
                // Note: If Difference is -50 (Need -50 more), type is expense?
                // Statement: -150. Tx: -100. Diff: -50. Yes, need another expense of 50.
                // Statement: 150. Tx: 100. Diff: 50. Need another income of 50.
                status: 'reconciled',
                launchDate: new Date().toISOString().split('T')[0], // Today creation
                dueDate: statementLine.date, // Match statement date
                paymentDate: statementLine.date,
                categoryId: newTxCategoryId,
                bankAccountId: selectedBankId,
                isReconciled: true,
                date: statementLine.date,
                category: ''
            };
        } else if (!isBalanced && !showResolutionForm) {
            if (!confirm("Diferença não justificada. Deseja conciliar mesmo assim? (Gerará pendência)")) {
                return;
            }
        }

        onConfirm({
            interest: Math.abs(interest),
            penalty: Math.abs(penalty),
            discount: Math.abs(discount),
            newTransaction
        });
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-t-xl sticky top-0 z-10">
                    <div className="flex items-center space-x-2">
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                            <Calculator size={20} className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Concluir Conciliação</h3>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Visual Equation */}
                    <div className="flex items-center justify-between text-center gap-2">
                        <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 flex-1">
                            <p className="text-xs text-zinc-500 uppercase font-bold">Extrato</p>
                            <p className={`text-lg font-bold ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stmtVal)}
                            </p>
                        </div>
                        <div className="text-zinc-300">=</div>
                        <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 flex-1 relative">
                            <div className="absolute -top-2 -right-2 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {selectedTransactions.length} itens
                            </div>
                            <p className="text-xs text-zinc-500 uppercase font-bold">Selecionado</p>
                            <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(txsTotalSigned)}
                            </p>
                        </div>
                    </div>

                    {/* Adjustments */}
                    <div className="bg-zinc-50/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2">
                            <Plus size={12} /> Ajustes / Encargos
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Juros</label>
                                <input
                                    type="number" min="0" step="0.01"
                                    value={interest || ''}
                                    onChange={(e) => setInterest(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="0,00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Multa</label>
                                <input
                                    type="number" min="0" step="0.01"
                                    value={penalty || ''}
                                    onChange={(e) => setPenalty(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="0,00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Desconto</label>
                                <input
                                    type="number" min="0" step="0.01"
                                    value={discount || ''}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-sm text-emerald-600 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Result Card */}
                    <div className={`p-4 rounded-lg transition-colors duration-300 ${isBalanced ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className={`text-xs font-bold uppercase mb-0.5 ${isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                    {isBalanced ? 'Valores Batem!' : 'Diferença Restante'}
                                </p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isBalanced ? calculatedTotal : finalDifference)}
                                </p>
                            </div>
                            {isBalanced
                                ? <CheckCircle2 size={32} className="text-emerald-500 animate-in zoom-in" />
                                : <AlertCircle size={32} className="text-rose-500 animate-pulse" />
                            }
                        </div>

                        {/* Resolution Form */}
                        {!isBalanced && (
                            <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-800/50">
                                {!showResolutionForm ? (
                                    <button
                                        onClick={() => setShowResolutionForm(true)}
                                        className="w-full py-2.5 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded flex items-center justify-center gap-2 transition"
                                    >
                                        <Plus size={14} /> Registrar Diferença como Lançamento
                                    </button>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Novo Lançamento ({finalDifference > 0 ? 'Entrada' : 'Saída'})</p>
                                        <input
                                            value={newTxDesc}
                                            onChange={(e) => setNewTxDesc(e.target.value)}
                                            placeholder="Descrição (ex: Tarifas, Diferença Cambial...)"
                                            className="w-full text-sm p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                            autoFocus
                                        />
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Buscar Categoria..."
                                                className="w-full text-sm p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={categorySearch}
                                                onChange={(e) => {
                                                    setCategorySearch(e.target.value);
                                                    setIsCategoryListOpen(true);
                                                    if (e.target.value === '') setNewTxCategoryId('');
                                                }}
                                                onFocus={() => {
                                                    // If input is empty but category is selected, fill input with category name
                                                    if (!categorySearch && newTxCategoryId) {
                                                        const cat = categories.find(c => c.id === newTxCategoryId);
                                                        if (cat) setCategorySearch(cat.name);
                                                    }
                                                    setIsCategoryListOpen(true);
                                                }}
                                                onBlur={() => setTimeout(() => setIsCategoryListOpen(false), 200)}
                                            />
                                            {/* Dropdown Icon */}
                                            <div className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none">
                                                <ArrowRight size={14} className="rotate-90" />
                                            </div>

                                            {isCategoryListOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-lg z-50">
                                                    {categories
                                                        .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                                        .map(c => (
                                                            <div
                                                                key={c.id}
                                                                className="px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-zinc-700 dark:text-zinc-200 border-b last:border-0 border-zinc-50 dark:border-zinc-700/50"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    setNewTxCategoryId(c.id);
                                                                    setCategorySearch(c.name);
                                                                    setIsCategoryListOpen(false);
                                                                }}
                                                            >
                                                                {c.name}
                                                            </div>
                                                        ))
                                                    }
                                                    {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                                                        <div className="px-3 py-2 text-xs text-zinc-400 italic">Nenhuma categoria encontrada</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setShowResolutionForm(false)} className="text-xs text-zinc-500 hover:text-zinc-700 px-3 py-1">Cancelar</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-3 bg-zinc-50 dark:bg-zinc-900 rounded-b-xl sticky bottom-0 z-10">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isBalanced && !showResolutionForm && !confirm}
                        className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all 
                            ${isBalanced || (showResolutionForm && newTxCategoryId && newTxDesc)
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20 transform hover:-translate-y-0.5'
                                : 'bg-zinc-400 cursor-not-allowed'
                            }`}
                    >
                        Confirmar & Conciliar
                    </button>
                </div>
            </div>
        </div>
    );
};
