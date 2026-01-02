
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Save, Plus, Trash2, Edit2, ChevronDown, ChevronRight, FileText, X, Building2, Search, Briefcase, Bell, Info, Calendar, CheckCircle2, AlertCircle, Users, GripVertical, Wallet, Mail, Phone, MapPin } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Category, BankAccount, TransactionType, CostCenter, NotificationSettings, Transaction } from '../types';
import { UserManagement } from '../components/UserManagement';

import { useTransactions } from '../context/TransactionContext';

// --- Sortable Item Component (External) ---
const SortableCategoryItem = ({
    category,
    level,
    categories,
    expandedGroups,
    searchTerm,
    onToggle,
    onAddSub,
    onEdit,
    onDelete
}: {
    category: Category,
    level: number,
    categories: Category[],
    expandedGroups: string[],
    searchTerm: string,
    onToggle: (id: string) => void,
    onAddSub: (c: Category) => void,
    onEdit: (c: Category) => void,
    onDelete: (id: string) => void
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' : 'relative' as 'relative',
    };

    const isExpanded = expandedGroups.includes(category.id);
    const isIncome = category.type === 'income';
    const children = categories.filter(c => c.parentId === category.id).sort((a, b) => a.code.localeCompare(b.code));
    const hasChildren = children.length > 0;

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
            <div className={`group flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isIncome ? 'border-l-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-l-4 border-rose-500 bg-rose-50/30 dark:bg-rose-900/10'}`}>
                <div className="flex items-center space-x-3" style={{ paddingLeft: `${level * 20}px` }}>
                    <div {...attributes} {...listeners} className="cursor-grab hover:text-zinc-900 dark:hover:text-zinc-100 text-zinc-400 p-1">
                        <GripVertical size={16} />
                    </div>

                    {!searchTerm && <button onClick={() => onToggle(category.id)} className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 ${!hasChildren ? 'invisible' : ''}`}>{isExpanded ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}</button>}
                    <span className="font-mono text-sm text-zinc-500 w-16">{category.code}</span>
                    <span className={`text-sm text-zinc-900 dark:text-zinc-200 ${level === 0 ? 'font-bold' : ''}`}>{category.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}`}>{isIncome ? 'Receita' : 'Despesa'}</span>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => onAddSub(category)}
                            className="p-1.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Adicionar subcategoria"
                        >
                            <Plus size={14} />
                        </button>
                        <button onClick={() => onEdit(category)} className="p-1.5 text-zinc-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors"><Edit2 size={14} /></button>
                        {!category.isSystemDefault && <button onClick={() => onDelete(category.id)} className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"><Trash2 size={14} /></button>}
                    </div>
                </div>
            </div>
            {isExpanded && (
                <CategorySortableList
                    parentId={category.id}
                    categories={categories}
                    level={level + 1}
                    expandedGroups={expandedGroups}
                    searchTerm={searchTerm}
                    onToggle={onToggle}
                    onAddSub={onAddSub}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            )}
        </div>
    );
};

// --- Recursive List Component (External) ---
const CategorySortableList = ({
    parentId,
    categories,
    level,
    expandedGroups,
    searchTerm,
    onToggle,
    onAddSub,
    onEdit,
    onDelete
}: {
    parentId: string | undefined,
    categories: Category[],
    level: number,
    expandedGroups: string[],
    searchTerm: string,
    onToggle: (id: string) => void,
    onAddSub: (c: Category) => void,
    onEdit: (c: Category) => void,
    onDelete: (id: string) => void
}) => {
    // Filter items for this level using global categories list
    // Fix: Handle null vs undefined for root items
    const items = categories.filter(c => c.parentId === parentId || ((parentId === undefined || parentId === null) && (c.parentId === null || c.parentId === undefined)));

    return (
        <SortableContext
            items={items.map(c => c.id)}
            strategy={verticalListSortingStrategy}
        >
            {items.map(cat => (
                <SortableCategoryItem
                    key={cat.id}
                    category={cat}
                    level={level}
                    categories={categories}
                    expandedGroups={expandedGroups}
                    searchTerm={searchTerm}
                    onToggle={onToggle}
                    onAddSub={onAddSub}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </SortableContext>
    );
};


const CompanyGeneralSettings = ({ companyData, updateCompanyData }: { companyData: any, updateCompanyData: (d: any) => Promise<void> }) => {
    const [localData, setLocalData] = useState(companyData || {});
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalData(companyData || {});
        setHasChanges(false);
    }, [companyData]);

    const handleChange = (field: string, value: any) => {
        const newData = { ...localData, [field]: value };
        // For address, handle nested update simpler
        if (field === 'street') {
            newData.address = { ...localData.address, street: value };
            delete newData.street; // Cleanup temp
        }
        setLocalData(newData);
        setHasChanges(true);
    };

    const handleSave = async () => {
        await updateCompanyData(localData);
        setHasChanges(false);
    };

    const handleCancel = () => {
        setLocalData(companyData || {});
        setHasChanges(false);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-[600px] relative">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Dados da Empresa</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Informações cadastrais para relatórios e documentos.</p>
            </div>
            <div className="p-6 space-y-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">Nome da Empresa</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Building2 size={16} className="text-zinc-400" />
                            </div>
                            <input type="text" value={localData.name || ''} onChange={(e) => handleChange('name', e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Razão Social ou Nome Fantasia" />
                        </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">CNPJ / CPF</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FileText size={16} className="text-zinc-400" />
                            </div>
                            <input type="text" value={localData.document || ''} onChange={(e) => handleChange('document', e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-500" placeholder="00.000.000/0000-00" />
                        </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={16} className="text-zinc-400" />
                            </div>
                            <input type="email" value={localData.email || ''} onChange={(e) => handleChange('email', e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-500" placeholder="contato@empresa.com" />
                        </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">Telefone / WhatsApp</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone size={16} className="text-zinc-400" />
                            </div>
                            <input type="text" value={localData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-500" placeholder="(00) 00000-0000" />
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1">Endereço</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPin size={16} className="text-zinc-400" />
                            </div>
                            <input type="text" value={localData.address?.street || ''} onChange={(e) => handleChange('street', e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Endereço completo" />
                        </div>
                    </div>
                </div>
            </div>
            {hasChanges && (
                <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-lg border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
                    <span className="text-xs text-zinc-500 pl-2">Alterações não salvas</span>
                    <button onClick={handleCancel} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg font-medium">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-yellow-500/20"><Save size={16} /> Salvar Alterações</button>
                </div>
            )}
        </div>
    );
};

const CompanyFinancialSettings = ({ companySettings, updateCompanySettings }: { companySettings: any, updateCompanySettings: (d: any) => Promise<void> }) => {
    const [capital, setCapital] = useState(companySettings?.capitalGiroNecessario || 0);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setCapital(companySettings?.capitalGiroNecessario || 0);
        setHasChanges(false);
    }, [companySettings]);

    const handleChange = (val: number) => {
        setCapital(val);
        setHasChanges(true);
    };

    const handleSave = async () => {
        await updateCompanySettings({ ...companySettings, capitalGiroNecessario: capital });
        setHasChanges(false);
    };

    const handleCancel = () => {
        setCapital(companySettings?.capitalGiroNecessario || 0);
        setHasChanges(false);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-[600px] relative">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Parâmetros Financeiros</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Definições para análise e gestão do caixa.</p>
            </div>
            <div className="p-6 space-y-6">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Building2 size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Capital de Giro Mínimo</h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-3">Defina o valor ideal de reserva financeira para sua empresa.</p>
                            <div className="flex items-center gap-2 max-w-xs">
                                <span className="text-zinc-500 font-bold">R$</span>
                                <input type="number" value={capital} onChange={(e) => handleChange(parseFloat(e.target.value))} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {hasChanges && (
                <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-lg border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
                    <span className="text-xs text-zinc-500 pl-2">Alterações não salvas</span>
                    <button onClick={handleCancel} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg font-medium">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-yellow-500/20"><Save size={16} /> Salvar Alterações</button>
                </div>
            )}
        </div>
    );
};

const NotificationSettingsTab = ({ notificationSettings, updateNotificationSettings, transactions }: { notificationSettings: NotificationSettings, updateNotificationSettings: (s: NotificationSettings) => Promise<void>, transactions: Transaction[] }) => {
    const [localSettings, setLocalSettings] = useState(notificationSettings);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalSettings(notificationSettings);
        setHasChanges(false);
    }, [notificationSettings]);

    const handleScan = (key: keyof NotificationSettings, val: any) => {
        setLocalSettings(prev => {
            const next = { ...prev, [key]: val };
            setHasChanges(true); // Simplified change detection (always true on edit)
            return next;
        });
    };

    const handleSave = async () => {
        await updateNotificationSettings(localSettings);
        setHasChanges(false);
    };

    const handleCancel = () => {
        setLocalSettings(notificationSettings);
        setHasChanges(false);
    };

    // Recalculate preview based on LOCAL settings
    const preview = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        let filtered = transactions;

        if (localSettings.customRangeActive && localSettings.customRangeStart && localSettings.customRangeEnd) {
            filtered = transactions.filter(t => t.dueDate >= localSettings.customRangeStart && t.dueDate <= localSettings.customRangeEnd);
        }

        const overdue = localSettings.showOverdue
            ? filtered.filter(t => t.type === 'expense' && t.status !== 'reconciled' && (t.status === 'overdue' || t.dueDate < today)).length
            : 0;

        const dueToday = localSettings.showDueToday
            ? filtered.filter(t => t.type === 'expense' && t.status !== 'reconciled' && t.dueDate === today).length
            : 0;

        const upcoming = localSettings.showUpcoming
            ? filtered.filter(t => {
                if (t.type !== 'expense' || t.status === 'reconciled') return false;
                const future = new Date();
                future.setDate(future.getDate() + localSettings.daysInAdvance);
                const futureStr = future.toISOString().split('T')[0];
                return t.dueDate > today && t.dueDate <= futureStr;
            }).length
            : 0;

        return { overdue, dueToday, upcoming, total: overdue + dueToday + upcoming };
    }, [transactions, localSettings]);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-[600px] relative">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">borConfiguração de Alertas</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Defina como e quando você deseja ser notificado.</p>
                </div>
                <div className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span>Sistema Ativo</span>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2">Tipos de Notificação</h4>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-start space-x-3">
                            <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-lg text-rose-600 dark:text-rose-400"><AlertCircle size={20} /></div>
                            <div><h4 className="font-bold text-zinc-900 dark:text-white text-sm">Contas Vencidas</h4><p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Alerta imediato para contas em atraso.</p></div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={localSettings.showOverdue} onChange={() => handleScan('showOverdue', !localSettings.showOverdue)} />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-yellow-500"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-start space-x-3">
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg text-yellow-600 dark:text-yellow-400"><Bell size={20} /></div>
                            <div><h4 className="font-bold text-zinc-900 dark:text-white text-sm">Vencimento Hoje</h4><p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Lembrete no dia exato do vencimento.</p></div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={localSettings.showDueToday} onChange={() => handleScan('showDueToday', !localSettings.showDueToday)} />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-yellow-500"></div>
                        </label>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-start space-x-3">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400"><Info size={20} /></div>
                                <div><h4 className="font-bold text-zinc-900 dark:text-white text-sm">Avisar com Antecedência</h4><p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Pré-aviso de contas futuras.</p></div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={localSettings.showUpcoming} onChange={() => handleScan('showUpcoming', !localSettings.showUpcoming)} />
                                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-yellow-500"></div>
                            </label>
                        </div>
                        {localSettings.showUpcoming && (
                            <div className="pl-12 flex items-center gap-3">
                                <input type="number" min="1" max="30" value={localSettings.daysInAdvance} onChange={(e) => handleScan('daysInAdvance', parseInt(e.target.value) || 1)} className="w-16 p-2 text-center bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm font-bold outline-none focus:ring-2 focus:ring-yellow-500" />
                                <span className="text-sm text-zinc-600 dark:text-zinc-300">dias antes.</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300"><Calendar size={18} /><h4 className="font-bold text-sm">Filtro de Período</h4></div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={localSettings.customRangeActive} onChange={() => handleScan('customRangeActive', !localSettings.customRangeActive)} />
                                <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-yellow-500"></div>
                            </label>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Se ativo, o sistema só emitirá alertas para contas com vencimento dentro deste intervalo.</p>
                        <div className={`grid grid-cols-2 gap-3 transition-opacity ${localSettings.customRangeActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <div><label className="text-[10px] uppercase font-bold text-zinc-400">Início</label><input type="date" value={localSettings.customRangeStart} onChange={(e) => handleScan('customRangeStart', e.target.value)} className="w-full mt-1 p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-sm text-zinc-900 dark:text-white outline-none focus:border-yellow-500" /></div>
                            <div><label className="text-[10px] uppercase font-bold text-zinc-400">Fim</label><input type="date" value={localSettings.customRangeEnd} onChange={(e) => handleScan('customRangeEnd', e.target.value)} className="w-full mt-1 p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-sm text-zinc-900 dark:text-white outline-none focus:border-yellow-500" /></div>
                        </div>
                    </div>
                    <div className="p-5 bg-zinc-900 dark:bg-zinc-950 rounded-xl text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><Bell size={64} /></div>
                        <h4 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-3">Diagnóstico em Tempo Real (Prévia)</h4>
                        <div className="space-y-3 relative z-10">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2"><span className="text-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Vencidas</span><span className="font-mono font-bold">{preview.overdue}</span></div>
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2"><span className="text-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Hoje</span><span className="font-mono font-bold">{preview.dueToday}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Próximas</span><span className="font-mono font-bold">{preview.upcoming}</span></div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-zinc-800 text-center"><p className="text-xs text-zinc-500">Total de alertas ativos na tela: <span className="text-white font-bold">{preview.total}</span></p></div>
                    </div>
                </div>
            </div>
            {hasChanges && (
                <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-lg border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 z-50">
                    <span className="text-xs text-zinc-500 pl-2">Alterações não salvas</span>
                    <button onClick={handleCancel} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg font-medium">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-yellow-500/20"><Save size={16} /> Salvar Alterações</button>
                </div>
            )}
        </div>
    );
};

interface SettingsProps { }

export const Settings: React.FC<SettingsProps> = () => {
    const {
        categories,
        bankAccounts,
        costCenters,
        notificationSettings,
        transactions,
        companySettings,
        companyData,
        // Actions
        addCategory, updateCategory, deleteCategory,
        addBankAccount, updateBankAccount, deleteBankAccount,
        addCostCenter, updateCostCenter, deleteCostCenter,
        updateNotificationSettings, updateCompanySettings, updateCompanyData,
        restoreDefaultCategories
    } = useTransactions();

    console.log('DEBUG CATEGORIES:', categories);

    const location = useLocation();
    const [activeTab, setActiveTab] = useState('chartOfAccounts');
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5']);

    // Read tab from URL parameter on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['general', 'financial', 'chartOfAccounts', 'bankAccounts', 'costCenters', 'users', 'notifications'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [location.search]);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'category' | 'bank' | 'costCenter' | null; id: string | null; title: string }>({
        isOpen: false,
        type: null,
        id: null,
        title: ''
    });

    // Category Modal State
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [catFormData, setCatFormData] = useState<{
        name: string;
        parentId: string;
        type: TransactionType;
    }>({ name: '', parentId: '', type: 'expense' });

    // Bank Modal State
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
    const [bankFormData, setBankFormData] = useState({ name: '', initialBalance: 0, initialBalanceDate: '', color: 'blue' });

    // Cost Center Modal State
    const [isCCModalOpen, setIsCCModalOpen] = useState(false);
    const [editingCC, setEditingCC] = useState<CostCenter | null>(null);
    const [ccFormData, setCCFormData] = useState({ name: '', code: '' });

    // ... (Existing Category, Bank, CC Handlers remain unchanged) ...
    const toggleGroup = (id: string) => {
        if (expandedGroups.includes(id)) {
            setExpandedGroups(expandedGroups.filter(g => g !== id));
        } else {
            setExpandedGroups([...expandedGroups, id]);
        }
    };

    // ... (Keep existing Modal Open/Close handlers for Categories, Banks, CCs) ...
    const handleOpenAddCat = () => { setEditingCategory(null); setCatFormData({ name: '', parentId: '', type: 'expense' }); setIsCatModalOpen(true); };
    const handleOpenAddSubCat = (parentCategory: Category) => { setEditingCategory(null); setCatFormData({ name: '', parentId: parentCategory.id, type: parentCategory.type }); setIsCatModalOpen(true); };
    const handleOpenEditCat = (category: Category) => { setEditingCategory(category); setCatFormData({ name: category.name, parentId: category.parentId || '', type: category.type }); setIsCatModalOpen(true); };

    // REPLACE: handleDeleteCat with Modal Logic
    const handleDeleteCatCheck = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;
        if (category.isSystemDefault) { alert("Não é possível excluir categorias padrão do sistema."); return; }
        if (categories.some(c => c.parentId === categoryId)) { alert("Não é possível excluir uma categoria que possui subcategorias."); return; }

        setDeleteModal({ isOpen: true, type: 'category', id: categoryId, title: category.name });
    };

    const handleSaveCat = async () => {
        if (!catFormData.name) return;
        if (editingCategory) {
            await updateCategory(editingCategory.id, { name: catFormData.name, parentId: catFormData.parentId || undefined });
        } else {
            const parent = categories.find(c => c.id === catFormData.parentId);
            let newCode = '9.99';
            if (parent) {
                const siblings = categories.filter(c => c.parentId === parent.id);
                newCode = `${parent.code}.${siblings.length + 1} `.replace('.0.', '.').trim();
            } else {
                const roots = categories.filter(c => !c.parentId);
                newCode = `${roots.length + 1}.0`.trim();
            }
            await addCategory({
                name: catFormData.name,
                type: parent ? parent.type : catFormData.type,
                code: newCode,
                parentId: catFormData.parentId || undefined,
                isSystemDefault: false
            });
        }
        setIsCatModalOpen(false);
    };

    const handleOpenAddBank = () => { setEditingBank(null); setBankFormData({ name: '', initialBalance: 0, initialBalanceDate: new Date().toISOString().split('T')[0], color: 'blue' }); setIsBankModalOpen(true); };
    const handleOpenEditBank = (bank: BankAccount) => { setEditingBank(bank); setBankFormData({ name: bank.name, initialBalance: bank.initialBalance, initialBalanceDate: bank.initialBalanceDate || '', color: bank.color }); setIsBankModalOpen(true); };

    // REPLACE: handleDeleteBank with Modal Logic
    const handleDeleteBankCheck = (bankId: string) => {
        const bank = bankAccounts.find(b => b.id === bankId);
        if (bank) setDeleteModal({ isOpen: true, type: 'bank', id: bankId, title: bank.name });
    };

    const handleSaveBank = async () => {
        if (!bankFormData.name) return;
        if (editingBank) {
            await updateBankAccount(editingBank.id, bankFormData);
        } else {
            await addBankAccount(bankFormData);
        }
        setIsBankModalOpen(false);
    };

    const handleOpenAddCC = () => { setEditingCC(null); setCCFormData({ name: '', code: '' }); setIsCCModalOpen(true); };
    const handleOpenEditCC = (cc: CostCenter) => { setEditingCC(cc); setCCFormData({ name: cc.name, code: cc.code }); setIsCCModalOpen(true); };

    // REPLACE: handleDeleteCC with Modal Logic
    const handleDeleteCCCheck = (ccId: string) => {
        const cc = costCenters.find(c => c.id === ccId);
        if (cc) setDeleteModal({ isOpen: true, type: 'costCenter', id: ccId, title: cc.name });
    };

    const handleSaveCC = async () => {
        if (!ccFormData.name) return;
        if (editingCC) {
            await updateCostCenter(editingCC.id, ccFormData);
        } else {
            await addCostCenter(ccFormData);
        }
        setIsCCModalOpen(false);
    };

    // Confirm Delete Handler
    const handleConfirmDelete = async () => {
        if (!deleteModal.id || !deleteModal.type) return;

        if (deleteModal.type === 'category') {
            await deleteCategory(deleteModal.id);
        } else if (deleteModal.type === 'bank') {
            await deleteBankAccount(deleteModal.id);
        } else if (deleteModal.type === 'costCenter') {
            await deleteCostCenter(deleteModal.id);
        }

        setDeleteModal({ ...deleteModal, isOpen: false });
    };

    // Imports for DnD - Hooks
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = categories.findIndex(c => c.id === active.id);
        const newIndex = categories.findIndex(c => c.id === over.id);

        const activeItem = categories[oldIndex];
        const overItem = categories[newIndex];

        if (activeItem.parentId !== overItem.parentId) return;

        const siblings = categories.filter(c => c.parentId === activeItem.parentId);
        const oldSiblingIndex = siblings.findIndex(c => c.id === active.id);
        const newSiblingIndex = siblings.findIndex(c => c.id === over.id);

        const newOrderedSiblings = arrayMove(siblings, oldSiblingIndex, newSiblingIndex);

        // Re-numbering Logic (Inline for simplicity)
        const reorderSiblings = (cats: Category[], parentId: string | undefined, newSiblingsOrder: Category[]) => {
            const tree: any = { children: [] };
            const idMap: any = {};
            cats.forEach(c => { idMap[c.id] = { ...c, children: [] }; });
            const roots: any[] = [];
            cats.forEach(c => {
                if (c.parentId) {
                    if (idMap[c.parentId]) idMap[c.parentId].children.push(idMap[c.id]);
                    else roots.push(idMap[c.id]);
                } else roots.push(idMap[c.id]);
            });

            if (parentId) {
                if (idMap[parentId]) idMap[parentId].children = newSiblingsOrder.map(s => idMap[s.id]);
            } else {
                const newRoots = newSiblingsOrder.map(s => idMap[s.id]);
                roots.length = 0; roots.push(...newRoots);
            }

            const result: Category[] = [];
            const traverse = (nodes: any[], prefix: string) => {
                nodes.forEach((node, index) => {
                    let newCode = prefix ? `${prefix}.${index + 1}`.replace('.0.', '.') : `${index + 1}.0`;
                    const { children, ...rest } = node;
                    result.push({ ...rest, code: newCode });
                    if (node.children && node.children.length > 0) traverse(node.children, prefix ? newCode : (index + 1).toString());
                });
            };
            traverse(roots, '');
            return result;
        };

        const finalCategories = reorderSiblings(categories, activeItem.parentId || undefined, newOrderedSiblings);

        // Sync modified categories to Supabase
        // We find items in finalCategories that are different from `categories` (code or parentId)
        const updates = finalCategories.filter(final => {
            const original = categories.find(o => o.id === final.id);
            if (!original) return false;
            return original.code !== final.code || original.parentId !== final.parentId;
        });

        // Loop updates
        // Note: This does not await, so UI might be eager. Real app should handle loading state.
        updates.forEach(cat => {
            updateCategory(cat.id, { code: cat.code, parentId: cat.parentId });
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Configurações</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Gerencie parâmetros do sistema e dados mestres.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Nav */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        <button onClick={() => setActiveTab('general')} className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'general' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}><Building2 size={18} /><span>Geral</span></button>
                        <button onClick={() => setActiveTab('financial')} className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'financial' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}><Wallet size={18} /><span>Financeiro</span></button>
                        <button onClick={() => setActiveTab('chartOfAccounts')} className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'chartOfAccounts' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}><FileText size={18} /><span>Plano de Contas</span></button>
                        <button onClick={() => setActiveTab('bankAccounts')} className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'bankAccounts' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}><Building2 size={18} /><span>Contas Bancárias</span></button>
                        <button onClick={() => setActiveTab('costCenters')} className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'costCenters' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}><Briefcase size={18} /><span>Centros de Custo</span></button>
                        <button onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'users' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}><Users size={18} /><span>Usuários</span></button>
                        <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'notifications' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}><Bell size={18} /><span>Avisos e Notificações</span></button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'general' && (
                        <CompanyGeneralSettings companyData={companyData} updateCompanyData={updateCompanyData} />
                    )}

                    {activeTab === 'financial' && (
                        <CompanyFinancialSettings companySettings={companySettings} updateCompanySettings={updateCompanySettings} />
                    )}

                    {activeTab === 'chartOfAccounts' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-[600px]">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div><h3 className="text-lg font-bold text-zinc-900 dark:text-white">Plano de Contas</h3><p className="text-xs text-zinc-500 dark:text-zinc-400">Estrutura de Receitas e Despesas.</p></div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64"><Search size={16} className="absolute left-3 top-2.5 text-zinc-400" /><input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500 text-zinc-900 dark:text-white" /></div>
                                    <button onClick={restoreDefaultCategories} className="flex items-center space-x-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-3 py-2 rounded-lg text-sm font-bold transition flex-shrink-0"><span className="hidden sm:inline">Restaurar Padrão</span><span className="sm:hidden">Restaurar</span></button>
                                    <button onClick={handleOpenAddCat} className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-2 rounded-lg text-sm font-bold transition flex-shrink-0"><Plus size={16} /><span className="hidden sm:inline">Adicionar</span></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="min-w-full pb-20">
                                        <CategorySortableList
                                            parentId={undefined}
                                            categories={categories}
                                            level={0}
                                            expandedGroups={expandedGroups}
                                            searchTerm={searchTerm}
                                            onToggle={toggleGroup}
                                            onAddSub={handleOpenAddSubCat}
                                            onEdit={handleOpenEditCat}
                                            onDelete={handleDeleteCatCheck}
                                        />
                                    </div>
                                </DndContext>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bankAccounts' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-[600px]">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center"><div><h3 className="text-lg font-bold text-zinc-900 dark:text-white">Contas Bancárias</h3></div><button onClick={handleOpenAddBank} className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"><Plus size={16} /><span>Adicionar Banco</span></button></div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">{bankAccounts.map(bank => (
                                <div key={bank.id} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${bank.color}-100 dark:bg-${bank.color}-900/30 text-${bank.color}-600 dark:text-${bank.color}-400`}>
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-zinc-900 dark:text-white">{bank.name}</h4>
                                            <div className="flex flex-col text-sm text-zinc-500 dark:text-zinc-400">
                                                <span className="font-semibold">R$ {bank.initialBalance.toLocaleString('pt-BR')}</span>
                                                {bank.initialBalanceDate && (
                                                    <span className="text-xs flex items-center gap-1 mt-0.5">
                                                        <Calendar size={11} />
                                                        {new Date(bank.initialBalanceDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleOpenEditBank(bank)} className="p-2 text-zinc-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteBankCheck(bank.id)} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}</div>
                        </div>
                    )}

                    {activeTab === 'costCenters' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-[600px]">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center"><div><h3 className="text-lg font-bold text-zinc-900 dark:text-white">Centros de Custo</h3></div><button onClick={handleOpenAddCC} className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"><Plus size={16} /><span>Adicionar</span></button></div>
                            <div className="p-6 space-y-6">
                                {/* All Cost Centers */}
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {costCenters.length === 0 && <p className="text-sm text-zinc-400 italic">Nenhum centro de custo encontrado.</p>}
                                        {costCenters.map(cc => (
                                            <div key={cc.id} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                                        <Briefcase size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-zinc-900 dark:text-white">{cc.name}</h4>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{cc.code || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleOpenEditCC(cc)} className="p-2 text-zinc-400 hover:text-yellow-500"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteCCCheck(cc.id)} className="p-2 text-zinc-400 hover:text-rose-500"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <UserManagement />
                    )}

                    {activeTab === 'notifications' && (
                        <NotificationSettingsTab
                            notificationSettings={notificationSettings}
                            updateNotificationSettings={updateNotificationSettings}
                            transactions={transactions}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            {isCatModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center"><h3 className="font-bold text-zinc-900 dark:text-white">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3><button onClick={() => setIsCatModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={20} /></button></div>
                        <div className="p-4 space-y-4">
                            <div><label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome da Conta</label><input type="text" value={catFormData.name} onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500" autoFocus /></div>
                            {!editingCategory && (
                                <>
                                    <div><label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tipo</label><div className="flex bg-zinc-50 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700"><button className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${catFormData.type === 'expense' ? 'bg-white dark:bg-zinc-700 shadow text-rose-600 dark:text-rose-400' : 'text-zinc-500'}`} onClick={() => setCatFormData({ ...catFormData, type: 'expense', parentId: '' })}>Despesa</button><button className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${catFormData.type === 'income' ? 'bg-white dark:bg-zinc-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`} onClick={() => setCatFormData({ ...catFormData, type: 'income', parentId: '' })}>Receita</button></div></div>
                                    <div><label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Conta Pai (Opcional)</label><select value={catFormData.parentId} onChange={(e) => setCatFormData({ ...catFormData, parentId: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm"><option value="">Nenhuma (Raiz)</option>{categories.filter(c => c.type === catFormData.type).map(cat => (<option key={cat.id} value={cat.id}>{cat.code} - {cat.name}</option>))}</select></div>
                                </>
                            )}
                        </div>
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-2"><button onClick={() => setIsCatModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button><button onClick={handleSaveCat} disabled={!catFormData.name} className="px-4 py-2 text-sm font-bold text-black bg-yellow-500 hover:bg-yellow-400 rounded-lg disabled:opacity-50">Salvar</button></div>
                    </div>
                </div>
            )}
            {isBankModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800"><div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center"><h3 className="font-bold text-zinc-900 dark:text-white">{editingBank ? 'Editar Banco' : 'Novo Banco'}</h3><button onClick={() => setIsBankModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={20} /></button></div><div className="p-4 space-y-4"><div><label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome da Instituição</label><input type="text" value={bankFormData.name} onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500" placeholder="Ex: Banco do Brasil" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Saldo Inicial (R$)</label><input type="number" value={bankFormData.initialBalance} onChange={(e) => setBankFormData({ ...bankFormData, initialBalance: parseFloat(e.target.value) })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500" /></div><div><label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Data do Saldo</label><input type="date" value={bankFormData.initialBalanceDate} onChange={(e) => setBankFormData({ ...bankFormData, initialBalanceDate: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500" /></div></div><div><label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cor</label><div className="flex space-x-2">{['blue', 'green', 'orange', 'red', 'purple', 'zinc'].map(color => (<button key={color} onClick={() => setBankFormData({ ...bankFormData, color })} className={`w-8 h-8 rounded-full bg-${color}-500 border-2 ${bankFormData.color === color ? 'border-white dark:border-zinc-900 ring-2 ring-yellow-500' : 'border-transparent'}`}></button>))}</div></div></div><div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-2"><button onClick={() => setIsBankModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button><button onClick={handleSaveBank} disabled={!bankFormData.name} className="px-4 py-2 text-sm font-bold text-black bg-yellow-500 hover:bg-yellow-400 rounded-lg disabled:opacity-50">Salvar</button></div></div></div>
            )}
            {isCCModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800"><div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center"><h3 className="font-bold text-zinc-900 dark:text-white">{editingCC ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</h3><button onClick={() => setIsCCModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={20} /></button></div><div className="p-4 space-y-4"><div><label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome</label><input type="text" value={ccFormData.name} onChange={(e) => setCCFormData({ ...ccFormData, name: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500" placeholder="Ex: Comercial" /></div><div><label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Código (Opcional)</label><input type="text" value={ccFormData.code} onChange={(e) => setCCFormData({ ...ccFormData, code: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500" placeholder="Ex: CC-001" /></div></div><div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-2"><button onClick={() => setIsCCModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button><button onClick={handleSaveCC} disabled={!ccFormData.name} className="px-4 py-2 text-sm font-bold text-black bg-yellow-500 hover:bg-yellow-400 rounded-lg disabled:opacity-50">Salvar</button></div></div></div>
            )}
        </div>
    );
};