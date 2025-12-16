import { useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';

export interface DashboardMetrics {
    totalCurrent: number;
    totalProjected: number;
    revenueRealized: number;
    revenueProjected: number;
    expenseRealized: number;
    expenseProjected: number;
    profitRealized: number;
    profitProjected: number;
    revenueByCategory: Record<string, number>;
    expenseByCategory: Record<string, number>;
    prevMonthExpenses: number;
    prevMonthExpensesByCategory: Record<string, number>;
    goals: {
        revenue: number;
        expense: number;
        profit: number;
    };
    history: { date: string; balance: number; revenue: number; expense: number }[];
    // Aliases / Computed for new UI
    balance: number;
    netProfit: number;
    profitMargin: number;
    expenseExpected: number;
    workingCapital: number;
    financialCushion: number;
}

export function useDashboardMetrics(dateRange: { start: string; end: string }) {
    const { transactions, bankAccounts, planningData, categories, companySettings } = useTransactions();

    if (!dateRange || !dateRange.end) {
        return { isLoading: true, metrics: null };
    }

    const currentMonthKey = dateRange.end.slice(0, 7); // YYYY-MM

    // Calculate Previous Month Key
    const previousMonthKey = useMemo(() => {
        const [year, month] = currentMonthKey.split('-').map(Number);
        const date = new Date(year, month - 2); // month is 1-indexed, so -1 is current index, -2 is prev month index
        return date.toISOString().slice(0, 7);
    }, [currentMonthKey]);

    // --- FINANCIAL CALCULATIONS ---
    const financials = useMemo(() => {
        const bankBalances: Record<string, { current: number; projected: number; name: string; color: string }> = {};

        let totalCurrent = 0;
        let totalProjected = 0; // Means "Expected Balance at End of Month"

        // 1. Initialize Banks with Initial Balances
        bankAccounts.forEach((bank) => {
            const initial = bank.initialBalance || 0;
            bankBalances[bank.id] = {
                current: initial,
                projected: initial,
                name: bank.name,
                color: bank.color || 'zinc',
            };
            totalCurrent += initial;
            totalProjected += initial;
        });

        // 2. Process Transactions
        let revenueRealized = 0;
        let revenueProjected = 0;
        let expenseRealized = 0;
        let expenseProjected = 0;
        let fclRealized = 0; // Formula: Revenue Realized - Expense Realized
        let fclProjected = 0; // Formula: Revenue Projected - Expense Projected

        const revenueByCategory: Record<string, number> = {};
        const expenseByCategory: Record<string, number> = {};

        let prevMonthExpenses = 0;
        const prevMonthExpensesByCategory: Record<string, number> = {};

        transactions.forEach((tx) => {
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
                    prevMonthExpensesByCategory[tx.categoryId] =
                        (prevMonthExpensesByCategory[tx.categoryId] || 0) + Math.abs(tx.amount);
                }
            }
        });

        // --- D. Daily History for Sparklines (Last 30 days or current view) ---
        // We will generate a daily series for the selected dateRange to power sparklines/charts
        const dayMap = new Map<string, { date: string; balance: number; revenue: number; expense: number }>();

        const startDt = new Date(dateRange.start);
        const endDt = new Date(dateRange.end);

        // Initialize days
        for (let d = new Date(startDt); d <= endDt; d.setDate(d.getDate() + 1)) {
            dayMap.set(d.toISOString().slice(0, 10), {
                date: d.toISOString().slice(0, 10),
                balance: 0,
                revenue: 0,
                expense: 0
            });
        }

        // Populate Daily Flows
        transactions.forEach(tx => {
            const d = tx.paymentDate || tx.dueDate || tx.date;
            if (dayMap.has(d)) {
                const entry = dayMap.get(d)!;
                if (tx.type === 'income') entry.revenue += (tx.amount); // Assume amount is positive for income in logic, or abs it
                else if (tx.type === 'expense') entry.expense += (tx.amount);
            }
        });

        // 1. Calculate Initial Balances before start date
        const initialBanks = bankAccounts.reduce((acc, b) => acc + (b.initialBalance || 0), 0);

        // Filter pre-period transactions
        const preTransactions = transactions.filter(tx => {
            const d = tx.paymentDate || tx.dueDate || tx.date;
            return d < dateRange.start;
        });

        // Calculate Initial Realized (only reconciled) and Initial Projected (all)
        // Note: Initial Projected includes everything up to start date.

        let preBalanceRealized = initialBanks; // Assuming initial bank balance is realized
        let preBalanceProjected = initialBanks;

        preTransactions.forEach(tx => {
            const val = tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount);

            // Projected always includes the tx (assuming valid status)
            if (tx.status !== 'voided') { // If we had voided status
                preBalanceProjected += val;
            }

            // Realized only if reconciled
            if (tx.status === 'reconciled') {
                preBalanceRealized += val;
            }
        });

        // 2. Accumulate Daily Balances
        let runningRealized = preBalanceRealized;
        let runningProjected = preBalanceProjected;

        const history = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)).map(day => {
            // We need to re-scan transactions for this day to separate realized/projected flow
            // The `dayMap` aggregated total revenue/expense, but didn't split by status.
            // Optimization: We could have split in the dayMap population step. 
            // Let's do a quick filter here or optimize dayMap in future. 
            // For now, let's re-iterate or Refactor Step D to be more robust.

            // Refactored Step D Logic inline here for correctness:
            const dayTxs = transactions.filter(tx => {
                const d = tx.paymentDate || tx.dueDate || tx.date;
                return d === day.date;
            });

            let dayNetRealized = 0;
            let dayNetProjected = 0;

            dayTxs.forEach(tx => {
                const val = tx.type === 'income' ? Math.abs(tx.amount) : -Math.abs(tx.amount);
                if (tx.status === 'reconciled') dayNetRealized += val;
                dayNetProjected += val; // All valid txs count for projected
            });

            runningRealized += dayNetRealized;
            runningProjected += dayNetProjected;

            return {
                ...day,
                balance: runningProjected, // Keep original for compatibility if needed, but UI will use specific fields
                balanceRealized: runningRealized,
                balanceProjected: runningProjected
            };
        });

        // 3. Derived Metrics
        const profitRealized = revenueRealized - expenseRealized;
        const profitProjected = revenueProjected - expenseProjected;
        const profitMargin = revenueRealized > 0 ? (profitRealized / revenueRealized) * 100 : 0;

        // 4. Working Capital Analysis
        const workingCapital = companySettings?.capitalGiroNecessario || 0;
        const financialCushion = totalCurrent - workingCapital;

        return {
            bankBalances,
            totalCurrent,
            totalProjected,
            revenueRealized,
            revenueProjected,
            expenseRealized,
            expenseProjected,
            profitRealized,
            profitProjected,
            fclRealized,
            fclProjected,
            revenueByCategory,
            expenseByCategory,
            prevMonthExpenses,
            prevMonthExpensesByCategory,
            history,
            // New Aliased Fields
            balance: totalCurrent,
            netProfit: profitRealized,
            profitMargin,
            expenseExpected: expenseProjected,
            workingCapital,
            financialCushion
        };
    }, [transactions, bankAccounts, currentMonthKey, previousMonthKey, dateRange, companySettings]); // Added companySettings dep

    // Goals from Planning
    const goals = useMemo(() => {
        const plan = planningData.find((p) => p.month === currentMonthKey);
        // If no plan, return 0 to indicate not set. The UI handles 0 specially.
        return {
            revenue: plan?.revenueGoal || 0,
            expense: plan?.expenseGoal || 0,
            profit: plan?.profitGoal || (plan?.revenueGoal || 0) - (plan?.expenseGoal || 0) || 0,
        };
    }, [planningData, currentMonthKey]);

    const metrics: DashboardMetrics = {
        ...financials,
        goals,
    };

    return { isLoading: false, metrics, categories, transactions, currentMonthKey };
}
