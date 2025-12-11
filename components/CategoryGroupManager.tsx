import React, { useState } from 'react';
import { X, Plus, Trash2, Check, GripVertical, FolderOpen, Tag } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { CategoryGroup, Category } from '../types';

interface CategoryGroupManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CategoryGroupManager: React.FC<CategoryGroupManagerProps> = ({ isOpen, onClose }) => {
    const {
        categoryGroups,
        categories,
        addCategoryGroup,
        updateCategoryGroup,
        deleteCategoryGroup,
        categoryGroupItems,
        updateCategoryGroupItems
    } = useTransactions();

    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editingGroup, setEditingGroup] = useState<Partial<CategoryGroup> | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const handleStartEdit = (group?: CategoryGroup) => {
        if (group) {
            setEditingGroup(group);
            // Load linked categories
            const linked = categoryGroupItems
                .filter(item => item.groupId === group.id)
                .map(item => item.categoryId);
            setSelectedCategories(linked);
        } else {
            setEditingGroup({
                name: '',
                type: 'expense',
                active: true,
                color: '#3b82f6'
            });
            setSelectedCategories([]);
        }
        setView('edit');
    };

    const handleSave = async () => {
        if (!editingGroup || !editingGroup.name) return;

        let groupId = editingGroup.id;

        if (groupId) {
            updateCategoryGroup(groupId, editingGroup);
        } else {
            groupId = await addCategoryGroup(editingGroup as Omit<CategoryGroup, 'id'>);
        }

        // Save linked categories
        if (groupId) {
            updateCategoryGroupItems(groupId, selectedCategories);
        }

        setView('list');
        setEditingGroup(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza? Isso removerá o grupo e suas metas.')) {
            deleteCategoryGroup(id);
        }
    };

    const toggleCategory = (catId: string) => {
        setSelectedCategories(prev =>
            prev.includes(catId)
                ? prev.filter(id => id !== catId)
                : [...prev, catId]
        );
    };

    // Filter categories for valid selection (match group type)
    const availableCategories = categories.filter(c =>
        c.type === editingGroup?.type &&
        (c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                            {view === 'list' ? 'Grupos de Categorias' : (editingGroup?.id ? 'Editar Grupo' : 'Novo Grupo')}
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {view === 'list'
                                ? 'Organize suas categorias em grupos para planejamento macro.'
                                : 'Defina o nome e as categorias que compõem este grupo.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {view === 'list' ? (
                        <div className="space-y-4">
                            {/* Empty State */}
                            {categoryGroups.length === 0 && (
                                <div className="text-center py-12 text-zinc-500">
                                    <FolderOpen size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>Nenhum grupo criado ainda.</p>
                                </div>
                            )}

                            {/* Groups List */}
                            <div className="grid gap-3">
                                {categoryGroups.map(group => {
                                    const linkedCount = categoryGroupItems.filter(i => i.groupId === group.id).length;
                                    return (
                                        <div key={group.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 group hover:border-indigo-500/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                                    style={{ backgroundColor: group.color || '#6366f1' }}
                                                >
                                                    {group.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{group.name}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                        <span className={`capitalize ${group.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {group.type === 'income' ? 'Receita' : 'Despesa'}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{linkedCount} categorias vinculadas</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleStartEdit(group)}
                                                    className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(group.id)}
                                                    className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handleStartEdit()}
                                className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 hover:border-indigo-500 hover:text-indigo-500 font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Criar Novo Grupo
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Edit Form */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome do Grupo</label>
                                    <input
                                        type="text"
                                        value={editingGroup?.name}
                                        onChange={e => setEditingGroup(prev => ({ ...prev!, name: e.target.value }))}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Ex: Marketing, Pessoal..."
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
                                    <select
                                        value={editingGroup?.type}
                                        onChange={e => setEditingGroup(prev => ({ ...prev!, type: e.target.value as 'income' | 'expense' }))}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="expense">Despesa</option>
                                        <option value="income">Receita</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cor de Identificação</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setEditingGroup(prev => ({ ...prev!, color }))}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${editingGroup?.color === color ? 'border-zinc-900 dark:border-white ring-2 ring-offset-2 ring-zinc-200 dark:ring-zinc-800' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-zinc-200 dark:border-zinc-800 my-6"></div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                        <Tag size={16} />
                                        Vincular Categorias
                                    </label>
                                    <span className="text-xs text-zinc-500">
                                        {selectedCategories.length} selecionadas
                                    </span>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Buscar categoria..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 mb-2"
                                />

                                <div className="max-h-[200px] overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {availableCategories.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-zinc-500">
                                            Nenhuma categoria encontrada para este tipo.
                                        </div>
                                    ) : (
                                        availableCategories.map(cat => (
                                            <div
                                                key={cat.id}
                                                onClick={() => toggleCategory(cat.id)}
                                                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 ${selectedCategories.includes(cat.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                            >
                                                <span className="text-sm text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                                                {selectedCategories.includes(cat.id) && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500">
                                    * Apenas categorias do tipo {editingGroup?.type === 'income' ? 'Receita' : 'Despesa'} são exibidas.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-2xl">
                    {view === 'edit' ? (
                        <>
                            <button
                                onClick={() => setView('list')}
                                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!editingGroup?.name}
                                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Salvar Grupo
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg"
                        >
                            Fechar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
