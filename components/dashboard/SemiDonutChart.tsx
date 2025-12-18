import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { defaultCurrency } from '../../utils/financialUtils';

interface SemiDonutChartProps {
    value: number;
    target: number;
    type: 'revenue' | 'expense' | 'profit';
    label?: string;
    loading?: boolean;
}

export const SemiDonutChart: React.FC<SemiDonutChartProps> = ({ value, target, type, label, loading }) => {
    // Dynamic Colors based on Progress/Health
    const getColor = (t: string, pct: number) => {
        const isCompleted = pct >= 100;
        const isNear = pct >= 80; // Warning zone

        if (t === 'expense') {
            // Expense: Green (Safe) -> Yellow (Warning) -> Red (Over)
            if (pct > 100) return '#EF4444'; // Red-500
            if (pct >= 85) return '#EAB308'; // Yellow-500
            return '#10B981'; // Emerald-500
        }

        // Revenue / Profit: Red (Bad) -> Yellow (Progress) -> Green (Goal Met)
        if (pct >= 100) return '#10B981'; // Emerald-500
        if (pct >= 50) return '#EAB308'; // Yellow-500
        return '#EF4444'; // Red-500
    };

    // Calculate percentage
    const percentage = target > 0 ? (value / target) * 100 : 0;
    const displayPercentage = Math.min(percentage, 100);

    // Determine color based on type and percentage
    const mainColor = getColor(type, percentage);
    const emptyColor = '#27272A'; // Zinc-800 for empty state

    const data = [
        { name: 'Realizado', value: displayPercentage },
        { name: 'Restante', value: 100 - displayPercentage }
    ];

    if (loading) {
        return <div className="h-full w-full flex items-center justify-center animate-pulse bg-zinc-800/50 rounded-lg"></div>;
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius="75%"
                        outerRadius="100%"
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-out"
                    >
                        <Cell key="progress" fill={mainColor} />
                        <Cell key="bg" fill={emptyColor} />
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-zinc-900 border border-zinc-700 p-2 rounded shadow-xl text-xs z-50">
                                        <p className="text-zinc-400">Meta: {defaultCurrency(target)}</p>
                                        <p className="text-white font-bold">Realizado: {defaultCurrency(value)}</p>
                                        <p style={{ color: mainColor }}>{percentage.toFixed(1)}%</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Percentage Only */}
            <div className="absolute bottom-0 w-full flex justify-center pointer-events-none">
                <div className="flex items-baseline justify-center">
                    <span className="text-sm font-bold tracking-tighter shadow-black drop-shadow-md" style={{ color: mainColor }}>
                        {percentage.toFixed(0)}<span className="text-[9px] opacity-60 ml-0.5">%</span>
                    </span>
                </div>
            </div>
        </div>
    );
};
