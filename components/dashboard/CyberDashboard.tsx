import React, { useMemo } from 'react';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { CyberKpiCard } from './CyberKpiCard';
import { CyberHeroCard } from './CyberHeroCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Sector, Legend } from 'recharts';
import { Wallet, ArrowUpCircle, ArrowDownCircle, DollarSign, Activity, AlertTriangle } from 'lucide-react';

export const CyberDashboard: React.FC<{
    dateRange: { start: string, end: string };
    onViewBankTransactions?: (bankId: string) => void;
}> = ({ dateRange }) => {

    const { metrics, isLoading, categories } = useDashboardMetrics(dateRange);

    const expenseData = useMemo(() => {
        if (!metrics || !metrics.expenseByCategory) return [];
        return Object.entries(metrics.expenseByCategory)
            .map(([id, val]) => {
                const catName = categories.find(c => c.id === id)?.name || id.substring(0, 8);
                return { name: catName, value: val as number };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 7);
    }, [metrics, categories]);

    if (isLoading || !metrics) {
        return <div className="p-12 text-center text-slate-500 animate-pulse">Carregando Cyber Dashboard...</div>;
    }

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    const performanceData = metrics.history || [];

    return (
        <div className="w-full min-h-full bg-[#0f172a] text-slate-200 p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Visão Geral
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Monitoramento financeiro em tempo real.
                    </p>
                </div>
                <div className="text-sm font-medium px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-slate-300">
                    {new Date(dateRange.start).toLocaleDateString()} — {new Date(dateRange.end).toLocaleDateString()}
                </div>
            </div>

            {/* 1. Top Row: KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <CyberKpiCard
                    title="Saldo Total"
                    value={metrics.totalCurrent}
                    icon={Wallet}
                    color="blue"
                    trend={0}
                />
                <CyberKpiCard
                    title="Receitas"
                    value={metrics.revenueRealized}
                    icon={ArrowUpCircle}
                    color="emerald"
                    trend={metrics.prevMonthExpenses?.revenue && metrics.prevMonthExpenses.revenue > 0
                        ? parseFloat((((metrics.revenueRealized - metrics.prevMonthExpenses.revenue) / metrics.prevMonthExpenses.revenue) * 100).toFixed(1))
                        : 0}
                />
                <CyberKpiCard
                    title="Despesas"
                    value={metrics.expenseRealized}
                    icon={ArrowDownCircle}
                    color="purple"
                    trend={metrics.prevMonthExpenses?.expense && metrics.prevMonthExpenses.expense > 0
                        ? parseFloat((((metrics.expenseRealized - metrics.prevMonthExpenses.expense) / metrics.prevMonthExpenses.expense) * 100).toFixed(1))
                        : 0}
                />
                <CyberKpiCard
                    title="Resultado"
                    value={metrics.profitRealized}
                    icon={DollarSign}
                    color="cyan"
                    trend={0}
                />
            </div>

            {/* 2. Middle Row: Hero + Gauges */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Hero Card */}
                <div className="xl:col-span-2 min-h-[300px]">
                    <CyberHeroCard balance={metrics.totalCurrent} projected={metrics.totalProjected} />
                </div>

                {/* Gauges Column */}
                <div className="xl:col-span-1 grid grid-cols-1 gap-6">
                    {/* Profit Margin Gauge */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center relative overflow-hidden group hover:border-slate-700 transition-colors">
                        <div className="absolute top-4 left-4">
                            <h3 className="text-slate-200 font-bold text-sm uppercase tracking-wide">Margem de Lucro</h3>
                        </div>
                        <div className="absolute top-4 right-4 text-slate-600">
                            <Activity size={20} />
                        </div>

                        <div className="mt-6 relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="12" fill="none" />
                                <circle
                                    cx="80" cy="80" r="70"
                                    stroke="#3b82f6" strokeWidth="12" fill="none"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * Math.max(0, Math.min(100, (metrics.profitRealized / (metrics.revenueRealized || 1)) * 100))) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-white shadow-glow">
                                    {metrics.revenueRealized > 0 ? Math.round((metrics.profitRealized / metrics.revenueRealized) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Margem Líquida sobre Receita</p>
                    </div>

                    {/* Expense Target Gauge */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-center gap-4 hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-slate-200 font-bold text-sm uppercase tracking-wide">Meta de Despesas</h3>
                                <p className="text-xs text-slate-500 mt-1">Consumo do orçamento planejado</p>
                            </div>
                            <span className="text-white font-bold text-xl">
                                {metrics.goals.expense > 0 ? Math.round((metrics.expenseRealized / metrics.goals.expense) * 100) : 0}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden border border-slate-700/50">
                            <div
                                className={`h-full bg-gradient-to-r transition-all duration-1000 ${(metrics.expenseRealized / metrics.goals.expense) > 1
                                    ? 'from-rose-600 to-rose-400'
                                    : 'from-emerald-600 to-emerald-400'
                                    }`}
                                style={{ width: `${Math.min(100, metrics.goals.expense > 0 ? (metrics.expenseRealized / metrics.goals.expense) * 100 : 0)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-400">{formatMoney(metrics.expenseRealized)} gastos</span>
                            <span className="text-slate-500">Meta: {formatMoney(metrics.goals.expense || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Bottom Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cash Flow Evolution */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity size={18} className="text-cyan-400" />
                            Evolução do Saldo
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="cyberGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(val) => new Date(val).getDate().toString()}
                                    stroke="#475569"
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(val) => `R$${val / 1000}k`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(val: number) => [formatMoney(val), 'Saldo Acumulado']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#06b6d4"
                                    strokeWidth={3}
                                    fill="url(#cyberGradient)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Expenses */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <AlertTriangle size={18} className="text-purple-400" />
                            Top Categorias de Despesa
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        {expenseData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-600">
                                Nenhuma despesa no período
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={expenseData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#1e293b' }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                                        formatter={(val: number) => [formatMoney(val), 'Valor']}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                        {expenseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#3b82f6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
