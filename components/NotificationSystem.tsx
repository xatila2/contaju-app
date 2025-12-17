import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, Clock, Calendar, Bell, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Transaction, NotificationSettings } from '../types';

interface NotificationSystemProps {
    transactions: Transaction[];
    settings: NotificationSettings;
}

interface AlertItem {
    id: string;
    type: 'overdue' | 'today' | 'upcoming';
    title: string;
    message: string;
    count: number;
    totalAmount: number;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ transactions, settings }) => {
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(true);
    const navigate = useNavigate();

    // Calculate alerts based on transactions and current date
    const alerts = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const alertsList: AlertItem[] = [];

        // Helper to format currency
        const fmt = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val);

        // Filter transactions by Custom Date Range if active
        let filteredTransactions = transactions;
        if (settings.customRangeActive && settings.customRangeStart && settings.customRangeEnd) {
            filteredTransactions = transactions.filter(t =>
                t.dueDate >= settings.customRangeStart &&
                t.dueDate <= settings.customRangeEnd
            );
        }

        // 1. Overdue Alerts
        if (settings.showOverdue) {
            const overdueTxs = filteredTransactions.filter(t =>
                t.status !== 'reconciled' &&
                t.type === 'expense' && // Usually we care more about paying bills on time
                (t.status === 'overdue' || t.dueDate < today)
            );

            if (overdueTxs.length > 0) {
                const total = overdueTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                alertsList.push({
                    id: 'alert-overdue',
                    type: 'overdue',
                    title: 'Contas Vencidas',
                    message: `Você tem ${overdueTxs.length} conta(s) vencida(s) totalizando ${fmt(total)}.`,
                    count: overdueTxs.length,
                    totalAmount: total
                });
            }
        }

        // 2. Due Today Alerts
        if (settings.showDueToday) {
            const dueTodayTxs = filteredTransactions.filter(t =>
                t.status !== 'reconciled' &&
                t.type === 'expense' &&
                t.dueDate === today
            );

            if (dueTodayTxs.length > 0) {
                const total = dueTodayTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                alertsList.push({
                    id: 'alert-today',
                    type: 'today',
                    title: 'Vencendo Hoje',
                    message: `${dueTodayTxs.length} conta(s) vencem hoje. Total: ${fmt(total)}.`,
                    count: dueTodayTxs.length,
                    totalAmount: total
                });
            }
        }

        // 3. Upcoming Alerts
        if (settings.showUpcoming && settings.daysInAdvance > 0) {
            const upcomingDate = new Date();
            upcomingDate.setDate(upcomingDate.getDate() + settings.daysInAdvance);
            const upcomingStr = upcomingDate.toISOString().split('T')[0];

            const upcomingTxs = filteredTransactions.filter(t =>
                t.status !== 'reconciled' &&
                t.type === 'expense' &&
                t.dueDate > today &&
                t.dueDate <= upcomingStr
            );

            if (upcomingTxs.length > 0) {
                const total = upcomingTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
                alertsList.push({
                    id: 'alert-upcoming',
                    type: 'upcoming',
                    title: 'A Vencer em Breve',
                    message: `${upcomingTxs.length} conta(s) nos próximos ${settings.daysInAdvance} dias.`,
                    count: upcomingTxs.length,
                    totalAmount: total
                });
            }
        }

        return alertsList;
    }, [transactions, settings]);

    // Load snoozed alerts from localStorage on mount
    useEffect(() => {
        try {
            const snoozed = JSON.parse(localStorage.getItem('finflux_snoozed_alerts') || '{}');
            const now = Date.now();
            // Filter IDs that are still within the "snooze" period (e.g., 24 hours)
            const validDismissed = Object.keys(snoozed).filter(id => {
                const timestamp = snoozed[id];
                const snoozeDuration = 1000 * 60 * 60 * 24; // 24 hours
                return (now - timestamp) < snoozeDuration;
            });
            setDismissedIds(validDismissed);
        } catch (e) {
            console.error("Error loading snoozed alerts", e);
        }
    }, []);

    const activeAlerts = alerts.filter(a => !dismissedIds.includes(a.id));

    const handleDismiss = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDismissedIds(prev => [...prev, id]);

        // Save to localStorage with timestamp
        try {
            const snoozed = JSON.parse(localStorage.getItem('finflux_snoozed_alerts') || '{}');
            snoozed[id] = Date.now();
            localStorage.setItem('finflux_snoozed_alerts', JSON.stringify(snoozed));
        } catch (e) {
            console.error("Error saving snoozed alert", e);
        }
    };

    const handleAlertClick = (type: AlertItem['type']) => {
        let query = '';
        if (type === 'overdue') query = '?status=overdue';
        else if (type === 'today') query = '?date=today';
        else if (type === 'upcoming') query = '?status=pending';

        navigate(`/transactions${query}`);
    };

    if (activeAlerts.length === 0 || !isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col space-y-3 max-w-sm w-full">
            {settings.customRangeActive && (
                <div className="bg-zinc-800 text-white text-xs px-3 py-1 rounded-full self-end shadow-lg flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                    <Filter size={10} />
                    Filtro de Data Ativo
                </div>
            )}
            {activeAlerts.map(alert => {
                let bgColor = '';
                let iconColor = '';
                let Icon = Bell;

                if (alert.type === 'overdue') {
                    bgColor = 'bg-rose-50 dark:bg-rose-900/95 border-rose-200 dark:border-rose-800';
                    iconColor = 'text-rose-600 dark:text-rose-400';
                    Icon = AlertCircle;
                } else if (alert.type === 'today') {
                    bgColor = 'bg-yellow-50 dark:bg-yellow-900/95 border-yellow-200 dark:border-yellow-800';
                    iconColor = 'text-yellow-600 dark:text-yellow-400';
                    Icon = Clock;
                } else {
                    bgColor = 'bg-blue-50 dark:bg-blue-900/95 border-blue-200 dark:border-blue-800';
                    iconColor = 'text-blue-600 dark:text-blue-400';
                    Icon = Calendar;
                }

                return (
                    <div
                        key={alert.id}
                        onClick={() => handleAlertClick(alert.type)}
                        className={`p-4 rounded-xl border shadow-xl backdrop-blur-md flex items-start justify-between animate-slide-up transition-all cursor-pointer ${bgColor} hover:scale-[1.02] transform`}
                    >
                        <div className="flex items-start space-x-3 pointer-events-none">
                            <div className={`p-2 rounded-full bg-white/50 dark:bg-black/20 ${iconColor}`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <h4 className={`font-bold text-sm ${iconColor}`}>{alert.title}</h4>
                                <p className="text-xs text-zinc-600 dark:text-zinc-200 mt-1 font-medium leading-relaxed">
                                    {alert.message}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => handleDismiss(alert.id, e)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 hover:bg-black/5 rounded group"
                        >
                            <X size={16} className="group-hover:text-zinc-700 dark:group-hover:text-white transition-colors" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
