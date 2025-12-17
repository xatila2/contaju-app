import { Transaction, Category, BankAccount, TransactionType } from '../types';

export const defaultCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


// Helper to determine DRE line item from category
// In a real app, this would be a property on the Category entity.
// Here we use heuristics based on category name or type.
export const getDRELineItem = (category: Category): string => {
    const name = category.name.toLowerCase();

    if (category.type === 'income') return 'Receita Bruta';

    // Deductions
    if (name.includes('imposto') || name.includes('devolução') || name.includes('desconto')) return 'Deduções da Receita';

    // CMV/CPV
    if (name.includes('fornecedor') || name.includes('mercadoria') || name.includes('custo') || name.includes('matéria')) return 'Custos Variáveis (CMV/CPV)';

    // Personnel
    if (name.includes('salário') || name.includes('pessoal') || name.includes('férias') ||
        name.includes('13') || name.includes('prolabore') || name.includes('benefício')) return 'Despesas com Pessoal';

    // Admin
    if (name.includes('alugu') || name.includes('energia') || name.includes('água') ||
        name.includes('internet') || name.includes('escritório') || name.includes('contabil')) return 'Despesas Administrativas';

    // Financial
    if (name.includes('juros') || name.includes('bancári') || name.includes('multa') || name.includes('tarifa')) return 'Resultado Financeiro';

    // Default
    return 'Outras Despesas Operacionais';
};

export interface DRELine {
    name: string;
    value: number;
    percentage: number; // % of Net Revenue
    level: number; // For indentation
    isTotal: boolean;
    color?: string;
}

export interface DREResult {
    lines: DRELine[];
    grossRevenue: number;
    netRevenue: number;
    grossProfit: number;
    ebitda: number;
    netResult: number;
}

export const calculateDRE = (
    transactions: Transaction[],
    categories: Category[],
    startDate: string,
    endDate: string,
    mode: 'accrual' | 'cash' = 'accrual' // Competência vs Caixa
): DREResult => {
    // 1. Filter transactions in period
    const filtered = transactions.filter(tx => {
        const date = mode === 'accrual' ? tx.dueDate : (tx.paymentDate || '');
        if (!date) return false;
        return date >= startDate && date <= endDate && tx.status !== 'scheduled'; // Exclude scheduled for past DRE usually, but for projection we might want them. 
        // For standard DRE of past months, we usually want 'reconciled' for Cash basis, and all for Accrual.
        // Let's assume for Accrual we take everything except explicitly voided (if any).
        // For Cash basis we only take reconciled (paid).
    }).filter(tx => {
        if (mode === 'cash') return tx.status === 'reconciled';
        return true;
    });

    // 2. Aggregate by DRE Line
    const totals: Record<string, number> = {
        'Receita Bruta': 0,
        'Deduções da Receita': 0,
        'Custos Variáveis (CMV/CPV)': 0,
        'Despesas com Pessoal': 0,
        'Despesas Administrativas': 0,
        'Outras Despesas Operacionais': 0,
        'Resultado Financeiro': 0
    };

    filtered.forEach(tx => {
        const cat = categories.find(c => c.id === tx.categoryId);
        if (!cat) return;

        const line = getDRELineItem(cat);
        // Income is positive, Expense is negative for calculation usually, but DRE lines are often displayed positive.
        // Let's keep logic: Revenue +, Expenses -.
        const amount = Math.abs(tx.amount) * (tx.type === 'expense' ? -1 : 1);

        if (totals[line] !== undefined) {
            // For financial result, expense is negative, income (yields) is positive
            totals[line] += amount;
        }
    });

    // 3. Calculate Totals
    const grossRevenue = totals['Receita Bruta'];
    const deductions = totals['Deduções da Receita']; // Should be negative
    const netRevenue = grossRevenue + deductions;

    const variableCosts = totals['Custos Variáveis (CMV/CPV)']; // Negative
    const grossProfit = netRevenue + variableCosts;

    const personnel = totals['Despesas com Pessoal'];
    const admin = totals['Despesas Administrativas'];
    const otherOps = totals['Outras Despesas Operacionais'];

    const ebitda = grossProfit + personnel + admin + otherOps;

    const financial = totals['Resultado Financeiro'];
    const netResult = ebitda + financial;

    // 4. Build Lines Structure
    const formatLine = (name: string, val: number, level: number, isTotal: boolean): DRELine => ({
        name,
        value: val,
        percentage: netRevenue !== 0 ? (val / netRevenue) * 100 : 0,
        level,
        isTotal
    });

    const lines: DRELine[] = [
        formatLine('Receita Bruta', grossRevenue, 0, false),
        formatLine('(-) Deduções', deductions, 1, false),
        formatLine('= Receita Líquida', netRevenue, 0, true),

        formatLine('(-) Custos Variáveis', variableCosts, 1, false),
        formatLine('= Lucro Bruto', grossProfit, 0, true),

        formatLine('(-) Despesas com Pessoal', personnel, 1, false),
        formatLine('(-) Despesas Administrativas', admin, 1, false),
        formatLine('(-) Outras Despesas', otherOps, 1, false),

        formatLine('= EBITDA', ebitda, 0, true),

        formatLine('(+/-) Resultado Financeiro', financial, 1, false),
        formatLine('= Resultado Líquido', netResult, 0, true)
    ];

    return {
        lines,
        grossRevenue,
        netRevenue,
        grossProfit,
        ebitda,
        netResult
    };
};

// Cash Flow Projection Types
export interface DailyBalance {
    date: string;
    income: number;
    expense: number;
    balance: number; // Daily net
    accumulated: number; // Ending balance
}

export const projectCashFlow = (
    transactions: Transaction[],
    bankAccounts: BankAccount[],
    daysToProject: number
): DailyBalance[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: DailyBalance[] = [];

    // 1. Calculate Initial Balance (Current)
    let currentBalance = bankAccounts.reduce((acc, bank) => {
        // In a real app, we need to sum initial balance + all reconciled transactions up to today
        // For simplicity here, assuming bankAccounts.initialBalance is the STARTING point and we need to calculate current.
        // OR assuming the mock data or context keeps 'accumulated' somewhere.
        // Let's calculate standard balance:
        return acc + bank.initialBalance;
    }, 0);

    // Add all reconciled transactions to get current real balance
    // NOTE: If bankAccounts.initialBalance is "Balance at start of usage", we sum everything.
    // If it's "Current Balance", we just use it. Let's assume it's static initial.
    transactions.forEach(tx => {
        if (tx.status === 'reconciled') {
            currentBalance += (tx.type === 'expense' ? -1 : 1) * Math.abs(tx.amount);
        }
    });

    // 2. Generate Daily Lines
    for (let i = 0; i < daysToProject; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Find single transactions for this date
        const dailyTx = transactions.filter(tx =>
            tx.dueDate === dateStr && tx.status !== 'reconciled'
        );

        // Generate recurring transactions
        // This is complex. We need to check every transaction with recurrence active
        // and see if it lands on this date.
        // Ideally, we pre-generate instances.
        // For this MVP util, let's just use the 'dailyTx' which in a real app would likely include
        // generated 'scheduled' transactions up to infinity or X months.
        // IF the app doesn't pre-generate, we iterate.
        // Let's assume the context/backend generates 'scheduled' transactions for the near future.
        // Inspecting types.ts, Transaction has 'recurrence'.
        // Inspecting TransactionContext, it doesn't seem to auto-generate deeply.
        // We will just use 'dailyTx' assuming user sees explicit future transactions.

        let dailyIncome = 0;
        let dailyExpense = 0;

        dailyTx.forEach(tx => {
            const amount = Math.abs(tx.amount);
            if (tx.type === 'expense') dailyExpense += amount;
            else if (tx.type === 'income') dailyIncome += amount;
        });

        const dailyNet = dailyIncome - dailyExpense;
        currentBalance += dailyNet;

        result.push({
            date: dateStr,
            income: dailyIncome,
            expense: dailyExpense,
            balance: dailyNet,
            accumulated: currentBalance
        });
    }

    return result;
};
