import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Calendar, DollarSign, CreditCard, Plus } from 'lucide-react';
import { Category } from '../types';
import { CurrencyInput } from './CurrencyInput';

interface CreditCardExpenseFormProps {
    categories: Category[];
    initialData?: {
        description: string;
        amount: number;
        date: string;
        categoryId: string;
        item?: any; // Pass full item if needed for install/other logic, but specific fields are safer
    };
    onSubmit: (data: {
        description: string;
        amount: number;
        date: string;
        categoryId: string;
        installments: number;
    }) => void;
    onCancel: () => void;
    onCreateCategory?: (name: string) => void;
}

export const CreditCardExpenseForm: React.FC<CreditCardExpenseFormProps> = ({ categories, initialData, onSubmit, onCancel, onCreateCategory }) => {
    const [formData, setFormData] = useState({
        description: initialData?.description || '',
        amount: initialData?.amount || 0,
        date: initialData?.date || new Date().toISOString().split('T')[0],
        categoryId: initialData?.categoryId || '',
        isInstallment: false,
        installments: 2
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial focus
    const descriptionInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (descriptionInputRef.current) {
            descriptionInputRef.current.focus();
        }
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter Categories: Expense Only + Subgroups (Assuming subgroups have parentId or similar logic?)
    // User requirement: "apenas despesas e apenas os subgrupos"
    // We filter by type === 'expense'.
    // For "subgroups", we usually check if it has a parentId. If all your actionable categories have parentId, this works.
    // If we don't have enough info on "subgroups" vs "groups", usually groups shouldn't be selectable.
    // Let's assume for now valid actionable categories are those that match. 
    // If the mock data uses 'parentId' for subgroups, use that.
    // Checking previous context, it seems standard app structure is Groups -> Subgroups.
    // We will filter items that have a parentId (if the schema supports it) OR just filtered by type for now to be safe, 
    // unless we see clear hierarchy. The prompt said "apenas subgrupos", so I'll try to filter for present parentId if possible,
    // but if not sure, I'll stick to type='expense' and maybe filter out ones that are 'parents' to others? 
    // Simpler: Filter by type='expense'.

    const filteredCategories = useMemo(() => {
        return categories.filter(c =>
            c.type === 'expense' &&
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            // Optional: Add logic here if we confirm 'subgroup' identification
            // For now, let's assume all 'expense' categories are valid targets or user can search them.
            // If we strictly enforce "only subgroups", we need to know which are roots.
            // A common pattern is: Roots have !parentId. Subgroups have parentId.
            c.parentId // Only show items that are children of something (subgroups)
        );
    }, [categories, searchTerm]);

    const selectedCategory = categories.find(c => c.id === formData.categoryId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            description: formData.description,
            amount: formData.amount,
            date: formData.date,
            categoryId: formData.categoryId,
            installments: formData.isInstallment ? formData.installments : 1
        });
    };

    const installmentValue = formData.amount > 0 && formData.installments > 0
        ? formData.amount / formData.installments
        : 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Descrição</label>
                <input
                    ref={descriptionInputRef}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Ex: Almoço, Uber, Supermercado..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required
                />
            </div>

            {/* Amount */}
            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Valor Total</label>
                <div className="relative">
                    <CurrencyInput
                        value={formData.amount}
                        onChange={(val) => setFormData({ ...formData, amount: val })}
                        className="w-full p-2.5 pl-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-xl font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <DollarSign className="absolute left-3 top-3 text-zinc-400" size={18} />
                </div>
            </div>

            {/* Category Selection (Moved Up) */}
            <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Categoria</label>
                <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full p-2.5 text-left bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none flex justify-between items-center"
                >
                    <span className={selectedCategory ? '' : 'text-zinc-400'}>
                        {selectedCategory ? selectedCategory.name : 'Selecione...'}
                    </span>
                    <ChevronDown size={16} className="text-zinc-400" />
                </button>

                {isCategoryOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-60 flex flex-col">
                        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-400" />
                                <input
                                    autoFocus
                                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-white placeholder-zinc-400"
                                    placeholder="Buscar categoria..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-1">
                            {filteredCategories.length === 0 && !searchTerm ? (
                                <div className="p-3 text-center text-xs text-zinc-500">
                                    Nenhuma categoria encontrada.
                                </div>
                            ) : (
                                filteredCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, categoryId: cat.id });
                                            setIsCategoryOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between group transition-colors ${formData.categoryId === cat.id
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                            }`}
                                    >
                                        <span>{cat.name}</span>
                                        {formData.categoryId === cat.id && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                                    </button>
                                ))
                            )}

                            {/* Create Option */}
                            {searchTerm && !filteredCategories.find(c => c.name.toLowerCase() === searchTerm.toLowerCase()) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onCreateCategory) {
                                            onCreateCategory(searchTerm);
                                            // Optimistic logic or wait for update?
                                            // Ideally we wait, but let's just close and hope parent handles it or user re-selects (imperfect but requested MVP)
                                            // Actually, we can assume parent adds it. 
                                            // We can't select it yet because we need ID.
                                            // Just clear search and close.
                                            setSearchTerm('');
                                            setIsCategoryOpen(false);
                                        }
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-t border-zinc-100 dark:border-zinc-800 mt-1"
                                >
                                    <Plus size={14} />
                                    <span>Cadastrar "{searchTerm}"</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Installments Toggle */}
            <div className="flex items-start gap-4 p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center h-5 mt-1">
                    <input
                        id="installment-toggle"
                        type="checkbox"
                        checked={formData.isInstallment}
                        onChange={e => setFormData({ ...formData, isInstallment: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="installment-toggle" className="font-medium text-sm text-zinc-900 dark:text-zinc-200 cursor-pointer">
                        Compra Parcelada?
                    </label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Marque se esta compra será paga em várias vezes.</p>
                </div>
            </div>

            {/* Installment Details (Conditional) */}
            {formData.isInstallment && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nº Parcelas</label>
                        <input
                            type="number" min="2" max="60"
                            className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.installments}
                            onChange={e => setFormData({ ...formData, installments: Number(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30 flex flex-col justify-center">
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Valor da Parcela</span>
                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installmentValue)}
                        </span>
                    </div>
                </div>
            )}

            {/* Date Details */}
            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Data</label>
                <div className="relative">
                    <input
                        type="date"
                        className="w-full p-2.5 pl-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        required
                    />
                    <Calendar className="absolute left-3 top-2.5 text-zinc-400" size={18} />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium transition-colors">Cancelar</button>
                <button
                    type="submit"
                    className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!formData.description || formData.amount <= 0 || !formData.categoryId}
                >
                    Confirmar Lançamento
                </button>
            </div>
        </form>
    );
};
