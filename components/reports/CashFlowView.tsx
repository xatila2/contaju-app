import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart, Line } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, Calendar } from 'lucide-react';
import { Transaction, BankAccount } from '../../types';
import { projectCashFlow } from '../../utils/financialUtils';

interface CashFlowViewProps {
    transactions: Transaction[];
    bankAccounts: BankAccount[];
    mode: 'short' | 'long'; // Short: 15/30 days, Long: 90 days
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ transactions, bankAccounts, mode }) => {
    const [days, setDays] = useState(mode === 'short' ? 15 : 90);

    const projectedData = useMemo(() => projectCashFlow(transactions, bankAccounts, days), [transactions, bankAccounts, days]);

    const minBalance = Math.min(...projectedData.map(d => d.accumulated));
    const negativeDays = projectedData.filter(d => d.accumulated < 0).length;
    const workingCapitalNeed = minBalance < 0 ? Math.abs(minBalance) : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Controls */}
            {mode === 'short' && (
                <div className="flex gap-2">
                    <button
                        onClick={() => setDays(15)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${days === 15 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                    >
                        15 Dias
                    </button>
                    <button
                        onClick={() => setDays(30)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${days === 30 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                    >
                        30 Dias
                    </button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs text-zinc-500 uppercase">Menor Saldo Projetado</p>
                    <p className={`text-2xl font-bold mt-1 ${minBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(minBalance)}
                    </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs text-zinc-500 uppercase">Nec. Capital de Giro</p>
                    <p className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(workingCapitalNeed)}
                    </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs text-zinc-500 uppercase">Dias no Vermelho</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className={`text-2xl font-bold ${negativeDays > 0 ? 'text-rose-600' : 'text-zinc-900 dark:text-white'}`}>
                            {negativeDays} dias
                        </p>
                        {negativeDays > 0 && <AlertTriangle size={20} className="text-rose-500" />}
                    </div>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
                    {mode === 'short' ? 'Projeção Diária de Saldo' : 'Projeção de Fluxo de Caixa (90 Dias)'}
                </h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={projectedData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(val) => {
                                    const d = new Date(val);
                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                }}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                            <Tooltip
                                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                formatter={(val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}
                            />
                            {/* In long mode, showing bars for daily movement might be too crowded, maybe just balance line or weekly aggregation */}
                            {mode === 'short' ? (
                                <>
                                    <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={8} stackId="a" />
                                    <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={8} stackId="a" />
                                </>
                            ) : null}
                            <Line
                                type="monotone"
                                dataKey="accumulated"
                                name="Saldo Acumulado"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                dot={false}
                            />

                            {/* Gradient for area under line? Optional. Let's stick to line for clarity. */}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Transaction Lists (Only for Short Term) */}
            {mode === 'short' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upcoming Incomes */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-emerald-50 dark:bg-emerald-900/10">
                            <h4 className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                                <ArrowUpCircle size={18} /> Próximas Entradas
                            </h4>
                        </div>
                        <div className="p-2 max-h-60 overflow-y-auto">
                            {projectedData.flatMap(d => {
                                // Find actual transactions for this date
                                return transactions.filter(t => t.dueDate === d.date && t.type === 'income' && t.status !== 'reconciled');
                            }).slice(0, 5).map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{tx.description}</p>
                                        <p className="text-xs text-zinc-500">{new Date(tx.dueDate).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <span className="font-bold text-emerald-600 text-sm">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Expenses */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-rose-50 dark:bg-rose-900/10">
                            <h4 className="font-semibold text-rose-800 dark:text-rose-400 flex items-center gap-2">
                                <ArrowDownCircle size={18} /> Próximas Saídas
                            </h4>
                        </div>
                        <div className="p-2 max-h-60 overflow-y-auto">
                            {projectedData.flatMap(d => {
                                return transactions.filter(t => t.dueDate === d.date && t.type === 'expense' && t.status !== 'reconciled');
                            }).slice(0, 5).map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{tx.description}</p>
                                        <p className="text-xs text-zinc-500">{new Date(tx.dueDate).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <span className="font-bold text-rose-600 text-sm">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(tx.amount))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
