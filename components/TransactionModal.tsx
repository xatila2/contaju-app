
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Save, Paperclip, FileText, Repeat, ArrowRightLeft, Search, ChevronDown, Lock, ArrowDownCircle, ArrowUpCircle, Wand2, Plus } from 'lucide-react';
import { Transaction, Category, BankAccount, CostCenter, CategoryRule } from '../types';
import { CurrencyInput } from './CurrencyInput';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  categories: Category[];
  bankAccounts: BankAccount[];
  costCenters?: CostCenter[];
  transactionToEdit: Transaction | null;
  categoryRules?: CategoryRule[];
  onAddCategoryRule?: (rule: Omit<CategoryRule, 'id'>) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen, onClose, onSave, categories, bankAccounts, costCenters = [], transactionToEdit,
  categoryRules = [], onAddCategoryRule
}) => {
  const defaultState: Partial<Transaction> = {
    description: '',
    client: '',
    amount: 0,
    type: 'expense',
    status: 'pending',
    launchDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    paymentDate: '',
    categoryId: '',
    costCenterId: '',
    bankAccountId: '',
    destinationBankAccountId: '',
    recurrence: { active: false, frequency: 'monthly', interval: 1, endType: 'date', occurrences: 12 },
    notes: '',
    attachmentName: ''
  };

  const [formData, setFormData] = useState(defaultState);

  // Custom Category Dropdown State
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [autoSuggested, setAutoSuggested] = useState(false);
  const [showRuleCreator, setShowRuleCreator] = useState(false);
  const [newRuleKeyword, setNewRuleKeyword] = useState('');

  // Populate form when opening in Edit mode
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setFormData({ ...transactionToEdit });
      } else {
        setFormData(defaultState);
      }
      setCategorySearch('');
    }
  }, [isOpen, transactionToEdit]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Auto-Suggestion Logic ---
  const normalizeText = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  const checkCategoryRules = () => {
    // Only run if description has value and we are on income/expense
    if (!formData.description || formData.type === 'transfer' || !categoryRules.length) return;

    // Don't override if editing an existing transaction (unless user explicitly cleared it, but here we assume safety)
    if (transactionToEdit && formData.categoryId === transactionToEdit.categoryId) return;

    // If user already manually selected a category, we might choose NOT to override, 
    // or only override if the current category is empty.
    // Requirement says: "When user fills description... suggest".
    // Let's safe guard: Only suggest if category is empty OR if this is a fresh typing session.
    // For now, if categoryId is set, we skip to avoid annoying the user, unless they just cleared it.
    // Actually, improved UX: If user types "Uber" but category was "Food", maybe they want to switch. 
    // But let's stick to: If no category selected, OR if the user just finished typing description.

    const descNorm = normalizeText(formData.description);
    const typeRules = categoryRules.filter(r => r.type === formData.type && r.active);

    // Find matches
    const matches = typeRules.filter(rule => descNorm.includes(normalizeText(rule.keyword)));

    if (matches.length > 0) {
      // Sort by priority (desc)
      matches.sort((a, b) => b.priority - a.priority);
      const bestMatch = matches[0];

      // Update form
      if (bestMatch.categoryId !== formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: bestMatch.categoryId }));
        setAutoSuggested(true);
      }
    }
  };

  const handleRuleCreation = () => {
    if (!onAddCategoryRule || !formData.categoryId || !newRuleKeyword) return;

    onAddCategoryRule({
      type: formData.type as 'income' | 'expense',
      keyword: newRuleKeyword,
      categoryId: formData.categoryId,
      priority: 1,
      active: true
    });

    setShowRuleCreator(false);
    setNewRuleKeyword('');
    alert('Regra criada com sucesso!');
  };

  const handleSave = () => {
    console.log('Attempting to save:', formData);
    console.log('Categories available:', categories.length);

    // Basic Validation
    if (!formData.description || !formData.amount || !formData.dueDate) {
      const missing = [];
      if (!formData.description) missing.push("Descrição");
      if (!formData.amount) missing.push("Valor");
      if (!formData.dueDate) missing.push("Data Vencimento");
      alert(`Por favor preencha: ${missing.join(', ')}`);
      return;
    }

    if (formData.type === 'transfer') {
      if (!formData.bankAccountId || !formData.destinationBankAccountId) {
        alert("Selecione conta origem e destino para transferência.");
        return;
      }
      if (formData.bankAccountId === formData.destinationBankAccountId) {
        alert("A conta de destino deve ser diferente da origem.");
        return;
      }
    } else {
      if (!formData.categoryId) {
        alert("Selecione uma categoria.");
        return;
      }
    }

    const newTx: Transaction = {
      ...formData as Transaction,
      id: transactionToEdit ? transactionToEdit.id : Math.random().toString(36).substr(2, 9),
    };
    onSave(newTx);
    onClose();
  };

  const handleFileUpload = () => {
    const mockFiles = ['nota_fiscal_servico.pdf', 'comprovante_pix.pdf', 'invoice_1023.pdf'];
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setFormData({ ...formData, attachmentName: randomFile });
  };

  const filteredCategories = useMemo(() => {
    // 1. Filter by Type (Income vs Expense)
    const typeFiltered = categories.filter(c => c.type === formData.type);

    // 2. Sort by Code
    const sorted = [...typeFiltered].sort((a, b) => a.code.localeCompare(b.code));

    // 3. Filter by Search Term
    if (!categorySearch) return sorted;
    return sorted.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [categories, formData.type, categorySearch]);

  const selectedCategoryName = useMemo(() => {
    const cat = categories.find(c => c.id === formData.categoryId);
    return cat ? cat.name : '';
  }, [categories, formData.categoryId]);

  if (!isOpen) return null;

  const isTransfer = formData.type === 'transfer';

  // Auto-reconcile when payment date is set
  useEffect(() => {
    if (formData.paymentDate && formData.status !== 'reconciled') {
      setFormData(prev => ({ ...prev, status: 'reconciled' }));
    }
  }, [formData.paymentDate]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] transition-colors duration-500
          ${formData.type === 'expense' ? 'bg-gradient-to-b from-rose-100 to-white dark:from-rose-950/40 dark:to-zinc-900 border-t-4 border-t-rose-600' : ''}
          ${formData.type === 'income' ? 'bg-gradient-to-b from-emerald-100 to-white dark:from-emerald-950/40 dark:to-zinc-900 border-t-4 border-t-emerald-600' : ''}
          ${formData.type === 'transfer' ? 'bg-gradient-to-b from-blue-100 to-white dark:from-blue-950/40 dark:to-zinc-900 border-t-4 border-t-blue-600' : ''}
        `}>
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-transparent">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">

          {/* Transaction Type Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 mb-6">
            <button
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all text-sm font-bold ${formData.type === 'expense' ? 'bg-white dark:bg-zinc-700 shadow-md text-rose-600 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-0' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700/50'}`}
              onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '' })}
            >
              <ArrowDownCircle size={18} />
              <span>Pagar</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all text-sm font-bold ${formData.type === 'income' ? 'bg-white dark:bg-zinc-700 shadow-md text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-0' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700/50'}`}
              onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
            >
              <ArrowUpCircle size={18} />
              <span>Receber</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all text-sm font-bold ${formData.type === 'transfer' ? 'bg-white dark:bg-zinc-700 shadow-md text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-0' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700/50'}`}
              onClick={() => setFormData({ ...formData, type: 'transfer' })}
            >
              <ArrowRightLeft size={18} />
              <span>Transferências</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Descrição</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                placeholder={
                  formData.type === 'transfer' ? "Ex: Transf. para Investimento" :
                    formData.type === 'income' ? "Ex: Recebimento de Venda" :
                      "Ex: Pagamento de Luz"
                }
                autoFocus
                onBlur={checkCategoryRules}
              />
            </div>

            {!isTransfer && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cliente / Fornecedor</label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={e => setFormData({ ...formData, client: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  placeholder="Ex: Imobiliária Silva"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500">R$</span>
                <CurrencyInput
                  value={formData.amount}
                  onChange={(val) => setFormData({ ...formData, amount: val })}
                  className="w-full pl-10 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Secondary type switcher removed as requested, now integrated in top tabs */}
          </div>

          {isTransfer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Conta Origem (Sai)</label>
                <select
                  value={formData.bankAccountId || ''}
                  onChange={e => setFormData({ ...formData, bankAccountId: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                >
                  <option value="">Selecione...</option>
                  {bankAccounts.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Conta Destino (Entra)</label>
                <select
                  value={formData.destinationBankAccountId || ''}
                  onChange={e => setFormData({ ...formData, destinationBankAccountId: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                >
                  <option value="">Selecione...</option>
                  {bankAccounts.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Searchable Category Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Categoria {autoSuggested && <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full ml-2 animate-pulse">(Sugerida)</span>}
                  </label>
                  {/* Create Rule Shortcut */}
                  {!isTransfer && formData.description && formData.categoryId && onAddCategoryRule && (
                    <button
                      onClick={() => {
                        setNewRuleKeyword(formData.description.split(' ')[0]); // Default to first word
                        setShowRuleCreator(true);
                      }}
                      className="text-xs flex items-center text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 hover:underline"
                    >
                      <Plus size={10} className="mr-0.5" /> Criar Regra
                    </button>
                  )}
                </div>
                <div
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-yellow-500"
                  onClick={() => {
                    setIsCatDropdownOpen(!isCatDropdownOpen);
                    if (!isCatDropdownOpen) setCategorySearch('');
                  }}
                >
                  {isCatDropdownOpen ? (
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                      placeholder="Buscar categoria..."
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className={`text-sm ${selectedCategoryName ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-400 dark:text-zinc-500'}`}>
                      {selectedCategoryName || "Selecione..."}
                    </span>
                  )}
                  <ChevronDown size={16} className="text-zinc-500 flex-shrink-0 ml-2" />
                </div>

                {isCatDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map(cat => {
                        const level = (cat.code.match(/\./g) || []).length + (cat.code.length > 4 ? 1 : 0);
                        const indent = level * 12;

                        // Check if category is a parent (has children)
                        const hasChildren = categories.some(c => c.parentId === cat.id);

                        return (
                          <div
                            key={cat.id}
                            className={`px-3 py-2 text-sm flex items-center transition-colors border-l-2
                                                ${hasChildren
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold border-zinc-400 dark:border-zinc-500 cursor-default pointer-events-none opacity-90'
                                : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer border-transparent hover:border-yellow-400'
                              }
                                            `}
                            style={{ paddingLeft: `${indent + 12}px` }}
                            onClick={(e) => {
                              if (hasChildren) {
                                e.stopPropagation();
                                return;
                              }
                              setFormData({ ...formData, categoryId: cat.id });
                              setIsCatDropdownOpen(false);
                              setCategorySearch('');
                            }}
                          >
                            <span className={`font-mono text-xs mr-2 ${hasChildren ? 'text-zinc-600 dark:text-zinc-400 font-bold' : 'text-zinc-400 dark:text-zinc-500'}`}>{cat.code}</span>
                            <span>{cat.name}</span>
                            {hasChildren && <span className="ml-auto text-xs text-zinc-400 font-normal uppercase tracking-wider">Grupo</span>}
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-sm text-zinc-500">Nenhuma categoria encontrada.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Rule Creator Modal (Mini) */}
              {showRuleCreator && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-2xl border border-yellow-500/30 w-80 animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <Wand2 size={16} className="text-yellow-500" />
                      Nova Regra de Sugestão
                    </h4>
                    <p className="text-xs text-zinc-500 mb-3">
                      Sempre que a descrição conter a palavra abaixo, sugerir <strong>{selectedCategoryName}</strong>.
                    </p>
                    <input
                      type="text"
                      value={newRuleKeyword}
                      onChange={(e) => setNewRuleKeyword(e.target.value)}
                      className="w-full text-sm border rounded px-2 py-1 mb-3 dark:bg-zinc-800 dark:border-zinc-700"
                      placeholder="Ex: uber"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowRuleCreator(false)} className="text-xs px-3 py-1.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200">Cancelar</button>
                      <button onClick={handleRuleCreation} className="text-xs px-3 py-1.5 rounded bg-yellow-500 text-white font-medium hover:bg-yellow-600">Salvar Regra</button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Conta Bancária</label>
                <select
                  value={formData.bankAccountId || ''}
                  onChange={e => setFormData({ ...formData, bankAccountId: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none font-medium text-sm"
                >
                  <option value="">Selecione o banco...</option>
                  {bankAccounts.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!isTransfer && (
            <div className="grid grid-cols-1">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Centro de Custo</label>
                <select
                  value={formData.costCenterId || ''}
                  onChange={e => setFormData({ ...formData, costCenterId: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none font-medium text-sm"
                >
                  <option value="">Selecione...</option>
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Competência</label>
              <input
                type="date"
                value={formData.launchDate}
                onChange={e => setFormData({ ...formData, launchDate: e.target.value })}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Vencimento <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Pagamento</label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Repeat className="text-yellow-600 dark:text-yellow-500" size={18} />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">Repetir lançamento?</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={formData.recurrence?.active} onChange={(e) => setFormData({ ...formData, recurrence: { ...formData.recurrence!, active: e.target.checked } })} />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            {/* Recurrence Options - Missing Block Restored */}
            {formData.recurrence?.active && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Frequência</label>
                  <select
                    value={formData.recurrence.frequency}
                    onChange={(e) => setFormData({ ...formData, recurrence: { ...formData.recurrence!, frequency: e.target.value as any } })}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Repetir a cada (unid.)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.recurrence.interval}
                    onChange={(e) => setFormData({ ...formData, recurrence: { ...formData.recurrence!, interval: parseInt(e.target.value) || 1 } })}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Terminar</label>
                  <div className="flex space-x-2 mb-2">
                    <button
                      onClick={() => setFormData({ ...formData, recurrence: { ...formData.recurrence!, endType: 'date' } })}
                      className={`flex-1 text-[10px] py-1 rounded border ${formData.recurrence.endType === 'date' ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-400' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-500'}`}
                    >
                      Por Data
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, recurrence: { ...formData.recurrence!, endType: 'occurrences' } })}
                      className={`flex-1 text-[10px] py-1 rounded border ${formData.recurrence.endType === 'occurrences' ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-400' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-500'}`}
                    >
                      Por Repetições
                    </button>
                  </div>

                  {formData.recurrence.endType === 'date' ? (
                    <input
                      type="date"
                      value={formData.recurrence.endDate || ''}
                      onChange={(e) => setFormData({ ...formData, recurrence: { ...formData.recurrence!, endDate: e.target.value } })}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-yellow-500 [&::-webkit-calendar-picker-indicator]:dark:invert"
                    />
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="360"
                        value={formData.recurrence.occurrences || ''}
                        onChange={(e) => setFormData({ ...formData, recurrence: { ...formData.recurrence!, occurrences: parseInt(e.target.value) || 1 } })}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="Ex: 12"
                      />
                      <span className="absolute right-3 top-2 text-xs text-zinc-400">vezes</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Notas / Observações</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                placeholder="Detalhes adicionais sobre a transação..."
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Documento / Comprovante</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleFileUpload}
                  className="flex items-center space-x-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-colors"
                >
                  <Paperclip size={16} />
                  <span>Anexar Arquivo</span>
                </button>
                {formData.attachmentName && (
                  <div className="flex items-center space-x-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                    <FileText size={14} />
                    <span className="truncate max-w-[200px]">{formData.attachmentName}</span>
                    <button onClick={() => setFormData({ ...formData, attachmentName: '' })} className="hover:text-emerald-800 dark:hover:text-emerald-200"><X size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">Cancelar</button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-bold text-black bg-gradient-to-r from-yellow-600 to-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20 rounded-lg transition"
          >
            <Save size={16} />
            <span>{transactionToEdit ? 'Atualizar' : 'Salvar'} Lançamento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
