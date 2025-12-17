import React from 'react';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { defaultCurrency } from '../../utils/financialUtils';
import { SemiDonutChart } from './SemiDonutChart';

interface GoalCardProps {
    type: 'revenue' | 'expense' | 'profit';
    realized: number;
    goal: number;
    loading?: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({ type, realized, goal, loading }) => {
    if (loading) return <div className="h-40 w-full bg-zinc-800/50 animate-pulse rounded-xl"></div>;

    const percentage = goal > 0 ? (realized / goal) * 100 : 0;
    const diff = realized - goal;

    // Config based on type
    const config = {
        revenue: {
            title: 'Meta de Receita',
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            goodCondition: diff >= 0
        },
        expense: {
            title: 'Limite de Despesa',
            icon: TrendingDown,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            goodCondition: diff <= 0 // Expense below goal is good
        },
        profit: {
            title: 'Meta de Lucro',
            icon: Target,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            goodCondition: diff >= 0
        }
    }[type];

    const Icon = config.icon;

    return (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-5 relative overflow-hidden group hover:border-gold-500/30 transition duration-300 min-h-[180px] flex flex-col justify-between">
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 ${config.bg} blur-[60px] opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none`}></div>

            <div className="flex justify-between items-start">
                <div className="z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                            <Icon size={16} />
                        </div>
                        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">{config.title}</h3>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-white mb-1">{defaultCurrency(realized)}</span>
                    </div>
                </div>

                {/* Embedded Chart */}
                <div className="w-24 h-24 -mr-2 -mt-2">
                    <SemiDonutChart
                        type={type}
                        value={realized}
                        target={goal}
                        label="" // No label to keep it clean small
                    />
                </div>
            </div>

            {/* Status Footer */}
            <div className="flex justify-between items-center text-xs border-t border-dark-700/50 pt-3 mt-2">
                <span className={`${config.goodCondition ? 'text-emerald-400' : 'text-rose-400'} flex items-center font-medium bg-dark-700/50 px-2 py-1 rounded`}>
                    {percentage.toFixed(1)}% <span className="text-gray-500 ml-1 font-normal">atingido</span>
                </span>
                <span className={`font-mono ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {diff > 0 ? '+' : ''}{defaultCurrency(diff)}
                </span>
            </div>
        </div>
    );
};
