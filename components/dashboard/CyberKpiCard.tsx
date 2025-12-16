import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CyberKpiCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    trend?: number;
    color?: 'blue' | 'cyan' | 'purple' | 'emerald' | 'amber';
    formatter?: (val: number) => string;
}

export const CyberKpiCard: React.FC<CyberKpiCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    formatter = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}) => {

    const colorStyles = {
        blue: { bg: 'bg-blue-500', text: 'text-blue-500', glow: 'shadow-blue-500/20' },
        cyan: { bg: 'bg-cyan-500', text: 'text-cyan-500', glow: 'shadow-cyan-500/20' },
        purple: { bg: 'bg-purple-500', text: 'text-purple-500', glow: 'shadow-purple-500/20' },
        emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', glow: 'shadow-emerald-500/20' },
        amber: { bg: 'bg-amber-500', text: 'text-amber-500', glow: 'shadow-amber-500/20' },
    };

    const style = colorStyles[color];

    return (
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between group hover:border-slate-700 transition-all">
            {/* Background Glow Effect */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${style.bg} opacity-[0.05] blur-2xl group-hover:opacity-[0.1] transition-opacity`} />

            <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                    {title}
                </p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                        {formatter(value)}
                    </h3>
                    {trend !== undefined && (
                        <span className={`text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {trend >= 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                </div>
            </div>

            <div className={`p-3 rounded-xl ${style.bg} bg-opacity-10 ${style.text} flex items-center justify-center shrink-0`}>
                <Icon size={22} strokeWidth={2} />
            </div>
        </div>
    );
};
