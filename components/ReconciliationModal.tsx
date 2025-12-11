
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Calculator, ArrowRight, Plus } from 'lucide-react';
import { Transaction, BankStatementLine, Category } from '../types';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (adjustments: { interest: number; penalty: number; discount: number }, newTransaction?: Transaction) => void;
  statementLine: BankStatementLine | null;
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
  const [showResolutionForm, setShowResolutionForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInterest(0);
      setPenalty(0);
      setDiscount(0);
      setNewTxDesc(statementLine ? `Ajuste: ${statementLine.description}` : '');
      setNewTxCategoryId('');
      setShowResolutionForm(false);
    }
  }, [isOpen, statementLine]);

  if (!isOpen || !statementLine) return null;

  const transactionsTotal = selectedTransactions.reduce((acc, t) => acc + t.amount, 0);
  const isExpense = statementLine.amount < 0;
  
  const calculatedTotal = isExpense
    ? transactionsTotal - Math.abs(interest) - Math.abs(penalty) + Math.abs(discount)
    : transactionsTotal + Math.abs(interest) + Math.abs(penalty) - Math.abs(discount);

  const difference = statementLine.amount - calculatedTotal;
  const isBalanced = Math.abs(difference) < 0.01;

  const handleConfirm = () => {
    if (!isBalanced && !showResolutionForm) {
        if (!confirm("Os valores não batem exatamente. Deseja conciliar mesmo assim com diferença?")) {
            return;
        }
    }
    
    let newTransaction: Transaction | undefined = undefined;
    if (!isBalanced && showResolutionForm && newTxCategoryId) {
        newTransaction = {
            id: `tx-res-${Date.now()}`,
            description: newTxDesc,
            amount: difference,
            type: difference > 0 ? 'income' : 'expense',
            status: 'reconciled',
            launchDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(statementLine.date).toISOString().split('T')[0],
            paymentDate: new Date(statementLine.date).toISOString().split('T')[0],
            categoryId: newTxCategoryId,
            bankAccountId: selectedBankId,
            isReconciled: true
        };
    }

    onConfirm({
      interest: Math.abs(interest),
      penalty: Math.abs(penalty),
      discount: Math.abs(discount)
    }, newTransaction);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-t-xl sticky top-0">
          <div className="flex items-center space-x-2">
             <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                <Calculator size={20} className="text-yellow-600 dark:text-yellow-400" />
             </div>
             <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Validar Conciliação</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4 items-center text-center">
                <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 uppercase">Extrato</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statementLine.amount)}
                    </p>
                </div>
                <div className="flex justify-center text-zinc-400"><ArrowRight /></div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 uppercase">Selecionados ({selectedTransactions.length})</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transactionsTotal)}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ajustes Financeiros</p>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Juros / Multa</label>
                        <input 
                            type="number" min="0" step="0.01"
                            value={interest}
                            onChange={(e) => setInterest(parseFloat(e.target.value) || 0)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-sm text-rose-600 font-medium"
                            placeholder="0,00"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Outros Encargos</label>
                        <input 
                            type="number" min="0" step="0.01"
                            value={penalty}
                            onChange={(e) => setPenalty(parseFloat(e.target.value) || 0)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-sm text-rose-600 font-medium"
                            placeholder="0,00"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Descontos</label>
                        <input 
                            type="number" min="0" step="0.01"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-sm text-emerald-600 font-medium"
                            placeholder="0,00"
                        />
                    </div>
                </div>
            </div>

            <div className={`p-4 rounded-lg flex flex-col gap-2 ${isBalanced ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800'}`}>
                <div className="flex justify-between items-center">
                    <div>
                        <p className={`text-xs font-bold uppercase ${isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {isBalanced ? 'Valores Conciliados' : 'Diferença Encontrada'}
                        </p>
                        <p className="text-xl font-bold text-zinc-900 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedTotal)}
                        </p>
                    </div>
                    {!isBalanced && (
                        <div className="text-right">
                             <p className="text-xs text-rose-700 dark:text-rose-400 font-bold">Faltando</p>
                             <p className="text-sm font-bold text-rose-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(difference)}
                             </p>
                        </div>
                    )}
                    {isBalanced && <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />}
                </div>

                {!isBalanced && (
                    <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800">
                        {!showResolutionForm ? (
                            <button 
                                onClick={() => setShowResolutionForm(true)}
                                className="w-full py-2 text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/20 rounded flex items-center justify-center gap-1 transition shadow-sm"
                            >
                                <Plus size={12} /> Criar Lançamento da Diferença
                            </button>
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 p-3 rounded border border-rose-200 dark:border-rose-800 space-y-2">
                                <p className="text-xs font-bold text-zinc-900 dark:text-white">Novo Lançamento ({difference > 0 ? 'Receita' : 'Despesa'})</p>
                                <input 
                                    type="text"
                                    value={newTxDesc}
                                    onChange={(e) => setNewTxDesc(e.target.value)}
                                    placeholder="Descrição"
                                    className="w-full text-xs p-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                />
                                <select 
                                    value={newTxCategoryId}
                                    onChange={(e) => setNewTxCategoryId(e.target.value)}
                                    className="w-full text-xs p-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                >
                                    <option value="">Selecione Categoria...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="text-xs text-zinc-400 flex justify-between">
                                    <span>Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(difference)}</span>
                                    <button onClick={() => setShowResolutionForm(false)} className="text-rose-500 hover:underline">Cancelar</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-3 bg-zinc-50 dark:bg-zinc-900 rounded-b-xl sticky bottom-0">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                Cancelar
            </button>
            <button 
                onClick={handleConfirm}
                disabled={!isBalanced && !showResolutionForm}
                className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all ${isBalanced || (showResolutionForm && newTxCategoryId) ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-zinc-400 cursor-not-allowed'}`}
            >
                {showResolutionForm ? 'Criar & Conciliar' : 'Confirmar & Baixar'}
            </button>
        </div>
      </div>
    </div>
  );
};
