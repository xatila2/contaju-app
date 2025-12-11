import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DashboardLayout, GridItem, CardConfig } from '../types';

interface DashboardContextType {
    layouts: DashboardLayout[];
    activeLayout: DashboardLayout | null;
    isEditMode: boolean;

    // Actions
    toggleEditMode: () => void;
    setActiveLayout: (layoutId: string) => void;
    saveLayout: (layout: DashboardLayout) => void;
    updateLayoutItems: (items: GridItem[]) => void;
    updateCardConfig: (cardId: string, config: CardConfig) => void;
    addCardToLayout: (cardId: string, defaultSize: { w: number, h: number }) => void;
    removeCardFromLayout: (cardId: string) => void;
    resetToDefault: (customItems?: GridItem[]) => void;
}

const DEFAULT_LAYOUT: DashboardLayout = {
    id: 'default',
    userId: 'default',
    name: 'Visão Geral Original',
    items: [
        // Row 1: Bank List (Will be injected dynamically)

        // Row 2: KPIs
        { i: 'kpi_total_balance', x: 0, y: 3, w: 3, h: 3 },
        { i: 'kpi_income', x: 3, y: 3, w: 3, h: 3 },
        { i: 'kpi_expense', x: 6, y: 3, w: 3, h: 3 },
        { i: 'kpi_result', x: 9, y: 3, w: 3, h: 3 },

        // Row 3: Main Chart + Side Widgets
        { i: 'fluxo_caixa_30d', x: 0, y: 6, w: 8, h: 8 },
        { i: 'reconciliation_widget', x: 8, y: 6, w: 4, h: 3 },
        { i: 'revenue_goal_widget', x: 8, y: 9, w: 4, h: 5 },

        // Row 4: Expenses Table/Chart
        { i: 'despesa_por_categoria_pareto', x: 0, y: 14, w: 12, h: 6 }
    ],
    configs: {
        'kpi_total_balance': { type: 'kpi_rich' },
        'kpi_income': { type: 'kpi_rich', period: '30d' },
        'kpi_expense': { type: 'kpi_rich', period: '30d' },
        'kpi_result': { type: 'kpi_rich', period: '30d' },
        'fluxo_caixa_30d': { type: 'linha_area', period: '30d', showProjections: true },
        'reconciliation_widget': { type: 'custom_reconciliation' },
        'revenue_goal_widget': { type: 'custom_revenue_goal' },
        'despesa_por_categoria_pareto': { type: 'barra_horizontal', period: '30d' }
    }
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [layouts, setLayouts] = useState<DashboardLayout[]>(() => {
        const saved = localStorage.getItem('finflux_dashboard_layouts');
        return saved ? JSON.parse(saved) : [DEFAULT_LAYOUT];
    });

    const [activeLayoutId, setActiveLayoutId] = useState<string>('default');
    const [isEditMode, setIsEditMode] = useState(false);

    const activeLayout = layouts.find(l => l.id === activeLayoutId) || layouts[0];

    useEffect(() => {
        localStorage.setItem('finflux_dashboard_layouts', JSON.stringify(layouts));
    }, [layouts]);

    const toggleEditMode = () => setIsEditMode(prev => !prev);

    const saveLayout = (updatedLayout: DashboardLayout) => {
        setLayouts(prev => prev.map(l => l.id === updatedLayout.id ? updatedLayout : l));
    };

    const updateLayoutItems = (newItems: GridItem[]) => {
        if (!activeLayout) return;
        const updatedLayout = { ...activeLayout, items: newItems };
        saveLayout(updatedLayout);
    };

    const updateCardConfig = (cardId: string, config: CardConfig) => {
        if (!activeLayout) return;
        const updatedLayout = {
            ...activeLayout,
            configs: { ...activeLayout.configs, [cardId]: config }
        };
        saveLayout(updatedLayout);
    };

    const addCardToLayout = (cardId: string, defaultSize: { w: number, h: number }) => {
        if (!activeLayout) return;
        // Find first available spot or append to bottom
        // Simple append for now:
        const maxY = activeLayout.items.reduce((max, item) => Math.max(max, item.y + item.h), 0);

        // Use a clearer separator that won't conflict with existing underscores in IDs
        const instanceId = `${cardId}__inst_${Date.now()}`;

        const newItem: GridItem = {
            i: instanceId, // The GridItem ID must be unique
            x: 0,
            y: maxY,
            w: defaultSize.w,
            h: defaultSize.h
        };

        const updatedLayout = {
            ...activeLayout,
            items: [...activeLayout.items, newItem],
            // Initialize config with registry defaults if needed, handled by consumer components primarily
            configs: { ...activeLayout.configs, [instanceId]: {} }
        };
        saveLayout(updatedLayout);
    };

    const removeCardFromLayout = (instanceId: string) => {
        if (!activeLayout) return;
        const updatedLayout = {
            ...activeLayout,
            items: activeLayout.items.filter(i => i.i !== instanceId),
            // Optional: clean up config
        };
        saveLayout(updatedLayout);
    };

    // We need to dynamically inject bank cards if they are missing or if it's the first load?
    // Actually, "Total Freedom" means we should generate the default layout's "Bank Row" dynamically based on available banks.
    // BUT `DashboardContext` doesn't access `TransactionContext` (circular dep risk or just architecture).
    // `DefaultLayout` is static here.
    // Solution: We export a `cleanup/refresh` function or we accept an `initialBanks` prop?
    // Or simpler: We define a "Layout Initializer" effect in `Dashboard.tsx` that checks if banks are present?
    // Let's keep `resetToDefault` simple here, but maybe allow passing new items?
    /* 
       For "Total Freedom" of bank cards:
       We initially providing a "Empty Bank Slot" or user adds them?
       User said: "Design misaligned". "Need total freedom".
       So they want to resize EACH bank card.
       
       We will change `DEFAULT_LAYOUT` to NOT include 'bank_summary_list' by default, 
       but instead we need a way to populate it.
       
       Let's stick to the plan:
       1. Remove 'bank_summary_list' from static default.
       2. Add a `initializeDefaultBankCards(banks: BankAccount[])` method?
       3. Or just let the user add them? The prompt implies "Restore original configuration".
       
       Compromise: `bank_summary_list` REMOVED.
       We will rely on `Dashboard.tsx` to call `ensureBankCards(bankAccounts)` on mount if layout is empty/default?
    */

    // For now, let's just expose a method to "Reset with Banks" or similar.
    // Let's modify `resetToDefault` to accept optional `customItems`.

    const resetToDefault = (customItems?: GridItem[]) => {
        // Logic to rebuild default layout
        const baseItems = DEFAULT_LAYOUT.items.filter(i => i.i !== 'bank_summary_list');

        const newLayout = {
            ...DEFAULT_LAYOUT,
            items: customItems ? [...customItems, ...baseItems] : DEFAULT_LAYOUT.items
        };

        setLayouts([newLayout]);
        setActiveLayoutId('default');
    };

    return (
        <DashboardContext.Provider value={{
            layouts,
            activeLayout,
            isEditMode,
            toggleEditMode,
            setActiveLayout: setActiveLayoutId,
            saveLayout,
            updateLayoutItems,
            updateCardConfig,
            addCardToLayout,
            removeCardFromLayout,
            resetToDefault
        }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
