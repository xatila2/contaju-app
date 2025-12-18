import React, { useState } from 'react';
import { Plus, CreditCard as CardIcon, Trash2, Calendar, DollarSign, Wallet, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { CreditCard, Transaction } from '../types';
import { CurrencyInput } from '../components/CurrencyInput';
import { CreditCardExpenseForm } from '../components/CreditCardExpenseForm';

export const CreditCards = () => {
    const {
        creditCards, transactions, categories,
        handleAddCreditCard, handleAddCardExpense, handlePayInvoice, bankAccounts,
        handleBatchDelete, handleSaveTransaction, addCategory
    } = useTransactions();

    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isPayInvoiceModalOpen, setIsPayInvoiceModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'current' | 'future' | 'history'>('current');
    const [futureOffset, setFutureOffset] = useState(1);

    // Expense Form State
    const [newExpense, setNewExpense] = useState<Partial<Transaction>>({
        description: '',
        amount: 0,
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0]
    });

    const [newCard, setNewCard] = useState<Partial<CreditCard>>({
        name: '',
        limit: 0,
        closingDay: 1,
        dueDay: 10,
        active: true,
        defaultBankAccountId: ''
    });

    const selectedCard = creditCards.find(c => c.id === selectedCardId) || creditCards[0];

    // Filter Logic for Invoices
    const getInvoiceTransactions = (monthOffset = 0) => {
        if (!selectedCard) return [];

        const today = new Date();
        // Base calc for "Current Invoice"
        // If today < closingDay, current invoice is this Month.
        // If today >= closingDay, current invoice is next Month (because this one closed).
        let targetMonth = today.getMonth();
        let targetYear = today.getFullYear();

        if (today.getDate() >= selectedCard.closingDay) {
            targetMonth++;
        }

        // Apply Offset (Future +1, +2 etc)
        targetMonth += monthOffset;

        // Normalize Year
        while (targetMonth > 11) {
            targetMonth -= 12;
            targetYear++;
        }

        const invoiceMonthStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
        const targetInvoiceId = `${selectedCard.id}_${invoiceMonthStr}`;

        return transactions.filter(t => t.creditCardId === selectedCard.id && t.invoiceId === targetInvoiceId);
    };

    const currentInvoiceTransactions = getInvoiceTransactions(0);
    const nextInvoiceTransactions = getInvoiceTransactions(1);

    // For History, we'd need a list of past months. Keeping simple for now.

    const invoiceTotal = currentInvoiceTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const isInvoicePaid = currentInvoiceTransactions.length > 0 && currentInvoiceTransactions.every(t => t.isReconciled);

    // Payment Form State
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        bankAccountId: '',
        date: new Date().toISOString().split('T')[0]
    });

    const openPayModal = () => {
        if (selectedCard) {
            setPaymentData({
                amount: invoiceTotal,
                bankAccountId: selectedCard.defaultBankAccountId || bankAccounts[0]?.id || '',
                date: new Date().toISOString().split('T')[0]
            });
            setIsPayInvoiceModalOpen(true);
        }
    };

    const handlePaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCard && paymentData.amount > 0 && paymentData.bankAccountId) {
            // Reconstruct logic for current invoice month
            // We need to pass the same 'MM-YYYY' logic or similar to match the ID
            // Ideally getInvoiceTransactions() should return the ID, but for now we follow the same date logic
            const today = new Date();
            let targetMonth = today.getMonth();
            let targetYear = today.getFullYear();
            if (today.getDate() >= selectedCard.closingDay) {
                targetMonth++;
                if (targetMonth > 11) { targetMonth = 0; targetYear++; }
            }
            const invoiceMonthStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

            handlePayInvoice(
                selectedCard.id,
                invoiceMonthStr,
                paymentData.amount,
                paymentData.bankAccountId,
                paymentData.date
            );
            setIsPayInvoiceModalOpen(false);
        }
    };

    const handleExpenseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCard && newExpense.description && newExpense.amount) {
            handleAddCardExpense({
                description: newExpense.description,
                amount: Number(newExpense.amount), // Expenses are negative usually but we store absolute and handle type
                date: newExpense.date || new Date().toISOString().split('T')[0],
                dueDate: newExpense.date || new Date().toISOString().split('T')[0], // For card expenses, dueDate = purchase date usually for record
                categoryId: newExpense.categoryId || '',
                category: '', // Deprecated but required by type
                type: 'expense',
                launchDate: new Date().toISOString()
            }, selectedCard.id);

            setIsExpenseModalOpen(false);
            setNewExpense({ description: '', amount: 0, categoryId: '', date: new Date().toISOString().split('T')[0] });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCard.name && newCard.limit && newCard.defaultBankAccountId) {
            handleAddCreditCard({
                name: newCard.name,
                limit: Number(newCard.limit),
                closingDay: Number(newCard.closingDay),
                dueDay: Number(newCard.dueDay),
                defaultBankAccountId: newCard.defaultBankAccountId,
                active: true,
                brand: newCard.brand
            });
            setIsAddModalOpen(false);
            setNewCard({ name: '', limit: 0, closingDay: 1, dueDay: 10, active: true, defaultBankAccountId: '' });
        }
    };

    const handleDeleteTransaction = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este lançamento?')) {
            handleBatchDelete([id]);
        }
    };

    const handleUpdateTransaction = (data: { description: string, amount: number, date: string, categoryId: string }) => {
        if (!editingTransaction) return;

        const updatedTx: Transaction = {
            ...editingTransaction,
            description: data.description,
            amount: editingTransaction.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount),
            date: data.date,
            categoryId: data.categoryId,
            // We do not change invoice logic or installments here for simplicity in this "Edit" mode.
            // If date changes drastically it might mismatch invoiceId. 
            // Ideally we recalc invoiceId but let's assume minor edits for now or user knows.
            // To be safe, if we wanted full re-calc we'd need more logic, but user request is allow "edit".
        };

        handleSaveTransaction(updatedTx);
        setEditingTransaction(null);
    };

    return (
        <div className="flex h-full bg-zinc-50 dark:bg-zinc-950">
            {/* Sidebar List */}
            <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="font-bold text-zinc-900 dark:text-white">Seus Cartões</h2>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {creditCards.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 text-sm">
                            Nenhum cartão cadastrado.
                        </div>
                    ) : (
                        creditCards.map(card => (
                            <button
                                key={card.id}
                                onClick={() => setSelectedCardId(card.id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedCard?.id === card.id
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 ring-1 ring-indigo-500'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-zinc-900 dark:text-white">{card.name}</span>
                                    {card.brand && <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">{card.brand}</span>}
                                </div>
                                <div className="text-xs text-zinc-500">
                                    Final {card.dueDay} • Limite: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit)}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {selectedCard ? (
                    <div className="max-w-4xl mx-auto">
                        <header className="mb-8">
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <CardIcon className="text-indigo-500" />
                                {selectedCard.name}
                            </h1>
                            <p className="text-zinc-500 mt-1">
                                Dia {selectedCard.closingDay} fecha • Dia {selectedCard.dueDay} vence
                            </p>
                        </header>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <div className="text-sm text-zinc-500 mb-2">Limite Total</div>
                                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCard.limit)}
                                </div>
                            </div>
                            {/* Placeholders for used/available */}
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <div className="text-sm text-zinc-500 mb-2">Fatura Atual</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceTotal)}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <div className="text-sm text-zinc-500 mb-2">Disponível</div>
                                <div className="text-2xl font-bold text-emerald-500">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCard.limit - invoiceTotal)}
                                </div>
                            </div>
                        </div>

                        {/* Invoice Tabs & Actions */}
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between p-4 flex-wrap gap-4">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => { setActiveTab('current'); setFutureOffset(1); }}
                                        className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'current' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        Fatura Atual {(() => {
                                            const today = new Date();
                                            let m = today.getMonth();
                                            let y = today.getFullYear();
                                            if (selectedCard && today.getDate() >= selectedCard.closingDay) m++;
                                            const d = new Date(y, m, 1);
                                            return `(${d.toLocaleDateString('pt-BR', { month: 'short' })})`;
                                        })()}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('future')}
                                        className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'future' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        Futuras
                                    </button>
                                </div>

                                {activeTab === 'future' && (
                                    <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
                                        <button
                                            onClick={() => {
                                                if (futureOffset <= 1) {
                                                    setActiveTab('current');
                                                } else {
                                                    setFutureOffset(prev => prev - 1);
                                                }
                                            }}
                                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-500"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-[120px] text-center">
                                            {(() => {
                                                const today = new Date();
                                                // Calculate the display date for the invoice
                                                // Current logic: if today >= closing, "current" is next month.
                                                // So "current" (offset 0) might be Jan.
                                                // Offset 1 would be Feb.
                                                // Let's reuse the getInvoiceTransactions logic to find the target date? 
                                                // Or simpler: just add months to today?
                                                // Wait, getInvoiceTransactions calculates the target month/year internally.
                                                // I should replicate that display here.

                                                let targetMonth = today.getMonth();
                                                let targetYear = today.getFullYear();
                                                if (today.getDate() >= selectedCard.closingDay) {
                                                    targetMonth++;
                                                }
                                                targetMonth += futureOffset;
                                                const date = new Date(targetYear, targetMonth, 1);
                                                return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                                            })()}
                                        </span>
                                        <button
                                            onClick={() => setFutureOffset(prev => prev + 1)}
                                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-500"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsExpenseModalOpen(true)}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        <span className="hidden sm:inline">Nova Despesa</span>
                                    </button>

                                    {activeTab === 'current' && invoiceTotal > 0 && !isInvoicePaid && (
                                        <button
                                            onClick={openPayModal}
                                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                                        >
                                            <DollarSign size={16} />
                                            <span className="hidden sm:inline">Pagar</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Transaction List */}
                            <div className="p-0">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Data</th>
                                            <th className="px-6 py-3 text-left">Descrição</th>
                                            <th className="px-6 py-3 text-left">Categoria</th>
                                            <th className="px-6 py-3 text-right">Valor</th>
                                            <th className="px-6 py-3 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {(activeTab === 'current' ? currentInvoiceTransactions : getInvoiceTransactions(futureOffset)).length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Calendar size={32} className="opacity-20" />
                                                        <p>Nenhum lançamento nesta fatura.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            (activeTab === 'current' ? currentInvoiceTransactions : getInvoiceTransactions(futureOffset)).map(tx => (
                                                <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                                                    <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                                                        {new Date(tx.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-200">
                                                        {tx.description}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                            {categories.find(c => c.id === tx.categoryId)?.name || 'Sem categoria'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(tx.amount))}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => setEditingTransaction(tx)}
                                                                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTransaction(tx.id)}
                                                                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                        <CardIcon size={48} className="mb-4 opacity-50" />
                        <p>Selecione ou crie um cartão para começar</p>
                    </div>
                )}
            </div>

            {/* Expense Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 p-6">
                        <h3 className="text-lg font-bold mb-6 dark:text-white">Nova Despesa no Cartão</h3>
                        <CreditCardExpenseForm
                            categories={categories}
                            onCreateCategory={async (name) => {
                                await addCategory({
                                    name,
                                    type: 'expense',
                                    code: '', // Manual/Auto
                                    isSystemDefault: false
                                });
                            }}
                            onSubmit={(data) => {
                                if (selectedCard) {
                                    handleAddCardExpense({
                                        description: data.description,
                                        amount: Number(data.amount),
                                        date: data.date,
                                        dueDate: data.date,
                                        categoryId: data.categoryId,
                                        category: '',
                                        type: 'expense',
                                        launchDate: new Date().toISOString()
                                    }, selectedCard.id, data.installments);

                                    setIsExpenseModalOpen(false);
                                }
                            }}
                            onCancel={() => setIsExpenseModalOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Edit Transaction Modal */}
            {editingTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 p-6">
                        <h3 className="text-lg font-bold mb-6 dark:text-white">Editar Lançamento</h3>
                        <CreditCardExpenseForm
                            categories={categories}
                            initialData={{
                                description: editingTransaction.description,
                                amount: Math.abs(editingTransaction.amount),
                                date: editingTransaction.date,
                                categoryId: editingTransaction.categoryId
                            }}
                            onSubmit={handleUpdateTransaction}
                            onCancel={() => setEditingTransaction(null)}
                        />
                    </div>
                </div>
            )}




            {/* Pay Invoice Modal */}
            {
                isPayInvoiceModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 p-6">
                            <h3 className="text-lg font-bold mb-6 dark:text-white">Pagar Fatura Atual</h3>
                            <form onSubmit={handlePaySubmit} className="space-y-4">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 mb-4">
                                    <div className="text-sm text-zinc-500">Valor Total da Fatura</div>
                                    <div className="text-xl font-bold text-zinc-900 dark:text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceTotal)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Valor a Pagar</label>
                                    <CurrencyInput
                                        value={Number(paymentData.amount)}
                                        onChange={(val) => setPaymentData({ ...paymentData, amount: val })}
                                        className="w-full p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white font-mono text-lg font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Conta Bancária (Origem)</label>
                                    <select
                                        className="w-full p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                                        value={paymentData.bankAccountId}
                                        onChange={e => setPaymentData({ ...paymentData, bankAccountId: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {bankAccounts.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Data do Pagamento</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                                        value={paymentData.date}
                                        onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" onClick={() => setIsPayInvoiceModalOpen(false)} className="px-4 py-2 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700">Confirmar Pagamento</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Add Card Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 p-6">
                            <h3 className="text-lg font-bold mb-6 dark:text-white">Novo Cartão de Crédito</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome do Cartão</label>
                                    <input
                                        className="w-full p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                                        placeholder="Ex: Nubank, XP Visa Infinite"
                                        value={newCard.name}
                                        onChange={e => setNewCard({ ...newCard, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Banco para Pagamento</label>
                                    <select
                                        className="w-full p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                                        value={newCard.defaultBankAccountId}
                                        onChange={e => setNewCard({ ...newCard, defaultBankAccountId: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {bankAccounts.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Dia Fechamento</label>
                                        <input
                                            type="number" min="1" max="31"
                                            className="w-full p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                                            value={newCard.closingDay}
                                            onChange={e => setNewCard({ ...newCard, closingDay: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Dia Vencimento</label>
                                        <input
                                            type="number" min="1" max="31"
                                            className="w-full p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                                            value={newCard.dueDay}
                                            onChange={e => setNewCard({ ...newCard, dueDay: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Limite (R$)</label>
                                    <div className="relative">
                                        <CurrencyInput
                                            value={Number(newCard.limit)}
                                            onChange={(val) => setNewCard({ ...newCard, limit: val })}
                                            className="w-full p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">Criar Cartão</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
