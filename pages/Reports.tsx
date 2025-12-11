import React, { useState } from 'react';
import { DateRangePicker } from '../components/DateRangePicker';
import { useTransactions } from '../context/TransactionContext';
import { DREView } from '../components/reports/DREView';
import { CashVsAccrualView } from '../components/reports/CashVsAccrualView';
import { CashFlowView } from '../components/reports/CashFlowView';
import { BarChart2, TrendingUp, Calendar, ArrowLeftRight, Download, Printer } from 'lucide-react';

interface ReportsProps { }

export const Reports: React.FC<ReportsProps> = () => {
    const { transactions, categories, bankAccounts } = useTransactions();
    const [activeTab, setActiveTab] = useState<'dre' | 'cashVsAccrual' | 'cashFlowShort' | 'cashFlowLong'>('dre');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });

    // Handle Date Shifts (Timezone Safe)
    const handlePeriodShift = (direction: 'prev' | 'next') => {
        const [startY, startM, startD] = dateRange.start.split('-').map(Number);
        const [endY, endM, endD] = dateRange.end.split('-').map(Number);

        const start = new Date(startY, startM - 1, startD);
        const end = new Date(endY, endM - 1, endD);

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const modifier = direction === 'next' ? 1 : -1;

        if (diffDays >= 28 && diffDays <= 31) {
            const newStart = new Date(start.getFullYear(), start.getMonth() + modifier, 1);
            const newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0);
            setDateRange({ start: newStart.toISOString().split('T')[0], end: newEnd.toISOString().split('T')[0] });
        } else if (diffDays >= 360) {
            const newStart = new Date(start.getFullYear() + modifier, start.getMonth(), start.getDate());
            const newEnd = new Date(end.getFullYear() + modifier, end.getMonth(), end.getDate());
            setDateRange({ start: newStart.toISOString().split('T')[0], end: newEnd.toISOString().split('T')[0] });
        } else {
            const shiftAmount = diffDays + 1;
            const newStart = new Date(start);
            const newEnd = new Date(end);
            newStart.setDate(start.getDate() + (shiftAmount * modifier));
            newEnd.setDate(end.getDate() + (shiftAmount * modifier));
            setDateRange({ start: newStart.toISOString().split('T')[0], end: newEnd.toISOString().split('T')[0] });
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Relatórios Gerenciais</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Análises detalhadas para tomada de decisão</p>
                    </div>
                    {/* Period Selector (Only for DRE tabs) */}
                    {(activeTab === 'dre' || activeTab === 'cashVsAccrual') && (
                        <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                            <DateRangePicker
                                startDate={dateRange.start}
                                endDate={dateRange.end}
                                onChange={(start, end) => setDateRange({ start, end })}
                                onShift={handlePeriodShift}
                            />
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-xl overflow-x-auto border border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={() => setActiveTab('dre')}
                        className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'dre' ? 'bg-white dark:bg-zinc-800 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                    >
                        <BarChart2 size={18} />
                        <span>DRE Gerencial</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cashVsAccrual')}
                        className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'cashVsAccrual' ? 'bg-white dark:bg-zinc-800 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                    >
                        <ArrowLeftRight size={18} />
                        <span>DRE Caixa x Competência</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cashFlowShort')}
                        className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'cashFlowShort' ? 'bg-white dark:bg-zinc-800 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                    >
                        <Calendar size={18} />
                        <span>Fluxo de Caixa (Curto)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cashFlowLong')}
                        className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'cashFlowLong' ? 'bg-white dark:bg-zinc-800 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                    >
                        <TrendingUp size={18} />
                        <span>Projeção (90d)</span>
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-[500px]">
                    {activeTab === 'dre' && (
                        <DREView transactions={transactions} categories={categories} dateRange={dateRange} />
                    )}
                    {activeTab === 'cashVsAccrual' && (
                        <CashVsAccrualView transactions={transactions} categories={categories} dateRange={dateRange} />
                    )}
                    {activeTab === 'cashFlowShort' && (
                        <CashFlowView transactions={transactions} bankAccounts={bankAccounts} mode="short" />
                    )}
                    {activeTab === 'cashFlowLong' && (
                        <CashFlowView transactions={transactions} bankAccounts={bankAccounts} mode="long" />
                    )}
                </div>

            </div>
        </div>
    );
};
