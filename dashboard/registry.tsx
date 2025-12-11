import { CardDefinition } from '../types';
import { Transaction, Category, PlanningData } from '../types';

// IMPORTANT: This registry defines the metadata for all available cards.
// The actual logic for fetching data will be in separate selector functions.

export const CARD_REGISTRY: CardDefinition[] = [
    // --- Custom Widgets ---
    {
        id: 'bank_single_card',
        title: 'Cartão de Banco',
        description: 'Exibe saldo de uma conta específica.',
        category: 'Cartões',
        defaultSize: { w: 3, h: 2 },
        defaultType: 'custom_bank_card',
        allowedTypes: ['custom_bank_card']
    },
    {
        id: 'bank_summary_list',
        title: 'Lista de Contas',
        description: 'Grid com todas as contas bancárias.',
        category: 'Cartões',
        defaultSize: { w: 12, h: 4 },
        defaultType: 'custom_bank_list',
        allowedTypes: ['custom_bank_list']
    },
    {
        id: 'revenue_goal_widget',
        title: 'Meta de Faturamento',
        description: 'Progresso da meta mensal.',
        category: 'KPI',
        defaultSize: { w: 4, h: 4 },
        defaultType: 'custom_revenue_goal',
        allowedTypes: ['custom_revenue_goal']
    },

    // --- CASH ANALYSIS ---
    { id: 'saldo_disponivel', title: 'Saldo Disponível', description: 'Saldo total consolidado.', category: 'Caixa', defaultSize: { w: 3, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich', 'kpi_numero'] },
    { id: 'saldo_por_conta', title: 'Saldo por Conta', description: 'Saldo atual de cada conta.', category: 'Caixa', defaultSize: { w: 4, h: 4 }, defaultType: 'barra_horizontal', allowedTypes: ['barra_horizontal', 'barra_vertical', 'pizza'] },
    { id: 'saldo_diario', title: 'Saldo Diário', description: 'Evolução do saldo dia a dia.', category: 'Caixa', defaultSize: { w: 6, h: 4 }, defaultType: 'linha_simples', allowedTypes: ['linha_simples', 'linha_area'] },
    { id: 'movimentacao_liquida', title: 'Movimentação Líquida', description: 'Entradas - Saídas por período.', category: 'Caixa', defaultSize: { w: 6, h: 4 }, defaultType: 'barra_vertical', allowedTypes: ['barra_vertical', 'linha_area'] },
    { id: 'proj_fluxo_caixa_30d', title: 'Fluxo de Caixa 30d', description: 'Projeção para os próximos 30 dias.', category: 'Caixa', defaultSize: { w: 8, h: 6 }, defaultType: 'linha_area', allowedTypes: ['linha_area', 'barras_agrupadas', 'linha_com_pontos'] },

    // --- REVENUE ---
    { id: 'receita_por_categoria', title: 'Receita por Categoria', description: 'Distribuição de receitas.', category: 'Receita', defaultSize: { w: 4, h: 4 }, defaultType: 'donut', allowedTypes: ['donut', 'pizza', 'barra_horizontal'] },
    { id: 'receita_total', title: 'Receita Total', description: 'Volume total de vendas.', category: 'Receita', defaultSize: { w: 3, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich', 'kpi_numero'] },
    { id: 'top10_clientes', title: 'Top 10 Clientes', description: 'Quem mais comprou no período.', category: 'Receita', defaultSize: { w: 4, h: 6 }, defaultType: 'barra_horizontal', allowedTypes: ['barra_horizontal', 'kpi_scorecard'] },
    { id: 'ticket_medio', title: 'Ticket Médio', description: 'Valor médio por venda.', category: 'Receita', defaultSize: { w: 3, h: 2 }, defaultType: 'kpi_numero', allowedTypes: ['kpi_numero', 'linha_simples'] },

    // --- EXPENSES ---
    { id: 'despesas_totais', title: 'Despesas Totais', description: 'Volume total de gastos.', category: 'Despesa', defaultSize: { w: 3, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich', 'kpi_numero'] },
    { id: 'despesa_por_categoria_pareto', title: 'Despesas por Categoria', description: 'Pareto das maiores despesas.', category: 'Despesa', defaultSize: { w: 6, h: 6 }, defaultType: 'barra_horizontal', allowedTypes: ['barra_horizontal', 'barras_empilhadas'] },

    // --- KPIs ---
    { id: 'kpi_income', title: 'Receita (KPI)', description: 'Indicador de entrada.', category: 'KPI', defaultSize: { w: 3, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich'] },
    { id: 'kpi_expense', title: 'Despesa (KPI)', description: 'Indicador de saída.', category: 'KPI', defaultSize: { w: 3, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich'] },
    { id: 'kpi_result', title: 'Resultado (KPI)', description: 'Indicador de saldo.', category: 'KPI', defaultSize: { w: 3, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich'] },
    { id: 'kpi_total_balance', title: 'Saldo Total', description: 'Legacy', category: 'Caixa', defaultSize: { w: 3, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich'] },

    { id: 'capital_giro_card', title: 'Capital de Giro', description: 'Monitoramento de Capital de Giro e Caixa Livre', category: 'Financeiro', defaultSize: { w: 4, h: 3 }, defaultType: 'custom_working_capital', allowedTypes: ['custom_working_capital'] },

    // --- OFFICIAL DASHBOARD CARDS ---
    { id: 'saldo_total', title: 'Saldo Total', description: 'Soma de todos os bancos.', category: 'Oficial', defaultSize: { w: 3, h: 2 }, defaultType: 'kpi_numero', allowedTypes: ['kpi_numero', 'kpi_rich'] },
    { id: 'saldos_por_banco', title: 'Saldos por Banco', description: 'Saldo por conta bancária.', category: 'Oficial', defaultSize: { w: 4, h: 4 }, defaultType: 'barra_horizontal', allowedTypes: ['barra_horizontal', 'barra_vertical', 'pizza'] },
    { id: 'receita_total_prevista_realizada', title: 'Receita Total', description: 'Realizado vs Previsto.', category: 'Oficial', defaultSize: { w: 4, h: 4 }, defaultType: 'kpi_gradient', allowedTypes: ['kpi_gradient', 'barras_agrupadas', 'kpi_numero', 'linha_simples'] },
    { id: 'despesa_total_prevista_realizada', title: 'Despesas Totais', description: 'Realizado vs Teto.', category: 'Oficial', defaultSize: { w: 4, h: 4 }, defaultType: 'kpi_gradient', allowedTypes: ['kpi_gradient', 'barras_agrupadas', 'kpi_numero', 'linha_simples'] },
    { id: 'resultado_total_realizado_projetado', title: 'Resultado do Mês', description: 'Realizado vs Projetado.', category: 'Oficial', defaultSize: { w: 4, h: 4 }, defaultType: 'barras_agrupadas', allowedTypes: ['barras_agrupadas', 'linha_simples', 'linha_barra'] },
    { id: 'resultado_por_banco', title: 'Resultado por Banco', description: 'Resultado por conta.', category: 'Oficial', defaultSize: { w: 4, h: 4 }, defaultType: 'barra_horizontal', allowedTypes: ['barra_horizontal'] },
    { id: 'gauge_receita_meta', title: 'Meta de Receita', description: 'Progresso da receita.', category: 'Oficial', defaultSize: { w: 3, h: 3 }, defaultType: 'kpi_gauge', allowedTypes: ['kpi_gauge', 'kpi_termometro'] },
    { id: 'gauge_despesa_teto', title: 'Teto de Despesas', description: 'Consumo do teto.', category: 'Oficial', defaultSize: { w: 3, h: 3 }, defaultType: 'kpi_gauge', allowedTypes: ['kpi_gauge', 'kpi_termometro'] },

    // --- NEW PROMPT CARDS ---
    { id: 'receita_meta_gauge', title: 'Meta de Receita', description: 'Real vs Meta (Gauge).', category: 'Oficial', defaultSize: { w: 3, h: 3 }, defaultType: 'kpi_gauge', allowedTypes: ['kpi_gauge'] },
    { id: 'despesa_meta_gauge', title: 'Meta de Despesa', description: 'Real vs Teto (Gauge Invertido).', category: 'Oficial', defaultSize: { w: 3, h: 3 }, defaultType: 'kpi_gauge', allowedTypes: ['kpi_gauge'] },
    { id: 'lucro_meta_gauge', title: 'Meta de Lucro', description: 'Real vs Meta (Gauge).', category: 'Oficial', defaultSize: { w: 3, h: 3 }, defaultType: 'kpi_gauge', allowedTypes: ['kpi_gauge'] },
    { id: 'fluxo_caixa_livre_card', title: 'Fluxo de Caixa Livre', description: 'Operacional Liquido.', category: 'Oficial', defaultSize: { w: 3, h: 3 }, defaultType: 'kpi_gradient', allowedTypes: ['kpi_gradient', 'kpi_rich'] },

    { id: 'faturamento_total_card', title: 'Total Faturamento', description: 'Soma total de receitas.', category: 'Oficial', defaultSize: { w: 4, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich', 'kpi_numero'] },
    { id: 'pagamentos_total_card', title: 'Total Pagamentos', description: 'Soma total de despesas.', category: 'Oficial', defaultSize: { w: 4, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich', 'kpi_numero'] },
    { id: 'lucro_mensal_card', title: 'Lucro do Mês', description: 'Receita - Despesa.', category: 'Oficial', defaultSize: { w: 4, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich', 'kpi_numero'] },

    // --- NEW DASHBOARD 2.0 CARDS ---
    { id: 'caixa_atual_card', title: 'Caixa Atual', description: 'Saldo consolidado e variação', category: 'Oficial', defaultSize: { w: 4, h: 4 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich', 'kpi_gradient'] },
    { id: 'saude_caixa_card', title: 'Saúde do Caixa', description: 'Capital de Giro e Caixa Livre', category: 'Oficial', defaultSize: { w: 4, h: 4 }, defaultType: 'custom_working_capital', allowedTypes: ['custom_working_capital', 'kpi_gauge'] },
    { id: 'caixa_livre_explicit_card', title: 'Caixa Livre', description: 'Valor disponível após reserva', category: 'Oficial', defaultSize: { w: 4, h: 2 }, defaultType: 'kpi_rich', allowedTypes: ['kpi_rich'] },
    { id: 'fcl_card', title: 'Fluxo de Caixa Livre', description: 'Indicador FCL', category: 'Oficial', defaultSize: { w: 4, h: 4 }, defaultType: 'kpi_gradient', allowedTypes: ['kpi_gradient', 'kpi_rich'] },
    { id: 'despesa_por_categoria_detalhada', title: 'Despesas por Categoria (Detalhada)', description: 'Barra horizontal detalhada.', category: 'Oficial', defaultSize: { w: 12, h: 4 }, defaultType: 'barra_horizontal', allowedTypes: ['barra_horizontal'] },
    { id: 'fluxo_caixa_diario', title: 'Fluxo de Caixa Diário', description: 'Evolução diária do saldo.', category: 'Oficial', defaultSize: { w: 12, h: 4 }, defaultType: 'linha_area', allowedTypes: ['linha_area', 'linha_simples'] },
];

// Helper to get definition
export function getCardDefinition(cardId: string): CardDefinition | undefined {
    return CARD_REGISTRY.find(def => def.id === cardId);
}
