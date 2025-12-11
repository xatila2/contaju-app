import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Clock, DollarSign, Package, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { Transaction } from '../types';

const MetricCard = ({ label, value, subtext, icon: Icon, color, trend }: any) => {
    const getColorClasses = (colorName: string) => {
        switch (colorName) {
            case 'blue': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            case 'emerald': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
            case 'amber': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
            case 'rose': return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
            default: return 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

    const subtextColor = (colorName: string) => {
        switch (colorName) {
            case 'blue': return 'text-blue-600 dark:text-blue-400';
            case 'emerald': return 'text-emerald-600 dark:text-emerald-400';
            case 'amber': return 'text-amber-600 dark:text-amber-400';
            case 'rose': return 'text-rose-600 dark:text-rose-400';
            default: return 'text-zinc-600 dark:text-zinc-400';
        }
    }

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{label}</p>
                <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{value}</h3>
                <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${subtextColor(color)}`}>
                    {trend === 'up' && <TrendingUp size={12} />}
                    {trend === 'down' && <TrendingDown size={12} />}
                    {trend === 'stable' && <Minus size={12} />}
                    {subtext}
                </p>
            </div>
            <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};

export const WorkingCapital = () => {
    const { transactions } = useTransactions();

    // --- CALCULATION LOGIC ---
    const metrics = useMemo(() => {
        const now = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);

        // Filter relevant transactions (Last 90 days, Reconciled)
        const recentTx = transactions.filter(t =>
            t.status === 'reconciled' &&
            t.paymentDate &&
            t.dueDate >= ninetyDaysAgo.toISOString().split('T')[0]
        );

        // Helper: Calculate Days Difference
        const daysDiff = (start: string, end: string) => {
            const d1 = new Date(start).getTime();
            const d2 = new Date(end).getTime();
            return Math.ceil((d2 - d1) / (1000 * 3600 * 24));
        };

        // 1. DSO (Day Sales Outstanding) - Average Receipt Time
        // Logic: Weighted average of (PaymentDate - LaunchDate) for Income
        let totalIncomeAmount = 0;
        let weightedIncomeDays = 0;

        recentTx.forEach(tx => {
            if (tx.type === 'income' && tx.launchDate && tx.paymentDate) {
                const amount = tx.amount;
                const days = Math.max(0, daysDiff(tx.launchDate, tx.paymentDate));
                weightedIncomeDays += (days * amount);
                totalIncomeAmount += amount;
            }
        });

        const dso = totalIncomeAmount > 0 ? Math.round(weightedIncomeDays / totalIncomeAmount) : 0;

        // 2. DPO (Days Payable Outstanding) - Average Payment Time
        // Logic: Weighted average of (PaymentDate - LaunchDate) for Expense
        let totalExpenseAmount = 0;
        let weightedExpenseDays = 0;

        recentTx.forEach(tx => {
            if (tx.type === 'expense' && tx.launchDate && tx.paymentDate) {
                const amount = Math.abs(tx.amount); // use magnitude
                const days = Math.max(0, daysDiff(tx.launchDate, tx.paymentDate));
                weightedExpenseDays += (days * amount);
                totalExpenseAmount += amount;
            }
        });

        const dpo = totalExpenseAmount > 0 ? Math.round(weightedExpenseDays / totalExpenseAmount) : 0;

        // 3. DIO (Days Inventory Outstanding)
        // Assume 0 for now as we don't track inventory turnover
        const dio = 0;

        // 4. CCC (Cash Conversion Cycle)
        // CCC = DIO + DSO - DPO
        const ccc = dio + dso - dpo;

        return { dso, dpo, dio, ccc };
    }, [transactions]);

    const waterfallData = [
        { name: 'DIO (Estoque)', value: metrics.dio, type: 'add' },
        { name: 'DSO (Recebíveis)', value: metrics.dso, type: 'add' },
        { name: 'DPO (Fornecedores)', value: -metrics.dpo, type: 'subtract' }, // Negative for waterfall logic visual?
        { name: 'CCC (Ciclo)', value: metrics.ccc, type: 'result' },
    ];

    // CCC Status text
    const getCCCStatus = (val: number) => {
        if (val < 0) return { text: "Excelente (Financiado)", color: "text-emerald-600" };
        if (val < 30) return { text: "Bom (Ciclo Curto)", color: "text-blue-600" };
        return { text: "Atenção (Ciclo Longo)", color: "text-amber-600" };
    }

    const status = getCCCStatus(metrics.ccc);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Análise de Capital de Giro</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Eficiência operacional baseada no histórico de 90 dias.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    label="DSO (Prazo Médio Recebimento)"
                    value={`${metrics.dso} dias`}
                    subtext="Tempo da venda até o caixa"
                    icon={DollarSign}
                    color="blue"
                    trend="stable"
                />
                <MetricCard
                    label="DPO (Prazo Médio Pagamento)"
                    value={`${metrics.dpo} dias`}
                    subtext="Tempo da compra até o pagamento"
                    icon={Clock}
                    color="emerald"
                    trend="stable"
                />
                <MetricCard
                    label="DIO (Prazo Médio Estoque)"
                    value={`${metrics.dio} dias`}
                    subtext="Dados não disponíveis (Padrão 0)"
                    icon={Package}
                    color="amber"
                    trend="stable"
                />
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-6">Ciclo de Conversão de Caixa (CCC)</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={waterfallData} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" strokeOpacity={0.2} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46', color: '#fff' }} />
                            <ReferenceLine y={0} stroke="#71717a" />
                            <Bar dataKey="value" barSize={60}>
                                {waterfallData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.type === 'add' ? '#3B82F6' : entry.type === 'subtract' ? '#10B981' : '#CA8A04'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Result Summary */}
                <div className="mt-8 flex flex-col md:flex-row items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <div className="mb-4 md:mb-0">
                        <h4 className="text-zinc-500 dark:text-zinc-400 text-sm uppercase font-bold tracking-wider">Ciclo Resultante (CCC)</h4>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl font-bold text-zinc-900 dark:text-white">{metrics.ccc}</span>
                            <span className="text-xl text-zinc-500 font-medium">dias</span>
                        </div>
                    </div>
                    <div className="md:text-right max-w-md">
                        <p className={`font-bold ${status.color} mb-1`}>{status.text}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {metrics.ccc > 0
                                ? `Você precisa financiar sua operação por ${metrics.ccc} dias. Tente aumentar o prazo com fornecedores (DPO) ou reduzir o prazo de recebimento (DSO).`
                                : `Parabéns! Você recebe dos clientes antes de pagar os fornecedores. Sua operação gera caixa automaticamente.`
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};