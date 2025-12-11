import React, { useState, useEffect } from 'react';
import { X, Calculator, ShoppingBag, Plus, Trash2, Calendar, FileText, DollarSign, Save } from 'lucide-react';
import { Purchase, Transaction, Category, CostCenter } from '../types';
import { CurrencyInput } from './CurrencyInput';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (purchase: Purchase, transactions: Transaction[]) => void;
    categories: Category[];
    costCenters: CostCenter[];
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
    isOpen, onClose, onSave, categories, costCenters
}) => {
    const [supplier, setSupplier] = useState('');
    const [description, setDescription] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [categoryId, setCategoryId] = useState('');
    const [costCenterId, setCostCenterId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');

    // Installment Config
    const [installmentsCount, setInstallmentsCount] = useState(1);
    const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [calculatedInstallments, setCalculatedInstallments] = useState<Partial<Transaction>[]>([]);

    // Effect to recalculate installments when key fields change
    useEffect(() => {
        if (totalAmount > 0 && installmentsCount > 0) {
            const installments: Partial<Transaction>[] = [];
            const baseValue = Math.floor((totalAmount / installmentsCount) * 100) / 100;
            let remainder = Math.round((totalAmount - (baseValue * installmentsCount)) * 100) / 100;

            const startDate = new Date(firstDueDate);

            for (let i = 0; i < installmentsCount; i++) {
                let val = baseValue;
                // Add remainder to the first installment
                if (i === 0) val += remainder;

                const dueDate = new Date(startDate);
                dueDate.setMonth(startDate.getMonth() + i);

                installments.push({
                    amount: -val, // Expense is negative
                    dueDate: dueDate.toISOString().split('T')[0],
                    description: `${description} (${i + 1}/${installmentsCount})`,
                });
            }
            setCalculatedInstallments(installments);
        } else {
            setCalculatedInstallments([]);
        }
    }, [totalAmount, installmentsCount, firstDueDate, description]);

    const handleSave = () => {
        if (!supplier || !description || !categoryId || totalAmount <= 0) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

        const purchaseId = `purch-${Date.now()}`;
        const newTransactions: Transaction[] = calculatedInstallments.map((inst, idx) => ({
            id: `tx-${purchaseId}-${idx}`,
            description: inst.description || description,
            amount: inst.amount || 0,
            type: 'expense',
            status: 'pending',
            launchDate: purchaseDate,
            dueDate: inst.dueDate || purchaseDate,
            categoryId,
            costCenterId,
            client: supplier,
            purchaseId
        }));

        const newPurchase: Purchase = {
            id: purchaseId,
            supplier,
            description,
            purchaseDate,
            totalAmount,
            installmentsCount,
            status: 'synced',
            categoryId,
            costCenterId,
            invoiceNumber,
            linkedTransactionIds: newTransactions.map(t => t.id)
        };

        onSave(newPurchase, newTransactions);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setSupplier('');
        setDescription('');
        setTotalAmount(0);
        setInstallmentsCount(1);
        setCalculatedInstallments([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">

                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Novo Lançamento de Compra</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Crie a compra e gere parcelas automaticamente no Contas a Pagar.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Purchase Details */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">Dados da Compra</h4>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fornecedor *</label>
                            <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500" placeholder="Ex: Fornecedor ABC" autoFocus />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Descrição *</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500" placeholder="Ex: Compra de Equipamentos" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Data da Compra</label>
                                <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nota Fiscal</label>
                                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500" placeholder="Nº 12345" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Categoria *</label>
                                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                                    <option value="">Selecione...</option>
                                    {categories.filter(c => c.type === 'expense').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Centro de Custo</label>
                                <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                                    <option value="">Selecione...</option>
                                    {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Installment Calculation */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col h-full">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-4 flex items-center gap-2">
                            <Calculator size={16} /> Parcelamento e Valores
                        </h4>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Valor Total (R$) *</label>
                                <CurrencyInput value={totalAmount} onChange={val => setTotalAmount(val)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-lg font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500" placeholder="0,00" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nº Parcelas</label>
                                    <input type="number" min="1" max="120" value={installmentsCount} onChange={e => setInstallmentsCount(parseInt(e.target.value))} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">1º Vencimento</label>
                                    <input type="date" value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col">
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Simulação de Parcelas (Serão criadas no AP)</label>
                            <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-950 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Parcela</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-zinc-500">Vencimento</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {calculatedInstallments.map((inst, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 text-zinc-900 dark:text-zinc-200">{idx + 1}x</td>
                                                <td className="px-4 py-2 text-center text-zinc-500">{new Date(inst.dueDate!).toLocaleDateString('pt-BR')}</td>
                                                <td className="px-4 py-2 text-right font-medium text-rose-600 dark:text-rose-400">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(inst.amount || 0))}
                                                </td>
                                            </tr>
                                        ))}
                                        {calculatedInstallments.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-zinc-400 text-xs">Informe o valor total para calcular.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-3 bg-white dark:bg-zinc-900 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">Cancelar</button>
                    <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 rounded-lg transition"
                    >
                        <Save size={16} />
                        <span>Salvar Compra e Gerar AP</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
