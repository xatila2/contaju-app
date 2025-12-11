
import React, { useState } from 'react';
import { X, Search, Plus, BarChart2, DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { CARD_REGISTRY } from '../../dashboard/registry';
import { useDashboard } from '../../context/DashboardContext';

interface CardPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CardPickerModal: React.FC<CardPickerModalProps> = ({ isOpen, onClose }) => {
    const { addCardToLayout } = useDashboard();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

    if (!isOpen) return null;

    const categories = ['Todos', ...Array.from(new Set(CARD_REGISTRY.map(c => c.category)))];

    const filteredCards = CARD_REGISTRY.filter(card => {
        const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            card.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || card.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleAdd = (cardId: string, defaultSize: { w: number, h: number }) => {
        addCardToLayout(cardId, defaultSize);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Adicionar Card</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Escolha uma análise para adicionar ao seu dashboard.</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        <X size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row gap-4 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-2.5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar análises..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500 text-zinc-900 dark:text-white"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                        ? 'bg-yellow-500 text-black shadow-sm'
                                        : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCards.map(card => (
                        <div key={card.id} className="group relative bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-lg ${card.category === 'Caixa' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        card.category === 'Despesa' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                                            card.category === 'Receita' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
                                    }`}>
                                    {card.defaultType.includes('kpi') ? <DollarSign size={20} /> :
                                        card.defaultType.includes('pie') ? <PieChart size={20} /> :
                                            card.defaultType.includes('line') ? <TrendingUp size={20} /> :
                                                <BarChart2 size={20} />}
                                </div>
                                <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-700/50 rounded-full text-zinc-500 dark:text-zinc-400">
                                    {card.category}
                                </span>
                            </div>

                            <h4 className="font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">{card.title}</h4>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2 flex-1">{card.description}</p>

                            <button
                                onClick={() => handleAdd(card.id, card.defaultSize)}
                                className="w-full flex items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-700 hover:bg-yellow-500 hover:text-black dark:hover:bg-yellow-500 dark:hover:text-black text-zinc-600 dark:text-zinc-300 py-2.5 rounded-lg text-sm font-medium transition-all"
                            >
                                <Plus size={16} />
                                <span>Adicionar</span>
                            </button>
                        </div>
                    ))}

                    {filteredCards.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <div className="mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                                <Search size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Nenhum card encontrado</h3>
                            <p className="text-zinc-500 dark:text-zinc-400">Tente buscar por outro termo ou categoria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
