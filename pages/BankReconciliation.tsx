import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Check, X, FileText, ArrowRight, AlertTriangle, Link as LinkIcon, Eye, History, Building2, Plus, Calendar, Search, Filter } from 'lucide-react';
import { BankStatementLine, Transaction, ReconciliationMatch, BankAccount, Category } from '../types';
import { ReconciliationModal } from '../components/ReconciliationModal';
import { useSearchParams } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';

export const BankReconciliation: React.FC = () => {
    const [searchParams] = useSearchParams();
    const {
        transactions,
        bankStatementLines: statementLines,
        categories,
        handleImportStatement: onImportStatement,
        handleReconcile: onReconcile,
        bankAccounts,
        handleSaveTransaction
    } = useTransactions();

    // -- STATE --
    const [selectedBankId, setSelectedBankId] = useState<string>(searchParams.get('bankId') || '');
    const [viewHistory, setViewHistory] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Selection for Matching
    const [selectedStmtLineId, setSelectedStmtLineId] = useState<string | null>(null);
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

    // Modals
    const [showMatchModal, setShowMatchModal] = useState(false); // To confirm match
    const [showCreateModal, setShowCreateModal] = useState(false); // To create new

    // New Transaction Form State
    const [newTxData, setNewTxData] = useState({
        description: '',
        amount: 0,
        date: '',
        categoryId: '',
        type: 'expense' as 'income' | 'expense'
    });

    // -- HELPERS --
    const getMonthDateRange = (monthKey: string) => {
        const [y, m] = monthKey.split('-');
        const start = new Date(parseInt(y), parseInt(m) - 1, 1);
        const end = new Date(parseInt(y), parseInt(m), 0);
        return { start, end };
    };

    // Filter Data by Bank & Month
    const { filteredStatement, filteredTransactions } = useMemo(() => {
        if (!selectedBankId) return { filteredStatement: [], filteredTransactions: [] };

        const { start, end } = getMonthDateRange(currentMonth);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        const stmts = statementLines.filter(l => {
            // Mock bank ID check if statement lines had bankId (assuming they adhere to selected context or imported context)
            // Ideally statement lines should belong to a bank. For now, we assume imported lines act on current bank context or are filtered elsewhere.
            // If statementLines is global, we need to know which bank they belong to.
            // Assuming current implementation treats imported lines as "pending" for the active view.
            return l.date >= startStr && l.date <= endStr && (viewHistory ? l.isReconciled : !l.isReconciled);
        }).sort((a, b) => b.date.localeCompare(a.date));

        const txs = transactions.filter(t => {
            return t.bankAccountId === selectedBankId &&
                t.date >= startStr && t.date <= endStr &&
                (viewHistory ? t.isReconciled : !t.isReconciled);
        }).sort((a, b) => b.date.localeCompare(a.date));

        return { filteredStatement: stmts, filteredTransactions: txs };
    }, [selectedBankId, currentMonth, viewHistory, statementLines, transactions]);

    // Balances
    const balances = useMemo(() => {
        const stmtBalance = filteredStatement.reduce((acc, l) => acc + l.amount, 0);
        const sysBalance = filteredTransactions.reduce((acc, t) => acc + (t.type === 'expense' ? -t.amount : t.amount), 0);
        const diff = stmtBalance - sysBalance;
        return { stmtBalance, sysBalance, diff };
    }, [filteredStatement, filteredTransactions]);

    // -- MATCHING LOGIC --
    const findCandidates = (stmtLine: BankStatementLine) => {
        // Simple logic: Find internal txs with same amount (approx) and close date
        return filteredTransactions.filter(tx => {
            const txVal = tx.type === 'expense' ? -tx.amount : tx.amount;
            const valDiff = Math.abs(stmtLine.amount - txVal);
            // Allow 5% diff or exact match logic
            // Converting dates to check proximity could be done here too
            return valDiff < 0.05; // Exact match for now
        });
    };

    // -- HANDLERS --
    const handleRecClick = (line: BankStatementLine) => {
        setSelectedStmtLineId(line.id);
        const candidates = findCandidates(line);
        if (candidates.length > 0) {
            // Auto-select first candidate or show list? 
            // For now, let's select the first one to simulate "Found match"
            setSelectedTxId(candidates[0].id);
            setShowMatchModal(true); // Open the verification modal directly
        } else {
            // No match -> Offer to create
            setNewTxData({
                description: line.description,
                amount: Math.abs(line.amount),
                date: line.date,
                categoryId: '',
                type: line.amount < 0 ? 'expense' : 'income'
            });
            setShowCreateModal(true);
        }
    };

    const handleCreateTransaction = () => {
        if (!newTxData.categoryId || !newTxData.description) {
            alert("Preencha categoria e descrição.");
            return;
        }

        const newTx: Transaction = {
            id: `tx-new-${Date.now()}`,
            description: newTxData.description,
            amount: newTxData.amount,
            type: newTxData.type,
            date: newTxData.date,
            categoryId: newTxData.categoryId,
            bankAccountId: selectedBankId,
            status: 'reconciled',
            isReconciled: true,
            paymentDate: newTxData.date,
            dueDate: newTxData.date,
            launchDate: new Date().toISOString(),
            category: categories.find(c => c.id === newTxData.categoryId)?.name || 'Outros'
        };

        // Create transaction in context
        handleSaveTransaction(newTx);

        // Then reconcile match
        if (selectedStmtLineId) {
            const match: ReconciliationMatch = {
                id: `match-new-${Date.now()}`,
                statementLineId: selectedStmtLineId,
                transactionIds: [newTx.id],
                matchedAt: new Date().toISOString(),
                type: 'full',
                adjustments: { interest: 0, penalty: 0, discount: 0 }
            };
            // Use existing onReconcile but strictly with the new transaction?
            // Actually createTransaction handles the transaction add. onReconcile updates the statement line.
            // We need to verify how generic onReconcile is. It takes "newTransaction" arg optionally.
            // For safety, let's just pass it to onReconcile if it supports creation, or call both.
            // The existing ReconcileModal logic calls onReconcile with list of matches.
            onReconcile([match], { interest: 0, penalty: 0, discount: 0 });
        }

        setShowCreateModal(false);
        setSelectedStmtLineId(null);
    };

    const handleConfirmMatch = (adjustments: any, newTx?: Transaction) => {
        if (selectedStmtLineId && selectedTxId) {
            const match: ReconciliationMatch = {
                id: `match-${Date.now()}`,
                statementLineId: selectedStmtLineId,
                transactionIds: [selectedTxId],
                matchedAt: new Date().toISOString(),
                type: 'full',
                adjustments
            };
            onReconcile([match], adjustments, newTx);
            setShowMatchModal(false);
            setSelectedStmtLineId(null);
            setSelectedTxId(null);
        }
    };

    // File Upload Wrapper
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            // Basic OFX Parser Mock
            const lines: BankStatementLine[] = [];
            const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
            const matches = text.match(transactionRegex);
            if (matches) {
                matches.forEach((block, idx) => {
                    const val = block.match(/<TRNAMT>(.*?)(\r|\n)/)?.[1] || '0';
                    const dateRaw = block.match(/<DTPOSTED>(.*?)(\r|\n)/)?.[1] || '';
                    const memo = block.match(/<MEMO>(.*?)(\r|\n)/)?.[1] || 'Sem descrição';
                    const d = dateRaw.length >= 8 ? `${dateRaw.substring(0, 4)}-${dateRaw.substring(4, 6)}-${dateRaw.substring(6, 8)}` : new Date().toISOString().split('T')[0];
                    lines.push({ id: `stmt-${Date.now()}-${idx}`, date: d, description: memo, amount: parseFloat(val), isReconciled: false });
                });
            } else {
                // Mock Import
                const d = new Date().toISOString().split('T')[0];
                lines.push({ id: `mock-${Date.now()}-1`, date: d, description: 'COMPRA TESTE', amount: -150.00, isReconciled: false });
                lines.push({ id: `mock-${Date.now()}-2`, date: d, description: 'CLIENTE XYZ', amount: 500.00, isReconciled: false });
            }
            onImportStatement(lines);
        };
        reader.readAsText(file);
    };

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4 p-6 overflow-hidden max-w-[1600px] mx-auto w-full">

            {/* 1. HEADER & BANK SELECTOR */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Building2 className="text-indigo-600" /> Conciliação Bancária
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Selecione a conta e vincule os lançamentos.</p>
                    </div>

                    <div className="flex gap-4 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold uppercase text-zinc-500">Mês de Referência</label>
                            <input
                                type="month"
                                value={currentMonth}
                                onChange={e => setCurrentMonth(e.target.value)}
                                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1 min-w-[250px]">
                            <label className="text-xs font-bold uppercase text-zinc-500">Conta Bancária</label>
                            <select
                                value={selectedBankId}
                                onChange={(e) => setSelectedBankId(e.target.value)}
                                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            >
                                <option value="">Selecione...</option>
                                {bankAccounts.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* HEADER SUMMARY */}
                {selectedBankId && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
                        <div className="border-r border-zinc-100 dark:border-zinc-800 pr-4">
                            <span className="text-xs font-bold uppercase text-zinc-400">Extrato (Período)</span>
                            <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{formatMoney(balances.stmtBalance)}</div>
                        </div>
                        <div className="border-r border-zinc-100 dark:border-zinc-800 pr-4">
                            <span className="text-xs font-bold uppercase text-zinc-400">Sistema (Período)</span>
                            <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{formatMoney(balances.sysBalance)}</div>
                        </div>
                        <div className="pr-4 flex flex-col justify-center">
                            <span className="text-xs font-bold uppercase text-zinc-400">Diferença</span>
                            <div className={`text-xl font-bold mt-1 ${Math.abs(balances.diff) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatMoney(balances.diff)}
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <label className="cursor-pointer px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold text-sm rounded-lg hover:bg-indigo-100 transition flex items-center gap-2">
                                <Upload size={16} /> Importar Extrato
                                <input type="file" accept=".ofx,.txt" className="hidden" onChange={handleFileUpload} />
                            </label>
                            <button
                                onClick={() => setViewHistory(!viewHistory)}
                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${viewHistory ? 'bg-yellow-100 border-yellow-200 text-yellow-800' : 'bg-transparent border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
                            >
                                {viewHistory ? 'Ver Pendentes' : 'Histórico'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT Area */}
            {!selectedBankId ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center text-zinc-400">
                    <Building2 size={48} className="mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-zinc-600 dark:text-zinc-300">Nenhuma conta selecionada</h3>
                    <p className="max-w-md mx-auto mt-2">Escolha uma conta bancária acima para visualizar o extrato e realizar a conciliação dos lançamentos.</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden min-h-0">

                    {/* COL 1: EXTRATO */}
                    <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                                <FileText size={16} /> Extrato Bancário
                            </h3>
                            <span className="text-xs font-bold px-2 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
                                {filteredStatement.length} registros
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-bold text-zinc-400 uppercase sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 font-medium">Data</th>
                                        <th className="px-4 py-2 font-medium">Descrição</th>
                                        <th className="px-4 py-2 font-medium text-right">Valor</th>
                                        <th className="px-4 py-2 font-medium text-center">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {filteredStatement.map(line => (
                                        <tr key={line.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                            <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                                                {new Date(line.date).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-zinc-900 dark:text-white truncate max-w-[180px]" title={line.description}>{line.description}</p>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${line.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {formatMoney(line.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {!line.isReconciled ? (
                                                    <button
                                                        onClick={() => handleRecClick(line)}
                                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                                                    >
                                                        Conciliar
                                                    </button>
                                                ) : (
                                                    <span className="text-emerald-500"><Check size={16} /></span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStatement.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-zinc-400 text-xs">Nenhum lançamento no extrato.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* COL 2: SISTEMA */}
                    <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                                <Building2 size={16} /> Lançamentos Internos
                            </h3>
                            <span className="text-xs font-bold px-2 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
                                {filteredTransactions.length} registros
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-bold text-zinc-400 uppercase sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 font-medium">Data</th>
                                        <th className="px-4 py-2 font-medium">Descrição</th>
                                        <th className="px-4 py-2 font-medium text-right">Valor</th>
                                        <th className="px-4 py-2 font-medium text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {filteredTransactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                                                {new Date(tx.date).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-zinc-900 dark:text-white truncate max-w-[180px]" title={tx.description}>{tx.description}</p>
                                                <p className="text-[10px] text-zinc-400 truncate">{categories.find(c => c.id === tx.categoryId)?.name}</p>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {formatMoney(tx.type === 'expense' ? -tx.amount : tx.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {tx.isReconciled ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        OK
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                        Pendente
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTransactions.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-zinc-400 text-xs">Nenhum lançamento interno no período.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800">
                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 rounded-t-xl">
                            <h3 className="font-bold text-zinc-900 dark:text-white">Criar Lançamento</h3>
                            <button onClick={() => setShowCreateModal(false)}><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-zinc-500">Nenhuma correspondência encontrada. Crie um novo lançamento para conciliar.</p>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Descrição</label>
                                    <input
                                        className="w-full mt-1 p-2 bg-zinc-50 dark:bg-zinc-800 border rounded text-sm"
                                        value={newTxData.description}
                                        onChange={e => setNewTxData({ ...newTxData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase">Valor</label>
                                        <input
                                            type="number"
                                            className="w-full mt-1 p-2 bg-zinc-50 dark:bg-zinc-800 border rounded text-sm font-bold"
                                            value={newTxData.amount}
                                            disabled // Fixed from statement
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase">Data</label>
                                        <input
                                            type="date"
                                            className="w-full mt-1 p-2 bg-zinc-50 dark:bg-zinc-800 border rounded text-sm"
                                            value={newTxData.date}
                                            onChange={e => setNewTxData({ ...newTxData, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Categoria</label>
                                    <select
                                        className="w-full mt-1 p-2 bg-zinc-50 dark:bg-zinc-800 border rounded text-sm"
                                        value={newTxData.categoryId}
                                        onChange={e => setNewTxData({ ...newTxData, categoryId: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateTransaction}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg mt-4 shadow-lg shadow-emerald-500/20"
                            >
                                Criar e Conciliar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RECONCILIATION MODAL (CONFIRMATION) */}
            <ReconciliationModal
                isOpen={showMatchModal}
                onClose={() => setShowMatchModal(false)}
                onConfirm={handleConfirmMatch}
                statementLine={filteredStatement.find(l => l.id === selectedStmtLineId) || null}
                selectedTransactions={selectedTxId ? filteredTransactions.filter(t => t.id === selectedTxId) : []}
                categories={categories}
                selectedBankId={selectedBankId}
            />

            {/* FOOTER SUMMARY */}
            <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 -mx-6 -mb-4 flex flex-wrap justify-between items-center shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] sticky bottom-0 z-20">
                <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-300"></div>
                        <span className="text-zinc-500">Total: <strong className="text-zinc-900 dark:text-white">{filteredStatement.length}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-zinc-500">Conciliados: <strong className="text-zinc-900 dark:text-white">{filteredStatement.filter(l => l.isReconciled).length}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-zinc-500">Pendentes: <strong className="text-zinc-900 dark:text-white">{filteredStatement.filter(l => !l.isReconciled).length}</strong></span>
                    </div>
                </div>

                <button className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-lg hover:opacity-90 transition">
                    Concluir Período
                </button>
            </div>
        </div>
    );
};
