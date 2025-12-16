
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onChange: (start: string, end: string) => void;
    align?: 'left' | 'right';
    onShift?: (direction: 'prev' | 'next') => void;
}

type RangeOption =
    | 'thisWeek'
    | 'thisMonth'
    | 'lastMonth'
    | 'next3Months'
    | 'next6Months'
    | 'thisYear'
    | 'nextYear'
    | 'custom';

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    startDate, endDate, onChange, align = 'left', onShift
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<RangeOption>('thisMonth');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: RangeOption) => {
        setSelectedOption(option);

        if (option === 'custom') {
            // Keeps current dates, user edits manually
            return;
        }

        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (option) {
            case 'thisWeek':
                const day = today.getDay(); // 0 (Sun) - 6 (Sat)
                const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
                start.setDate(diff);
                end.setDate(start.getDate() + 6);
                break;
            case 'thisMonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'next3Months':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 3, 0);
                break;
            case 'next6Months':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 6, 0);
                break;
            case 'thisYear':
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                break;
            case 'nextYear':
                start = new Date(today.getFullYear() + 1, 0, 1);
                end = new Date(today.getFullYear() + 1, 11, 31);
                break;
        }

        onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
        setIsOpen(false);
    };

    const getLabel = () => {
        if (!startDate || !endDate) return 'Selecionar Período';

        // Timezone-safe parsing: parse YYYY-MM-DD strings manually
        const [startY, startM, startD] = startDate.split('-').map(Number);
        const [endY, endM, endD] = endDate.split('-').map(Number);

        const start = new Date(startY, startM - 1, startD); // Month is 0-indexed
        const end = new Date(endY, endM - 1, endD);

        // Get limits of the start month
        const startMonthFirst = new Date(start.getFullYear(), start.getMonth(), 1);
        const startMonthLast = new Date(start.getFullYear(), start.getMonth() + 1, 0);

        // Get limits of the start year
        const startYearFirst = new Date(start.getFullYear(), 0, 1);
        const startYearLast = new Date(start.getFullYear(), 11, 31);

        // Helper to compare dates (ignoring time)
        const isSameDate = (d1: Date, d2: Date) => d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];

        // 1. Check for Full Month
        if (isSameDate(start, startMonthFirst) && isSameDate(end, startMonthLast)) {
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const monthLabel = monthNames[start.getMonth()];

            // Show year if not current year
            if (start.getFullYear() !== new Date().getFullYear()) {
                return `${monthLabel} de ${start.getFullYear()}`;
            }
            return monthLabel;
        }

        // 2. Check for Full Year
        if (isSameDate(start, startYearFirst) && isSameDate(end, startYearLast)) {
            return start.getFullYear().toString();
        }

        // 3. Custom Range - Format nicely
        // If current year, omit year. Else show year.
        const currentYear = new Date().getFullYear();
        const startFormat = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: start.getFullYear() !== currentYear ? '2-digit' : undefined });
        const endFormat = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: end.getFullYear() !== currentYear ? '2-digit' : undefined });

        if (selectedOption === 'thisWeek') return 'Esta Semana';

        return `${startFormat} - ${endFormat}`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors w-full md:w-auto"
            >
                {onShift && (
                    <div onClick={(e) => { e.stopPropagation(); onShift('prev'); }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-md mr-1">
                        <ChevronDown size={14} className="rotate-90 text-zinc-400" />
                    </div>
                )}
                <Calendar size={16} className="text-zinc-400" />
                <span className="font-medium">{getLabel()}</span>
                {onShift && (
                    <div onClick={(e) => { e.stopPropagation(); onShift('next'); }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-md ml-1">
                        <ChevronDown size={14} className="-rotate-90 text-zinc-400" />
                    </div>
                )}
                {!onShift && <ChevronDown size={14} className="text-zinc-400" />}
            </button>

            {isOpen && (
                <div className={`absolute z-50 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 ${align === 'right' ? 'right-0' : 'left-0'}`}>
                    <div className="space-y-1 mb-3">
                        {[
                            { id: 'thisWeek', label: 'Esta Semana' },
                            { id: 'thisMonth', label: 'Este Mês' },
                            { id: 'lastMonth', label: 'Mês Passado' },
                            { id: 'next3Months', label: 'Próximos 3 Meses' },
                            { id: 'next6Months', label: 'Próximos 6 Meses' },
                            { id: 'thisYear', label: 'Este Ano' },
                            { id: 'nextYear', label: 'Próximo Ano' },
                            { id: 'custom', label: 'Personalizado' },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleSelect(opt.id as RangeOption)}
                                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex justify-between items-center ${selectedOption === opt.id ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                            >
                                {opt.label}
                                {selectedOption === opt.id && <Check size={14} />}
                            </button>
                        ))}
                    </div>

                    {/* Manual Inputs always visible for reference or editing if custom */}
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center space-x-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setSelectedOption('custom'); onChange(e.target.value, endDate); }}
                            className="w-1/2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-yellow-500 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <span className="text-zinc-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setSelectedOption('custom'); onChange(startDate, e.target.value); }}
                            className="w-1/2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-yellow-500 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
