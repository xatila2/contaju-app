import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

interface PremiumKpiCardProps {
    title: string;
    value: number;
    trend?: number; // percent
    data: any[]; // History data for sparkline
    dataKey: string; // Key to plot (balance, revenue, expense)
    icon?: LucideIcon;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    formatter?: (val: number) => string;
}

export const PremiumKpiCard: React.FC<PremiumKpiCardProps> = ({
    title,
    value,
    trend,
    data,
    dataKey,
    icon: Icon,
    variant = 'default',
    formatter = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}) => {

    const colors = {
        default: '#3b82f6', // blue
        success: '#10b981', // emerald
        warning: '#f59e0b', // amber
        danger: '#ef4444', // rose
        info: '#06b6d4' // cyan
    };

    const strokeColor = colors[variant] || colors.default;
    const fillColor = `${strokeColor}20`; // 20% opacity

    return (
        <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                        {title}
                    </p>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        {formatter(value)}
                    </h3>
                </div>
                {Icon && (
                    <div className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:text-brand-500 transition-colors`}>
                        <Icon size={20} />
                    </div>
                )}
            </div>

            {/* Sparkline */}
            <div className="h-16 mt-4 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={strokeColor}
                            strokeWidth={2}
                            fill={`url(#grad-${title})`}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Trend Indicator (Generic Logic) */}
            {trend !== undefined && (
                <div className="flex items-center gap-1 mt-2 text-xs font-medium">
                    {trend > 0 ? (
                        <span className="text-emerald-500 flex items-center">
                            <ArrowUpRight size={14} /> {trend.toFixed(1)}%
                        </span>
                    ) : trend < 0 ? (
                        <span className="text-rose-500 flex items-center">
                            <ArrowDownRight size={14} /> {Math.abs(trend).toFixed(1)}%
                        </span>
                    ) : (
                        <span className="text-zinc-400 flex items-center">
                            <Minus size={14} /> 0.0%
                        </span>
                    )}
                    <span className="text-zinc-400">vs. mês anterior</span>
                </div>
            )}
        </div>
    );
};
