import React, { useMemo } from 'react';
import { ChartCard } from './ChartCard';
import { useTransactions } from '../../context/TransactionContext';
import { useNavigate } from 'react-router-dom';

export const OfficialDashboard: React.FC<{
    dateRange: { start: string, end: string };
    onViewBankTransactions?: (bankId: string) => void;
}> = ({ dateRange, onViewBankTransactions }) => {

    const { transactions, bankAccounts, planningData, categories, companySettings, bankStatementLines } = useTransactions();
    const navigate = useNavigate();

    if (!dateRange || !dateRange.end) return null;

    const currentMonthKey = dateRange.end.slice(0, 7); // YYYY-MM

    // Calculate Previous Month Key
    const previousMonthKey = useMemo(() => {
        const [year, month] = currentMonthKey.split('-').map(Number);
        const date = new Date(year, month - 2); // month is 1-indexed, so -1 is current index, -2 is prev month index
        return date.toISOString().slice(0, 7);
    }, [currentMonthKey]);

    // --- FINANCIAL CALCULATIONS ---
    const financials = useMemo(() => {
        const bankBalances: Record<string, { current: number, projected: number, name: string, color: string }> = {};

        let totalCurrent = 0;
        let totalProjected = 0; // Means "Expected Balance at End of Month"

        // 1. Initialize Banks with Initial Balances
        bankAccounts.forEach(bank => {
            const initial = bank.initialBalance || 0;
            bankBalances[bank.id] = {
                current: initial,
                projected: initial,
                name: bank.name,
                color: bank.color || 'zinc'
            };
            totalCurrent += initial;
            totalProjected += initial;
        });

        // 2. Process Transactions
        let revenueRealized = 0;
        let revenueProjected = 0;
        let expenseRealized = 0;
        let expenseProjected = 0;
        let fclRealized = 0;   // Formula: Revenue Realized - Expense Realized
        let fclProjected = 0;  // Formula: Revenue Projected - Expense Projected

        const revenueByCategory: Record<string, number> = {};
        const expenseByCategory: Record<string, number> = {};

        let prevMonthExpenses = 0;
        const prevMonthExpensesByCategory: Record<string, number> = {};

        transactions.forEach(tx => {
            const refDate = tx.paymentDate || tx.dueDate || tx.date;
            const isReconciled = tx.status === 'reconciled';

            // --- A. Bank Balance Updates (All Time) ---
            // If it's a bank transaction, update balances
            if (tx.bankAccountId && bankBalances[tx.bankAccountId]) {
                const valSigned = tx.type === 'expense' ? -tx.amount : tx.type === 'income' ? tx.amount : 0;

                if (isReconciled) {
                    bankBalances[tx.bankAccountId].current += valSigned;
                    bankBalances[tx.bankAccountId].projected += valSigned; // Projected includes everything realized too
                    totalCurrent += valSigned;
                    totalProjected += valSigned;
                } else if (tx.status === 'pending') {
                    // Pending transactions affect projected balance
                    bankBalances[tx.bankAccountId].projected += valSigned;
                    totalProjected += valSigned;
                }
            }

            // --- B. Period Metrics (Current Month Only) ---
            if (refDate && refDate.startsWith(currentMonthKey)) {
                const amount = Math.abs(tx.amount);

                if (tx.type === 'income') {
                    if (isReconciled) {
                        revenueRealized += amount;
                        fclRealized += amount;
                        revenueByCategory[tx.categoryId] = (revenueByCategory[tx.categoryId] || 0) + amount;
                    }
                    revenueProjected += amount;
                    fclProjected += amount;

                } else if (tx.type === 'expense') {
                    if (isReconciled) {
                        expenseRealized += amount;
                        fclRealized -= amount;
                    }
                    expenseByCategory[tx.categoryId] = (expenseByCategory[tx.categoryId] || 0) + amount;
                    expenseProjected += amount;
                    fclProjected -= amount;
                }
            }

            // --- C. Previous Month Metrics ---
            if (refDate && refDate.startsWith(previousMonthKey)) {
                if (tx.type === 'expense' && isReconciled) {
                    prevMonthExpenses += Math.abs(tx.amount);
                    prevMonthExpensesByCategory[tx.categoryId] = (prevMonthExpensesByCategory[tx.categoryId] || 0) + Math.abs(tx.amount);
                }
            }
        });

        // 3. Derived Metrics
        const profitRealized = revenueRealized - expenseRealized;
        const profitProjected = revenueProjected - expenseProjected;

        // Variation = Projected - Realized (Standard formula requested)
        const revenueVariation = revenueProjected - revenueRealized;
        const expenseVariation = expenseProjected - expenseRealized;
        const profitVariation = profitProjected - profitRealized;

        // Bank Totals Variations
        const totalVariation = totalProjected - totalCurrent;

        return {
            bankBalances,
            totalCurrent,
            totalProjected,
            totalVariation,
            revenueRealized,
            revenueProjected,
            revenueVariation,
            expenseRealized,
            expenseProjected,
            expenseVariation,
            profitRealized,
            profitProjected,
            profitVariation,
            fclRealized,
            fclProjected,
            revenueByCategory,
            expenseByCategory,
            prevMonthExpenses,
            prevMonthExpensesByCategory
        };
    }, [transactions, bankAccounts, currentMonthKey, previousMonthKey]);

    // Goals from Planning
    const goals = useMemo(() => {
        const plan = planningData.find(p => p.month === currentMonthKey);
        return {
            revenue: plan?.revenueGoal || 1, // Avoid div/0
            expense: plan?.expenseGoal || 1,
            profit: plan?.profitGoal || ((plan?.revenueGoal || 0) - (plan?.expenseGoal || 0)) || 1
        };
    }, [planningData, currentMonthKey]);

    // Helper for Category Names
    const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Outros';

    // --- TIME HELPERS ---
    const getBusinessDays = (dateString: string) => {
        const [year, month] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0).getDate();
        let workDays = 0;
        let passedWorkDays = 0;
        const now = new Date();
        const isCurrentMonth = now.getFullYear() === year && now.getMonth() === (month - 1);
        const today = now.getDate();

        for (let i = 1; i <= lastDay; i++) {
            const current = new Date(year, month - 1, i);
            const day = current.getDay();
            if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
                workDays++;
                if (isCurrentMonth && i <= today) {
                    passedWorkDays++;
                }
            }
        }
        // If past month, passed = total
        if (now > new Date(year, month, 0)) passedWorkDays = workDays;

        return { total: workDays, passed: passedWorkDays };
    };

    const businessDays = useMemo(() => getBusinessDays(currentMonthKey), [currentMonthKey]);

    // --- PERFORMANCE METRICS ---
    const performance = useMemo(() => {
        // 1. REVENUE PACE
        const revenueGoal = goals.revenue;
        const revenueIdealPace = businessDays.total > 0 ? revenueGoal / businessDays.total : 0;
        const revenueCurrentPace = businessDays.passed > 0 ? financials.revenueRealized / businessDays.passed : 0;
        const revenuePaceDiff = revenueCurrentPace - revenueIdealPace;
        // Status: Green (>= ideal), Yellow (> 80% ideal), Red (< 80%)
        const revenueStatus = revenueCurrentPace >= revenueIdealPace ? 'success'
            : revenueCurrentPace >= (revenueIdealPace * 0.8) ? 'warning'
                : 'danger';

        // 2. EXPENSE BUDGET
        const expenseGoal = goals.expense; // Budget
        const expenseRemaining = Math.max(0, expenseGoal - financials.expenseRealized);
        const expensePercent = expenseGoal > 0 ? (financials.expenseRealized / expenseGoal) * 100 : 0;
        // Status: Green (< 60%), Yellow (60-80%), Red (> 80%)
        const expenseStatus = expensePercent <= 60 ? 'success'
            : expensePercent <= 80 ? 'warning'
                : 'danger';

        // 3. PROFIT DISTANCE
        const profitGoal = goals.profit;
        const profitShortfall = Math.max(0, profitGoal - financials.profitRealized);
        const profitProjected = financials.profitProjected;
        // Status: Green (Projected >= Goal), Yellow (Projected >= 90% Goal), Red (Projected < 90%)
        const profitStatus = profitProjected >= profitGoal ? 'success'
            : profitProjected >= (profitGoal * 0.9) ? 'warning'
                : 'danger';

        return {
            revenue: { idealPace: revenueIdealPace, currentPace: revenueCurrentPace, status: revenueStatus },
            expense: { remaining: expenseRemaining, percent: expensePercent, status: expenseStatus },
            profit: { shortfall: profitShortfall, projected: profitProjected, status: profitStatus }
        };
    }, [financials, goals, businessDays]);

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20">

            {/* --- HEADER --- */}
            <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                    Visão Geral
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">Acompanhe os indicadores financeiros da sua empresa.</p>
            </div>

            {/* ================================================================================= */}
            {/* BLOCO 1: CAIXA & CAPITAL (3 CARDS FIXOS) */}
            {/* ================================================================================= */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                    Caixa & Bancos
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 1. SALDO TOTAL */}
                    <ChartCard
                        cardId="caixa_atual_card"
                        config={{
                            customTitle: 'Saldo Total',
                            hideTitle: false,
                            style: { textColor: '#FFFFFF' }
                        }}
                        data={{
                            value: financials.totalCurrent,
                            projectedValue: financials.totalProjected,
                            subtext: 'Saldo consolidado (Atual + Previsto)',
                            // Use status for color logic in renderer if needed, or pass explicit classes
                            isPositive: financials.totalCurrent >= 0
                        }}
                        className={`shadow-lg border-0 ${financials.totalCurrent >= 0
                            ? 'bg-gradient-to-br from-emerald-600 to-emerald-800'
                            : 'bg-gradient-to-br from-red-700 to-rose-900'
                            }`}
                    />



                    {/* 3. CAPITAL DE GIRO */}
                    {(() => {
                        const target = companySettings?.capitalGiroNecessario || 0;
                        const current = financials.totalCurrent;
                        const shortfall = Math.max(target - current, 0);
                        const freeCash = Math.max(current - target, 0);
                        const potentialProfit = freeCash + financials.profitProjected; // Approximation

                        return (
                            <ChartCard
                                cardId="saude_caixa_card"
                                config={{
                                    customTitle: 'Capital de Giro',
                                    style: { enableGradient: false }
                                }}
                                data={{
                                    target,
                                    current,
                                    shortfall,
                                    freeCash,
                                    potentialProfit,
                                    // Pass explicit status
                                    status: current >= target ? 'success' : 'danger'
                                }}
                                className="min-h-[250px] shadow-lg bg-white dark:bg-zinc-900 ring-1 ring-zinc-100 dark:ring-zinc-800"
                            />
                        );
                    })()}
                </div>

                {/* LISTA DE BANCOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {bankAccounts.map(bank => {
                        const bData = financials.bankBalances[bank.id];
                        // Status logic: Green > 0, Red < 0
                        const statusColor = bData.current >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';

                        // Count unreconciled lines
                        const pendingCount = bankStatementLines.filter(l =>
                            (l.bankAccountId === bank.id) && !l.isReconciled
                        ).length;

                        return (
                            <ChartCard
                                key={bank.id}
                                cardId={`bank_single_card__inst_${bank.id}`}
                                config={{ hideTitle: true }}
                                data={{
                                    name: bank.name,
                                    currentBalance: bData.current,
                                    predictedBalance: bData.projected,
                                    color: bank.color, // Bank brand color
                                    statusColor, // For text
                                    unreconciledCount: pendingCount
                                }}
                                className="cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all bg-white dark:bg-zinc-900 shadow-sm"
                                onClick={() => onViewBankTransactions?.(bank.id)}
                            />
                        );
                    })}
                </div>
            </section>

            {/* ================================================================================= */}
            {/* BLOCO 2: PERFORMANCE MENSAL (Recriado) */}
            {/* ================================================================================= */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-6 bg-pink-500 rounded-full"></span>
                    Performance Mensal
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* A. RECEITA (RITMO) */}
                    <ChartCard
                        cardId="receita_meta_gauge"
                        config={{ customTitle: 'Ritmo de Receita', type: 'kpi_gauge', style: { accentColor: '#10b981' } }}
                        data={{
                            value: financials.revenueRealized,
                            target: goals.revenue,
                            details: [
                                { label: 'Meta do Mês', value: goals.revenue },
                                { label: 'Ritmo Ideal', value: performance.revenue.idealPace, isCurrency: true, suffix: '/dia' },
                                {
                                    label: 'Ritmo Atual', value: performance.revenue.currentPace, isCurrency: true, suffix: '/dia',
                                    highlight: performance.revenue.status === 'success' ? 'text-emerald-600' : 'text-rose-600'
                                }
                            ],
                            status: performance.revenue.status
                        }}
                        className="shadow-lg bg-white dark:bg-zinc-900 min-h-[220px]"
                    />

                    {/* B. DESPESA (ORÇAMENTO) */}
                    <ChartCard
                        cardId="despesa_meta_gauge"
                        config={{ customTitle: 'Consumo do Orçamento', type: 'kpi_gauge', style: { accentColor: '#ef4444' } }}
                        data={{
                            value: financials.expenseRealized,
                            target: goals.expense,
                            details: [
                                { label: 'Orçamento', value: goals.expense },
                                { label: 'Consumido', value: performance.expense.percent, isPercent: true },
                                { label: 'Restante', value: performance.expense.remaining, isCurrency: true }
                            ],
                            status: performance.expense.status,
                            inverse: true // Higher expense percent is bad (or good depending on view, here Consumption: Green < 60%)
                        }}
                        className="shadow-lg bg-white dark:bg-zinc-900 min-h-[220px]"
                    />

                    {/* C. LUCRO (DISTÂNCIA) */}
                    <ChartCard
                        cardId="lucro_meta_gauge"
                        config={{ customTitle: 'Distância da Meta', type: 'kpi_gauge', style: { accentColor: '#8b5cf6' } }}
                        data={{
                            value: financials.profitRealized,
                            target: goals.profit,
                            details: [
                                { label: 'Falta p/ Meta', value: performance.profit.shortfall, isCurrency: true },
                                {
                                    label: 'Projeção', value: performance.profit.projected, isCurrency: true,
                                    highlight: performance.profit.status === 'success' ? 'text-emerald-600' : 'text-rose-600'
                                }
                            ],
                            status: performance.profit.status
                        }}
                        className="shadow-lg bg-white dark:bg-zinc-900 min-h-[220px]"
                    />

                </div>
            </section>

            {/* ================================================================================= */}
            {/* BLOCO 3: FLUXO DE CAIXA LIVRE (FCL) */}
            {/* ================================================================================= */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Fluxo de Caixa Livre
                </h2>

                <div className="grid grid-cols-1 gap-6">
                    <ChartCard
                        cardId="fcl_card"
                        config={{ customTitle: "Fluxo de Caixa Livre (FCL)" }}
                        data={{
                            value: financials.fclRealized,
                            projectedValue: financials.fclProjected,
                            diff: financials.fclProjected - financials.fclRealized,
                            trend: financials.fclRealized > 0 ? 'up' : 'down',
                            subtext: 'Indicador de liquidez operacional'
                        }}
                        className="shadow-lg bg-white dark:bg-zinc-900"
                    />
                </div>
            </section>

            {/* ================================================================================= */}
            {/* BLOCO 4: ANÁLISE DE DESPESAS */}
            {/* ================================================================================= */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                    Análise de Despesas
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* COLUNA 1 & 2: GRÁFICO DE BARRAS (Categorias) */}
                    <div className="lg:col-span-2">
                        {/* Expense Category Chart - Always Render */}
                        {/* Expense Category Chart - Direct Transaction Link */}
                        {(() => {
                            // DIRECT CALCULATION FROM TRANSACTIONS
                            // This ensures we bypass any shared logic that might be failing
                            // and gives us raw, unfiltered truth from the database.

                            const categoryTotals: Record<string, number> = {};
                            let totalExpensesInMonth = 0;

                            transactions.forEach(tx => {
                                // 1. Filter Type
                                if (tx.type !== 'expense') return;

                                // 2. Filter Date (Competency/Cash view matching dashboard standard)
                                const refDate = tx.paymentDate || tx.dueDate || tx.date;
                                if (!refDate || !refDate.startsWith(currentMonthKey)) return;

                                // 3. Accumulate
                                const val = Math.abs(tx.amount);
                                categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + val;
                                totalExpensesInMonth += val;
                            });

                            const expenseData = Object.entries(categoryTotals)
                                .sort(([, a], [, b]) => b - a)
                                .map(([id, val]) => ({
                                    name: getCatName(id),
                                    value: val,
                                    percent: totalExpensesInMonth > 0 ? (val / totalExpensesInMonth) * 100 : 0
                                }));

                            // New Model: Show Top 5 + Others if too many
                            // Or just show all? Horizontal bars handle scrolling well (or auto-height).
                            // Let's stick to showing all sorted.

                            // If no data, show placeholder
                            const chartData = expenseData.length > 0
                                ? expenseData
                                : [{ name: 'Sem lançamentos', value: 0 }];

                            return (
                                <ChartCard
                                    cardId="despesa_por_categoria_detalhada"
                                    config={{
                                        customTitle: 'Despesas por Categoria (Transações)',
                                        hideTitle: false,
                                        type: 'barra_horizontal'
                                    }}
                                    data={chartData}
                                    className="min-h-[400px] shadow-lg bg-white dark:bg-zinc-900 p-4 rounded-xl"
                                />
                            );
                        })()}
                    </div>

                    {/* COLUNA 3: TEXTO DE ANÁLISE (Insights) */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-zinc-100 dark:border-zinc-800 flex flex-col gap-6">
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 border-b pb-2 border-zinc-100 dark:border-zinc-700">Insights do Mês</h3>

                        {/* 1. COMPARAÇÃO TOTAL */}
                        {(() => {
                            const diff = financials.expenseRealized - financials.prevMonthExpenses;
                            const percentChange = financials.prevMonthExpenses > 0 ? (diff / financials.prevMonthExpenses) * 100 : 0;
                            const isIncrease = diff > 0;

                            return (
                                <div>
                                    <h4 className="text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">1. Comparativo Mensal</h4>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                        Neste mês, suas despesas <span className={isIncrease ? "font-bold text-rose-600" : "font-bold text-emerald-600"}>
                                            {isIncrease ? 'aumentaram' : 'diminuíram'} {Math.abs(percentChange).toFixed(1)}% ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(diff))})
                                        </span> em relação ao mês anterior.
                                        {isIncrease ? ' Atenção aos gastos variáveis.' : ' Ótimo trabalho na contenção de custos!'}
                                    </p>
                                </div>
                            );
                        })()}

                        {/* 2. MAIORES AUMENTOS */}
                        {(() => {
                            // Find category with biggest absolute increase
                            let maxIncreaseId = '';
                            let maxIncreaseVal = 0;

                            Object.entries(financials.expenseByCategory).forEach(([id, currVal]) => {
                                const prevVal = financials.prevMonthExpensesByCategory[id] || 0;
                                const increase = currVal - prevVal;
                                if (increase > maxIncreaseVal) {
                                    maxIncreaseVal = increase;
                                    maxIncreaseId = id;
                                }
                            });

                            if (!maxIncreaseId) return (
                                <div>
                                    <h4 className="text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">2. Ponto de Atenção</h4>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">Nenhuma categoria apresentou aumento significativo este mês.</p>
                                </div>
                            );

                            return (
                                <div>
                                    <h4 className="text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">2. O que pesou mais?</h4>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                        A categoria <strong className="text-zinc-900 dark:text-white">{getCatName(maxIncreaseId)}</strong> teve o maior aumento absoluto de <span className="font-bold text-rose-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(maxIncreaseVal)}</span> comparado ao mês passado.
                                    </p>
                                </div>
                            );
                        })()}

                        {/* 3. SUGESTÃO */}
                        <div>
                            <h4 className="text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">3. Sugestão Prática</h4>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic border-l-2 border-indigo-500 pl-3">
                                "Revise os lançamentos da categoria que mais aumentou para identificar se foram pontuais ou se há uma nova tendência de gasto. Ajuste a meta dessa categoria no Planejamento se necessário."
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ================================================================================= */}
            {/* BLOCO 5: FLUXO DE CAIXA DIÁRIO */}
            {/* ================================================================================= */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Fluxo de Caixa Diário
                </h2>

                <ChartCard
                    cardId="fluxo_caixa_diario"
                    config={{
                        customTitle: `Fluxo de Caixa - ${new Date(currentMonthKey + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
                        hideTitle: false,
                        type: 'linha_area'
                    }}
                    data={(() => {
                        // Get all days in selected month
                        const [year, month] = currentMonthKey.split('-').map(Number);
                        const daysInMonth = new Date(year, month, 0).getDate();
                        const dailyData = [];

                        // Calculate cumulative balance day by day
                        let cumulativeBalance = financials.totalCurrent - financials.totalProjected; // Start with realized balance

                        for (let day = 1; day <= daysInMonth; day++) {
                            const dateStr = `${currentMonthKey}-${String(day).padStart(2, '0')}`;

                            // Get transactions for this day
                            const dayTransactions = transactions.filter(tx => {
                                const txDate = tx.paymentDate || tx.dueDate || tx.date;
                                return txDate === dateStr;
                            });

                            // Calculate day's net flow
                            let dayFlow = 0;
                            dayTransactions.forEach(tx => {
                                if (tx.type === 'income') dayFlow += Math.abs(tx.amount);
                                else if (tx.type === 'expense') dayFlow -= Math.abs(tx.amount);
                            });

                            cumulativeBalance += dayFlow;

                            dailyData.push({
                                name: `${day}`,
                                value: cumulativeBalance,
                                date: dateStr
                            });
                        }

                        return dailyData;
                    })()}
                    className="shadow-lg bg-white dark:bg-zinc-900 min-h-[400px]"
                />
            </section>
        </div >
    );
};
