
import React, { useState, useMemo } from 'react';
import { Plus, Search, ShoppingBag, FileText, Calendar, CheckCircle2, AlertCircle, Clock, Link as LinkIcon, Trash2, X, ArrowUpRight } from 'lucide-react';
import { Purchase, Category, CostCenter, Transaction } from '../types';
import { PurchaseModal } from '../components/PurchaseModal';

import { useTransactions } from '../context/TransactionContext';
import { useNavigate } from 'react-router-dom';

interface PurchasesProps { }

export const Purchases: React.FC<PurchasesProps> = () => {
    const {
        purchases, transactions, categories, costCenters,
        handleSavePurchase, handleDeletePurchase
    } = useTransactions();
    const navigate = useNavigate();

    const onSavePurchase = handleSavePurchase;
    const onDeletePurchase = handleDeletePurchase;
    const onViewTransaction = (txId: string) => {
        // Navegar para transactions com filtro ou hash? 
        // Por simplificação, apenas navega para transações
        navigate('/transactions');
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Details Modal State
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const filteredPurchases = purchases.filter(p =>
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

    const getPaymentStatus = (purchase: Purchase) => {
        const relatedTxs = transactions.filter(t => purchase.linkedTransactionIds.includes(t.id));
        if (relatedTxs.length === 0) return { label: 'Sem parcelas', color: 'zinc' };

        const allPaid = relatedTxs.every(t => t.status === 'reconciled');
        if (allPaid) return { label: 'Concluído', color: 'emerald' };

        const anyOverdue = relatedTxs.some(t => t.status === 'overdue' || (t.status === 'pending' && t.dueDate < new Date().toISOString().split('T')[0]));
        if (anyOverdue) return { label: 'Atrasado', color: 'rose' };

        const paidCount = relatedTxs.filter(t => t.status === 'reconciled').length;
        if (paidCount > 0) return { label: `Parcial (${paidCount}/${relatedTxs.length})`, color: 'blue' };

        return { label: 'Pendente', color: 'yellow' };
    };

    // Helper for Details Modal
    const linkedInstallments = useMemo(() => {
        if (!selectedPurchase) return [];
        return transactions
            .filter(t => selectedPurchase.linkedTransactionIds.includes(t.id))
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [selectedPurchase, transactions]);

    const handleRowDoubleClick = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        setIsDetailsOpen(true);
    };

    const handleInstallmentDoubleClick = (txId: string) => {
        if (onViewTransaction) {
            onViewTransaction(txId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestão de Compras</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Registre compras e gere automaticamente o Contas a Pagar.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition"
                >
                    <Plus size={18} />
                    <span>Nova Compra</span>
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-[500px]">
                {/* Filters */}
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-2.5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar por fornecedor ou descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-50 dark:bg-zinc-950">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Fornecedor / Descrição</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">Parcelas</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">Status Financeiro</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
                            {filteredPurchases.length > 0 ? filteredPurchases.map(purchase => {
                                const status = getPaymentStatus(purchase);
                                return (
                                    <tr
                                        key={purchase.id}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                        onDoubleClick={() => handleRowDoubleClick(purchase)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                            {new Date(purchase.purchaseDate).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white">{purchase.supplier}</span>
                                                <span className="text-xs text-zinc-500">{purchase.description}</span>
                                                {purchase.invoiceNumber && <span className="text-[10px] text-zinc-400 mt-0.5">NF: {purchase.invoiceNumber}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                            {formatMoney(purchase.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-500">
                                            {purchase.installmentsCount}x
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full bg-${status.color}-100 dark:bg-${status.color}-900/30 text-${status.color}-700 dark:text-${status.color}-400`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="group relative">
                                                    <LinkIcon size={16} className="text-blue-500 cursor-help" />
                                                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                        Integrado ao AP
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeletePurchase(purchase.id); }}
                                                    className="text-zinc-400 hover:text-rose-500 transition-colors" title="Excluir Compra e Parcelas"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        Nenhuma compra registrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PurchaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSavePurchase}
                categories={categories}
                costCenters={costCenters}
            />

            {/* Details Modal */}
            {isDetailsOpen && selectedPurchase && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{selectedPurchase.supplier}</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedPurchase.description}</p>
                            </div>
                            <button onClick={() => setIsDetailsOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-0 overflow-auto">
                            <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800">
                                <thead className="bg-zinc-50 dark:bg-zinc-950 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Parcela</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500">Vencimento</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Valor</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                    {linkedInstallments.map((tx, idx) => (
                                        <tr
                                            key={tx.id}
                                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer group"
                                            onDoubleClick={() => handleInstallmentDoubleClick(tx.id)}
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">
                                                {idx + 1} / {selectedPurchase.installmentsCount}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-zinc-500">
                                                {new Date(tx.dueDate).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-bold text-rose-600 dark:text-rose-400">
                                                {formatMoney(Math.abs(tx.amount))}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.status === 'reconciled'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {tx.status === 'reconciled' ? 'Pago' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleInstallmentDoubleClick(tx.id)}
                                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-xs flex items-center justify-end gap-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Ver <ArrowUpRight size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-xl">
                            Dica: Clique duas vezes na parcela para editar no Contas a Pagar.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
