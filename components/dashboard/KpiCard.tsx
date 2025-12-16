import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { DashboardCard } from '../ui/DashboardCard';

interface KpiCardProps {
    title: string;
    value: number;
    prevValue?: number; // For trend
    projected?: number;
    icon?: LucideIcon;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    formatter?: (val: number) => string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
    title,
    value,
    prevValue,
    projected,
    icon: Icon,
    variant = 'default',
    formatter = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}) => {

    // Trend Logic
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    let trendValue = 0;

    // If we have a projected value, maybe we compare against that? 
    // Standard KPI is usually vs Goal or vs Last Month. 
    // Let's assume prevValue is "Last Month" or "Target".

    // Simply showing Value

    const colors = {
        default: 'text-zinc-900 dark:text-white',
        success: 'text-status-success',
        warning: 'text-status-warning',
        danger: 'text-status-danger',
        info: 'text-status-info'
    };

    const bgColors = {
        default: 'bg-zinc-100 dark:bg-zinc-800',
        success: 'bg-emerald-50 dark:bg-emerald-900/20',
        warning: 'bg-amber-50 dark:bg-amber-900/20',
        danger: 'bg-rose-50 dark:bg-rose-900/20',
        info: 'bg-blue-50 dark:bg-blue-900/20'
    };

    const iconColors = {
        default: 'text-zinc-500',
        success: 'text-status-success',
        warning: 'text-status-warning',
        danger: 'text-status-danger',
        info: 'text-status-info'
    };

    return (
        <div className={`rounded-xl p-5 border shadow-sm flex flex-col justify-between h-full bg-white dark:bg-surface-dark border-zinc-200 dark:border-zinc-800`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{title}</span>
                {Icon && (
                    <div className={`p-2 rounded-lg ${bgColors[variant]}`}>
                        <Icon size={18} className={iconColors[variant]} />
                    </div>
                )}
            </div>

            <div>
                <h3 className={`text-2xl font-bold tracking-tight ${colors.default}`}>
                    {formatter(value)}
                </h3>

                {projected !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-zinc-400">Previsto:</span>
                        <span className="text-sm font-mono font-medium text-zinc-600 dark:text-zinc-300">
                            {formatter(projected)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
