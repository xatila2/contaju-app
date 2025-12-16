import React, { useState } from 'react';
import { CardConfig, ChartType } from '../../types';
import { CARD_REGISTRY } from '../../dashboard/registry';
import { X, LayoutTemplate, Palette, Type } from 'lucide-react';
import { BarChart, Calendar } from 'lucide-react'; // Keep generic icons if used

interface CardConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string;
    currentConfig: CardConfig;
    onSave: (config: CardConfig) => void;
}

export const CardConfigModal: React.FC<CardConfigModalProps> = ({
    isOpen, onClose, cardId, currentConfig, onSave
}) => {
    const [activeTab, setActiveTab] = useState<'data' | 'style'>('data');

    // Config State
    const [period, setPeriod] = useState(currentConfig?.period || '30d');
    const [chartType, setChartType] = useState(currentConfig?.chartType || 'default');

    // Title State
    const [customTitle, setCustomTitle] = useState(currentConfig?.customTitle || '');
    const [hideTitle, setHideTitle] = useState(currentConfig?.hideTitle || false);

    // Style State
    const [bgColor, setBgColor] = useState(currentConfig?.style?.backgroundColor || '');
    const [textColor, setTextColor] = useState(currentConfig?.style?.textColor || '');
    const [accentColor, setAccentColor] = useState(currentConfig?.style?.accentColor || '');
    const [fontFamily, setFontFamily] = useState(currentConfig?.style?.fontFamily || 'sans');

    // Load definition
    const definitionId = cardId.includes('__inst_') ? cardId.split('__inst_')[0] : cardId;
    const definition = CARD_REGISTRY.find(d => d.id === definitionId) || CARD_REGISTRY.find(d => d.id === 'bank_single_card'); // Fallback

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({
            ...currentConfig,
            period: period as any,
            chartType: chartType as any,
            customTitle: customTitle || undefined,
            hideTitle: hideTitle,
            style: {
                backgroundColor: bgColor || undefined,
                textColor: textColor || undefined,
                accentColor: accentColor || undefined,
                fontFamily: fontFamily as any,
            }
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Editar Card</h3>
                        <p className="text-xs text-zinc-500 text-ellipsis overflow-hidden">{definition?.title || cardId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'data'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        <LayoutTemplate size={16} />
                        Dados & Visualização
                    </button>
                    <button
                        onClick={() => setActiveTab('style')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'style'
                            ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        <Palette size={16} />
                        Aparência (Estilos)
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">

                    {activeTab === 'data' && (
                        <>
                            {/* Chart Type Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de Visualização</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {definition?.allowedTypes?.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setChartType(type)}
                                            className={`px-3 py-2 text-sm rounded-lg border text-left transition-all ${chartType === type
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                                                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                                                }`}
                                        >
                                            {formatTypeName(type)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Period Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Período de Análise</label>
                                <select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                                >
                                    <option value="7d">Últimos 7 dias</option>
                                    <option value="15d">Últimos 15 dias</option>
                                    <option value="30d">Últimos 30 dias</option>
                                    <option value="ytd">Ano Atual (YTD)</option>
                                    <option value="1y">Últimos 12 meses</option>
                                </select>
                            </div>
                        </>
                    )}

                    {activeTab === 'style' && (
                        <div className="space-y-6">
                            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-lg text-xs">
                                Personalize as cores e fontes deste card específico.
                            </div>

                            {/* Title Customization */}
                            <div className="space-y-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Título do Card</label>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="showTitle"
                                            checked={!hideTitle}
                                            onChange={(e) => setHideTitle(!e.target.checked)}
                                            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="showTitle" className="text-sm text-zinc-700 dark:text-zinc-300">Mostrar Título</label>
                                    </div>

                                    {!hideTitle && (
                                        <div>
                                            <input
                                                type="text"
                                                value={customTitle}
                                                onChange={(e) => setCustomTitle(e.target.value)}
                                                placeholder={`Padrão: ${definition?.title}`}
                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                                            />
                                            <p className="text-xs text-zinc-400 mt-1">Deixe em branco para usar o padrão.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Cores</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-xs text-zinc-600 dark:text-zinc-400">Fundo</span>
                                            <div className="flex gap-2">
                                                <input type="color" value={bgColor || '#ffffff'} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                                                <button onClick={() => setBgColor('')} className="text-xs underline text-zinc-400">Reset</button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-zinc-600 dark:text-zinc-400">Texto</span>
                                            <div className="flex gap-2">
                                                <input type="color" value={textColor || '#000000'} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                                                <button onClick={() => setTextColor('')} className="text-xs underline text-zinc-400">Reset</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Typography */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    <Type size={16} />
                                    Tipografia
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setFontFamily('sans')}
                                        className={`px-3 py-2 text-sm border rounded-lg ${fontFamily === 'sans' ? 'bg-zinc-100 border-zinc-300 font-bold' : 'border-zinc-200'}`}
                                    >
                                        Sans
                                    </button>
                                    <button
                                        onClick={() => setFontFamily('serif')}
                                        className={`px-3 py-2 text-sm border rounded-lg font-serif ${fontFamily === 'serif' ? 'bg-zinc-100 border-zinc-300 font-bold' : 'border-zinc-200'}`}
                                    >
                                        Serif
                                    </button>
                                    <button
                                        onClick={() => setFontFamily('mono')}
                                        className={`px-3 py-2 text-sm border rounded-lg font-mono ${fontFamily === 'mono' ? 'bg-zinc-100 border-zinc-300 font-bold' : 'border-zinc-200'}`}
                                    >
                                        Mono
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50 dark:bg-zinc-900/50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm">
                        Aplicar Mudanças
                    </button>
                </div>
            </div>
        </div>
    );
};

const formatTypeName = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// Helper for labels
function formatChartTypeName(type: string) {
    const labels: Record<string, string> = {
        'linha_simples': 'Linha',
        'linha_area': 'Área',
        'bar_vertical': 'Colunas',
        'bar_horizontal': 'Barras',
        'pie': 'Pizza',
        'donut': 'Donut',
        'kpi_rich': 'KPI Detalhado',
        'kpi_numero': 'Número Simples',
        'barras_agrupadas': 'Colunas Agrupadas',
        'barras_empilhadas': 'Colunas Empilhadas',
        // ... add others
    };
    return labels[type] || type.replace(/_/g, ' ');
}
