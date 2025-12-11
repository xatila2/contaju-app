import { Transaction, Category, BankAccount, CreditCard } from '../types';
import { CardConfig } from '../types';

// Helper types
export interface ChartDataPoint {
    name: string;
    value: number;
    value2?: number; // For comparison or secondary series
    color?: string;
}

export const getPeriodDates = (period: string = '30d') => {
    const end = new Date();
    const start = new Date();

    if (period === '7d') start.setDate(end.getDate() - 7);
    else if (period === '15d') start.setDate(end.getDate() - 15);
    else if (period === '30d') start.setDate(end.getDate() - 30);
    else if (period === '60d') start.setDate(end.getDate() - 60);
    else if (period === '90d') start.setDate(end.getDate() - 90);
    else if (period === '12m') start.setFullYear(end.getFullYear() - 1);

    return { start, end };
};

// --- DATA SELECTORS ---

export const calculateSaldoDisponivel = (accounts: BankAccount[]) => {
    return accounts.reduce((acc, bank) => acc + bank.initialBalance, 0);
    // Note: Should utilize transactions to calculate REAL TIME balance if not already maintained in context state. 
    // Assuming 'initialBalance' is just initial, we need to sum transactions.
    // However, for MVP, we might assume BankAccount holds current balance or we calc it.
    // Let's assume we need to calculate meaningful balance: Initial + Incomes - Expenses (reconciled).
    // EXCEPT: Context might update banks? No, context stores initial. 
    // We need a helper for current balance.
};

export const calculateCurrentBalance = (accounts: BankAccount[], transactions: Transaction[]) => {
    let total = 0;
    accounts.forEach(acc => {
        let bal = acc.initialBalance;
        // This is expensive if we do it every render. Should be memoized in Context.
        // For now, let's just do it.
        const accTx = transactions.filter(t => t.bankAccountId === acc.id && t.status === 'reconciled');
        accTx.forEach(t => {
            if (t.type === 'income') bal += t.amount;
            else if (t.type === 'expense') bal -= t.amount;
        });
        total += bal;
    });
    return total;
};

export const calculatePeriodTotals = (transactions: Transaction[], period: string) => {
    const { start, end } = getPeriodDates(period);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // Filter relevant tx
    const relevant = transactions.filter(t =>
        t.status === 'reconciled' &&
        t.date >= startStr &&
        t.date <= endStr
    );

    // Separate Realized (Reconciled) vs Pending (Projected)
    // Note: The above filter ONLY gets reconciled. We need to fetch ALL first.

    const allRelevant = transactions.filter(t =>
        t.date >= startStr &&
        t.date <= endStr
    );

    const realizedTx = allRelevant.filter(t => t.status === 'reconciled');
    const pendingTx = allRelevant.filter(t => t.status === 'pending');

    const incomeRealized = realizedTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenseRealized = realizedTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const incomePending = pendingTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expensePending = pendingTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
        income: { realized: incomeRealized, pending: incomePending, total: incomeRealized + incomePending },
        expense: { realized: expenseRealized, pending: expensePending, total: expenseRealized + expensePending },
        balance: { realized: incomeRealized - expenseRealized, pending: incomePending - expensePending, total: (incomeRealized + incomePending) - (expenseRealized + expensePending) }
    };
};

export const getCategoryDistribution = (transactions: Transaction[], categories: Category[], type: 'income' | 'expense', period: string) => {
    const { start, end } = getPeriodDates(period);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const relevant = transactions.filter(t => {
        if (!t.date) return false; // Ensure t.date is defined before accessing it
        return t.type === type &&
            t.status === 'reconciled' &&
            t.date >= startStr &&
            t.date <= endStr;
    });

    const map = new Map<string, number>();

    relevant.forEach(t => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Outros';
        map.set(catName, (map.get(catName) || 0) + t.amount);
    });

    const data: ChartDataPoint[] = [];
    map.forEach((value, key) => data.push({ name: key, value }));
    return data.sort((a, b) => b.value - a.value);
};

export const getDailyCashFlow = (transactions: Transaction[], period: string) => {
    const { start, end } = getPeriodDates(period);
    // Generate all days
    const data: any[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = d.toISOString().split('T')[0];

        const dayTx = transactions.filter(t => t.status === 'reconciled' && t.date === day);
        const income = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        data.push({
            name: new Date(day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            income,
            expense,
            balance: income - expense
        });
    }
    return data;
};

// ... Add more selectors as strictly needed for the initial cards
