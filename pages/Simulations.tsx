
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts';
import { RotateCcw, Save, Sliders, ArrowRight, TrendingUp, DollarSign } from 'lucide-react';
import { DEFAULT_SCENARIOS } from '../constants';
import { Transaction, Category } from '../types';

import { useTransactions } from '../context/TransactionContext';

interface SimulationsProps { }

export const Simulations: React.FC<SimulationsProps> = () => {
    const { transactions, categories } = useTransactions();

    const [selectedScenarioId, setSelectedScenarioId] = useState<string>('base');

    // Custom Params for Cost Reduction Analysis
    const [fixedCostReduction, setFixedCostReduction] = useState(0); // Percentage
    const [variableCostReduction, setVariableCostReduction] = useState(0); // Percentage
    const [salesGrowth, setSalesGrowth] = useState(0); // Percentage

    // --- 1. Calculate Baseline P&L (DRE) from Transactions ---
    const baselineData = useMemo(() => {
        // Determine month range or just sum up all loaded transactions for "Average Month" simulation
        // For simplicity, we calculate totals and assume a monthly average context
        let totalRevenue = 0;
        let totalVariableCost = 0;
        let totalFixedCost = 0;

        transactions.forEach(tx => {
            if (tx.status !== 'reconciled' && tx.status !== 'pending') return; // Only real/pending
            const amount = Math.abs(tx.amount);

            if (tx.type === 'income') {
                totalRevenue += amount;
            } else if (tx.type === 'expense') {
                const cat = categories.find(c => c.id === tx.categoryId);
                // Logic: Code 2.x = Variable, Code 3,4,5 = Fixed
                if (cat?.code.startsWith('2')) {
                    totalVariableCost += amount;
                } else {
                    totalFixedCost += amount; // Default to fixed if not explicitly variable
                }
            }
        });

        const netProfit = totalRevenue - totalVariableCost - totalFixedCost;
        const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return { totalRevenue, totalVariableCost, totalFixedCost, netProfit, margin };
    }, [transactions, categories]);


    // --- 2. Calculate Simulated P&L ---
    const simulatedData = useMemo(() => {
        // Apply Factors
        const simRevenue = baselineData.totalRevenue * (1 + salesGrowth / 100);

        // Variable cost usually scales with revenue, THEN we apply reduction efficiency
        // Base variable ratio
        const variableRatio = baselineData.totalRevenue > 0 ? baselineData.totalVariableCost / baselineData.totalRevenue : 0;
        const projectedVariableCostRaw = simRevenue * variableRatio;
        const simVariableCost = projectedVariableCostRaw * (1 - variableCostReduction / 100);

        // Fixed cost stays constant relative to revenue, then apply reduction
        const simFixedCost = baselineData.totalFixedCost * (1 - fixedCostReduction / 100);

        const simNetProfit = simRevenue - simVariableCost - simFixedCost;
        const simMargin = simRevenue > 0 ? (simNetProfit / simRevenue) * 100 : 0;

        return {
            totalRevenue: simRevenue,
            totalVariableCost: simVariableCost,
            totalFixedCost: simFixedCost,
            netProfit: simNetProfit,
            margin: simMargin
        };
    }, [baselineData, salesGrowth, fixedCostReduction, variableCostReduction]);

    const comparisonData = [
        { name: 'Receita', base: baselineData.totalRevenue, sim: simulatedData.totalRevenue },
        { name: 'Custos Var.', base: baselineData.totalVariableCost, sim: simulatedData.totalVariableCost },
        { name: 'Custos Fixos', base: baselineData.totalFixedCost, sim: simulatedData.totalFixedCost },
        { name: 'Lucro Líq.', base: baselineData.netProfit, sim: simulatedData.netProfit },
    ];

    const profitDiff = simulatedData.netProfit - baselineData.netProfit;
    const isProfitBetter = profitDiff >= 0;

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
    const formatPercent = (val: number) => val.toFixed(1) + '%';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[calc(100vh-140px)]">

            {/* LEFT: Controls */}
            <div className="lg:col-span-4 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full">
                <div className="flex items-center space-x-2 mb-6 text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg">
                        <Sliders className="text-yellow-600 dark:text-yellow-500" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Parâmetros de Simulação</h2>
                        <p className="text-xs text-zinc-500">Ajuste as variáveis para projetar resultados</p>
                    </div>
                </div>

                <div className="space-y-8 flex-1">
                    {/* Sales Growth Slider */}
                    <div>
                        <div className="flex justify-between mb-2 items-center">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Crescimento de Receita</label>
                            <span className="text-sm font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">+{salesGrowth}%</span>
                        </div>
                        <input
                            type="range" min="-20" max="50" step="1"
                            value={salesGrowth}
                            onChange={(e) => setSalesGrowth(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <p className="text-xs text-zinc-400 mt-2">Simula aumento de volume ou preço médio.</p>
                    </div>

                    {/* Variable Cost Slider */}
                    <div>
                        <div className="flex justify-between mb-2 items-center">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Redução de Custos Variáveis</label>
                            <span className="text-sm font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">-{variableCostReduction}%</span>
                        </div>
                        <input
                            type="range" min="0" max="30" step="1"
                            value={variableCostReduction}
                            onChange={(e) => setVariableCostReduction(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className="text-xs text-zinc-400 mt-2">Eficiência em compras (CMV), impostos ou comissões.</p>
                    </div>

                    {/* Fixed Cost Slider */}
                    <div>
                        <div className="flex justify-between mb-2 items-center">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Redução de Custos Fixos</label>
                            <span className="text-sm font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">-{fixedCostReduction}%</span>
                        </div>
                        <input
                            type="range" min="0" max="30" step="1"
                            value={fixedCostReduction}
                            onChange={(e) => setFixedCostReduction(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className="text-xs text-zinc-400 mt-2">Renegociação de aluguel, software, e despesas gerais.</p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex space-x-3">
                    <button
                        onClick={() => { setFixedCostReduction(0); setVariableCostReduction(0); setSalesGrowth(0); }}
                        className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors" title="Resetar">
                        <RotateCcw size={20} />
                    </button>
                    <button className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20 text-black py-3 rounded-xl font-bold transition">
                        <Save size={20} />
                        <span>Salvar Cenário</span>
                    </button>
                </div>
            </div>

            {/* RIGHT: Results Matrix */}
            <div className="lg:col-span-8 flex flex-col space-y-6">

                {/* Top Cards: Impact Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Resultado Líquido (Projetado)</p>
                            <div className="flex items-baseline space-x-2">
                                <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{formatMoney(simulatedData.netProfit)}</h3>
                                <span className={`text-sm font-bold px-2 py-0.5 rounded ${isProfitBetter ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {isProfitBetter ? '+' : ''}{formatMoney(profitDiff)}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-2">Impacto direto no caixa da empresa.</p>
                        </div>
                        <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10 ${isProfitBetter ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-zinc-500">Margem Atual</span>
                            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{formatPercent(baselineData.margin)}</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full mb-4">
                            <div className="bg-zinc-400 h-full rounded-full" style={{ width: `${Math.min(baselineData.margin, 100)}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-zinc-500">Margem Projetada</span>
                            <span className={`font-mono font-bold ${simulatedData.margin >= baselineData.margin ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatPercent(simulatedData.margin)}
                            </span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full">
                            <div className={`h-full rounded-full ${simulatedData.margin >= baselineData.margin ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(simulatedData.margin, 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Matrix Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <h3 className="font-bold text-zinc-900 dark:text-white">Matriz de Impacto (DRE Gerencial)</h3>
                        <div className="flex space-x-2 text-xs">
                            <span className="flex items-center"><div className="w-3 h-3 bg-zinc-200 dark:bg-zinc-700 rounded mr-1"></div> Atual</span>
                            <span className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div> Simulado</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800">
                            <thead className="bg-zinc-50 dark:bg-zinc-950">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Indicador</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-zinc-500 uppercase">Atual (Base)</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase">Simulado</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-zinc-500 uppercase">Variação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                {/* Revenue */}
                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                                        <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600"><DollarSign size={14} /></div>
                                        Receita Bruta
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-zinc-600 dark:text-zinc-300 font-mono">
                                        {formatMoney(baselineData.totalRevenue)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-yellow-600 dark:text-yellow-500 font-mono bg-yellow-50/50 dark:bg-yellow-900/10">
                                        {formatMoney(simulatedData.totalRevenue)}
                                    </td>
                                    <td className={`px-6 py-4 text-right text-sm font-bold font-mono ${simulatedData.totalRevenue >= baselineData.totalRevenue ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatMoney(simulatedData.totalRevenue - baselineData.totalRevenue)}
                                    </td>
                                </tr>

                                {/* Variable Costs */}
                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 pl-10">
                                        (-) Custos Variáveis
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-zinc-600 dark:text-zinc-300 font-mono">
                                        {formatMoney(baselineData.totalVariableCost)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-zinc-600 dark:text-zinc-300 font-mono bg-yellow-50/50 dark:bg-yellow-900/10">
                                        {formatMoney(simulatedData.totalVariableCost)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-zinc-400 font-mono">
                                        {formatMoney(simulatedData.totalVariableCost - baselineData.totalVariableCost)}
                                    </td>
                                </tr>

                                {/* Fixed Costs */}
                                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 pl-10">
                                        (-) Custos Fixos
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-zinc-600 dark:text-zinc-300 font-mono">
                                        {formatMoney(baselineData.totalFixedCost)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-zinc-600 dark:text-zinc-300 font-mono bg-yellow-50/50 dark:bg-yellow-900/10">
                                        {formatMoney(simulatedData.totalFixedCost)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-emerald-600 font-mono">
                                        {formatMoney(baselineData.totalFixedCost - simulatedData.totalFixedCost)} (Econ.)
                                    </td>
                                </tr>

                                {/* Net Profit */}
                                <tr className="bg-zinc-50/50 dark:bg-zinc-950/50 font-bold border-t-2 border-zinc-100 dark:border-zinc-800">
                                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                                        <div className={`p-1 rounded ${isProfitBetter ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><TrendingUp size={14} /></div>
                                        Resultado Operacional
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-zinc-900 dark:text-white font-mono">
                                        {formatMoney(baselineData.netProfit)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-yellow-600 dark:text-yellow-500 font-mono bg-yellow-50/50 dark:bg-yellow-900/10 border-x border-yellow-100 dark:border-yellow-900/20">
                                        {formatMoney(simulatedData.netProfit)}
                                    </td>
                                    <td className={`px-6 py-4 text-right text-sm font-bold font-mono ${isProfitBetter ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatMoney(profitDiff)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
