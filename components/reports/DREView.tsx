import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Transaction, Category } from '../../types';
import { calculateDRE, DREResult } from '../../utils/financialUtils';

interface DREViewProps {
    transactions: Transaction[];
    categories: Category[];
    dateRange: { start: string; end: string };
}

const KPICard = ({ label, value, percent, type = 'neutral' }: { label: string, value: number, percent?: number, type?: 'good' | 'bad' | 'neutral' }) => {
    const isPositive = percent && percent >= 0;
    const color = type === 'good' ? 'text-emerald-500' : type === 'bad' ? 'text-rose-500' : 'text-zinc-500';
    const bg = type === 'good' ? 'bg-emerald-50 dark:bg-emerald-900/20' : type === 'bad' ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-zinc-100 dark:bg-zinc-800';

    return (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                </span>
            </div>
            {percent !== undefined && (
                <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${color}`}>
                    {isPositive ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                    {Math.abs(percent).toFixed(1)}% {label === 'Lucro Líquido' ? 'da Receita' : 'vs Anterior'}
                </div>
            )}
        </div>
    );
};

export const DREView: React.FC<DREViewProps> = ({ transactions, categories, dateRange }) => {
    const [analysisMode, setAnalysisMode] = useState<'vertical' | 'horizontal'>('vertical');

    const dre = useMemo(() => calculateDRE(transactions, categories, dateRange.start, dateRange.end), [transactions, categories, dateRange]);

    // Calculate previous month for comparison
    const prevDRE = useMemo(() => {
        const start = new Date(dateRange.start);
        start.setMonth(start.getMonth() - 1);
        const end = new Date(dateRange.end);
        end.setMonth(end.getMonth() - 1);

        return calculateDRE(
            transactions,
            categories,
            start.toISOString().split('T')[0],
            new Date(start.getFullYear(), start.getMonth() + 1, 0).toISOString().split('T')[0]
        );
    }, [transactions, categories, dateRange]);

    // KPI Calculations
    const revGrowth = prevDRE.netRevenue !== 0 ? ((dre.netRevenue - prevDRE.netRevenue) / prevDRE.netRevenue) * 100 : 0;
    const netMargin = dre.netRevenue !== 0 ? (dre.netResult / dre.netRevenue) * 100 : 0;

    // Chart Data (Last 6 Months)
    const chartData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const start = d.toISOString().split('T')[0];
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
            const res = calculateDRE(transactions, categories, start, end);
            data.push({
                name: d.toLocaleDateString('pt-BR', { month: 'short' }),
                receita: res.netRevenue,
                lucro: res.netResult
            });
        }
        return data;
    }, [transactions, categories]);

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatPercent = (val: number) => val.toFixed(1) + '%';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Receita Líquida"
                    value={dre.netRevenue}
                    percent={revGrowth}
                    type={revGrowth >= 0 ? 'good' : 'bad'}
                />
                <KPICard
                    label="Lucro Bruto"
                    value={dre.grossProfit}
                />
                <KPICard
                    label="EBITDA"
                    value={dre.ebitda}
                />
                <KPICard
                    label="Lucro Líquido"
                    value={dre.netResult}
                    percent={netMargin}
                    type={dre.netResult >= 0 ? 'good' : 'bad'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2. Chart */}
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Evolução Semestral</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}
                                />
                                <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} name="Receita" opacity={0.8} />
                                <Line type="monotone" dataKey="lucro" stroke="#e11d48" strokeWidth={2} name="Lucro Líq." dot={{ r: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. DRE Table */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Demonstrativo Detalhado</h3>

                        {/* Analysis Mode Toggle */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                            <button
                                onClick={() => setAnalysisMode('vertical')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${analysisMode === 'vertical' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                            >
                                Análise Vertical
                            </button>
                            <button
                                onClick={() => setAnalysisMode('horizontal')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${analysisMode === 'horizontal' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                            >
                                Análise Horizontal
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Conta</th>
                                    <th className="px-6 py-3 font-medium text-right">Valor Atual</th>
                                    {analysisMode === 'vertical' ? (
                                        <th className="px-6 py-3 font-medium text-right">% Rec. Líq.</th>
                                    ) : (
                                        <>
                                            <th className="px-6 py-3 font-medium text-right text-zinc-400">Mês Anterior</th>
                                            <th className="px-6 py-3 font-medium text-right">Var. (R$)</th>
                                            <th className="px-6 py-3 font-medium text-right">Var. (%)</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {dre.lines.map((line, idx) => {
                                    // Find matching line in prevDRE (assuming order is identical as logic is deterministic)
                                    const prevLine = prevDRE.lines[idx];
                                    const prevValue = prevLine ? prevLine.value : 0;
                                    const variation = line.value - prevValue;
                                    const variationPercent = prevValue !== 0 ? (variation / Math.abs(prevValue)) * 100 : (line.value !== 0 ? 100 : 0);

                                    return (
                                        <tr
                                            key={idx}
                                            className={`
                                                ${line.isTotal ? 'bg-zinc-50/50 dark:bg-zinc-800/30 font-bold text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'} 
                                                hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors
                                            `}
                                        >
                                            <td className="px-6 py-3" style={{ paddingLeft: `${(line.level * 1.5) + 1.5}rem` }}>
                                                {line.name}
                                            </td>
                                            <td className={`px-6 py-3 text-right ${line.value < 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                                                {formatMoney(line.value)}
                                            </td>

                                            {analysisMode === 'vertical' ? (
                                                <td className="px-6 py-3 text-right text-zinc-500">
                                                    {line.level === 0 && line.name !== 'Receita Bruta' ? formatPercent(line.percentage) : '-'}
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-3 text-right text-zinc-400">
                                                        {formatMoney(prevValue)}
                                                    </td>
                                                    <td className={`px-6 py-3 text-right ${variation > 0 ? 'text-emerald-600' : variation < 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
                                                        {formatMoney(variation)}
                                                    </td>
                                                    <td className={`px-6 py-3 text-right ${variationPercent > 0 ? 'text-emerald-600' : variationPercent < 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
                                                        {prevValue !== 0 ? formatPercent(variationPercent) : (line.value !== 0 ? formatPercent(100) : '-')}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Explanatory Text */}
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                        {analysisMode === 'vertical'
                            ? "Análise vertical: mostra quanto cada conta representa em relação à Receita Líquida do período."
                            : "Análise horizontal: compara cada conta da DRE com o mês anterior, mostrando a variação em valor e percentual."
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};
