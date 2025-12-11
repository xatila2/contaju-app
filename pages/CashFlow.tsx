
import React, { useState, useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Filter, Download, X, Building2, ChevronRight, ChevronLeft, LayoutList, Layers, Briefcase } from 'lucide-react';
import { Transaction, BankAccount, Category, CostCenter } from '../types';
import { DateRangePicker } from '../components/DateRangePicker';

import { useTransactions } from '../context/TransactionContext';

interface CashFlowProps { }

export const CashFlow: React.FC<CashFlowProps> = () => {
    const { transactions, bankAccounts, categories, costCenters } = useTransactions();
    const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'yearly'>('daily');
    const [flowType, setFlowType] = useState<'standard' | 'direct'>('standard');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date(new Date().setDate(new Date().getDate() + 90)).toISOString().split('T')[0]
    });
    const [selectedBankId, setSelectedBankId] = useState<string>('all');
    const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('all');

    const [drillDownDate, setDrillDownDate] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handlePeriodShift = (direction: 'prev' | 'next') => {
        // Timezone-safe parsing: parse YYYY-MM-DD strings manually
        const [startY, startM, startD] = dateRange.start.split('-').map(Number);
        const [endY, endM, endD] = dateRange.end.split('-').map(Number);

        const start = new Date(startY, startM - 1, startD); // Month is 0-indexed
        const end = new Date(endY, endM - 1, endD);

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const modifier = direction === 'next' ? 1 : -1;

        if (diffDays >= 28 && diffDays <= 32) {
            // Month shift - calculate new start and end based on original start month + modifier
            const newStart = new Date(start.getFullYear(), start.getMonth() + modifier, 1);
            const newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0);
            setDateRange({ start: newStart.toISOString().split('T')[0], end: newEnd.toISOString().split('T')[0] });
        } else if (diffDays >= 360) {
            // Year shift
            const newStart = new Date(start.getFullYear() + modifier, start.getMonth(), start.getDate());
            const newEnd = new Date(end.getFullYear() + modifier, end.getMonth(), end.getDate());
            setDateRange({ start: newStart.toISOString().split('T')[0], end: newEnd.toISOString().split('T')[0] });
        } else {
            // Week or Custom: shift by exact duration + 1 day to clear the range
            const shiftAmount = diffDays + 1;
            const newStart = new Date(start);
            const newEnd = new Date(end);
            newStart.setDate(start.getDate() + (shiftAmount * modifier));
            newEnd.setDate(end.getDate() + (shiftAmount * modifier));
            setDateRange({ start: newStart.toISOString().split('T')[0], end: newEnd.toISOString().split('T')[0] });
        }
    };

    const chartData = useMemo(() => {
        // 1. Initial Balance Calculation (Total of all selected banks)
        let runningBalance = bankAccounts
            .filter(b => selectedBankId === 'all' || b.id === selectedBankId)
            .reduce((acc, b) => acc + b.initialBalance, 0);

        // Adjust running balance for transactions BEFORE start date
        transactions.forEach(tx => {
            if (tx.status !== 'reconciled') return;
            if (tx.dueDate < dateRange.start) {
                const matchesBank = selectedBankId === 'all' || tx.bankAccountId === selectedBankId;
                const matchesCC = selectedCostCenterId === 'all' || tx.costCenterId === selectedCostCenterId;

                if (matchesBank && matchesCC) {
                    runningBalance += tx.amount; // amount is signed (+/-)
                }
            }
        });

        // 2. Group Transactions by Period
        const grouped = transactions.reduce((acc, curr) => {
            const txDate = curr.dueDate;
            if (txDate < dateRange.start || txDate > dateRange.end) return acc;

            const matchesBank = selectedBankId === 'all' || curr.bankAccountId === selectedBankId;
            const matchesCC = selectedCostCenterId === 'all' || curr.costCenterId === selectedCostCenterId;
            if (!matchesBank || !matchesCC) return acc;

            const dateObj = new Date(txDate);
            let key = txDate; // Daily default
            if (viewMode === 'monthly') key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            if (viewMode === 'yearly') key = `${dateObj.getFullYear()}`;

            if (!acc[key]) {
                acc[key] = {
                    date: key,
                    income: 0, expense: 0,
                    op_income: 0, op_expense: 0,
                    inv_flow: 0, fin_flow: 0
                };
            }

            if (curr.type === 'income') acc[key].income += curr.amount;
            if (curr.type === 'expense') acc[key].expense += Math.abs(curr.amount);

            // Direct Cash Flow Logic based on Category Type
            const cat = categories.find(c => c.id === curr.categoryId);
            const cfType = cat?.cashFlowType || 'operational';

            if (cfType === 'operational') {
                if (curr.type === 'income') acc[key].op_income += curr.amount;
                if (curr.type === 'expense') acc[key].op_expense += Math.abs(curr.amount);
            } else if (cfType === 'investment') {
                acc[key].inv_flow += curr.amount; // Keep sign
            } else if (cfType === 'financing') {
                acc[key].fin_flow += curr.amount; // Keep sign
            }

            return acc;
        }, {} as Record<string, any>);

        // 3. Transform to Array and sort
        const sortedKeys = Object.keys(grouped).sort();

        return sortedKeys.map(key => {
            const item = grouped[key];
            const initialBalance = runningBalance;
            const result = item.income - item.expense;

            // Direct Flow Result
            const op_result = item.op_income - item.op_expense;
            const total_flow = op_result + item.inv_flow + item.fin_flow; // should equal result roughly

            runningBalance += result;

            return {
                ...item,
                initialBalance,
                result,
                balance: runningBalance,
                op_result,
                total_flow,
                projected: new Date(key) > new Date() || (viewMode === 'monthly' && new Date(key + '-01') > new Date())
            };
        });

    }, [viewMode, dateRange, selectedBankId, selectedCostCenterId, transactions, bankAccounts, categories]);

    const handleRowClick = (date: string) => {
        setDrillDownDate(date);
        setIsDetailModalOpen(true);
    };

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Sem Categoria';
    const getBankName = (id?: string) => bankAccounts.find(b => b.id === id)?.name || 'N/A';

    const detailedTransactions = useMemo(() => {
        if (!drillDownDate) return [];

        return transactions.filter(tx => {
            const txDate = tx.dueDate;
            const dateMatches = viewMode === 'daily'
                ? txDate === drillDownDate
                : txDate.startsWith(drillDownDate);

            const bankMatches = selectedBankId === 'all' || tx.bankAccountId === selectedBankId;
            const ccMatches = selectedCostCenterId === 'all' || tx.costCenterId === selectedCostCenterId;

            return dateMatches && bankMatches && ccMatches;
        });
    }, [drillDownDate, transactions, selectedBankId, selectedCostCenterId, viewMode]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const renderMatrixTable = () => {
        return (
            <div className="overflow-x-auto border-t border-zinc-200 dark:border-zinc-800">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 border-separate border-spacing-0">
                    <thead className="bg-zinc-50 dark:bg-zinc-900">
                        <tr>
                            <th className="sticky left-0 z-20 bg-zinc-50 dark:bg-zinc-900 px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 min-w-[250px]">
                                {flowType === 'standard' ? 'Indicadores Financeiros' : 'Atividades (Fluxo Direto)'}
                            </th>
                            {chartData.map((data, idx) => (
                                <th key={idx} className="px-6 py-4 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider min-w-[140px]">
                                    {viewMode === 'monthly'
                                        ? new Date(data.date + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
                                        : data.date}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
                        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-500 border-r border-zinc-100 dark:border-zinc-800">
                                (=) Saldo Inicial de Caixa
                            </td>
                            {chartData.map((data, idx) => (
                                <td key={idx} className="px-6 py-3 text-right text-sm text-zinc-500">
                                    {formatCurrency(data.initialBalance)}
                                </td>
                            ))}
                        </tr>

                        {flowType === 'standard' ? (
                            <>
                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 border-r border-zinc-100 dark:border-zinc-800">
                                        (+) Entradas Totais
                                    </td>
                                    {chartData.map((data, idx) => (
                                        <td key={idx} className="px-6 py-3 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(data.income)}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 border-r border-zinc-100 dark:border-zinc-800">
                                        (-) Saídas Totais
                                    </td>
                                    {chartData.map((data, idx) => (
                                        <td key={idx} className="px-6 py-3 text-right text-sm font-medium text-rose-600 dark:text-rose-400">
                                            {formatCurrency(data.expense)}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 font-medium">
                                    <td className="sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-900 px-6 py-3 text-sm text-zinc-800 dark:text-zinc-200 border-r border-zinc-100 dark:border-zinc-800">
                                        (=) Variação do Caixa
                                    </td>
                                    {chartData.map((data, idx) => (
                                        <td key={idx} className={`px-6 py-3 text-right text-sm ${data.result >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {formatCurrency(data.result)}
                                        </td>
                                    ))}
                                </tr>
                            </>
                        ) : (
                            <>
                                {/* Operational */}
                                <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                                    <td className="sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-900 px-6 py-3 text-xs font-bold text-zinc-500 uppercase border-r border-zinc-100 dark:border-zinc-800">
                                        1. Atividades Operacionais
                                    </td>
                                    <td colSpan={chartData.length} className="bg-zinc-50 dark:bg-zinc-900"></td>
                                </tr>
                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-6 py-2 text-sm text-zinc-600 dark:text-zinc-400 pl-8 border-r border-zinc-100 dark:border-zinc-800">
                                        (+) Recebimento Operacional
                                    </td>
                                    {chartData.map((data, idx) => (
                                        <td key={idx} className="px-6 py-2 text-right text-sm text-emerald-600 dark:text-emerald-500">
                                            {formatCurrency(data.op_income)}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-6 py-2 text-sm text-zinc-600 dark:text-zinc-400 pl-8 border-r border-zinc-100 dark:border-zinc-800">
                                        (-) Pagamento Operacional
                                    </td>
                                    {chartData.map((data, idx) => (
                                        <td key={idx} className="px-6 py-2 text-right text-sm text-rose-600 dark:text-rose-500">
                                            {formatCurrency(data.op_expense)}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 font-medium">
                                    <td className="sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-900 px-6 py-2 text-sm text-zinc-800 dark:text-zinc-200 pl-8 border-r border-zinc-100 dark:border-zinc-800">
                                        (=) Gerado nas Operações
                                    </td>
                                    {chartData.map((data, idx) => (
                                        <td key={idx} className="px-6 py-2 text-right text-sm text-zinc-900 dark:text-white">
                                            {formatCurrency(data.op_income - data.op_expense)}
                                        </td>
                                    ))}
                                </tr>

                                {/* Investment */}
                                <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                                    <td className="sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-900 px-6 py-3 text-xs font-bold text-zinc-500 uppercase border-r border-zinc-100 dark:border-zinc-800">
                                        2. Atividades de Investimento
                                    </td>
                                    <td colSpan={chartData.length} className="bg-zinc-50 dark:bg-zinc-900"></td>
                                </tr>
                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-6 py-2 text-sm text-zinc-600 dark:text-zinc-400 pl-8 border-r border-zinc-100 dark:border-zinc-800">
                                        (+/-) Fluxo de Investimento
                                    </td>
                                    {chartData.map((data, idx) => (
                                        <td key={idx} className="px-6 py-2 text-right text-sm text-zinc-700 dark:text-zinc-300">
                                            {formatCurrency(data.inv_flow)}
                                        </td>
                                    ))}
                                </tr>

                                {/* Financing */}
                                <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                                    <td className="sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-900 px-6 py-3 text-xs font-bold text-zinc-500 uppercase border-r border-zinc-100 dark:border-zinc-800">
                                        3. Atividades de Financiamento
                                    </td>
                                    <td colSpan={chartData.length} className="bg-zinc-50 dark:bg-zinc-900"></td>
                                </tr>
                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-6 py-2 text-sm text-zinc-600 dark:text-zinc-400 pl-8 border-r border-zinc-100 dark:border-zinc-800">
                                        (+/-) Fluxo de Financiamento
                                    </td>
                                    {chartData.map((data, idx) => (
                                        <td key={idx} className="px-6 py-2 text-right text-sm text-zinc-700 dark:text-zinc-300">
                                            {formatCurrency(data.fin_flow)}
                                        </td>
                                    ))}
                                </tr>
                            </>
                        )}

                        <tr className="bg-yellow-50/30 dark:bg-yellow-900/10 font-bold border-t-2 border-zinc-200 dark:border-zinc-700">
                            <td className="sticky left-0 z-10 bg-yellow-50 dark:bg-zinc-900 px-6 py-4 text-sm text-zinc-900 dark:text-white border-r border-zinc-100 dark:border-zinc-800">
                                (=) Saldo Final Acumulado
                            </td>
                            {chartData.map((data, idx) => (
                                <td key={idx} className="px-6 py-4 text-right text-sm text-zinc-900 dark:text-white">
                                    {formatCurrency(data.balance)}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Fluxo de Caixa Detalhado</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Análise de entradas, saídas e saldo acumulado.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 flex items-center shadow-sm h-10">
                        <Building2 size={16} className="text-zinc-400 mr-2" />
                        <select
                            value={selectedBankId}
                            onChange={(e) => setSelectedBankId(e.target.value)}
                            className="bg-transparent text-sm font-medium text-zinc-900 dark:text-white outline-none min-w-[150px]"
                        >
                            <option value="all" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Todos os Bancos</option>
                            {bankAccounts.map(bank => (
                                <option key={bank.id} value={bank.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{bank.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 flex items-center shadow-sm h-10">
                        <Briefcase size={16} className="text-zinc-400 mr-2" />
                        <select
                            value={selectedCostCenterId}
                            onChange={(e) => setSelectedCostCenterId(e.target.value)}
                            className="bg-transparent text-sm font-medium text-zinc-900 dark:text-white outline-none min-w-[150px]"
                        >
                            <option value="all" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Todos C.C.</option>
                            {costCenters.map(cc => (
                                <option key={cc.id} value={cc.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{cc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 h-10">
                        <button
                            onClick={() => setViewMode('daily')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'daily' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                        >
                            Diário
                        </button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setViewMode('yearly')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'yearly' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                        >
                            Anual
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePeriodShift('prev')}
                            className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            title="Período anterior"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <DateRangePicker
                            startDate={dateRange.start}
                            endDate={dateRange.end}
                            onChange={(start, end) => setDateRange({ start, end })}
                            align="right"
                        />
                        <button
                            onClick={() => handlePeriodShift('next')}
                            className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            title="Próximo período"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <button className="h-10 w-10 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        onClick={(e: any) => {
                            if (e && e.activePayload && e.activePayload[0]) {
                                handleRowClick(e.activePayload[0].payload.date);
                            }
                        }}
                        className="cursor-pointer"
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" strokeOpacity={0.2} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#71717a' }}
                            tickFormatter={(value) => {
                                if (viewMode === 'monthly') return new Date(value + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                                if (viewMode === 'yearly') return value;
                                return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                            }}
                            minTickGap={30}
                        />
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#71717a' }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#71717a' }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46', color: '#fff' }}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Bar yAxisId="left" dataKey="income" name="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={viewMode === 'daily' ? 8 : 20} />
                        <Bar yAxisId="left" dataKey="expense" name="Saídas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={viewMode === 'daily' ? 8 : 20} />
                        <Line yAxisId="right" type="monotone" dataKey="balance" name="Saldo Acumulado" stroke="#EAB308" strokeWidth={3} dot={viewMode !== 'daily'} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {viewMode === 'daily' ? 'Detalhamento Diário' : 'Análise Financeira Matricial'}
                        </h3>
                    </div>

                    {viewMode !== 'daily' && (
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <button
                                onClick={() => setFlowType('standard')}
                                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${flowType === 'standard' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                            >
                                <LayoutList size={14} />
                                <span>Fluxo Padrão</span>
                            </button>
                            <button
                                onClick={() => setFlowType('direct')}
                                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${flowType === 'direct' ? 'bg-white dark:bg-zinc-700 shadow text-yellow-600 dark:text-yellow-500' : 'text-zinc-500'}`}
                            >
                                <Layers size={14} />
                                <span>Fluxo Direto (O/I/F)</span>
                            </button>
                        </div>
                    )}
                </div>

                {viewMode === 'daily' ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                            <thead className="bg-zinc-50 dark:bg-zinc-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Período</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Entradas</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Saídas</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-yellow-600 dark:text-yellow-500 uppercase tracking-wider">Saldo Final</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                                {chartData.slice(Math.max(0, chartData.length - 10)).map((day, idx) => (
                                    <tr
                                        key={idx}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                        onDoubleClick={() => handleRowClick(day.date)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-300 font-medium">
                                            {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(day.income)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-rose-600 dark:text-rose-400">
                                            {formatCurrency(day.expense)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-700 dark:text-yellow-500 font-bold">
                                            {formatCurrency(day.balance)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {day.projected ? (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300">
                                                    Projetado
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                                                    Realizado
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    renderMatrixTable()
                )}
            </div>

            {isDetailModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-t-xl">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Detalhes do Dia</h3>
                                <p className="text-sm text-zinc-500">{drillDownDate}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-0 overflow-auto">
                            {detailedTransactions.length > 0 ? (
                                <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800">
                                    <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {detailedTransactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                                <td className="px-6 py-3 text-sm text-zinc-900 dark:text-zinc-200 font-medium">
                                                    {tx.description}
                                                    <span className="block text-xs text-zinc-500 font-normal">{tx.client}</span>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                                                    {getCategoryName(tx.categoryId)}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                                                    {getBankName(tx.bankAccountId)}
                                                </td>
                                                <td className={`px-6 py-3 text-sm font-bold text-right ${tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-rose-600' : 'text-blue-600'}`}>
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${tx.status === 'reconciled' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {tx.status === 'reconciled' ? 'Pago' : 'Pendente'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                                    <p>Nenhuma transação encontrada para esta data com os filtros atuais.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
