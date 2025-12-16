import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DashboardCard } from '../ui/DashboardCard';
import { DashboardMetrics } from '../../hooks/useDashboardMetrics';

interface FinancialPerformanceChartProps {
    metrics: DashboardMetrics;
}

export const FinancialPerformanceChart: React.FC<FinancialPerformanceChartProps> = ({ metrics }) => {
    // We use the daily history we generated in the hook
    const data = metrics.history || [];

    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    return (
        <DashboardCard title="Performance Financeira" className="h-[400px]">
            {data.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-400">Sem dados</div>
            ) : (
                <div className="w-full h-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.4} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(val) => new Date(val).getDate().toString()}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#71717a' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#71717a' }}
                                tickFormatter={(val) => `R$${val / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => formatMoney(value)}
                                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />

                            <Bar dataKey="revenue" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} fillOpacity={0.8} />
                            <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} fillOpacity={0.8} />
                            <Line type="monotone" dataKey="balance" name="Saldo Acumulado" stroke="#3b82f6" strokeWidth={3} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
        </DashboardCard>
    );
};
