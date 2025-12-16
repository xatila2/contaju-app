import React from 'react';

interface DashboardCardProps {
    title?: string;
    className?: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, className, children, headerAction }) => {
    return (
        <div className={`bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-brand-100 dark:border-zinc-800 p-5 flex flex-col ${className}`}>
            {(title || headerAction) && (
                <div className="flex justify-between items-center mb-4">
                    {title && (
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            {title}
                        </h3>
                    )}
                    {headerAction}
                </div>
            )}
            <div className="flex-1 min-h-0">
                {children}
            </div>
        </div>
    );
};
