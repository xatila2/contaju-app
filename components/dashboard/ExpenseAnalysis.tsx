import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector, Tooltip } from 'recharts';
import { DashboardCard } from '../ui/DashboardCard';
import { DashboardMetrics } from '../../hooks/useDashboardMetrics';
import { Category } from '../../types';

interface ExpenseAnalysisProps {
    metrics: DashboardMetrics;
    categories: Category[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#64748b'];

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    return (
        <g>
            <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#71717a" fontSize={12}>
                {payload.name}
            </text>
            <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#18181b" fontSize={16} fontWeight="bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            </text>
            <text x={cx} y={cy + 35} dy={8} textAnchor="middle" fill="#9ca3af" fontSize={11}>
                {`${(percent * 100).toFixed(1)}%`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 8}
                outerRadius={outerRadius + 12}
                fill={fill}
            />
        </g>
    );
};

export const ExpenseAnalysis: React.FC<ExpenseAnalysisProps> = ({ metrics, categories }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const data = useMemo(() => {
        if (!metrics || !metrics.expenseByCategory) return [];

        const totalRevenue = metrics.revenueRealized || 1;

        return Object.entries(metrics.expenseByCategory)
            .map(([id, value]) => {
                const cat = categories.find((c) => c.id === id);
                return {
                    name: cat?.name || 'Outros',
                    value,
                    percentOfRevenue: (value / totalRevenue) * 100,
                    id
                };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Top 6 only for cleaner Donut
    }, [metrics, categories]);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Insight Logic
    const insight = useMemo(() => {
        let maxDiffId = '';
        let maxDiffVal = -Infinity;

        Object.entries(metrics.expenseByCategory).forEach(([id, currVal]) => {
            const prevVal = metrics.prevMonthExpensesByCategory[id] || 0;
            const diff = currVal - prevVal;
            if (diff > maxDiffVal) {
                maxDiffVal = diff;
                maxDiffId = id;
            }
        });

        if (maxDiffVal <= 0) return null;

        const catName = categories.find(c => c.id === maxDiffId)?.name || 'Outros';
        return { name: catName, value: maxDiffVal };
    }, [metrics, categories]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-2">
                <DashboardCard title="Distribuição de Despesas" className="h-[400px]">
                    {data.length === 0 ? (
                        <div className="flex flex-col h-full items-center justify-center text-zinc-400 space-y-4">
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                <span className="text-2xl grayscale">📊</span>
                            </div>
                            <p className="text-sm">Nenhuma despesa registrada neste período.</p>
                        </div>
                    ) : (
                        <div className="w-full h-full min-h-0 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        // @ts-ignore
                                        activeIndex={activeIndex}
                                        activeShape={renderActiveShape}
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={2}
                                        dataKey="value"
                                        onMouseEnter={onPieEnter}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </DashboardCard>
            </div>

            {/* Insight Section */}
            <div className="lg:col-span-1">
                <DashboardCard className="h-full bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600 mb-4">
                        Insights do Mês
                    </h3>

                    <div className="space-y-6">
                        {insight ? (
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Maior Aumento</p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                    A categoria <strong className="text-zinc-900 dark:text-white">{insight.name}</strong> aumentou {' '}
                                    <span className="text-status-danger font-bold">{formatMoney(insight.value)}</span> em relação ao mês anterior.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-zinc-500">
                                    Você manteve suas despesas controladas em relação ao mês anterior. Ótimo trabalho!
                                </p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Total Despesas</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                {formatMoney(metrics.expenseRealized)}
                            </p>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="bg-status-danger h-full"
                                    style={{ width: `${Math.min(100, (metrics.expenseRealized / (metrics.goals.expense || 1)) * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">
                                {metrics.goals.expense > 0 ? `${Math.round((metrics.expenseRealized / metrics.goals.expense) * 100)}% do orçamento` : 'Sem meta definida'}
                            </p>
                        </div>

                        {/* Mini Legend */}
                        <div className="pt-4 mt-2">
                            <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Top Categorias</p>
                            <div className="space-y-2">
                                {data.slice(0, 4).map((entry, index) => (
                                    <div key={entry.id} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-zinc-600 dark:text-zinc-300 truncate max-w-[120px]">{entry.name}</span>
                                        </div>
                                        <span className="font-medium text-zinc-900 dark:text-white">{formatMoney(entry.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
};
