
import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Search, Calendar, CheckCircle, CheckCircle2, AlertCircle, Clock, MoreVertical, Repeat, Paperclip, FileText, Check, RotateCcw, Building2, CreditCard, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, ArrowRight, Briefcase, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Transaction, TransactionType, TransactionStatus, Category, BankAccount, CostCenter } from '../types';
import { PaymentConfirmationModal } from '../components/PaymentConfirmationModal';
import { DateRangePicker } from '../components/DateRangePicker';

import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';

interface FilterState {
    type: 'all' | TransactionType;
    status: 'all' | TransactionStatus | 'dueToday' | 'toDue';
    startDate: string;
    endDate: string;
    costCenterId: string;
    bankAccountId: string;
    origin: 'all' | 'bank_account' | 'credit_card';
}

type SortField = 'dueDate' | 'description' | 'amount' | 'status' | 'client' | 'paymentDate' | 'bankAccountId';
type SortDirection = 'asc' | 'desc';

interface TransactionsProps {
    onEdit: (tx: Transaction) => void;
    preSelectedBankId?: string;
    highlightTransactionId?: string | null;
}

export const Transactions: React.FC<TransactionsProps> = ({
    onEdit, preSelectedBankId, highlightTransactionId
}) => {
    const { transactions, categories, bankAccounts, creditCards, costCenters, handleQuickStatusUpdate, handleBatchDelete, handleBatchStatusUpdate } = useTransactions();
    const onUpdateStatus = handleQuickStatusUpdate;

    // Batch Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [showBatchPayModal, setShowBatchPayModal] = useState(false);
    const [showBatchEditModal, setShowBatchEditModal] = useState(false);


    const [searchTerm, setSearchTerm] = useState('');

    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedTxForPayment, setSelectedTxForPayment] = useState<Transaction | null>(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: SortDirection }>({
        field: 'dueDate',
        direction: 'asc'
    });

    const [filters, setFilters] = useState<FilterState>(() => {
        const saved = localStorage.getItem('finflux_tx_filters');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...parsed,
                costCenterId: parsed.costCenterId || 'all',
                bankAccountId: parsed.bankAccountId || 'all'
            };
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            type: 'expense',
            status: 'all',
            startDate: startOfMonth.toISOString().split('T')[0],
            endDate: endOfMonth.toISOString().split('T')[0],
            costCenterId: 'all',
            bankAccountId: 'all',
            origin: 'all'
        };
    });

    // Deep Link Handling
    useEffect(() => {
        if (preSelectedBankId) {
            setFilters(prev => ({
                ...prev,
                bankAccountId: preSelectedBankId,
                status: 'all'
            }));
        }

        if (highlightTransactionId) {
            const targetTx = transactions.find(t => t.id === highlightTransactionId);
            if (targetTx) {
                setFilters(prev => ({
                    ...prev,
                    status: 'all',
                    startDate: '',
                    endDate: '',
                    type: targetTx.type,
                    bankAccountId: 'all',
                }));

                if (targetTx.type === 'expense') setActiveTab('payable');
                if (targetTx.type === 'income') setActiveTab('receivable');
                if (targetTx.type === 'transfer') setActiveTab('transfer');
            }
        }
    }, [preSelectedBankId, highlightTransactionId, transactions]);

    useEffect(() => {
        if (highlightTransactionId) {
            const element = document.getElementById(`row-${highlightTransactionId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightTransactionId, transactions, filters]);

    const [activeTab, setActiveTab] = useState<'payable' | 'receivable' | 'transfer'>(() => {
        if (filters.type === 'transfer') return 'transfer';
        return filters.type === 'income' ? 'receivable' : 'payable';
    });

    const handleTabChange = (tab: 'payable' | 'receivable' | 'transfer') => {
        setActiveTab(tab);
        let newType: TransactionType = 'expense';
        if (tab === 'receivable') newType = 'income';
        if (tab === 'transfer') newType = 'transfer';
        setFilters(prev => ({ ...prev, type: newType }));
    };

    const handleSort = (field: SortField) => {
        setSortConfig(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // --- PERIOD NAVIGATION LOGIC ---
    const handlePeriodPrev = () => handlePeriodShift('prev');
    const handlePeriodNext = () => handlePeriodShift('next');

    const handlePeriodShift = (direction: 'prev' | 'next') => {
        if (!filters.startDate || !filters.endDate) return;

        // Timezone-safe parsing: parse YYYY-MM-DD strings manually
        const [startY, startM, startD] = filters.startDate.split('-').map(Number);
        const [endY, endM, endD] = filters.endDate.split('-').map(Number);

        const start = new Date(startY, startM - 1, startD); // Month is 0-indexed
        const end = new Date(endY, endM - 1, endD);

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const modifier = direction === 'next' ? 1 : -1;

        // Smart shift logic
        if (diffDays >= 27 && diffDays <= 32) {
            // Month shift - calculate new start and end based on original start month + modifier
            const newStart = new Date(start.getFullYear(), start.getMonth() + modifier, 1);
            const newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0);
            setFilters(prev => ({ ...prev, startDate: newStart.toISOString().split('T')[0], endDate: newEnd.toISOString().split('T')[0] }));

        } else if (diffDays >= 360) {
            // Year shift
            const newStart = new Date(start.getFullYear() + modifier, start.getMonth(), start.getDate());
            const newEnd = new Date(end.getFullYear() + modifier, end.getMonth(), end.getDate());
            setFilters(prev => ({ ...prev, startDate: newStart.toISOString().split('T')[0], endDate: newEnd.toISOString().split('T')[0] }));
        } else {
            // Week or Custom: shift by exact duration + 1 day to clear the range
            const shiftAmount = diffDays + 1;
            const newStart = new Date(start);
            const newEnd = new Date(end);
            newStart.setDate(start.getDate() + (shiftAmount * modifier));
            newEnd.setDate(end.getDate() + (shiftAmount * modifier));
            setFilters(prev => ({ ...prev, startDate: newStart.toISOString().split('T')[0], endDate: newEnd.toISOString().split('T')[0] }));
        }
    };

    // --- BATCH LOGIC ---
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = filteredTransactions.map(t => t.id);
            setSelectedIds(new Set(allIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBatchDeleteAction = () => {
        if (confirm(`Tem certeza que deseja excluir ${selectedIds.size} lançamentos?`)) {
            handleBatchDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };

    const handleBatchPayConfirmAction = (date: string, bankId: string) => {
        handleBatchStatusUpdate(Array.from(selectedIds), {
            status: 'reconciled',
            paymentDate: date,
            bankAccountId: bankId,
            isReconciled: true
        });
        setSelectedIds(new Set());
        setShowBatchPayModal(false);
    };

    const handleBatchEditConfirmAction = (updates: any) => {
        handleBatchStatusUpdate(Array.from(selectedIds), updates);
        setSelectedIds(new Set());
        setShowBatchEditModal(false);
    };

    useEffect(() => {
        localStorage.setItem('finflux_tx_filters', JSON.stringify(filters));
    }, [filters]);

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Sem Categoria';
    const getBankName = (id: string | undefined) => id ? bankAccounts.find(b => b.id === id)?.name : '-';

    // Helper to resolve Source Name (Bank vs Card)
    const getSourceName = (tx: Transaction) => {
        if (tx.origin === 'credit_card' && tx.creditCardId) {
            return creditCards.find(c => c.id === tx.creditCardId)?.name || 'Cartão Desconhecido';
        }
        return getBankName(tx.bankAccountId);
    };

    const openPaymentModal = (e: React.MouseEvent, tx: Transaction) => {
        e.stopPropagation();
        setSelectedTxForPayment(tx);
        setIsPayModalOpen(true);
    };

    const handleConfirmPayment = (data: { paymentDate: string; bankAccountId: string; interest: number; penalty: number; discount: number; finalAmount: number; paidAmount: number }) => {
        if (selectedTxForPayment) {
            onUpdateStatus(selectedTxForPayment.id, {
                status: 'reconciled',
                paymentDate: data.paymentDate,
                bankAccountId: data.bankAccountId,
                interest: data.interest,
                penalty: data.penalty,
                discount: data.discount,
                finalAmount: data.finalAmount,
                // @ts-ignore - we are passing this extra field which context will handle
                paidAmount: data.paidAmount
            });
        }
        setIsPayModalOpen(false);
        setSelectedTxForPayment(null);
    };

    const handleUndo = (e: React.MouseEvent, tx: Transaction) => {
        e.stopPropagation();
        if (confirm('Desfazer reconciliação?')) {
            onUpdateStatus(tx.id, {
                status: 'pending',
                paymentDate: undefined,
                interest: 0, penalty: 0, discount: 0, finalAmount: undefined
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'reconciled': return <span className="flex items-center space-x-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-xs font-semibold"><CheckCircle2 size={12} /><span>Pago</span></span>;
            case 'pending': return <span className="flex items-center space-x-1 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-semibold"><Clock size={12} /><span>Pendente</span></span>;
            case 'overdue': return <span className="flex items-center space-x-1 px-2 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 text-xs font-semibold"><AlertCircle size={12} /><span>Atrasado</span></span>;
            default: return <span className="flex items-center space-x-1 px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold"><span>Agendado</span></span>;
        }
    };

    const filteredTransactions = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        let list = transactions.filter(tx => {
            if (highlightTransactionId && tx.id === highlightTransactionId) return true;

            const matchesSearch =
                tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.amount.toString().includes(searchTerm);

            const matchesType = filters.type === 'all' || tx.type === filters.type;

            let matchesStatus = true;
            if (filters.status === 'all') matchesStatus = true;
            else if (filters.status === 'reconciled') matchesStatus = tx.status === 'reconciled';
            else if (filters.status === 'pending') matchesStatus = tx.status === 'pending';
            else if (filters.status === 'overdue') matchesStatus = tx.status === 'overdue' || (tx.status === 'pending' && tx.dueDate < today);
            else if (filters.status === 'dueToday') matchesStatus = tx.status !== 'reconciled' && tx.dueDate === today;
            else if (filters.status === 'toDue') matchesStatus = tx.status !== 'reconciled' && tx.dueDate > today;

            // STRICT Due Date filtering
            const matchesDate = (!filters.startDate || tx.dueDate >= filters.startDate) &&
                (!filters.endDate || tx.dueDate <= filters.endDate);

            // Source Filtering
            const matchesCostCenter = filters.costCenterId === 'all' || tx.costCenterId === filters.costCenterId;
            const matchesBank = filters.bankAccountId === 'all' ||
                tx.bankAccountId === filters.bankAccountId ||
                (tx.origin === 'credit_card' && creditCards.find(c => c.id === tx.creditCardId)?.defaultBankAccountId === filters.bankAccountId);

            // Origin Filtering
            const matchesOrigin = filters.origin === 'all' ||
                (filters.origin === 'credit_card' ? tx.origin === 'credit_card' : (tx.origin === 'bank_account' || !tx.origin));

            return matchesSearch && matchesType && matchesStatus && matchesDate && matchesCostCenter && matchesBank && matchesOrigin;
        });

        // Sorting Logic
        list = list.sort((a, b) => {
            let valA: any = a[sortConfig.field];
            let valB: any = b[sortConfig.field];

            if (sortConfig.field === 'amount') {
                valA = Math.abs(a.amount);
                valB = Math.abs(b.amount);
            } else if (sortConfig.field === 'client') {
                valA = a.client || '';
                valB = b.client || '';
            } else if (sortConfig.field === 'bankAccountId') {
                valA = getBankName(a.bankAccountId) || '';
                valB = getBankName(b.bankAccountId) || '';
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [transactions, searchTerm, filters, highlightTransactionId, sortConfig]);

    // Determine View Mode: Grouped by Date (if sorted by dueDate) OR Flat List (if sorted by other columns)
    const isGroupedView = sortConfig.field === 'dueDate';

    // Group transactions by Date for the view
    const groupedTransactions = useMemo(() => {
        if (!isGroupedView) return {};
        const groups: { [key: string]: Transaction[] } = {};
        filteredTransactions.forEach(tx => {
            const date = tx.dueDate;
            if (!groups[date]) groups[date] = [];
            groups[date].push(tx);
        });
        return groups;
    }, [filteredTransactions, isGroupedView]);

    const sortedDateKeys = Object.keys(groupedTransactions).sort((a, b) => {
        const timeA = new Date(a).getTime();
        const timeB = new Date(b).getTime();
        return sortConfig.direction === 'desc' ? timeB - timeA : timeA - timeB;
    });

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortConfig.field !== field) return <div className="w-4 h-4 opacity-0 group-hover:opacity-30"><ArrowDown size={14} /></div>;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-yellow-600" /> : <ArrowDown size={14} className="text-yellow-600" />;
    };

    const TableHeader = ({ label, field, align = 'left' }: { label: string, field: SortField, align?: 'left' | 'center' | 'right' }) => (
        <th
            className={`px-6 py-3 text-${align} text-xs font-bold text-zinc-500 uppercase tracking-wider cursor-pointer group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors select-none`}
            onClick={() => handleSort(field)}
        >
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                {label}
                <SortIcon field={field} />
            </div>
        </th>
    );

    const BatchPayModal = () => {
        const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
        const [bank, setBank] = useState('');

        if (!showBatchPayModal) return null;

        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 p-6">
                    <h3 className="text-lg font-bold mb-4 dark:text-white">Pagamento em Lote</h3>
                    <p className="text-sm text-zinc-500 mb-4">Atualizando {selectedIds.size} lançamentos para "Pago".</p>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Data do Pagamento</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded p-2 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Conta Bancária</label>
                            <select value={bank} onChange={e => setBank(e.target.value)} className="w-full border rounded p-2 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white">
                                <option value="">Selecione...</option>
                                {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowBatchPayModal(false)} className="px-4 py-2 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300">Cancelar</button>
                        <button
                            disabled={!bank}
                            onClick={() => handleBatchPayConfirmAction(date, bank)}
                            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 disabled:opacity-50"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const BatchEditModal = () => {
        if (!showBatchEditModal) return null;

        const [updates, setUpdates] = useState<{
            dueDate?: string;
            paymentDate?: string;
            bankAccountId?: string;
        }>({});

        const [toggles, setToggles] = useState({
            dueDate: false,
            paymentDate: false,
            bankAccountId: false
        });

        const handleConfirm = () => {
            const finalUpdates: any = {};
            if (toggles.dueDate && updates.dueDate) finalUpdates.dueDate = updates.dueDate;
            if (toggles.paymentDate && updates.paymentDate) {
                finalUpdates.paymentDate = updates.paymentDate;
                // If payment date is set, implied status might be 'reconciled' if not already. 
                // But user asked to "Alter date", not necessarily "Pay". 
                // However, usually having a payment date means it is paid. 
                // Let's assume just data edit for now.
            }
            if (toggles.bankAccountId && updates.bankAccountId) finalUpdates.bankAccountId = updates.bankAccountId;

            handleBatchEditConfirmAction(finalUpdates);
        };

        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 p-6 animate-in zoom-in-95">
                    <h3 className="text-lg font-bold mb-4 dark:text-white">Edição em Lote</h3>
                    <p className="text-sm text-zinc-500 mb-6">Editando {selectedIds.size} lançamentos selecionados.</p>

                    <div className="space-y-4 mb-8">
                        {/* Due Date Toggle */}
                        <div className={`p-3 rounded-lg border transition-colors ${toggles.dueDate ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : 'border-zinc-200 dark:border-zinc-700'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                                    <input type="checkbox" checked={toggles.dueDate} onChange={e => setToggles({ ...toggles, dueDate: e.target.checked })} className="rounded text-yellow-600 focus:ring-yellow-500" />
                                    Alterar Vencimento
                                </label>
                            </div>
                            {toggles.dueDate && (
                                <input
                                    type="date"
                                    value={updates.dueDate || ''}
                                    onChange={e => setUpdates({ ...updates, dueDate: e.target.value })}
                                    className="w-full text-sm p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                                />
                            )}
                        </div>

                        {/* Payment Date Toggle */}
                        <div className={`p-3 rounded-lg border transition-colors ${toggles.paymentDate ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-zinc-200 dark:border-zinc-700'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                                    <input type="checkbox" checked={toggles.paymentDate} onChange={e => setToggles({ ...toggles, paymentDate: e.target.checked })} className="rounded text-emerald-600 focus:ring-emerald-500" />
                                    Alterar Data Pagamento
                                </label>
                            </div>
                            {toggles.paymentDate && (
                                <input
                                    type="date"
                                    value={updates.paymentDate || ''}
                                    onChange={e => setUpdates({ ...updates, paymentDate: e.target.value })}
                                    className="w-full text-sm p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                                />
                            )}
                        </div>

                        {/* Bank Toggle */}
                        <div className={`p-3 rounded-lg border transition-colors ${toggles.bankAccountId ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-zinc-200 dark:border-zinc-700'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                                    <input type="checkbox" checked={toggles.bankAccountId} onChange={e => setToggles({ ...toggles, bankAccountId: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                                    Alterar Conta/Banco
                                </label>
                            </div>
                            {toggles.bankAccountId && (
                                <select
                                    value={updates.bankAccountId || ''}
                                    onChange={e => setUpdates({ ...updates, bankAccountId: e.target.value })}
                                    className="w-full text-sm p-2 border rounded dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                                >
                                    <option value="">Selecione...</option>
                                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowBatchEditModal(false)} className="px-4 py-2 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300">Cancelar</button>
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 text-sm bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded font-bold hover:opacity-90"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        if (isToday) return 'Hoje';
        if (isYesterday) return 'Ontem';
        if (isTomorrow) return 'Amanhã';

        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    };



    // --- UPDATED ROW COMPONENT ---
    const TransactionRowWithSelection: React.FC<{ tx: Transaction; idx: number }> = ({ tx, idx }) => (
        <tr
            id={`row-${tx.id}`}
            className={`group transition-all duration-300 cursor-pointer border-l-4 ${idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'
                } ${selectedIds.has(tx.id) ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-yellow-600' : (highlightTransactionId === tx.id ? 'bg-yellow-100 dark:bg-yellow-900/30 border-l-yellow-500 animate-pulse' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/70 hover:shadow-md border-l-transparent hover:border-l-yellow-500')}`}
            onClick={(e) => {
                // If clicking row (not checkbox/button), maybe select? No, standard behavior is edit. 
                // But if user holds CMD/CTRL? 
                // Let's stick to Select Checkbox for selection, Double Click for Edit.
            }}
            onDoubleClick={() => onEdit(tx)}
        >
            {/* Checkbox Cell */}
            <td className="pl-4 py-4 w-10">
                <input
                    type="checkbox"
                    checked={selectedIds.has(tx.id)}
                    onChange={(e) => { e.stopPropagation(); handleSelectRow(tx.id); }}
                    className="w-4 h-4 rounded border-zinc-300 text-yellow-600 focus:ring-yellow-500 cursor-pointer"
                />
            </td>

            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                            {tx.description}
                        </span>
                        <div className="flex gap-1">
                            {tx.notes && <FileText size={12} className="text-zinc-400" />}
                            {tx.attachmentName && <Paperclip size={12} className="text-zinc-400" />}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">{tx.client || (tx.type === 'transfer' ? 'Interno' : 'Sem cliente')}</span>
                        <span className="text-zinc-300 dark:text-zinc-600">•</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-200 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
                            {tx.type === 'transfer' ? 'Transferência' : getCategoryName(tx.categoryId)}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-600 dark:text-zinc-400 font-medium font-mono">
                {new Date(tx.dueDate).toLocaleDateString('pt-BR')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-600 dark:text-zinc-400">
                {tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString('pt-BR') : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-zinc-600 dark:text-zinc-400">
                {tx.type === 'transfer' ? (
                    <div className="flex items-center space-x-1 text-xs">
                        <span className="font-bold">{getBankName(tx.bankAccountId)}</span>
                        <ArrowRight size={12} className="text-zinc-400" />
                        <span className="font-bold">{getBankName(tx.destinationBankAccountId)}</span>
                    </div>
                ) : (
                    tx.origin === 'credit_card' ? (
                        <div className="flex items-center space-x-1">
                            <CreditCard size={12} className="text-zinc-400" />
                            <span>{getSourceName(tx)}</span>
                        </div>
                    ) : (
                        getBankName(tx.bankAccountId) ? (
                            <div className="flex items-center space-x-1">
                                <Building2 size={12} className="text-zinc-400" />
                                <span>{getBankName(tx.bankAccountId)}</span>
                            </div>
                        ) : <span className="text-zinc-300">-</span>
                    )
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex flex-col items-end">
                    <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : tx.type === 'transfer' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {tx.type === 'income' ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap flex justify-center">
                {getStatusBadge(tx.status)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div className="flex items-center justify-center space-x-2 transition-all">
                    {tx.status === 'pending' || tx.status === 'overdue' || tx.status === 'scheduled' ? (
                        <button
                            onClick={(e) => openPaymentModal(e, tx)}
                            className="group p-1 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-colors" title="Marcar como Pago"
                        >
                            <CheckCircle size={20} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => handleUndo(e, tx)}
                            className="p-1 text-zinc-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full transition-colors" title="Desfazer"
                        >
                            <RotateCcw size={18} />
                        </button>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(tx); }}
                        className="p-1 text-zinc-400 hover:text-yellow-500 transition-colors"
                    >
                        <MoreVertical size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );

    const metrics = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const targetType = activeTab === 'receivable' ? 'income' : activeTab === 'transfer' ? 'transfer' : 'expense';

        const typeTransactions = transactions.filter(t => t.type === targetType);

        const filteredForMetrics = typeTransactions.filter(t => {
            // STRICT Date Filtering based on Due Date
            const dateMatch = (!filters.startDate || t.dueDate >= filters.startDate) && (!filters.endDate || t.dueDate <= filters.endDate);
            const ccMatch = filters.costCenterId === 'all' || t.costCenterId === filters.costCenterId;
            const bankMatch = filters.bankAccountId === 'all' || t.bankAccountId === filters.bankAccountId;
            return dateMatch && ccMatch && bankMatch;
        });

        const totalValue = filteredForMetrics.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const pendingTxs = filteredForMetrics.filter(t => t.status !== 'reconciled');

        const overdueCount = pendingTxs.filter(t => t.status === 'overdue' || t.dueDate < today).length;
        const dueTodayCount = pendingTxs.filter(t => t.dueDate === today).length;
        const toDueCount = pendingTxs.filter(t => t.dueDate > today).length;

        return { totalValue, overdueCount, dueTodayCount, toDueCount };
    }, [transactions, activeTab, filters]);

    const MetricCard = ({ title, value, count, active, onClick, colorClass }: any) => (
        <button
            onClick={onClick}
            className={`flex-1 p-4 rounded-xl border transition-all duration-200 flex flex-col items-start justify-between text-left h-24 ${active
                ? `bg-white dark:bg-zinc-800 border-${colorClass}-500 ring-1 ring-${colorClass}-500 shadow-md`
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
        >
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{title}</span>
            <div className="mt-1">
                <div className={`text-lg font-bold ${active ? `text-${colorClass}-600 dark:text-${colorClass}-400` : 'text-zinc-900 dark:text-white'}`}>
                    {value}
                </div>
                {count !== undefined && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{count} lançamentos</div>
                )}
            </div>
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Transações</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Gerencie pagamentos, recebimentos e transferências.</p>
                </div>
                <div className="flex bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <button
                        onClick={() => handleTabChange('payable')}
                        className={`flex items-center space-x-3 px-6 py-3.5 text-base font-semibold rounded-lg transition-all ${activeTab === 'payable' ? 'bg-rose-50 dark:bg-rose-900/20 shadow-md text-rose-600 dark:text-rose-400 border-2 border-rose-200 dark:border-rose-800' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                        <ArrowDownCircle size={20} />
                        <span>Pagar</span>
                    </button>
                    <button
                        onClick={() => handleTabChange('receivable')}
                        className={`flex items-center space-x-3 px-6 py-3.5 text-base font-semibold rounded-lg transition-all ${activeTab === 'receivable' ? 'bg-emerald-50 dark:bg-emerald-900/20 shadow-md text-emerald-600 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                        <ArrowUpCircle size={20} />
                        <span>Receber</span>
                    </button>
                    <button
                        onClick={() => handleTabChange('transfer')}
                        className={`flex items-center space-x-3 px-6 py-3.5 text-base font-semibold rounded-lg transition-all ${activeTab === 'transfer' ? 'bg-blue-50 dark:bg-blue-900/20 shadow-md text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-800' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                        <ArrowRightLeft size={20} />
                        <span>Transferências</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    title="Total no Período"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalValue)}
                    active={filters.status === 'all'}
                    onClick={() => setFilters({ ...filters, status: 'all' })}
                    colorClass="zinc"
                />
                <MetricCard
                    title="A Vencer"
                    value={metrics.toDueCount}
                    count="Lançamentos futuros"
                    active={filters.status === 'toDue'}
                    onClick={() => setFilters({ ...filters, status: 'toDue' })}
                    colorClass="blue"
                />
                <MetricCard
                    title="Vence Hoje"
                    value={metrics.dueTodayCount}
                    count="Ação necessária"
                    active={filters.status === 'dueToday'}
                    onClick={() => setFilters({ ...filters, status: 'dueToday' })}
                    colorClass="yellow"
                />
                <MetricCard
                    title="Vencido"
                    value={metrics.overdueCount}
                    count="Atenção"
                    active={filters.status === 'overdue'}
                    onClick={() => setFilters({ ...filters, status: 'overdue' })}
                    colorClass="rose"
                />
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none text-zinc-900 dark:text-white"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePeriodPrev}
                                className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <DateRangePicker
                                startDate={filters.startDate}
                                endDate={filters.endDate}
                                onChange={(start, end) => setFilters({ ...filters, startDate: start, endDate: end })}
                            />
                            <button
                                onClick={handlePeriodNext}
                                className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 px-3 h-10">
                            <Building2 size={16} className="text-zinc-400" />
                            <select
                                value={filters.bankAccountId}
                                onChange={(e) => setFilters({ ...filters, bankAccountId: e.target.value })}
                                className="bg-transparent border-none text-zinc-700 dark:text-zinc-200 text-sm focus:ring-0 p-0 outline-none min-w-[120px]"
                            >
                                <option value="all">Todos Bancos</option>
                                {bankAccounts.map(bank => (
                                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 px-3 h-10">
                            <Briefcase size={16} className="text-zinc-400" />
                            <select
                                value={filters.costCenterId}
                                onChange={(e) => setFilters({ ...filters, costCenterId: e.target.value })}
                                className="bg-transparent border-none text-zinc-700 dark:text-zinc-200 text-sm focus:ring-0 p-0 outline-none min-w-[120px]"
                            >
                                <option value="all">Todos C.C.</option>
                                {costCenters.map(cc => (
                                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 px-3 h-10">
                            <Filter size={16} className="text-zinc-400" />
                            <select
                                value={filters.origin}
                                onChange={(e) => setFilters({ ...filters, origin: e.target.value as any })}
                                className="bg-transparent border-none text-zinc-700 dark:text-zinc-200 text-sm focus:ring-0 p-0 outline-none min-w-[100px]"
                            >
                                <option value="all">Todas Origens</option>
                                <option value="bank_account">Conta Bancária</option>
                                <option value="credit_card">Cartão de Crédito</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-50 dark:bg-zinc-950">
                            <tr>
                                <th className="pl-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length}
                                        className="w-4 h-4 rounded border-zinc-300 text-yellow-600 focus:ring-yellow-500"
                                    />
                                </th>
                                <TableHeader label="Descrição" field="description" />
                                <TableHeader label="Vencimento" field="dueDate" align="center" />
                                <TableHeader label="Pagamento" field="paymentDate" align="center" />
                                <TableHeader label={activeTab === 'transfer' ? 'Origem -> Destino' : 'Banco'} field="bankAccountId" />
                                <TableHeader label="Valor" field="amount" align="right" />
                                <TableHeader label="Status" field="status" align="center" />
                                <th className="px-6 py-3 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {isGroupedView ? (
                                sortedDateKeys.length > 0 ? sortedDateKeys.map((dateKey) => (
                                    <React.Fragment key={dateKey}>
                                        {/* Date Header Row */}
                                        <tr className="bg-zinc-200 dark:bg-zinc-950 border-b border-zinc-300 dark:border-zinc-800">
                                            <td colSpan={8} className="px-6 py-2">
                                                <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                                    <Calendar size={12} />
                                                    {formatDateHeader(dateKey)}
                                                </span>
                                            </td>
                                        </tr>
                                        {/* Transactions for that date */}
                                        {groupedTransactions[dateKey].map((tx, idx) => (
                                            <TransactionRowWithSelection key={tx.id} tx={tx} idx={idx} />
                                        ))}
                                    </React.Fragment>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-24 text-center text-zinc-500">Nenhum lançamento encontrado para o período.</td>
                                    </tr>
                                )
                            ) : (
                                // Flat View (Sorted by other columns)
                                filteredTransactions.length > 0 ? filteredTransactions.map((tx, idx) => (
                                    <TransactionRowWithSelection key={tx.id} tx={tx} idx={idx} />
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-24 text-center text-zinc-500">Nenhum lançamento encontrado para o período.</td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaymentConfirmationModal
                isOpen={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                onConfirm={handleConfirmPayment}
                transaction={selectedTxForPayment}
                bankAccounts={bankAccounts}
            />

            <BatchPayModal />
            <BatchEditModal />

            {/* Batch Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 border border-zinc-700/50">
                    <span className="font-bold text-sm bg-zinc-800 px-2 py-1 rounded">{selectedIds.size} selecionados</span>
                    <div className="h-4 w-px bg-zinc-700"></div>
                    <button
                        onClick={() => setShowBatchPayModal(true)}
                        className="flex items-center gap-2 hover:text-emerald-400 font-medium text-sm transition-colors"
                    >
                        <CheckCircle size={16} />
                        Pagamento em Lote
                    </button>
                    <div className="h-4 w-px bg-zinc-700"></div>
                    <button
                        onClick={() => setShowBatchEditModal(true)}
                        className="flex items-center gap-2 hover:text-blue-400 font-medium text-sm transition-colors"
                    >
                        <div className="relative">
                            <Repeat size={16} className="absolute -top-1 -right-1 opacity-50" />
                            <FileText size={16} />
                        </div>
                        Editar em Lote
                    </button>
                    <button
                        onClick={handleBatchDeleteAction}
                        className="flex items-center gap-2 hover:text-rose-400 font-medium text-sm transition-colors"
                    >
                        <AlertCircle size={16} />
                        Excluir
                    </button>
                    <div className="h-4 w-px bg-zinc-700"></div>
                    <button onClick={() => setSelectedIds(new Set())} className="text-xs text-zinc-500 hover:text-white">Cancelar</button>
                </div>
            )}
        </div>
    );
};
