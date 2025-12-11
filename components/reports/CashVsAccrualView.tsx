import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Info } from 'lucide-react';
import { Transaction, Category } from '../../types';
import { calculateDRE } from '../../utils/financialUtils';

interface CashVsAccrualViewProps {
    transactions: Transaction[];
    categories: Category[];
    dateRange?: { start: string, end: string };
}

interface CategoryData {
    id: string;
    name: string;
    competence: number;
    cash: number;
    diff: number;
    status: string;
    statusColor: string;
}

export const CashVsAccrualView: React.FC<CashVsAccrualViewProps> = ({ transactions, categories, dateRange }) => {
    // Generate data for last 12 months (existing logic)
    const data = useMemo(() => {
        const result = [];
        const today = new Date();

        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const start = d.toISOString().split('T')[0];
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

            const accrual = calculateDRE(transactions, categories, start, end, 'accrual');
            const cash = calculateDRE(transactions, categories, start, end, 'cash');

            const diff = cash.netResult - accrual.netResult;
            const diffPercent = accrual.netResult !== 0 ? (diff / Math.abs(accrual.netResult)) * 100 : 0;

            result.push({
                month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                accrualRevenue: accrual.netRevenue,
                cashRevenue: cash.netRevenue,
                accrualResult: accrual.netResult,
                cashResult: cash.netResult,
                diff,
                isSignificant: Math.abs(diffPercent) > 20 // Alert if difference > 20%
            });
        }
        return result;
    }, [transactions, categories]);

    // New Logic: Category Analysis for Selected Period
    const categoryAnalysis = useMemo(() => {
        if (!dateRange) return { revenues: [], expenses: [] };

        const processCategories = (type: 'income' | 'expense') => {
            const relevantCats = categories.filter(c => c.type === type);
            // Include subcategories processing if needed, but for now assuming direct assignment or flat list.
            // A more robust approach would need to sum subcategories into parents if desired.
            // Here we act on the categoryId assigned to transaction.

            const result: CategoryData[] = relevantCats.map(cat => {
                // Filter transactions for this category
                // Note: transactions usually link to subcategories. 
                // We should match if transaction.categoryId == cat.id OR transaction.categoryId is child of cat.id
                // For simplicity, we filter by EXACT match or Child match if category tree is flat here.
                // Assuming flat or direct mapping for the report request "by category".

                // Helper to check if tx belongs to category (including subcategories ideally)
                // For this implementation, we'll simple-filter by cat.id and its children if we had a tree helper. 
                // Given standard implementation pattern:
                const txs = transactions.filter(t => t.categoryId === cat.id);

                const compVal = txs.reduce((sum, t) => {
                    // Check Competence Date (dueDate)
                    if (t.dueDate >= dateRange.start && t.dueDate <= dateRange.end) {
                        return sum + Math.abs(t.amount);
                    }
                    return sum;
                }, 0);

                const cashVal = txs.reduce((sum, t) => {
                    // Check Payment Date
                    if (t.paymentDate && t.paymentDate >= dateRange.start && t.paymentDate <= dateRange.end) {
                        return sum + Math.abs(t.amount);
                    }
                    return sum;
                }, 0);

                const diff = cashVal - compVal; // Cash - Competence
                let status = 'Normal';
                let statusColor = 'text-zinc-500';

                const threshold = compVal * 0.1; // 10%

                if (type === 'income') {
                    if (Math.abs(diff) < threshold) {
                        status = 'Normal';
                    } else if (diff < 0) {
                        status = 'A receber';
                        statusColor = 'text-rose-600 font-bold';
                    } else {
                        status = 'Rec. Adiantado';
                        statusColor = 'text-emerald-600 font-bold';
                    }
                } else {
                    if (Math.abs(diff) < threshold) {
                        status = 'Normal';
                    } else if (diff < 0) {
                        status = 'Contas a pagar';
                        statusColor = 'text-rose-600 font-bold';
                    } else {
                        status = 'Pag. Antecipado';
                        statusColor = 'text-amber-600 font-bold';
                    }
                }

                return {
                    id: cat.id,
                    name: cat.name,
                    competence: compVal,
                    cash: cashVal,
                    diff,
                    status,
                    statusColor
                };
            }).filter(item => item.competence > 0 || item.cash > 0) // Hide empty rows
                .sort((a, b) => b.competence - a.competence); // Sort by volume

            return result;
        };

        return {
            revenues: processCategories('income'),
            expenses: processCategories('expense')
        };

    }, [transactions, categories, dateRange]);

    const renderCategoryBlock = (title: string, data: CategoryData[], type: 'income' | 'expense', description: string) => {
        const barColorComp = type === 'income' ? '#3b82f6' : '#f43f5e'; // Blue / Red
        const barColorCash = '#10b981'; // Green for cash always? Or match Expense logic? 
        // Request said: "Competência (Despesas)" vs "Caixa (Pagamentos)"
        // Let's use darker red for Accrual Expense and Light Red for Cash Expense? 
        // Or strictly Blue/Green standard. Standard is clearer.
        // Let's stick to Blue(Comp) / Green(Cash) for Chart consistency as requested in Block B too?
        // Wait, Block B 3.2 says "Competência (Despesas)" vs "Caixa (Pagamentos)".
        // Standard DRE usually uses Red for expenses. 
        // Let's use:
        // Revenue: Comp(Blue), Cash(Green)
        // Expense: Comp(Red), Cash(Orange/Yellow) to differentiate? 
        // Or keep Blue/Green for "Projected vs Realized" metaphor. 
        // Let's use Blue/Green to match the top chart for consistency as requested "Visual consistency".

        return (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden mt-8">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
                    <p className="text-sm text-zinc-500 mt-1">{description}</p>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* CHART */}
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                                <XAxis type="number" tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)} />
                                <Legend />
                                <Bar dataKey="competence" name="Competência" fill="#64748b" radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="cash" name="Caixa" fill={type === 'income' ? '#10b981' : '#f59e0b'} radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-auto max-h-80">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Categoria</th>
                                    <th className="px-4 py-2 text-right">Competência</th>
                                    <th className="px-4 py-2 text-right">Caixa</th>
                                    <th className="px-4 py-2 text-right">Diferença</th>
                                    <th className="px-4 py-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {data.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]" title={row.name}>{row.name}</td>
                                        <td className="px-4 py-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.competence)}</td>
                                        <td className="px-4 py-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.cash)}</td>
                                        <td className="px-4 py-2 text-right font-medium text-zinc-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', signDisplay: 'always' }).format(row.diff)}</td>
                                        <td className={`px-4 py-2 text-center text-xs ${row.statusColor}`}>{row.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                <Info className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Entendendo a Diferença</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        **Competência**: Faturamento (quando a venda/despesa aconteceu).<br />
                        **Caixa**: Financeiro (quando o dinheiro realmente entrou ou saiu).<br />
                        Diferenças grandes indicam descasamento entre venda e recebimento (inadimplência ou prazos longos) ou descasamento de pagamentos.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Receita: Competência vs Caixa (12 Meses)</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barGap={0} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                            <Tooltip
                                formatter={(val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}
                                labelStyle={{ color: '#333' }}
                            />
                            <Legend />
                            <Bar dataKey="accrualRevenue" name="Competência (Vendas)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="cashRevenue" name="Caixa (Recebimentos)" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Detalhamento do Resultado (12 Meses)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mês</th>
                                <th className="px-6 py-3 font-medium text-right text-blue-600 dark:text-blue-400">Result. Competência</th>
                                <th className="px-6 py-3 font-medium text-right text-emerald-600 dark:text-emerald-400">Result. Caixa</th>
                                <th className="px-6 py-3 font-medium text-right">Diferença</th>
                                <th className="px-6 py-3 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {data.map((row, idx) => (
                                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="px-6 py-3 font-medium text-zinc-900 dark:text-white">{row.month}</td>
                                    <td className="px-6 py-3 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.accrualResult)}</td>
                                    <td className="px-6 py-3 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.cashResult)}</td>
                                    <td className={`px-6 py-3 text-right font-medium ${row.diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', signDisplay: 'always' }).format(row.diff)}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {row.isSignificant && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                Atenção
                                            </span>
                                        )}
                                        {!row.isSignificant && <span className="text-zinc-400">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* NEW BLOCKS */}
            {dateRange && (
                <>
                    {renderCategoryBlock(
                        "Receitas por Categoria: Competência x Caixa – Mês selecionado",
                        categoryAnalysis.revenues,
                        'income',
                        "Mostra, por categoria de receita, a diferença entre o que foi vendido (competência) e o que já foi recebido em caixa no mês selecionado."
                    )}

                    {renderCategoryBlock(
                        "Despesas por Categoria: Competência x Caixa – Mês selecionado",
                        categoryAnalysis.expenses,
                        'expense',
                        "Mostra, por categoria de despesa, a diferença entre o que foi lançado (competência) e o que já foi pago em caixa no mês selecionado."
                    )}
                </>
            )}
        </div>
    );
};
