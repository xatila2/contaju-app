import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Building2, Wallet, PiggyBank, ShieldCheck, AlertTriangle, X, Target } from 'lucide-react';
import { SemiDonutChart } from './SemiDonutChart';
import { GoalCard } from './GoalCard';
import { SafeWithdrawalCard } from './SafeWithdrawalCard';

export const GoldDashboard: React.FC<{
    dateRange: { start: string, end: string };
    onViewBankTransactions?: (bankId: string) => void;
}> = ({ dateRange, onViewBankTransactions }) => {
    const navigate = useNavigate();
    const { metrics, isLoading, categories, transactions } = useDashboardMetrics(dateRange);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [showBankModal, setShowBankModal] = useState(false);

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const chartData = useMemo(() => {
        if (!metrics?.history) return [];
        return metrics.history.map(day => ({
            date: day.date,
            realized: day.balanceRealized,
            projected: day.balanceProjected
        }));
    }, [metrics]);

    const topExpenses = useMemo(() => {
        if (!metrics?.expenseByCategory) return [];
        const totalExp = metrics.expenseRealized || 1;

        return Object.entries(metrics.expenseByCategory)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 5) // Show top 5 for better filtering options
            .map(([id, val]) => {
                const cat = categories.find(c => c.id === id);
                return {
                    id,
                    name: cat?.name || id,
                    value: val as number,
                    percent: ((val as number) / totalExp) * 100
                };
            });
    }, [metrics, categories]);

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        let txs = transactions;

        // Filter by category if selected
        if (selectedCategoryId) {
            txs = txs.filter(t => t.categoryId === selectedCategoryId);
        }

        // Sort by date desc
        return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5); // Show 5
    }, [transactions, selectedCategoryId]);

    if (isLoading || !metrics) {
        return <div className="h-full w-full flex items-center justify-center bg-dark-900 text-gold-500 font-sans animate-pulse">Carregando FinanceFlow...</div>;
    }

    const cushionStatus = metrics.financialCushion >= 0 ? 'safe' : 'risk';
    const cushionPercent = metrics.workingCapital > 0
        ? (metrics.balance / metrics.workingCapital) * 100
        : 100;

    return (
        <div className="w-full bg-dark-900 relative font-sans text-white h-full overflow-y-auto">
            <style>{`
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-enter { animation: fade-in-up 0.6s ease-out forwards; }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }
            `}</style>

            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full px-6 py-8 space-y-8 relative z-10 animate-enter">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Dashboard Financeiro</h1>
                        <p className="text-gray-400 text-sm">Visão geral interativa da sua saúde financeira.</p>
                    </div>
                </header>

                {/* KPI Cards Row (Merged with Goals) */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-enter delay-100">
                    {/* Card 1: Saldo Total */}
                    <article
                        onDoubleClick={() => setShowBankModal(true)}
                        className="bg-dark-800 p-5 rounded-xl border border-dark-600 corner-accent shadow-glow-card group hover:border-gold-500/50 hover:shadow-glow-gold hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer select-none min-h-[180px] flex flex-col justify-between"
                    >
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-gold-500/10 blur-[60px] opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none"></div>

                        <div className="flex justify-between items-start z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-dark-700 text-gold-400 border border-dark-600 group-hover:bg-gold-500/20 transition-colors">
                                        <Building2 size={16} className="drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
                                    </div>
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Saldo Total</h3>
                                </div>
                                <p className="text-2xl font-bold text-white tracking-tight group-hover:text-gold-400 transition-colors">{formatCurrency(metrics.balance)}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${metrics.balance >= 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {metrics.balance >= 0 ? '+' : ''}{metrics.profitMargin.toFixed(1)}%
                            </span>
                        </div>

                        <div className="mt-2 text-xs flex justify-between items-center text-gray-500 border-t border-dark-700/50 pt-3">
                            <span>Previsto: {formatCurrency(metrics.totalProjected)}</span>
                            <span className="text-[10px] text-gold-500 uppercase font-bold tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">Duplo Clique</span>
                        </div>
                    </article>

                    {/* Card 2: Receita (With Goal) */}
                    <article className="bg-dark-800 p-5 rounded-xl border border-dark-600 corner-accent shadow-glow-card group hover:border-green-500/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden min-h-[180px] flex flex-col justify-between">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 blur-[60px] opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none"></div>

                        <div className="flex justify-between items-start z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-dark-700 text-green-400 border border-dark-600 group-hover:bg-green-500/20 transition-colors">
                                        <Wallet size={16} className="drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                                    </div>
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Receita Realizada</h3>
                                    <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded border ${metrics.comparisons.revenue >= 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        {metrics.comparisons.revenue > 0 ? '+' : ''}{metrics.comparisons.revenue.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold text-white tracking-tight group-hover:text-green-400 transition-colors">{formatCurrency(metrics.revenueRealized)}</span>
                                    <span className="text-xs text-zinc-500 font-medium">Meta: {formatCurrency(metrics.goals.revenue)}</span>
                                </div>
                            </div>
                            {/* Embedded Chart */}
                            <div className="w-24 h-24 -mr-2 -mt-2">
                                <SemiDonutChart type="revenue" value={metrics.revenueRealized} target={metrics.goals.revenue} label="" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-dark-700/50 pt-3 mt-2">
                            <div className="text-gray-500">Previsto: {formatCurrency(metrics.revenueProjected)}</div>
                            <span className={`font-mono ${metrics.revenueRealized - metrics.goals.revenue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {metrics.revenueRealized - metrics.goals.revenue > 0 ? '+' : ''}{formatCurrency(metrics.revenueRealized - metrics.goals.revenue)}
                            </span>
                        </div>
                    </article>

                    {/* Card 3: Despesas (With Goal) */}
                    <article className="bg-dark-800 p-5 rounded-xl border border-dark-600 corner-accent shadow-glow-card group hover:border-red-500/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden min-h-[180px] flex flex-col justify-between">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/10 blur-[60px] opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none"></div>

                        <div className="flex justify-between items-start z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-dark-700 text-red-400 border border-dark-600 group-hover:bg-red-500/20 transition-colors">
                                        <PiggyBank size={16} className="drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                                    </div>
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Despesas Realizadas</h3>
                                    <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded border ${metrics.comparisons.expense <= 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        {metrics.comparisons.expense > 0 ? '+' : ''}{metrics.comparisons.expense.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold text-white tracking-tight group-hover:text-red-400 transition-colors">{formatCurrency(metrics.expenseRealized)}</span>
                                    <span className="text-xs text-zinc-500 font-medium">Meta: {formatCurrency(metrics.goals.expense)}</span>
                                </div>
                            </div>
                            {/* Embedded Chart */}
                            <div className="w-24 h-24 -mr-2 -mt-2">
                                <SemiDonutChart type="expense" value={metrics.expenseRealized} target={metrics.goals.expense} label="" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-dark-700/50 pt-3 mt-2">
                            <div className="text-gray-500">Previsto: {formatCurrency(metrics.expenseProjected)}</div>
                            <span className={`font-mono ${metrics.goals.expense - metrics.expenseRealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {metrics.expenseRealized - metrics.goals.expense > 0 ? '+' : ''}{formatCurrency(metrics.expenseRealized - metrics.goals.expense)}
                            </span>
                        </div>
                    </article>

                    {/* Card 4: Lucro (With Goal) */}
                    <article className="bg-dark-800 p-5 rounded-xl border border-dark-600 corner-accent shadow-glow-card group hover:border-gold-500/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden min-h-[180px] flex flex-col justify-between">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 blur-[60px] opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none"></div>

                        <div className="flex justify-between items-start z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg bg-dark-700 text-gold-400 border border-dark-600 group-hover:bg-gold-500/20 transition-colors">
                                        <TrendingUp size={16} className="drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
                                    </div>
                                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Resultado Líquido</h3>
                                    <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded border ${metrics.comparisons.profit >= 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        {metrics.comparisons.profit > 0 ? '+' : ''}{metrics.comparisons.profit.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold text-white tracking-tight group-hover:text-gold-400 transition-colors">{formatCurrency(metrics.netProfit)}</span>
                                    <span className="text-xs text-zinc-500 font-medium">Meta: {formatCurrency(metrics.goals.profit)}</span>
                                </div>
                            </div>
                            {/* Embedded Chart */}
                            <div className="w-24 h-24 -mr-2 -mt-2">
                                <SemiDonutChart type="profit" value={metrics.netProfit} target={metrics.goals.profit} label="" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-dark-700/50 pt-3 mt-2">
                            <div className="text-gray-500">Previsto: {formatCurrency(metrics.profitProjected)}</div>
                            <span className={`font-mono ${metrics.netProfit - metrics.goals.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {metrics.netProfit - metrics.goals.profit > 0 ? '+' : ''}{formatCurrency(metrics.netProfit - metrics.goals.profit)}
                            </span>
                        </div>

                    </article>

                    {/* Card 5 (Strategic): Safe Withdrawal */}
                    <SafeWithdrawalCard
                        balance={metrics.totalProjected}
                        workingCapital={metrics.workingCapital}
                        safeWithdrawal={metrics.safeWithdrawal}
                        capitalDeficit={metrics.capitalDeficit}
                    />
                </section>

                {/* Middle Section: Chart & Cushion */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-enter delay-200">
                    <div className="lg:col-span-2 bg-dark-800 rounded-xl border border-dark-600 p-6 shadow-glow-card flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <TrendingUp size={20} className="text-gold-400" />
                                    Fluxo de Caixa Livre
                                </h2>
                                <p className="text-sm text-gray-400">Comparativo Realizado vs Previsto</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right bg-dark-700/50 px-4 py-2 rounded-lg border border-dark-600">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Realizado</p>
                                    <p className={`text-lg font-bold ${metrics.fclRealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatMoney(metrics.fclRealized)}</p>
                                </div>
                                <div className="text-right bg-dark-700/50 px-4 py-2 rounded-lg border border-dark-600">
                                    <p className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Previsto</p>
                                    <p className="text-lg font-bold text-gold-100 opacity-80">{formatMoney(metrics.fclProjected)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#737373" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#737373" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                    <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => val.substring(8, 10)} minTickGap={30} />
                                    <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(18, 18, 18, 0.95)', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
                                        labelFormatter={(label) => `Data: ${new Date(label).toLocaleDateString()}`}
                                        formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR')}`, name]}
                                        cursor={{ stroke: '#D4AF37', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    {/* Projected Line (Behind) */}
                                    <Area
                                        type="monotone"
                                        dataKey="projected"
                                        stroke="#737373"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        fill="url(#colorProjected)"
                                        name="Previsto"
                                    />
                                    {/* Realized Line (Front) */}
                                    <Area
                                        type="monotone"
                                        dataKey="realized"
                                        stroke="#D4AF37"
                                        strokeWidth={3}
                                        fill="url(#colorRealized)"
                                        name="Realizado"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Financial Cushion Analysis */}
                    <div className="bg-dark-800 rounded-xl border border-dark-600 p-6 shadow-glow-card flex flex-col justify-between relative overflow-hidden group">
                        {/* Background Decoration */}
                        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-20 ${cushionStatus === 'safe' ? 'bg-green-500' : 'bg-red-500'}`}></div>

                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                {cushionStatus === 'safe' ? <ShieldCheck className="text-green-400" size={24} /> : <AlertTriangle className="text-red-400" size={24} />}
                                <h2 className="text-lg font-bold text-white">Análise de Colchão</h2>
                            </div>

                            <p className="text-sm text-gray-400 mb-6">
                                Comparativo entre seu Saldo Atual e a necessidade de Capital de Giro cadastrada.
                            </p>

                            <div className="space-y-6">
                                {/* Current Balance */}
                                <div>
                                    <div className="flex justify-between text-xs uppercase tracking-wider text-gray-500 mb-1">
                                        <span>Saldo Disponível</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{formatMoney(metrics.balance)}</div>
                                </div>

                                {/* Working Capital Target */}
                                <div>
                                    <div className="flex justify-between text-xs uppercase tracking-wider text-gray-500 mb-1">
                                        <span>Capital de Giro Necessário</span>
                                    </div>
                                    <div className="text-xl font-semibold text-gray-400">{formatMoney(metrics.workingCapital)}</div>
                                </div>

                                {/* Progress Bar / Indicator */}
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className={cushionStatus === 'safe' ? 'text-green-400' : 'text-red-400'}>
                                            {cushionStatus === 'safe' ? 'Cobertura Saudável' : 'Abaixo do Ideal'}
                                        </span>
                                        <span className="text-white font-bold">{cushionPercent.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-dark-700 h-3 rounded-full overflow-hidden relative">
                                        {/* Target Line marker */}
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10" style={{ left: `${Math.min((metrics.workingCapital / Math.max(metrics.balance, metrics.workingCapital)) * 100, 100)}%` }}></div>

                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${cushionStatus === 'safe' ? 'bg-green-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(cushionPercent, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-dark-600/50">
                            <span className="text-xs text-gray-500 uppercase">Margem de Segurança</span>
                            <div className={`text-2xl font-bold ${cushionStatus === 'safe' ? 'text-green-400' : 'text-red-400'}`}>
                                {formatMoney(metrics.financialCushion)}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {cushionStatus === 'safe'
                                    ? 'Você tem saldo acima do capital de giro necessário.'
                                    : 'Atenção: Seu saldo está abaixo do capital de giro recomendado.'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Bottom Section: Analysis */}
                <section className="space-y-6 animate-enter delay-300">
                    <h2 className="text-xl font-bold text-white">Análise de Despesas e Transações</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Expense Categories (Interactive) */}
                        <div className="bg-dark-800 rounded-xl border border-dark-600 p-6 lg:col-span-1 shadow-glow-card">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Por Categoria (Top 5)</h3>
                                {selectedCategoryId && (
                                    <button onClick={() => setSelectedCategoryId(null)} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                                        <X size={12} /> Limpar Filtro
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {topExpenses.map((ex, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedCategoryId(selectedCategoryId === ex.id ? null : ex.id)}
                                        className={`group/cat cursor-pointer p-2 rounded-lg transition-all ${selectedCategoryId === ex.id ? 'bg-gold-500/10 border border-gold-500/30' : 'hover:bg-dark-700 border border-transparent'}`}
                                    >
                                        <div className="flex justify-between mb-2">
                                            <span className={`text-sm font-medium truncate w-32 ${selectedCategoryId === ex.id ? 'text-gold-400' : 'text-white'}`}>{ex.name}</span>
                                            <span className="text-sm font-bold text-gold-400">{ex.percent.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-dark-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400 shadow-[0_0_8px_rgba(230,184,0,0.6)]" style={{ width: `${ex.percent}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                                {topExpenses.length === 0 && <p className="text-sm text-gray-500">Sem dados de despesa.</p>}
                            </div>
                        </div>

                        {/* Transactions List (Filtered & Interactive) */}
                        <div className="bg-dark-800 rounded-xl border border-dark-600 p-6 lg:col-span-2 shadow-glow-card overflow-hidden">
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                                {selectedCategoryId ? 'Transações Filtradas' : 'Transações Recentes'}
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs text-gray-500 border-b border-dark-600">
                                            <th className="py-3 pl-2 font-medium uppercase">Descrição</th>
                                            <th className="py-3 px-2 font-medium uppercase">Categoria</th>
                                            <th className="py-3 px-2 font-medium uppercase">Data</th>
                                            <th className="py-3 px-2 font-medium uppercase">Status</th>
                                            <th className="py-3 pr-2 font-medium uppercase text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {filteredTransactions.map(tx => (
                                            <tr
                                                key={tx.id}
                                                onDoubleClick={() => navigate(`/transactions?highlight=${tx.id}`)}
                                                className="group hover:bg-dark-700/50 transition-colors border-b border-dark-700/50 last:border-0 cursor-pointer select-none"
                                                title="Duplo clique para abrir"
                                            >
                                                <td className="py-4 pl-2 font-medium text-white group-hover:text-gold-200">{tx.description}</td>
                                                <td className="py-4 px-2 text-gray-400">{tx.category}</td>
                                                <td className="py-4 px-2 text-gray-400">{new Date(tx.date).toLocaleDateString()}</td>
                                                <td className="py-4 px-2">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'reconciled' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                                        {tx.status === 'reconciled' ? 'Pago' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className={`py-4 pr-2 text-right font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                                                    {tx.type === 'expense' ? '-' : '+'} {formatCurrency(Math.abs(tx.amount))}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredTransactions.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">Nenhuma transação encontrada.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-8"></div>
            </div >

            {/* Bank Breakdown Modal */}
            {
                showBankModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowBankModal(false)}>
                        <div className="bg-dark-800 border border-gold-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowBankModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
                            <h2 className="text-xl font-bold text-white mb-4">Detalhamento de Saldos</h2>
                            <p className="text-sm text-gray-400 mb-6">Saldo atual consolidado por conta bancária.</p>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {Object.entries(metrics.bankBalances).map(([id, bank]: [string, any]) => (
                                    <div key={id} className="flex justify-between items-center p-3 rounded-lg bg-dark-700/50 border border-dark-600">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bank.color }}></div>
                                            <span className="font-medium text-white">{bank.name}</span>
                                        </div>
                                        <span className="font-bold text-white">{formatCurrency(bank.current)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t border-dark-600 flex justify-between items-center">
                                <span className="text-gray-400">Total Consolidado</span>
                                <span className="text-xl font-bold text-gold-400">{formatCurrency(metrics.balance)}</span>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
