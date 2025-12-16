
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, DollarSign, TrendingDown, TrendingUp, Target, BarChart3, Settings2, FolderOpen, ChevronDown } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, PlanningData } from '../types';
import { CategoryGroupManager } from '../components/CategoryGroupManager';

// --- Helper Functions (Module Scope) ---
const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
// Replace compact with standard for better consistency, or specific no-decimal if space needed
const formatMoneyCompact = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);


// --- Helper Components (Defined OUTSIDE the main component to prevent re-renders/focus loss) ---

const SummaryCard = ({ title, goal, actual, type, icon: Icon }: any) => {
    const percentage = goal > 0 ? (actual / goal) * 100 : 0;
    const progress = Math.min(percentage, 100);

    let barColor = 'bg-zinc-500';
    let textColor = 'text-zinc-900 dark:text-white';

    if (type === 'expense') {
        // For expenses: Green if under budget, Yellow if close, Red if over
        if (percentage > 100) { barColor = 'bg-rose-500'; textColor = 'text-rose-600 dark:text-rose-400'; }
        else if (percentage > 85) { barColor = 'bg-yellow-500'; textColor = 'text-yellow-600 dark:text-yellow-400'; }
        else { barColor = 'bg-emerald-500'; textColor = 'text-zinc-900 dark:text-white'; }
    } else {
        // For Revenue/Profit: Green if target met
        if (percentage >= 100) { barColor = 'bg-emerald-500'; textColor = 'text-emerald-600 dark:text-emerald-400'; }
        else if (percentage >= 70) { barColor = 'bg-yellow-500'; }
        else { barColor = 'bg-rose-500'; }
    }

    return (
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">{title}</p>
                    <h3 className={`text-2xl font-bold mt-1 ${textColor}`}>{formatMoney(actual)}</h3>
                </div>
                <div className={`p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500`}>
                    <Icon size={20} />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Progresso: {percentage.toFixed(1)}%</span>
                    <span>Meta: {formatMoney(goal)}</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

const CellInput = ({ value, onSave, color }: { value: number, onSave: (val: string) => void, color: string }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [localValue, setLocalValue] = useState(value || 0);

    const formatBRL = (val: number) => {
        if (val === 0) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    useEffect(() => {
        setLocalValue(value || 0);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const numberValue = rawValue ? parseInt(rawValue, 10) / 100 : 0;
        setLocalValue(numberValue);
    };

    const handleBlur = () => {
        setIsFocused(false);
        onSave(localValue.toFixed(2));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        // Optional: Select all on focus if desired
        // e.target.select();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="relative group">
            <span className={`absolute left-2 top-1.5 text-[10px] text-zinc-400 pointer-events-none transition-opacity ${isFocused || localValue ? 'opacity-100' : 'opacity-0'}`}>
                {isFocused ? 'Valor' : 'Meta'}
            </span>
            {isFocused ? (
                <input
                    type="text"
                    inputMode="numeric"
                    value={localValue === 0 ? '' : formatBRL(localValue)}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder="R$ 0,00"
                    className={`w-full bg-white dark:bg-zinc-800 border-2 border-yellow-500 rounded px-2 pt-4 pb-1 text-right text-xs font-bold text-zinc-900 dark:text-white outline-none transition-all h-9 shadow-lg z-10`}
                    autoFocus
                />
            ) : (
                <div
                    onClick={() => setIsFocused(true)}
                    className={`w-full h-full min-h-[32px] flex items-center justify-end px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${color}`}
                >
                    <span className="text-xs font-medium">
                        {value === 0 ? '-' : formatBRL(value)}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 ml-1 text-zinc-400">
                        {/* <Edit2 size={10} /> */}
                    </span>
                </div>
            )}
        </div>
    );
};

const CellActual = ({ value, goal, type }: { value: number, goal: number, type: 'rev' | 'exp' | 'prof' }) => {
    let colorClass = 'text-zinc-500';
    const percent = goal > 0 ? (value / goal) * 100 : 0;

    if (goal > 0) {
        if (type === 'rev' || type === 'prof') {
            if (percent >= 100) { colorClass = 'text-emerald-600 font-bold'; }
            else if (percent >= 80) { colorClass = 'text-yellow-600'; }
            else { colorClass = 'text-rose-600'; }
        } else {
            if (percent > 100) { colorClass = 'text-rose-600 font-bold'; }
            else { colorClass = 'text-emerald-600'; }
        }
    }

    return (
        <div className="mt-1 flex justify-between items-center px-1">
            <span className="text-[10px] text-zinc-400">Real</span>
            <div className={`text-xs ${colorClass}`}>
                {formatMoney(value)}
            </div>
        </div>
    );
};

// --- Main Component ---

import { useTransactions } from '../context/TransactionContext';

interface PlanningProps { }

export const Planning: React.FC<PlanningProps> = () => {
    const {
        transactions,
        categories, // Get categories from context
        planningData,
        setPlanningData,
        // categoryGroups, // No longer used
        // categoryGroupItems, // No longer used
        categoryGroupGoals,
        setCategoryGroupGoal
    } = useTransactions();
    const onUpdatePlanning = setPlanningData;

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    // const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false); // No longer needed

    const [expandedSections, setExpandedSections] = useState({
        income: true,
        expense: true
    });

    // Track expanded state for Parent Categories
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const toggleSection = (section: 'income' | 'expense') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
    };

    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => {
        const date = new Date(selectedYear, i, 1);
        return {
            id: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
            label: date.toLocaleDateString('pt-BR', { month: 'long' }),
            shortLabel: date.toLocaleDateString('pt-BR', { month: 'short' }),
        };
    }), [selectedYear]);

    const getPlanningForMonth = (monthId: string) => {
        return planningData.find(p => p.month === monthId) || { month: monthId, revenueGoal: 0, expenseGoal: 0, profitGoal: 0, profitSharingParams: { totalPool: 0, distributedAmount: 0 } };
    };

    const getActualsForMonth = (monthId: string) => {
        const monthTransactions = transactions.filter(tx => {
            const txDate = tx.dueDate;
            return txDate.startsWith(monthId) && tx.status !== 'pending';
        });

        const revenue = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const profit = revenue - expense;

        return { revenue, expense, profit };
    };

    const handleGoalChange = (monthId: string, field: keyof PlanningData, value: string) => {
        const numValue = parseFloat(value) || 0;
        const existing = planningData.find(p => p.month === monthId);
        let newData;

        if (existing) {
            newData = planningData.map(p => p.month === monthId ? { ...p, [field]: numValue } : p);
        } else {
            newData = [...planningData, {
                month: monthId,
                revenueGoal: 0,
                expenseGoal: 0,
                profitGoal: 0,
                profitSharingParams: { totalPool: 0, distributedAmount: 0 },
                [field]: numValue
            } as PlanningData];
        }
        onUpdatePlanning(newData);
    };

    // Calculate Actuals for a specific category (Parent or Child)
    const getCategoryActual = (categoryId: string, monthId: string) => {
        // If it's a parent, we sum all its children + itself (if any direct assignments)
        // But usually transactions are deeper. 
        // Let's check if this category has children.
        const childIds = categories.filter(c => c.parentId === categoryId).map(c => c.id);
        const allAssociatedIds = [categoryId, ...childIds];

        const groupTransactions = transactions.filter(tx => {
            return tx.dueDate.startsWith(monthId) &&
                tx.status !== 'pending' &&
                allAssociatedIds.includes(tx.categoryId);
        });

        const total = groupTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
        return total;
    };

    // Get Goal for a Category (Parent or Child)
    // If it's a Parent, it sums the goals of its children.
    const getCategoryGoal = (categoryId: string, monthId: string) => {
        // Check if has children
        const children = categories.filter(c => c.parentId === categoryId);

        if (children.length > 0) {
            // It's a parent, sum children goals
            return children.reduce((acc, child) => {
                return acc + getCategoryGoal(child.id, monthId);
            }, 0);
        }

        // It's a leaf/child category, get direct goal
        const [year, month] = monthId.split('-').map(Number);
        const goal = categoryGroupGoals.find(g =>
            g.groupId === categoryId && // groupId maps to Category ID here
            g.year === year &&
            g.month === month
        );
        return goal?.goalAmount || 0;
    };

    // Save Goal for a specific category (usually a Child)
    const handleCategoryGoalChange = (categoryId: string, monthId: string, val: string) => {
        const [year, month] = monthId.split('-').map(Number);
        setCategoryGroupGoal({
            groupId: categoryId, // Using Category ID
            year,
            month,
            goalAmount: parseFloat(val) || 0
        });
    };

    const annualData = useMemo(() => {
        let totalRevGoal = 0, totalRevActual = 0;
        let totalExpGoal = 0, totalExpActual = 0;
        let totalProfGoal = 0, totalProfActual = 0;

        const chartData = months.map(month => {
            const plan = getPlanningForMonth(month.id);
            const actual = getActualsForMonth(month.id);

            // We should use the aggregated Category Goals effectively if groups exist
            // Re-calculate totals based on categories if needed, or stick to global plan for chart?
            // The prompt implies syncing. Let's rely on global plan for now BUT we should probably update global plan based on sum of categories? 
            // For simplicity and performance, let's keep using the stored global Plan for the chart to avoid massive recalc on every render, 
            // OR update the global plan whenever category goals change (complex).
            // Actually, the request implies the "Overview" rows (Revenue/Expense) in the table ARE the sums.
            // Let's make the chart reflect that too? 
            // The previous implementation calculated table rows dynamically but chart was on stored plan.
            // Let's stick to the stored plan for the chart to avoid discrepancies if user hasn't fully set up groups.
            // OR: Calculate dynamically if groups exist.

            // Let's calculate dynamically for accuracy with the new model
            const incomeCats = categories.filter(c => c.type === 'income' && !c.parentId);
            const expenseCats = categories.filter(c => c.type === 'expense' && !c.parentId);

            let currentRevGoal = 0;
            if (incomeCats.length > 0) {
                currentRevGoal = incomeCats.reduce((acc, c) => acc + getCategoryGoal(c.id, month.id), 0);
            } else {
                currentRevGoal = plan.revenueGoal;
            }

            let currentExpGoal = 0;
            if (expenseCats.length > 0) {
                currentExpGoal = expenseCats.reduce((acc, c) => acc + getCategoryGoal(c.id, month.id), 0);
            } else {
                currentExpGoal = plan.expenseGoal;
            }

            const currentProfGoal = currentRevGoal - currentExpGoal;

            totalRevGoal += currentRevGoal;
            totalRevActual += actual.revenue;
            totalExpGoal += currentExpGoal;
            totalExpActual += actual.expense;
            totalProfGoal += currentProfGoal;
            totalProfActual += actual.profit;

            return {
                name: month.shortLabel,
                revGoal: currentRevGoal,
                revActual: actual.revenue,
                expGoal: currentExpGoal,
                expActual: actual.expense,
                profGoal: currentProfGoal,
                profActual: actual.profit
            };
        });

        return {
            chartData,
            totals: {
                rev: { goal: totalRevGoal, actual: totalRevActual },
                exp: { goal: totalExpGoal, actual: totalExpActual },
                prof: { goal: totalProfGoal, actual: totalProfActual }
            }
        };
    }, [months, planningData, transactions, categories, categoryGroupGoals]);

    // Filter Parent Categories for the Table
    const incomeGroups = useMemo(() => categories.filter(c => c.type === 'income' && !c.parentId), [categories]);
    const expenseGroups = useMemo(() => categories.filter(c => c.type === 'expense' && !c.parentId), [categories]);

    // Helper to generate a consistent color based on string
    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    // We render rows.
    const renderCategoryRow = (category: any, depth: number = 0) => {
        const subcategories = categories.filter(c => c.parentId === category.id);
        const hasChildren = subcategories.length > 0;
        const isExpanded = expandedCategories[category.id];
        const paddingLeft = depth === 0 ? 'pl-12' : 'pl-20'; // Base padding + indent

        return (
            <React.Fragment key={category.id}>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className={`sticky left-0 z-10 bg-zinc-50/95 dark:bg-zinc-900/95 px-4 py-2 border-r border-zinc-200 dark:border-zinc-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] ${paddingLeft}`}>
                        <div className="flex items-center gap-2">
                            {hasChildren && (
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400"
                                >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            )}
                            {!hasChildren && <div className="w-4" />} {/* Spacer */}

                            {depth === 0 && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stringToColor(category.name) }}></div>}
                            <span className={`text-xs ${depth === 0 ? 'font-medium text-zinc-700 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                {category.name}
                            </span>
                        </div>
                    </td>
                    {months.map(month => {
                        const goal = getCategoryGoal(category.id, month.id);
                        const actual = getCategoryActual(category.id, month.id);

                        // If has children, Goal is read-only (sum). If no children, editable.
                        const isEditable = !hasChildren;

                        return (
                            <td key={month.id} className="px-3 py-2 border-r border-zinc-100 dark:border-zinc-800 last:border-none align-top">
                                {isEditable ? (
                                    <CellInput
                                        value={goal}
                                        onSave={(v) => handleCategoryGoalChange(category.id, month.id, v)}
                                        color="text-zinc-500 dark:text-zinc-400 font-normal"
                                    />
                                ) : (
                                    <div className="h-8 flex items-center justify-end px-2 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                                        {formatMoney(goal)}
                                    </div>
                                )}

                                <div className="flex justify-between items-center px-1 mt-0.5 opacity-70">
                                    <span className="text-[9px] text-zinc-300">R</span>
                                    <div className="text-[10px] text-zinc-400">{formatMoney(actual)}</div>
                                </div>
                            </td>
                        );
                    })}
                </tr>
                {isExpanded && subcategories.map(sub => renderCategoryRow(sub, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Planejamento Anual</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        Defina suas metas e acompanhe o realizado conforme o Plano de Contas.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Removed Manage Groups Button - Integrated with Categories */}
                    <div className="flex items-center space-x-4 bg-white dark:bg-zinc-900 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <button onClick={() => setSelectedYear(selectedYear - 1)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"><ChevronLeft size={20} className="text-zinc-500" /></button>
                        <span className="font-bold text-zinc-900 dark:text-white px-4">{selectedYear}</span>
                        <button onClick={() => setSelectedYear(selectedYear + 1)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"><ChevronRight size={20} className="text-zinc-500" /></button>
                    </div>
                </div>
            </div>

            {/* DASHBOARD SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title="Faturamento Anual"
                    goal={annualData.totals.rev.goal}
                    actual={annualData.totals.rev.actual}
                    type="revenue"
                    icon={DollarSign}
                />
                <SummaryCard
                    title="Orçamento de Despesas"
                    goal={annualData.totals.exp.goal}
                    actual={annualData.totals.exp.actual}
                    type="expense"
                    icon={TrendingDown}
                />
                <SummaryCard
                    title="Lucro Líquido Anual"
                    goal={annualData.totals.prof.goal}
                    actual={annualData.totals.prof.actual}
                    type="profit"
                    icon={Target}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CHART */}
                <div className="lg:col-span-3 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm h-[350px]">
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-zinc-400" />
                        Evolução Mensal (Meta vs Realizado)
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={annualData.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" strokeOpacity={0.2} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(val) => formatMoneyCompact(val)} width={80} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46', color: '#fff' }}
                                formatter={(val: number) => formatMoney(val)}
                            />
                            <Legend />
                            <Bar dataKey="revActual" name="Faturamento Real" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line type="monotone" dataKey="revGoal" name="Meta Faturamento" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />

                            <Bar dataKey="expActual" name="Despesa Real" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line type="monotone" dataKey="expGoal" name="Teto Despesas" stroke="#BE123C" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* GROUPS MANAGER MODAL - REMOVED */}
            {/* <CategoryGroupManager
                isOpen={isGroupManagerOpen}
                onClose={() => setIsGroupManagerOpen(false)}
            /> */}

            {/* MATRIX TABLE */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[400px]">
                <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 border-separate border-spacing-0">
                        <thead className="bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-20">
                            <tr>
                                <th className="sticky left-0 z-30 bg-zinc-50 dark:bg-zinc-950 px-4 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 w-64 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]">
                                    Detalhamento (Agrupamento)
                                </th>
                                {months.map(month => (
                                    <th key={month.id} className="px-3 py-4 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider min-w-[140px] border-r border-zinc-100 dark:border-zinc-800 last:border-none">
                                        {month.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">

                            {/* ================= REVENUE SECTION ================= */}
                            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-4 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 border-r border-zinc-200 dark:border-zinc-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer select-none"
                                        onClick={() => toggleSection('income')}
                                    >
                                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded text-emerald-600 flex items-center justify-center w-8 h-8">
                                            {expandedSections.income ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </div>
                                        <span>Faturamento</span>
                                    </div>
                                </td>
                                {months.map(month => {
                                    let goalVal = 0;

                                    if (incomeGroups.length > 0) {
                                        goalVal = incomeGroups.reduce((acc, g) => acc + getCategoryGoal(g.id, month.id), 0);
                                    } else {
                                        goalVal = getPlanningForMonth(month.id).revenueGoal;
                                    }

                                    const actual = getActualsForMonth(month.id).revenue;

                                    return (
                                        <td key={month.id} className="px-3 py-3 border-r border-zinc-100 dark:border-zinc-800 last:border-none align-top bg-emerald-50/10">
                                            {incomeGroups.length > 0 ? (
                                                <div className="h-8 flex items-center justify-end px-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 opacity-60">
                                                    {formatMoney(goalVal)}
                                                </div>
                                            ) : (
                                                <CellInput
                                                    value={goalVal}
                                                    onSave={(v) => handleGoalChange(month.id, 'revenueGoal', v)}
                                                    color="text-emerald-600 dark:text-emerald-400"
                                                />
                                            )}
                                            <CellActual value={actual} goal={goalVal} type="rev" />
                                        </td>
                                    );
                                })}
                            </tr>

                            {/* REVENUE GROUPS EXPANSION */}
                            {expandedSections.income && incomeGroups.map((group, idx) => renderCategoryRow(group))}

                            {/* ================= EXPENSE SECTION ================= */}
                            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-4 py-4 text-sm font-bold text-rose-600 dark:text-rose-400 border-r border-zinc-200 dark:border-zinc-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer select-none"
                                        onClick={() => toggleSection('expense')}
                                    >
                                        <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded text-rose-600 flex items-center justify-center w-8 h-8">
                                            {expandedSections.expense ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </div>
                                        <span>Despesas</span>
                                    </div>
                                </td>
                                {months.map(month => {
                                    let goalVal = 0;
                                    if (expenseGroups.length > 0) {
                                        goalVal = expenseGroups.reduce((acc, g) => acc + getCategoryGoal(g.id, month.id), 0);
                                    } else {
                                        goalVal = getPlanningForMonth(month.id).expenseGoal;
                                    }
                                    const actual = getActualsForMonth(month.id).expense;

                                    return (
                                        <td key={month.id} className="px-3 py-3 border-r border-zinc-100 dark:border-zinc-800 last:border-none align-top bg-rose-50/10">
                                            {expenseGroups.length > 0 ? (
                                                <div className="h-8 flex items-center justify-end px-2 text-xs font-bold text-rose-600 dark:text-rose-400 opacity-60">
                                                    {formatMoney(goalVal)}
                                                </div>
                                            ) : (
                                                <CellInput
                                                    value={goalVal}
                                                    onSave={(v) => handleGoalChange(month.id, 'expenseGoal', v)}
                                                    color="text-rose-600 dark:text-rose-400"
                                                />
                                            )}
                                            <CellActual value={actual} goal={goalVal} type="exp" />
                                        </td>
                                    );
                                })}
                            </tr>

                            {/* EXPENSE GROUPS EXPANSION */}
                            {expandedSections.expense && expenseGroups.map((group, idx) => renderCategoryRow(group))}

                            {/* ================= PROFIT SECTION ================= */}
                            <tr className="bg-yellow-50/20 dark:bg-yellow-900/5 hover:bg-yellow-50/40 dark:hover:bg-yellow-900/10 border-t-2 border-zinc-200 dark:border-zinc-700">
                                <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-4 py-4 text-sm font-bold text-yellow-600 dark:text-yellow-500 border-r border-zinc-200 dark:border-zinc-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded text-yellow-600 flex items-center justify-center w-8 h-8">
                                            <TrendingUp size={16} />
                                        </div>
                                        <span>Lucro Líquido</span>
                                    </div>
                                </td>
                                {months.map(month => {
                                    // Calculate Totals dynamically based on groups if present

                                    let revGoal = 0;
                                    let expGoal = 0;

                                    if (incomeGroups.length > 0) {
                                        revGoal = incomeGroups.reduce((acc, g) => acc + getCategoryGoal(g.id, month.id), 0);
                                    } else {
                                        revGoal = getPlanningForMonth(month.id).revenueGoal;
                                    }

                                    if (expenseGroups.length > 0) {
                                        expGoal = expenseGroups.reduce((acc, g) => acc + getCategoryGoal(g.id, month.id), 0);
                                    } else {
                                        expGoal = getPlanningForMonth(month.id).expenseGoal;
                                    }

                                    const profGoal = revGoal - expGoal;
                                    const actual = getActualsForMonth(month.id).profit;

                                    return (
                                        <td key={month.id} className="px-3 py-3 border-r border-zinc-100 dark:border-zinc-800 last:border-none align-top">
                                            <div className="h-8 flex items-center justify-end px-2 text-xs font-bold text-yellow-600 dark:text-yellow-500 opacity-60">
                                                {formatMoney(profGoal)}
                                            </div>
                                            <CellActual value={actual} goal={profGoal} type="prof" />
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-center text-zinc-500 flex justify-center items-center gap-2">
                    <span>Valores de Lucro Líquido são calculados automaticamente (Receita - Despesas).</span>
                </div>
            </div>

        </div>
    );
};
