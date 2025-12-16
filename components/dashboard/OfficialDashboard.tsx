import React from 'react';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { KpiCard } from './KpiCard';
import { ExpenseAnalysis } from './ExpenseAnalysis';
import { CashFlowChart } from './CashFlowChart';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

export const OfficialDashboard: React.FC<{
    dateRange: { start: string, end: string };
    onViewBankTransactions?: (bankId: string) => void;
}> = ({ dateRange, onViewBankTransactions }) => {

    const { metrics, isLoading, categories, currentMonthKey } = useDashboardMetrics(dateRange);

    if (isLoading || !metrics) {
        return <div className="p-8 text-center text-zinc-500 animate-pulse">Carregando indicadores...</div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-8 max-w-[1600px] mx-auto pb-20 fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Visão Geral</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        {new Date(dateRange.end).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Saldo Atual"
                    value={metrics.totalCurrent}
                    projected={metrics.totalProjected}
                    icon={Wallet}
                    variant={metrics.totalCurrent >= 0 ? 'success' : 'danger'}
                />
                <KpiCard
                    title="Receita Realizada"
                    value={metrics.revenueRealized}
                    projected={metrics.revenueProjected}
                    icon={TrendingUp}
                    variant="success"
                />
                <KpiCard
                    title="Despesa Realizada"
                    value={metrics.expenseRealized}
                    projected={metrics.expenseProjected}
                    icon={TrendingDown}
                    variant="danger"
                />
                <KpiCard
                    title="Resultado (Lucro)"
                    value={metrics.profitRealized}
                    projected={metrics.profitProjected}
                    icon={DollarSign}
                    variant={metrics.profitRealized >= 0 ? 'success' : 'danger'}
                />
            </div>

            {/* Expense Analysis Module */}
            <section>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity className="text-brand-500" size={20} />
                    Análise de Despesas
                </h2>
                <ExpenseAnalysis metrics={metrics} categories={categories} />
            </section>

            {/* Cash Flow Section */}
            <section>
                <CashFlowChart metrics={metrics} dateRange={dateRange} />
            </section>
        </div>
    );
};
