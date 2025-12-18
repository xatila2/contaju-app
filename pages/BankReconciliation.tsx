import React, { useState, useMemo, useEffect } from 'react';
import { Upload, FileText, Building2, Search, Filter, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { BankStatementItem, Transaction, BankAccount, Category } from '../types';
import { ReconciliationModal } from '../components/ReconciliationModal';
import { BankStatementCard } from '../components/reconciliation/BankStatementCard';
import { SmartMatchList } from '../components/reconciliation/SmartMatchList';
import { useTransactions } from '../context/TransactionContext';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';

export const BankReconciliation: React.FC = () => {
    const [searchParams] = useSearchParams();
    const {
        transactions,
        bankAccounts,
        categories,
        fetchBankStatementItems,
        handleReconciliationV2,
        handleSaveTransaction,
        companyId
    } = useTransactions();

    // -- STATE --
    const [selectedBankId, setSelectedBankId] = useState<string>(searchParams.get('bankId') || '');
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [statementItems, setStatementItems] = useState<BankStatementItem[]>([]);
    const [loadingStatement, setLoadingStatement] = useState(false);

    // Selection
    const [selectedStmtItemId, setSelectedStmtItemId] = useState<string | null>(null);
    const [selectedInternalTxIds, setSelectedInternalTxIds] = useState<string[]>([]);

    // Internal Transactions Filter
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reconciled'>('pending');

    // Modals
    const [showReconcileModal, setShowReconcileModal] = useState(false);

    // -- EFFECTS --
    useEffect(() => {
        if (selectedBankId && currentMonth) {
            loadStatement();
        }
    }, [selectedBankId, currentMonth]);

    const loadStatement = async () => {
        setLoadingStatement(true);
        const items = await fetchBankStatementItems(selectedBankId, currentMonth);
        setStatementItems(items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoadingStatement(false);
        // Clear selection on reload
        setSelectedStmtItemId(null);
        setSelectedInternalTxIds([]);
    };

    // -- DATA PREP --
    // Selected Statement Item
    const activeStmtItem = useMemo(() =>
        statementItems.find(i => i.id === selectedStmtItemId),
        [selectedStmtItemId, statementItems]);

    // Internal Transactions for the period/bank
    const internalTransactions = useMemo(() => {
        const [y, m] = currentMonth.split('-');
        const start = `${currentMonth}-01`;
        const end = `${currentMonth}-31`; // Loose

        const filtered = transactions.filter(t => {
            if (t.bankAccountId !== selectedBankId) return false;

            // Date Logic:
            // 1. If Reconciled: Must be in view period (Month)
            // 2. If Pending: Show everything up to the end of this month (Past pending items should appear)
            if (t.isReconciled) {
                if (t.date < start || t.date > end) return false;
            } else {
                if (t.date > end) return false; // Don't show future stuff
                // Show all past pending
            }

            // Text Filter
            if (searchText && !t.description.toLowerCase().includes(searchText.toLowerCase())) return false;

            // Status Filter
            if (filterStatus === 'pending' && t.isReconciled) return false;
            if (filterStatus === 'reconciled' && !t.isReconciled) return false;

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Debug Logging
        console.log(`[BankReconciliation] Loading. Total Txs: ${transactions.length}, SelectedBank: ${selectedBankId}, Filtered: ${filtered.length}`);
        return filtered;
    }, [transactions, selectedBankId, currentMonth, searchText, filterStatus]);

    // -- HANDLERS --
    const handleSelectStmtItem = (id: string) => {
        if (selectedStmtItemId === id) {
            setSelectedStmtItemId(null);
            setSelectedInternalTxIds([]);
        } else {
            setSelectedStmtItemId(id);
            setSelectedInternalTxIds([]); // Reset internal selection when switching statement item
            // Optional: Auto-select best match?
            // Let's keep it manual for "Premium Control" feel, or call a heuristic here.
        }
    };

    const handleToggleInternalTx = (id: string) => {
        if (selectedInternalTxIds.includes(id)) {
            setSelectedInternalTxIds(prev => prev.filter(x => x !== id));
        } else {
            setSelectedInternalTxIds(prev => [...prev, id]);
        }
    };

    const handleConfirmReconciliation = async (adjustments: any) => {
        if (!activeStmtItem) return;
        const selectedTxs = transactions.filter(t => selectedInternalTxIds.includes(t.id));

        await handleReconciliationV2([activeStmtItem], selectedTxs, adjustments);

        setShowReconcileModal(false);
        loadStatement(); // Refresh
    };

    // Import Logic (Simplified Direct Insert for V2)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!selectedBankId) {
            alert("Selecione uma conta bancária antes de importar o extrato.");
            return;
        }
        if (!companyId) {
            alert("Erro: Identificador da empresa não encontrado. Tente recarregar a página.");
            return;
        }
        if (!file) return;

        console.log("Iniciando leitura do arquivo OFX...", file.name);

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const text = ev.target?.result as string;
            console.log("Arquivo lido, tamanho:", text.length);

            // Basic OFX parsing
            const lines: any[] = [];
            // Regex to find STMTTRN blocks (case insensitive)
            const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
            const matches = text.match(transactionRegex);

            console.log("Blocos de transação encontrados:", matches?.length || 0);

            if (matches) {
                matches.forEach((block) => {
                    // Extract fields looking for content between tag and closest newline OR next tag start
                    const getValue = (tag: string) => {
                        const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
                        return block.match(regex)?.[1]?.trim() || '';
                    };

                    const val = getValue('TRNAMT') || '0';
                    const dateRaw = getValue('DTPOSTED');
                    const memo = getValue('MEMO') || 'Sem descrição';
                    const fitid = getValue('FITID') || `fit-${Date.now()}-${Math.random()}`;

                    let d = new Date().toISOString().split('T')[0];
                    if (dateRaw && dateRaw.length >= 8) {
                        const y = dateRaw.substring(0, 4);
                        const m = dateRaw.substring(4, 6);
                        const day = dateRaw.substring(6, 8);
                        d = `${y}-${m}-${day}`;
                    }

                    console.log(`Parsed: Date=${d}, Amount=${val}, Memo=${memo}`);

                    lines.push({
                        company_id: companyId,
                        bank_account_id: selectedBankId,
                        date: d,
                        description: memo,
                        amount: parseFloat(val.replace(',', '.')),
                        fitid: fitid,
                        memo: memo,
                        is_reconciled: false
                    });
                });

                if (lines.length > 0) {
                    console.log("Inserindo items no banco:", lines.length);
                    const { error } = await supabase.from('bank_statement_items').insert(lines).select();

                    if (error) {
                        console.error("Erro Supabase:", error);
                        alert("Erro ao importar: " + error.message);
                    } else {
                        console.log("Sucesso! Inseridos:", lines.length);
                        alert(`Importação concluída! ${lines.length} registros processados.`);
                        loadStatement();
                    }
                } else {
                    alert("Nenhuma transação válida encontrada no arquivo OFX.");
                }
            } else {
                console.warn("Regex não encontrou matches. Conteúdo do arquivo:", text.substring(0, 500) + "...");
                alert("Formato OFX não reconhecido ou arquivo vazio/inválido. Verifique o console para mais detalhes.");
            }
        };
        reader.readAsText(file);
    };

    // Derived State for UI
    const selectedInternalTxs = transactions.filter(t => selectedInternalTxIds.includes(t.id));
    const totalSelectedInternal = selectedInternalTxs.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);
    const difference = activeStmtItem ? activeStmtItem.amount - totalSelectedInternal : 0;
    const isReadyToReconcile = activeStmtItem && selectedInternalTxs.length > 0;

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col p-4 md:p-6 overflow-hidden max-w-[1920px] mx-auto w-full gap-4">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <RefreshCw className="text-indigo-600" /> Conciliação Bancária V2
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Novo fluxo inteligente de conciliação.</p>
                </div>

                <div className="flex gap-4 items-end bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Mês</label>
                        <input
                            type="month"
                            value={currentMonth}
                            onChange={e => setCurrentMonth(e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex flex-col gap-1 min-w-[200px]">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Conta</label>
                        <select
                            value={selectedBankId}
                            onChange={(e) => setSelectedBankId(e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Selecione...</option>
                            {bankAccounts.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <label className="cursor-pointer px-4 py-1.5 bg-indigo-600 text-white font-bold text-sm rounded hover:bg-indigo-700 transition flex items-center gap-2 h-[34px]">
                        <Upload size={14} /> Importar OFX
                        <input type="file" accept=".ofx,.txt" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            {/* MAIN CONTENT - 3 COLUMNS */}
            {!selectedBankId ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center text-zinc-400">
                    <Building2 size={48} className="mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-zinc-600 dark:text-zinc-300">Selecione uma conta</h3>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">

                    {/* COLUMN 1: BANK STATEMENT (4 cols) */}
                    <div className="md:col-span-4 flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2 text-sm">
                                <FileText size={16} /> Extrato Bancário
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
                                {statementItems.filter(i => !i.isReconciled).length} pendentes
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
                            {loadingStatement && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><RefreshCw className="animate-spin text-indigo-600" /></div>}

                            {statementItems.length === 0 ? (
                                <div className="text-center text-zinc-400 text-sm mt-10">Nenhum lançamento no extrato.</div>
                            ) : (
                                statementItems.map(item => (
                                    (!item.isReconciled || filterStatus === 'all') && ( // Simple client-side filter for now
                                        <BankStatementCard
                                            key={item.id}
                                            item={item}
                                            isSelected={selectedStmtItemId === item.id}
                                            onSelect={() => handleSelectStmtItem(item.id)}
                                        />
                                    )
                                ))
                            )}
                        </div>
                    </div>

                    {/* COLUMN 2: MATCH SUGGESTIONS / SEARCH (5 cols) */}
                    <div className="md:col-span-4 lg:col-span-5 flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 gap-2 flex flex-col shrink-0">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2 text-sm">
                                    <Building2 size={16} /> Correspondência
                                </h3>
                                <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-0.5">
                                    <button onClick={() => setFilterStatus('pending')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${filterStatus === 'pending' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}>Pendentes</button>
                                    <button onClick={() => setFilterStatus('all')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${filterStatus === 'all' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}>Todos</button>
                                </div>
                            </div>

                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-2 text-zinc-400" />
                                <input
                                    className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Buscar por descrição ou valor..."
                                    value={searchText}
                                    onChange={e => setSearchText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 bg-zinc-50/30 dark:bg-zinc-900/30">
                            {activeStmtItem ? (
                                <SmartMatchList
                                    statementItem={activeStmtItem}
                                    candidates={internalTransactions.filter(t =>
                                        activeStmtItem.amount < 0
                                            ? t.type === 'expense'
                                            : t.type === 'income'
                                    )}
                                    selectedIds={selectedInternalTxIds}
                                    onToggleSelect={handleToggleInternalTx}
                                    onCreate={() => setShowReconcileModal(true)}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-center p-6">
                                    <ArrowRight className="mb-2 opacity-30" size={32} />
                                    <p className="text-sm">Selecione um item do extrato à esquerda para ver sugestões.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMN 3: RECONCILIATION DETAILS (3 cols) */}
                    <div className="md:col-span-4 lg:col-span-3 flex flex-col bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                            <h3 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wide">Resumo da Conciliação</h3>
                        </div>

                        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                            {activeStmtItem ? (
                                <>
                                    {/* Extrato Card */}
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Item do Extrato</p>
                                        <p className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-2">{activeStmtItem.description}</p>
                                        <p className="text-xs text-zinc-500 mt-1">{new Date(activeStmtItem.date).toLocaleDateString('pt-BR')}</p>
                                        <p className={`text-xl font-bold mt-2 ${activeStmtItem.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activeStmtItem.amount)}
                                        </p>
                                    </div>

                                    <div className="flex justify-center text-zinc-300">
                                        {/* Icon Divider */}
                                        <Filter size={16} />
                                    </div>

                                    {/* Selected Txs */}
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ring-2 ring-white dark:ring-zinc-900">
                                            {selectedInternalTxs.length}
                                        </div>
                                        <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Selecionados</p>
                                        {selectedInternalTxs.length === 0 ? (
                                            <p className="text-sm text-zinc-400 italic">Nenhum selecionado</p>
                                        ) : (
                                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                                {selectedInternalTxs.map(t => (
                                                    <div key={t.id} className="flex justify-between text-xs py-1 border-b border-zinc-50 last:border-0 border-dashed">
                                                        <span className="truncate flex-1 pr-2 text-zinc-600">{t.description}</span>
                                                        <span className="font-bold text-zinc-900">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.type === 'expense' ? -t.amount : t.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {selectedInternalTxs.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                                <span className="text-xs font-bold text-zinc-900">Total</span>
                                                <span className={`text-sm font-bold ${totalSelectedInternal < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSelectedInternal)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Difference */}
                                    <div className={`p-4 rounded-lg border flex justify-between items-center ${Math.abs(difference) < 0.01 ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-rose-100 border-rose-200 text-rose-800'}`}>
                                        <span className="text-xs font-bold uppercase">Diferença</span>
                                        <span className="font-bold text-lg">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(difference)}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-zinc-400 mt-20">
                                    <p className="text-sm">Aguardando seleção...</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                            <button
                                onClick={() => setShowReconcileModal(true)}
                                disabled={!isReadyToReconcile}
                                className={`w-full py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2
                                    ${isReadyToReconcile
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                        : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                <CheckCircle2 size={18} />
                                {activeStmtItem && activeStmtItem.isReconciled ? 'Revisar Conciliação' : 'Conciliar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            <ReconciliationModal
                isOpen={showReconcileModal}
                onClose={() => setShowReconcileModal(false)}
                onConfirm={handleConfirmReconciliation}
                statementLine={activeStmtItem || null}
                selectedTransactions={selectedInternalTxs}
                categories={categories}
                selectedBankId={selectedBankId}
            />
        </div>
    );
};
