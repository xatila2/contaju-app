import React, { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DashboardCard } from '../ui/DashboardCard';
import { DashboardMetrics } from '../../hooks/useDashboardMetrics';
import { useTransactions } from '../../context/TransactionContext';

interface CashFlowChartProps {
    metrics: DashboardMetrics;
    dateRange: { start: string, end: string };
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ metrics, dateRange }) => {
    const { transactions, bankAccounts } = useTransactions();

    const data = useMemo(() => {
        if (!dateRange || !dateRange.start || !dateRange.end) return [];

        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        const dailyData = [];

        // Normalize time
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        // 1. Calculate Starting Balance (Before the selected period)
        const initialBanks = bankAccounts.reduce((acc, bank) => acc + (bank.initialBalance || 0), 0);

        const previousTransactions = transactions.filter(tx => {
            const txDateStr = tx.paymentDate || tx.dueDate || tx.date;
            if (!txDateStr) return false;
            const txDate = new Date(txDateStr);
            txDate.setHours(0, 0, 0, 0);
            return txDate < start;
        });

        // Calculate Pre-period balances separately
        const previousRealized = previousTransactions.reduce((acc, tx) => {
            if (tx.status !== 'reconciled') return acc;
            return tx.type === 'income' ? acc + Math.abs(tx.amount) : acc - Math.abs(tx.amount);
        }, 0);

        const previousProjected = previousTransactions.reduce((acc, tx) => {
            return tx.type === 'income' ? acc + Math.abs(tx.amount) : acc - Math.abs(tx.amount);
        }, 0);

        let cumulativeRealized = initialBanks + previousRealized;
        let cumulativeProjected = initialBanks + previousProjected;

        // 2. Loop through days
        const current = new Date(start);

        while (current <= end) {
            const dateStr = current.toISOString().slice(0, 10);

            const dayTransactions = transactions.filter(tx => {
                const txDate = tx.paymentDate || tx.dueDate || tx.date;
                return txDate === dateStr;
            });

            let dayFlowRealized = 0;
            let dayFlowProjected = 0;

            dayTransactions.forEach(tx => {
                const flow = tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount);

                dayFlowProjected += flow; // Projected includes everything
                if (tx.status === 'reconciled') {
                    dayFlowRealized += flow;
                }
            });

            cumulativeRealized += dayFlowRealized;
            cumulativeProjected += dayFlowProjected;

            dailyData.push({
                name: current.getDate(),
                fullDate: dateStr,
                realized: cumulativeRealized,
                projected: cumulativeProjected
            });

            current.setDate(current.getDate() + 1);
        }

        return dailyData;
    }, [transactions, bankAccounts, dateRange]);

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const formatDateTitle = () => {
        if (!dateRange.start) return '';
        try {
            const d1 = new Date(dateRange.start).toLocaleDateString('pt-BR');
            const d2 = new Date(dateRange.end).toLocaleDateString('pt-BR');
            return `${d1} a ${d2}`;
        } catch (e) {
            return '';
        }
    };

    return (
        <DashboardCard title={`Fluxo de Caixa (${formatDateTitle()})`} className="h-[400px]">
            {data.length === 0 ? (
                <div className="flex flex-col h-full items-center justify-center text-zinc-400 space-y-2">
                    <p>Sem dados para o período</p>
                </div>
            ) : (
                <div className="w-full h-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} opacity={0.5} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#71717a' }}
                                dy={10}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#71717a' }}
                                tickFormatter={(val) => `R$${val / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number, name: string) => [formatMoney(value), name]}
                                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate ? new Date(payload[0].payload.fullDate).toLocaleDateString('pt-BR') : label}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar
                                dataKey="realized"
                                name="Realizado"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                barSize={8}
                                fillOpacity={0.8}
                            />
                            <Line
                                type="monotone"
                                dataKey="projected"
                                name="Projetado"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray="5 5"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
        </DashboardCard>
    );
};
