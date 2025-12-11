import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';
import { Transaction, PlanningData } from '../types';

interface RevenueGoalWidgetProps {
    transactions: Transaction[];
    planningData: PlanningData[];
    dateRange: { start: string; end: string };
    theme: 'light' | 'dark';
}

export const RevenueGoalWidget: React.FC<RevenueGoalWidgetProps> = ({ transactions, planningData, dateRange, theme }) => {
    // 1. Calculate Actual Revenue for the period
    const actualRevenue = useMemo(() => {
        return transactions
            .filter(t =>
                t.type === 'income' &&
                t.status === 'reconciled' && // Only realized revenue counts towards the goal? Or pending too? Usually realized.
                t.paymentDate! >= dateRange.start &&
                t.paymentDate! <= dateRange.end
            )
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions, dateRange]);

    // 2. Find Goal for the period
    // We assume the goal is for the month of the start date.
    const revenueGoal = useMemo(() => {
        if (!dateRange.start) return 0;
        // Parsing YYYY-MM manually to avoid timezone issues with new Date()
        const [year, month] = dateRange.start.split('-');
        const monthKey = `${year}-${month}`;

        const plan = planningData.find(p => p.month === monthKey);
        return plan?.revenueGoal || 0;
    }, [planningData, dateRange]);

    // 3. Prepare Chart Data (Semi-Circle Gauge)
    const chartData = useMemo(() => {
        const achieved = actualRevenue;
        const remaining = Math.max(0, revenueGoal - actualRevenue);
        // If no goal, we can't show a gauge properly.
        if (revenueGoal === 0) return [{ name: 'N/A', value: 1 }];

        return [
            { name: 'Realizado', value: achieved },
            { name: 'Restante', value: remaining }
        ];
    }, [actualRevenue, revenueGoal]);

    const percentage = revenueGoal > 0 ? Math.min(100, (actualRevenue / revenueGoal) * 100) : 0;
    const isGoalMet = percentage >= 100;

    // Colors
    const filledColor = isGoalMet ? '#10b981' : '#f59e0b'; // Emerald if met, Amber if in progress
    const emptyColor = theme === 'dark' ? '#27272a' : '#e4e4e7'; // Zinc-800 / Zinc-200

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        Meta de Receita
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {revenueGoal > 0 ? 'Progresso mensal' : 'Defina uma meta no Planejamento'}
                    </p>
                </div>
                {revenueGoal > 0 && (
                    <div className={`p-1.5 rounded-full ${isGoalMet ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                        {isGoalMet ? <Target size={14} /> : <TrendingUp size={14} />}
                    </div>
                )}
            </div>

            {/* Chart Content */}
            <div className="flex-1 flex flex-col items-center justify-center -mt-8 relative z-10">
                {revenueGoal > 0 ? (
                    <div className="relative w-full h-[160px] flex items-end justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="100%" // Bottom center
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell key="achieved" fill={filledColor} />
                                    <Cell key="remaining" fill={emptyColor} />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Centered Label */}
                        <div className="absolute bottom-0 flex flex-col items-center mb-2">
                            <span className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tighter">
                                {percentage.toFixed(0)}%
                            </span>
                            <span className="text-xs text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full mt-1">
                                {formatMoney(actualRevenue)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center text-zinc-400 py-8">
                        <AlertCircle size={32} className="mb-2 opacity-50" />
                        <span className="text-sm">Nenhuma meta configurada para este mês.</span>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            {revenueGoal > 0 && (
                <div className="mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs z-10 relative">
                    <span className="text-zinc-500">Meta: <strong>{formatMoney(revenueGoal)}</strong></span>
                    <span className={`${isGoalMet ? 'text-emerald-500' : 'text-zinc-400'}`}>
                        {isGoalMet ? 'Conquistada!' : `Faltam ${formatMoney(Math.max(0, revenueGoal - actualRevenue))}`}
                    </span>
                </div>
            )}

            {/* Decorative Background Glow */}
            <div className={`absolute -bottom-10 right-0 w-32 h-32 bg-gradient-to-br ${isGoalMet ? 'from-emerald-500/10' : 'from-yellow-500/10'} to-transparent rounded-full blur-2xl pointer-events-none`}></div>
        </div>
    );
};
