
import React, { useState } from 'react';
import { CardConfig, ChartType } from '../../types';
import { getCardDefinition } from '../../dashboard/registry';
import { MoreVertical, Maximize2, Trash2, Edit2, BarChart2, PieChart, TrendingUp, Table, Settings, ArrowUpRight, ArrowDownRight, Target, Wallet, ChevronRight, AlertCircle, PenLine, X } from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { RevenueGoalWidget } from '../RevenueGoalWidget';

// --- COLOR PALETTE ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface ChartCardProps {
    cardId: string;
    config?: CardConfig;
    data: any; // Render-ready data
    onRemove?: () => void;
    onEditConfig?: (config: CardConfig) => void;
    isEditMode?: boolean;
    style?: React.CSSProperties; // Grid Layout style (position)
    // Grid props
    className?: string;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onTouchEnd?: React.TouchEventHandler;
    onClick?: React.MouseEventHandler;
}

export const ChartCard = React.forwardRef<HTMLDivElement, ChartCardProps>((props, ref) => {
    const {
        cardId, config, data, onRemove, onEditConfig, isEditMode, style, className, onMouseDown, onMouseUp, onTouchEnd, onClick
    } = props;

    // Helper to format currency
    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Extract definition using ID 
    const definitionId = cardId.includes('__inst_') ? cardId.split('__inst_')[0] : cardId;
    const definition = getCardDefinition(definitionId);

    const [showMenu, setShowMenu] = useState(false);

    if (!definition) {
        return <div ref={ref} style={style} className={`bg-red-50 p-4 border border-red-200 rounded ${className}`} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onTouchEnd={onTouchEnd}>Card Desconhecido: {cardId}</div>;
    }

    const type = config?.type || config?.chartType || definition.defaultType;
    const title = config?.customTitle || definition.title;
    const hideTitle = config?.hideTitle;

    // --- DYNAMIC STYLES ---
    const hasCustomTextColor = !!config?.style?.textColor;
    const txtPrimary = hasCustomTextColor ? '' : 'text-zinc-900 dark:text-zinc-100';
    const txtSecondary = hasCustomTextColor ? 'opacity-70' : 'text-zinc-500 dark:text-zinc-400';
    const txtMuted = hasCustomTextColor ? 'opacity-50' : 'text-zinc-400 dark:text-zinc-500';
    const customAccent = config?.style?.accentColor;

    // --- RENDERERS ---

    const renderWorkingCapital = () => {
        const { target, current, freeCash, potentialProfit, shortfall } = data || {};
        const safeCurrent = current || 0;
        const safeTarget = target || 1;
        const percent = Math.min(100, Math.max(0, (safeCurrent / safeTarget) * 100));

        // Colors
        let color = '#ef4444'; // Red < 60%
        if (percent >= 100) color = '#10b981'; // Green
        else if (percent >= 60) color = '#f59e0b'; // Yellow

        // Gradient for Gauge
        const gradientId = `grad_wc_${cardId}`;
        const gradientStops = percent >= 100
            ? <><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></>
            : percent >= 60
                ? <><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></>
                : <><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#b91c1c" /></>;

        const chartData = [
            { name: 'Progress', value: safeCurrent, fill: `url(#${gradientId})` },
            { name: 'Remaining', value: Math.max(0, safeTarget - safeCurrent), fill: hasCustomTextColor ? 'currentColor' : '#e4e4e7' }
        ];

        return (
            <div className={`flex flex-col h-full justify-between -m-4 p-4 rounded-xl ${config?.style?.enableGradient ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white' : ''}`}>

                {/* Block 1: Alvo vs Atual */}
                <div className="flex flex-col gap-1 mb-2">
                    <div className="flex justify-between items-center">
                        <div className={`text-xs font-bold uppercase tracking-wider ${config?.style?.enableGradient ? 'text-white/70' : 'text-zinc-400'}`}>Saldo Atual</div>
                        <div className={`font-mono font-bold ${config?.style?.enableGradient ? 'text-white' : txtPrimary}`}>{formatMoney(safeCurrent)}</div>
                    </div>
                    <div className="flex justify-between items-center border-t border-dashed border-white/20 pt-1">
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${config?.style?.enableGradient ? 'text-white/50' : 'text-zinc-400'}`}>Capital de Giro (Meta)</div>
                        <div className={`font-mono text-sm ${config?.style?.enableGradient ? 'text-white/80' : txtSecondary}`}>-{formatMoney(safeTarget)}</div>
                    </div>
                </div>



                {/* Block 2: Gauge */}
                <div className="relative flex-1 min-h-[120px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                        <RePieChart>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                                    {gradientStops}
                                </linearGradient>
                            </defs>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="70%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius="65%"
                                outerRadius="100%"
                                paddingAngle={0}
                                dataKey="value"
                                cornerRadius={6}
                                stroke="none"
                            >
                                <Cell fill={`url(#${gradientId})`} />
                                <Cell fill={config?.style?.enableGradient ? 'rgba(255,255,255,0.2)' : (hasCustomTextColor ? 'currentColor' : '#e4e4e7')} />
                            </Pie>
                            <Tooltip formatter={(val: number) => formatMoney(val)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        </RePieChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-2 left-0 right-0 text-center flex flex-col items-center">
                        <div className={`text-2xl font-bold ${config?.style?.enableGradient ? 'text-white' : txtPrimary}`}>
                            {Math.round(percent)}%
                        </div>
                        <div className={`text-xs font-bold mt-1 ${config?.style?.enableGradient ? 'text-white/80' : 'text-zinc-500'}`}>
                            {safeCurrent < safeTarget
                                ? <span className="text-rose-500 font-medium whitespace-nowrap">Atenção: abaixo do capital de giro ideal</span>
                                : <span className="text-emerald-500 font-medium whitespace-nowrap">Reserva atendida ✅</span>
                            }
                        </div>
                    </div>
                </div>

                {/* Block 3: Free Cash */}
                <div className={`mt-4 pt-4 border-t ${config?.style?.enableGradient ? 'border-white/20' : 'border-zinc-100 dark:border-zinc-800'}`}>
                    {(freeCash || 0) > 0 ? (
                        <div>
                            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${config?.style?.enableGradient ? 'text-white/70' : 'text-zinc-400'}`}>Caixa Livre</div>
                            <div className={`text-xl font-bold ${config?.style?.enableGradient ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatMoney(freeCash)}</div>
                            <div className={`text-[10px] mt-1 font-medium ${config?.style?.enableGradient ? 'text-white/60' : 'text-emerald-600/70 dark:text-emerald-400/70'}`}>
                                Potencial de Lucro: {formatMoney(potentialProfit || 0)}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-2">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${config?.style?.enableGradient ? 'bg-white/20 text-white' : 'text-orange-500 bg-orange-50 dark:bg-orange-900/20'}`}>
                                Recompondo Reserva
                            </span>
                        </div>
                    )}
                </div>
            </div >
        );
    };

    const renderCaixaAtual = () => {
        const value = data.value || 0;
        const projected = data.projectedValue || 0;
        const variation = projected - value;

        return (
            <div className={`flex flex-col h-full justify-between -m-4 p-6 ${hasCustomTextColor ? 'text-white' : ''}`}>
                <div>
                    <div className={`text-sm font-medium uppercase tracking-wider mb-1 opacity-70`}>{config.customTitle}</div>
                    <div className={`text-xs opacity-60 mb-4`}>{data.subtext}</div>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="text-3xl font-bold tracking-tight">{formatMoney(value)}</div>
                        <div className="text-sm font-medium opacity-80 mt-1">Saldo em contas</div>
                    </div>

                    <div className="pt-4 border-t border-white/20">
                        <div className="flex justify-between items-center text-sm">
                            <span className="opacity-80">Previsto do Mês</span>
                            <span className="font-mono font-bold">{formatMoney(projected)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                            <span className="opacity-80">Variação Prevista</span>
                            <span className="font-mono font-bold">{formatMoney(variation)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Default Fallback
    const renderDefaultBankContent = () => {
        // Data is the single bank object
        const bank = data as any;
        if (!bank || !bank.name) return <div className="text-zinc-400 p-2">Dados da conta indisponíveis</div>;

        const pendingCount = bank.unreconciledCount || 0;
        const isReconciled = pendingCount === 0;

        return (
            <div className="flex flex-col justify-between h-full w-full min-h-[90px]">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors truncate">{bank.name}</span>
                    <div className={`p-1.5 rounded-full bg-${bank.color}-100 dark:bg-${bank.color}-900/30 text-${bank.color}-600 dark:text-${bank.color}-400 shrink-0 ml-2`}>
                        <Wallet size={14} />
                    </div>
                </div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 mb-0.5">Saldo Atual</div>
                    <div className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate" title={formatMoney(bank.currentBalance || bank.initialBalance)}>
                        {formatMoney(bank.currentBalance || bank.initialBalance)}
                    </div>

                    <div className="mt-3 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${isReconciled ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <span className={`text-xs font-medium ${isReconciled ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {isReconciled ? 'Em dia' : `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`}
                            </span>
                        </div>
                        <button className="text-[10px] font-bold uppercase text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
                            Conciliar <ChevronRight size={10} />
                        </button>
                    </div>

                    {bank.predictedBalance !== undefined && false && ( // Hidden in favor of Reconciliation status as per request
                        <div className="mt-2 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-zinc-500 dark:text-zinc-400">Previsto:</span>
                                <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{formatMoney(bank.predictedBalance)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (config?.customTitle === 'Caixa Atual') {
        return (
            <div className={`relative overflow-hidden rounded-2xl border bg-card text-card-foreground p-6 flex flex-col justify-between transition-all duration-200 ${className}`} onClick={onClick}>
                {renderCaixaAtual()}
            </div>
        );
    }

    if (config?.customTitle === 'Saúde do Caixa') {
        return (
            <div className={`relative overflow-hidden rounded-2xl border bg-card text-card-foreground p-6 flex flex-col justify-between transition-all duration-200 ${className}`} onClick={onClick}>
                {renderWorkingCapital()}
            </div>
        );
    }

    // ... Other renderers ...

    const renderCustomBankList = () => {
        // Full list of banks in a grid
        const accounts = Array.isArray(data) ? data : [];
        if (!accounts.length) return <div className="p-4 text-zinc-400">Nenhuma conta bancária.</div>;
        // ... (Similar logic if needed, but bank list is complex)
        return <div className={txtMuted}>Lista de bancos (Visualização Simplificada)</div>;
    };

    // --- MINIATURES FOR EDIT MODE ---
    const renderMiniature = () => {
        if (type === 'kpi_gauge') return (
            <div className="flex items-center gap-2 text-zinc-400">
                <PieChart size={14} /> <span className="text-xs">Meia-Lua</span>
            </div>
        );
        // ... Add others if needed
        return null;
    };



    const renderRichKPI = () => {
        // Data expected: { value, label, projectedValue?, trend?, color? }
        const isUp = (data?.trend || 'up') === 'up';
        const Icon = isUp ? ArrowUpRight : ArrowDownRight;

        // Colors mapping
        // If has custom text color, we try to blend in, or stick to semantic colors? 
        // Usually KPIs need semantic colors (Profit = Green). Let's keep semantics for the Icon unless Accent is forced.

        const defaultIconColor = isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
        const defaultBgColor = isUp ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20';

        const iconColor = customAccent ? '' : defaultIconColor;
        const iconBg = customAccent ? 'bg-current opacity-10' : defaultBgColor;

        const hasProjection = data?.projectedValue !== undefined;

        // Responsive sizing
        const valueFontSize = isSmallCard ? 'text-lg' : isMediumCard ? 'text-2xl' : 'text-3xl';
        const projectedFontSize = isSmallCard ? 'text-sm' : isMediumCard ? 'text-base' : 'text-lg';

        return (
            <div className="flex flex-col justify-between h-full w-full p-2">
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-medium tracking-wide ${txtSecondary}`}>{title}</span>
                    <div className={`p-1.5 rounded-lg ${iconBg}`} style={{ color: customAccent || undefined }}>
                        <Icon size={isSmallCard ? 12 : 16} className={iconColor} style={{ color: customAccent || undefined }} />
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${hasCustomTextColor ? 'bg-current' : 'bg-zinc-900 dark:bg-zinc-100'}`}></span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${txtMuted}`}>Realizado</span>
                        </div>
                        <h3 className={`text-2xl lg:text-3xl font-bold tracking-tight truncate ${txtPrimary}`} title={formatMoney(data?.value || 0)}>
                            {formatMoney(data?.value || 0)}
                        </h3>
                    </div>

                    {hasProjection && !isSmallCard && (
                        <div className={`relative pl-3 border-l-2 border-dashed ${hasCustomTextColor ? 'border-current opacity-30' : 'border-zinc-300 dark:border-zinc-700'}`}>
                            <div className="flex items-center space-x-2 mb-0.5">
                                <Target size={10} className={customAccent ? '' : "text-yellow-600 dark:text-yellow-500"} style={{ color: customAccent || undefined }} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${customAccent ? '' : 'text-yellow-600 dark:text-yellow-500'}`} style={{ color: customAccent || undefined }}>Previsto</span>
                            </div>
                            <p className={`${projectedFontSize} font-semibold font-mono truncate ${txtSecondary}`}>
                                {formatMoney(data.projectedValue)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderKPI = () => {
        const value = typeof data === 'number' ? data : data?.value || 0;
        const formatted = formatMoney(value);
        const kpiFontSize = isSmallCard ? 'text-xl' : isMediumCard ? 'text-3xl' : 'text-4xl';
        const subtextSize = isSmallCard ? 'text-xs' : 'text-sm';
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <span className={`${kpiFontSize} font-bold truncate max-w-full px-2 ${txtPrimary}`}>{formatted}</span>
                {data?.subtext && !isSmallCard && <span className={`${subtextSize} mt-1 ${txtSecondary}`}>{data.subtext}</span>}
            </div>
        );
    };



    const renderReconciliation = () => {
        return (
            <div className="flex flex-col justify-between h-full p-2">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Conciliação</h3>
                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-xs px-2 py-1 rounded-full font-bold">Em dia</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-4 mb-2">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `85%` }}></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400 text-xs">Última sinc: Hoje</span>
                    <button className="text-yellow-600 dark:text-yellow-500 font-bold hover:underline text-xs flex items-center">
                        Conciliar <ChevronRight size={12} />
                    </button>
                </div>
            </div>
        );
    };

    const renderRevenueGoal = () => {
        // Data should contain transactions and planningData
        if (!data || !data.transactions) return <div className="p-4">Carregando dados da meta...</div>;
        return (
            <div className="h-full w-full -m-4 sm:-m-0 scale-95 sm:scale-100 origin-top-left">
                <RevenueGoalWidget
                    transactions={data.transactions}
                    planningData={data.planningData}
                    dateRange={data.dateRange}
                    theme={data.theme || 'light'}
                />
            </div>
        );
    };

    // Helper for Axis formatting
    const axisFormatter = (val: number) => {
        if (Math.abs(val) >= 1000000) return `R$${(val / 1000000).toFixed(1)}M`;
        if (Math.abs(val) >= 1000) return `R$${(val / 1000).toFixed(0)}k`;
        return `R$${val}`;
    };

    const NoDataState = () => (
        <div className="flex flex-col items-center justify-center h-full w-full opacity-40">
            <BarChart2 size={32} className="mb-2 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Sem dados para o período</span>
        </div>
    );

    const renderLine = (variant: 'line' | 'area' = 'area') => {
        const chartColors = customAccent ? [customAccent, ...COLORS] : COLORS;
        const axisColor = hasCustomTextColor ? 'currentColor' : '#71717A';
        const gridColor = hasCustomTextColor ? 'currentColor' : '#27272a';

        // Empty State Check
        const chartData = Array.isArray(data) ? data : [];
        if (chartData.length === 0 || chartData.every((d: any) => d.value === 0)) {
            return <NoDataState />;
        }

        return (
            <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                {variant === 'area' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`color-${cardId}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.1} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: axisColor, fontSize: 10 }}
                            dy={10}
                            hide={isSmallCard}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: axisColor, fontSize: 10 }}
                            tickFormatter={axisFormatter}
                            width={60}
                            hide={isSmallCard}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [formatMoney(value), 'Valor']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={chartColors[0]}
                            fillOpacity={1}
                            fill={`url(#color-${cardId})`}
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationEasing="ease-out"
                            activeDot={{ r: 6, strokeWidth: 0, fill: chartColors[0] }}
                        />
                        {/* Support for second value line if needed */}
                        {chartData.length > 0 && chartData[0].value2 !== undefined &&
                            <Area type="monotone" dataKey="value2" stroke="#82ca9d" fillOpacity={0} />
                        }
                    </AreaChart>
                ) : (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.1} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: axisColor, fontSize: 10 }}
                            dy={10}
                            hide={isSmallCard}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: axisColor, fontSize: 10 }}
                            tickFormatter={axisFormatter}
                            width={60}
                            hide={isSmallCard}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [formatMoney(value), 'Valor']}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={chartColors[0]}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationEasing="ease-out"
                            activeDot={{ r: 6, strokeWidth: 0, fill: chartColors[0] }}
                        />
                    </LineChart>
                )}
            </ResponsiveContainer>
        );
    };

    const renderBar = (layout: 'vertical' | 'horizontal', stacked = false) => {
        const chartColors = customAccent ? [customAccent, ...COLORS] : COLORS;
        const axisColor = hasCustomTextColor ? 'currentColor' : '#71717A';
        const gridColor = hasCustomTextColor ? 'currentColor' : '#E4E4E5';

        // Empty State Check
        const chartData = Array.isArray(data) ? data : [];
        if (chartData.length === 0 || chartData.every((d: any) => d.value === 0)) {
            return <NoDataState />;
        }

        return (
            <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                <BarChart data={chartData} layout={layout === 'horizontal' ? 'vertical' : 'horizontal'} margin={layout === 'horizontal' ? { top: 0, right: 20, left: 20, bottom: 0 } : { top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} vertical={layout === 'vertical' ? false : true} horizontal={layout === 'horizontal' ? false : true} />
                    {layout === 'horizontal' ? (
                        <>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }} interval={0} />
                        </>
                    ) : (
                        <>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} dy={10} hide={isSmallCard} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} tickFormatter={axisFormatter} width={60} hide={isSmallCard} />
                        </>
                    )}
                    <Tooltip
                        cursor={{ fill: hasCustomTextColor ? 'rgba(255,255,255,0.1)' : '#f4f4f5' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatMoney(value), 'Valor']}
                    />
                    {stacked ? (
                        <>
                            <Bar dataKey="value" stackId="a" fill={chartColors[0]} radius={[0, 0, 4, 4]} isAnimationActive={false} />
                            <Bar dataKey="value2" stackId="a" fill={chartColors[1]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        </>
                    ) : (
                        <Bar
                            dataKey="value"
                            fill={chartColors[0]}
                            radius={layout === 'horizontal' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                            barSize={layout === 'horizontal' ? 20 : undefined}
                            isAnimationActive={false}
                        />
                    )}
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderGauge = () => {
        // Data: value (current), target (max/meta), label, status, details[]
        const val = typeof data === 'number' ? data : data?.value || 0;
        const target = data?.target || 100;
        const percent = Math.min(100, Math.max(0, (val / target) * 100));

        // Determine Color based on Status or ID
        let color = '#10b981';
        let gradientId = `grad_${cardId}`;
        let gradientStops = <><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></>;

        const status = data?.status; // 'success', 'warning', 'danger'

        if (status === 'danger') {
            gradientStops = <><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#b91c1c" /></>;
            color = '#ef4444';
        } else if (status === 'warning') {
            gradientStops = <><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></>;
            color = '#f59e0b';
        } else if (status === 'success') {
            gradientStops = <><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></>;
            color = '#10b981';
        } else {
            // Fallback to definition ID logic if no explicit status
            if (definitionId === 'gauge_despesa_teto' || definitionId === 'despesa_meta_gauge') {
                gradientStops = <><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#ec4899" /></>;
            } else if (definitionId === 'lucro_meta_gauge') {
                gradientStops = <><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#d946ef" /></>;
            }
        }

        const chartData = [
            { name: 'Progress', value: val <= 0 ? 0.0001 : val, fill: `url(#${gradientId})` },
            { name: 'Remaining', value: Math.max(0, target - val), fill: hasCustomTextColor ? 'currentColor' : '#e4e4e7' }
        ];

        return (
            <div className="relative flex flex-col h-full w-full min-w-0">
                {/* Top: Gauge */}
                <div className="relative flex-1 min-h-[140px] -mt-4 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                        <RePieChart>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                                    {gradientStops}
                                </linearGradient>
                            </defs>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="70%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius="70%"
                                outerRadius="100%"
                                paddingAngle={0}
                                dataKey="value"
                                cornerRadius={6}
                                stroke="none"
                            >
                                <Cell fill={`url(#${gradientId})`} />
                                <Cell fill={hasCustomTextColor ? 'currentColor' : '#e4e4e7'} opacity={0.2} />
                            </Pie>
                            <Tooltip formatter={(val: number) => formatMoney(val > 0.01 ? val : 0)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        </RePieChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center pointer-events-none">
                        <span className={`text-2xl font-bold tracking-tight ${txtPrimary}`}>{formatMoney(val)}</span>
                    </div>
                </div>

                {/* Bottom: Details Grid */}
                {data?.details && Array.isArray(data.details) ? (
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                        {data.details.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">{item.label}</span>
                                <span className={`text-sm font-semibold truncate ${item.highlight || 'text-zinc-700 dark:text-zinc-300'}`}>
                                    {item.isCurrency ? formatMoney(item.value) : item.isPercent ? `${Math.round(item.value)}%` : item.value}
                                    {item.suffix && <span className="text-[10px] ml-0.5 opacity-70">{item.suffix}</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center pb-2">
                        <span className={`text-xs font-medium ${txtSecondary}`}>Meta: {formatMoney(target)}</span>
                    </div>
                )}
            </div>
        );
    };

    const renderCustomBankCard = () => {
        return renderDefaultBankContent();
    };

    const renderGradientKPI = () => {
        // Determine variant based on ID
        const variant = definitionId.includes('despesa') ? 'expense' : definitionId.includes('fluxo') || definitionId === 'fcl_card' ? 'fcl' : 'revenue';

        let gradientClass = 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-white';
        if (variant === 'expense') gradientClass = 'bg-gradient-to-br from-orange-500 to-red-700 text-white';

        const val = data?.value || 0;
        const predicted = data?.projectedValue || 0;
        const diff = data?.diff !== undefined ? data.diff : (predicted - val);

        // FCL Logic
        if (variant === 'fcl') {
            // Green (>0), Yellow (~0), Red (<0)
            if (val >= 0) gradientClass = 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white';
            else gradientClass = 'bg-gradient-to-br from-rose-500 to-rose-700 text-white';
        }

        return (
            <div className={`h-full w-full p-4 rounded-xl flex flex-col justify-between shadow-md ${gradientClass}`}>
                <div className="flex justify-between items-start">
                    <span className="text-white text-sm font-medium">{title}</span>
                    <div className="p-1 bg-white/20 rounded">
                        {data?.trend === 'down' ? <ArrowDownRight size={16} className="text-white" /> : <TrendingUp size={16} className="text-white" />}
                    </div>
                </div>

                <div>
                    <div className="text-xs text-white/90 uppercase tracking-wider font-bold mb-1">Realizado</div>
                    <div className="text-2xl lg:text-3xl font-bold text-white mb-3 truncate" title={formatMoney(val)}>{formatMoney(val)}</div>

                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white/50" style={{ width: `${Math.min(100, Math.abs(val / (predicted || 1)) * 100)}%` }}></div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/10 pt-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/80 uppercase">Previsto</span>
                            <span className="font-mono text-sm font-semibold text-white">{formatMoney(predicted)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-white/80 uppercase">Diferença</span>
                            <span className="font-mono text-sm font-semibold text-white">{formatMoney(diff)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const renderPie = () => {
        const chartColors = customAccent ? [customAccent, ...COLORS] : COLORS;
        const isDonut = type?.includes('donut');

        return (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RePieChart>
                    <Pie
                        data={Array.isArray(data) ? data : []}
                        cx="50%"
                        cy="50%"
                        innerRadius={isDonut ? "60%" : "0%"}
                        outerRadius="80%"
                        paddingAngle={5}
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-out"
                    >
                        {(Array.isArray(data) ? data : []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatMoney(value)} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', color: hasCustomTextColor ? 'inherit' : undefined }} />
                </RePieChart>
            </ResponsiveContainer>
        );
    };

    const renderContent = () => {
        // Special renderers
        if (type === 'custom_bank_card') return renderCustomBankCard();
        if (type === 'custom_bank_list') return renderCustomBankList();
        if (type === 'custom_revenue_goal') return renderRevenueGoal();
        if (type === 'custom_working_capital') return renderWorkingCapital();

        // Gradient Cards
        if (type === 'kpi_gradient') return renderGradientKPI();

        if (!data || (Array.isArray(data) && data.length === 0)) return <div className="flex items-center justify-center h-full text-zinc-400 text-sm">Sem dados para exibir</div>;

        // --- MAPPING ---

        // KPIS
        if (type === 'kpi_gauge') return renderGauge();

        if (type.startsWith('kpi_')) {
            if (type === 'kpi_rich') return renderRichKPI();
            // Map others to simple KPI or future generic KPI renderer
            return renderKPI();
        }

        // BARS
        if (type.includes('bar_horizontal') || type.includes('barra_horizontal')) return renderBar('horizontal');
        if (type.includes('barras_empilhadas')) return renderBar('vertical', true);
        if (type.includes('bar')) return renderBar('vertical');
        if (type === 'waterfall') return renderBar('vertical'); // Fallback

        // LINES / AREA
        if (type.includes('area') || type.includes('linha_area')) return renderLine('area');
        if (type.includes('linha') || type.includes('line')) return renderLine('line');

        // PIES
        if (type.includes('pizza') || type.includes('pie') || type.includes('donut')) return renderPie();

        // Default
        return renderLine('area');
    };

    // For custom widgets like Bank List or Revenue Goal, we might want to suppress the default Card Header/Container
    // if the widget handles it itself.
    // However, for consistency and Drag handle accessibility, we usually keep the container.
    // Let's keep the standard container but maybe hide header if desired?
    // For now, keep header for consistency (Title + Edit Controls).

    // Apply custom styles from config
    const customStyle = {
        backgroundColor: config?.style?.backgroundColor,
        color: config?.style?.textColor,
        borderColor: config?.style?.borderColor,
        fontFamily: config?.style?.fontFamily === 'mono' ? 'monospace' : config?.style?.fontFamily === 'serif' ? 'serif' : 'inherit',
    };

    // Combine grid style (positioning) with custom style (visuals)
    const combinedStyle = { ...style, ...customStyle };

    // Get current card dimensions from the grid item (if available via props or data-grid)
    // For now, we'll use placeholder; in a real implementation you'd extract from the layout
    const cardWidth = 4; // This would come from grid layout
    const cardHeight = 4; // This would come from grid layout

    // Responsive classes based on card size
    const isSmallCard = cardWidth <= 3 || cardHeight <= 2;
    const isMediumCard = cardWidth <= 6 && cardWidth > 3;
    const isLargeCard = cardWidth > 6;

    return (
        <div
            ref={ref}
            style={combinedStyle}
            // If custom bank list, remove background/border so the inner cards look separate?
            className={`h-full flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isEditMode ? 'ring-2 ring-indigo-500/20 hover:ring-indigo-500 cursor-move' : ''} ${className || ''}`}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
            onClick={onClick}
            data-card-size={isSmallCard ? 'small' : isMediumCard ? 'medium' : 'large'}
            {...props}
        >
            <div className={`${isSmallCard ? 'p-2' : 'p-4'} flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 relative group`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isEditMode && <div className="cursor-move text-zinc-400 hover:text-zinc-600"><MoreVertical size={isSmallCard ? 12 : 14} /></div>}
                    {!hideTitle && (
                        <h3
                            className={`${isSmallCard ? 'text-xs' : 'text-sm'} font-bold truncate transition-colors`}
                            style={{ color: config?.style?.textColor ? 'currentColor' : undefined }} // Allow overriding text color inheritance
                            title={title}
                        >
                            {title}
                        </h3>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {isEditMode && (
                        <>
                            <button
                                onClick={() => onEditConfig && onEditConfig(config || {})}
                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-indigo-500 transition-colors"
                                title="Personalizar (Cores e Dados)"
                            >
                                <PenLine size={isSmallCard ? 12 : 14} />
                            </button>
                            <button
                                onClick={onRemove}
                                className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"
                            >
                                <X size={isSmallCard ? 12 : 14} />
                            </button>
                        </>
                    )}
                </div>
            </div>



            {/* Content */}
            <div className="flex-1 min-w-0 relative" style={{ minHeight: 0 }}>
                <div className={`absolute inset-0 ${isSmallCard ? 'p-2' : 'p-4'}`} style={{ width: '100%', height: '100%' }}>
                    {renderContent()}
                </div>
            </div>

            {/* Edit Mode Overlay */}
            {isEditMode && <div className="absolute inset-0 bg-transparent z-10 pointer-events-none border-2 border-transparent group-hover:border-yellow-500/30 rounded-xl transition-colors" />}
        </div>
    );
});
