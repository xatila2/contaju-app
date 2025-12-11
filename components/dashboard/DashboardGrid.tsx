
import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useDashboard } from '../../context/DashboardContext';
import { ChartCard } from './ChartCard';
import { useTransactions } from '../../context/TransactionContext';

// Selectors
import {
    getCategoryDistribution,
    calculatePeriodTotals,
    calculateSaldoDisponivel,
    getDailyCashFlow
} from '../../dashboard/selectors';
import { GridItem } from '../../types';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const DashboardGrid = ({
    dateRange,
    onConfigureCard
}: {
    dateRange: { start: string, end: string },
    onConfigureCard: (cardId: string, currentConfig: any) => void
}) => {
    const {
        activeLayout,
        isEditMode,
        updateLayoutItems,
        removeCardFromLayout,
        updateCardConfig
    } = useDashboard();

    const { transactions, categories, bankAccounts, planningData } = useTransactions();

    if (!activeLayout) return <div>Carregando layout...</div>;

    // --- DATA FETCHING (DUMMY DISPATCHER) ---
    // In a real app, this would be a custom hook using useQuery or similar.
    // Here we just map ID to selector manually for the MVP.
    const getDataForCard = (cardId: string, instanceConfig: any) => {
        // Strip instance suffix if present
        const definitionId = cardId.includes('__inst_') ? cardId.split('__inst_')[0] : cardId;
        const period = instanceConfig?.period || '30d';

        switch (definitionId) {
            case 'bank_single_card':
                // Format: bank_single_card__inst_<BANK_ID>
                let suffix = cardId.split('__inst_')[1];

                // Fallback for weird legacy IDs if they exist (formatted like bank_single_card_bank-1__inst_default)
                if (suffix === 'default' && cardId.includes('bank_single_card_')) {
                    const middle = cardId.split('__inst_')[0];
                    suffix = middle.replace('bank_single_card_', '');
                }

                return bankAccounts.find(b => b.id === suffix);

            case 'bank_summary_list':
                return bankAccounts;
            case 'revenue_goal_widget':
                return {
                    transactions,
                    planningData,
                    dateRange,
                    theme: 'light' // Default or grab from context if available
                };
            case 'reconciliation_widget':
                return {}; // No specific data needed, handles internal logic or static
            case 'kpi_total_balance':
                return { value: calculateSaldoDisponivel(bankAccounts), subtext: 'Total Consolidado', trend: 'up' };
            case 'kpi_income':
                const inc = calculatePeriodTotals(transactions, '30d');
                return {
                    value: inc.income.realized,
                    projectedValue: inc.income.pending,
                    subtext: 'Receitas (30d)',
                    trend: 'up',
                    label: 'Receitas'
                };
            case 'kpi_expense':
                const exp = calculatePeriodTotals(transactions, '30d');
                return {
                    value: exp.expense.realized,
                    projectedValue: exp.expense.pending,
                    subtext: 'Despesas (30d)',
                    trend: 'down',
                    label: 'Despesas'
                };
            case 'kpi_result':
                const res = calculatePeriodTotals(transactions, '30d');
                return {
                    value: res.balance.realized,
                    projectedValue: res.balance.pending,
                    subtext: 'Resultado (30d)',
                    trend: res.balance.total >= 0 ? 'up' : 'down',
                    label: 'Resultado'
                };

            case 'saldo_disponivel':
                return { value: calculateSaldoDisponivel(bankAccounts), subtext: 'Total em Contas' };
            case 'entradas_periodo':
                return { value: calculatePeriodTotals(transactions, period).income, subtext: 'Receitas' };
            case 'saidas_periodo':
                return { value: calculatePeriodTotals(transactions, period).expense, subtext: 'Despesas' };
            case 'receita_por_categoria':
                return getCategoryDistribution(transactions, categories, 'income', period);
            case 'despesa_por_categoria_pareto':
                return getCategoryDistribution(transactions, categories, 'expense', period);
            case 'fluxo_caixa_30d':
            case 'proj_fluxo_caixa_30d': // Just reuse for MVP
                return getDailyCashFlow(transactions, period);
            case 'saldo_por_conta':
                return bankAccounts.map(b => ({ name: b.name, value: b.initialBalance })); // Needs real calc
            default:
                return null;
        }
    };

    const handleLayoutChange = (layout: any[]) => {
        // Save layout changes - this is called on every movement
        // The grid will auto-compact and prevent collisions
        if (!isEditMode) return;

        const newItems: GridItem[] = layout.map(l => ({
            i: l.i,
            x: l.x,
            y: l.y,
            w: l.w,
            h: l.h
        }));
        updateLayoutItems(newItems);
    };

    return (
        <div className="pb-20">
            <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: activeLayout.items }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={30}
                isDraggable={isEditMode}
                isResizable={isEditMode}
                onLayoutChange={handleLayoutChange}
                margin={[16, 16]}
                containerPadding={[0, 0]}
                compactType={null} // Free drag! No auto-organize vertical/horizontal.
                preventCollision={false} // Allow pushing items (standard behavior), or true to block? Default false is usually smoother for "swapping".
            >
                {activeLayout.items.map(item => {
                    const config = activeLayout.configs[item.i] || {};
                    const data = getDataForCard(item.i, config);

                    return (
                        <div key={item.i} data-grid={item}>
                            <ChartCard
                                cardId={item.i}
                                config={config}
                                data={data || []}
                                isEditMode={isEditMode}
                                onRemove={() => removeCardFromLayout(item.i)}
                                onEditConfig={(currentConfig) => onConfigureCard(item.i, currentConfig)}
                            />
                        </div>
                    );
                })}
            </ResponsiveGridLayout>
        </div >
    );
};
