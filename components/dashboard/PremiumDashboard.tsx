import React, { useMemo } from 'react';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { PremiumKpiCard } from './PremiumKpiCard';
import { FinancialPerformanceChart } from './FinancialPerformanceChart';
import { ExpenseAnalysis } from './ExpenseAnalysis';
import { CashFlowChart } from './CashFlowChart';
import { Wallet, TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle } from 'lucide-react';

export const PremiumDashboard: React.FC<{
    dateRange: { start: string, end: string };
    onViewBankTransactions?: (bankId: string) => void;
}> = ({ dateRange }) => {

    const { metrics, isLoading, categories } = useDashboardMetrics(dateRange);

    // Insights Mock Logic (Real implementation would be more complex)
    const insights = useMemo(() => {
        if (!metrics) return [];
        const items = [];

        // Burn Rate / Expense Alert
        if (metrics.expenseRealized > metrics.revenueRealized) {
            items.push({
                type: 'warning',
                title: 'Alerta de Fluxo',
                desc: 'Despesas superam receitas neste período. Atenção ao capital de giro.',
                icon: AlertCircle
            });
        } else {
            items.push({
                type: 'success',
                title: 'Fluxo Positivo',
                desc: 'Receitas cobrem as despesas. Ótimo momento para investir ou reservar.',
                icon: CheckCircle
            });
        }
        return items;
    }, [metrics]);

    if (isLoading || !metrics) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1920px] mx-auto pb-24 animate-in fade-in duration-500">
            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        Visão Executiva
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Acompanhe a saúde financeira da sua empresa em tempo real.
                    </p>
                </div>
            </div>

            {/* 2. Executive Snapshot (KPI Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <PremiumKpiCard
                    title="Saldo Atual"
                    value={metrics.totalCurrent}
                    data={metrics.history}
                    dataKey="balance"
                    icon={Wallet}
                    variant={metrics.totalCurrent >= 0 ? 'default' : 'danger'}
                    trend={0} // To calculate real trend we need prev month end balance
                />
                <PremiumKpiCard
                    title="Receita Realizada"
                    value={metrics.revenueRealized}
                    data={metrics.history}
                    dataKey="revenue"
                    icon={TrendingUp}
                    variant="success"
                />
                <PremiumKpiCard
                    title="Despesa Realizada"
                    value={metrics.expenseRealized}
                    data={metrics.history}
                    dataKey="expense"
                    icon={TrendingDown}
                    variant="danger"
                />
                <PremiumKpiCard
                    title="Resultado (Lucro)"
                    value={metrics.profitRealized}
                    data={metrics.history}
                    dataKey="balance" // Using balance curve shape for profit trend proxy for now
                    icon={Activity}
                    variant={metrics.profitRealized >= 0 ? 'success' : 'danger'}
                />
            </div>

            {/* 3. Performance & Cash Flow */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <FinancialPerformanceChart metrics={metrics} />
                </div>
                <div className="xl:col-span-1 space-y-6">
                    {/* Smart Insights Cards */}
                    {insights.map((insight, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border flex items-start gap-4 ${insight.type === 'warning'
                                ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50'
                                : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50'
                            }`}>
                            <insight.icon className={insight.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'} size={24} />
                            <div>
                                <h4 className={`font-bold text-sm ${insight.type === 'warning' ? 'text-amber-900 dark:text-amber-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
                                    {insight.title}
                                </h4>
                                <p className={`text-xs mt-1 ${insight.type === 'warning' ? 'text-amber-700 dark:text-amber-200' : 'text-emerald-700 dark:text-emerald-200'}`}>
                                    {insight.desc}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Consolidated Cash Flow is usually a Chart, here reused existing */}
                    <div className="h-[280px]">
                        <CashFlowChart metrics={metrics} dateRange={dateRange} />
                    </div>
                </div>
            </div>

            {/* 4. Deep Dive Analysis */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Análise de Despesas</h2>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                </div>
                <ExpenseAnalysis metrics={metrics} categories={categories} />
            </section>
        </div>
    );
};
