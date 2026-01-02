
import { CashFlowData, KPI, Transaction, Scenario, Category, BankAccount, CostCenter } from './types';

// --- MOCK BANKS ---
export const MOCK_BANKS: BankAccount[] = [
  { id: 'bank-1', name: 'Itaú Empresas', initialBalance: 150000, initialBalanceDate: '2023-01-01', color: 'orange' },
  { id: 'bank-2', name: 'Santander', initialBalance: 85000, initialBalanceDate: '2023-01-01', color: 'red' },
  { id: 'bank-3', name: 'Bradesco', initialBalance: 210000, initialBalanceDate: '2023-01-01', color: 'blue' },
  { id: 'bank-4', name: 'Caixa Pequeno', initialBalance: 1500, initialBalanceDate: '2023-01-01', color: 'green' },
];

// --- MOCK COST CENTERS ---
export const DEFAULT_COST_CENTERS: CostCenter[] = [
  { id: 'cc-1', name: 'Geral / Administrativo', code: 'CC-001' },
  { id: 'cc-2', name: 'Comercial / Vendas', code: 'CC-002' },
  { id: 'cc-3', name: 'Operações / Produção', code: 'CC-003' },
  { id: 'cc-4', name: 'TI e Tecnologia', code: 'CC-004' },
  { id: 'cc-5', name: 'Marketing', code: 'CC-005' },
];

// --- STANDARD CHART OF ACCOUNTS (PLANO DE CONTAS) ---
// --- STANDARD CHART OF ACCOUNTS (PLANO DE CONTAS) ---
// Match the Database Template Structure exactly to avoid duplicates
export const DEFAULT_CATEGORIES: Category[] = [
  // 1. RECEITAS
  { id: 'cat-1-0', code: '1.0', name: 'Receitas Operacionais', type: 'income', isSystemDefault: true, cashFlowType: 'operational' },
  { id: 'cat-1-1', code: '1.1', name: 'Vendas de Produtos', type: 'income', parentId: 'cat-1-0', cashFlowType: 'operational' },
  { id: 'cat-1-2', code: '1.2', name: 'Serviços Prestados', type: 'income', parentId: 'cat-1-0', cashFlowType: 'operational' },
  { id: 'cat-1-3', code: '1.3', name: 'Adiantamento de Clientes', type: 'income', parentId: 'cat-1-0', cashFlowType: 'operational' },

  // 2. RECEITAS FINANCEIRAS
  { id: 'cat-2-0', code: '2.0', name: 'Receitas Financeiras', type: 'income', isSystemDefault: true, cashFlowType: 'financial' },
  { id: 'cat-2-1', code: '2.1', name: 'Juros Recebidos', type: 'income', parentId: 'cat-2-0', cashFlowType: 'financial' },
  { id: 'cat-2-2', code: '2.2', name: 'Rendimentos de Aplicações', type: 'income', parentId: 'cat-2-0', cashFlowType: 'financial' },
  { id: 'cat-2-3', code: '2.3', name: 'Outras Entradas', type: 'income', parentId: 'cat-2-0', cashFlowType: 'financial' },

  // 3. DESPESAS ADMINISTRATIVAS
  { id: 'cat-3-0', code: '3.0', name: 'Despesas Administrativas', type: 'expense', isSystemDefault: true, cashFlowType: 'operational' },
  { id: 'cat-3-1', code: '3.1', name: 'Aluguel', type: 'expense', parentId: 'cat-3-0', cashFlowType: 'operational' },
  { id: 'cat-3-2', code: '3.2', name: 'Condomínio', type: 'expense', parentId: 'cat-3-0', cashFlowType: 'operational' },
  { id: 'cat-3-3', code: '3.3', name: 'Água, Luz e Telefone', type: 'expense', parentId: 'cat-3-0', cashFlowType: 'operational' },
  { id: 'cat-3-4', code: '3.4', name: 'Internet e Sistemas', type: 'expense', parentId: 'cat-3-0', cashFlowType: 'operational' },
  { id: 'cat-3-5', code: '3.5', name: 'Material de Escritório', type: 'expense', parentId: 'cat-3-0', cashFlowType: 'operational' },
  { id: 'cat-3-6', code: '3.6', name: 'Limpeza e Conservação', type: 'expense', parentId: 'cat-3-0', cashFlowType: 'operational' },
  { id: 'cat-3-7', code: '3.7', name: 'Seguros', type: 'expense', parentId: 'cat-3-0', cashFlowType: 'operational' },

  // 4. PESSOAL
  { id: 'cat-4-0', code: '4.0', name: 'Pessoal', type: 'expense', isSystemDefault: true, cashFlowType: 'operational' },
  { id: 'cat-4-1', code: '4.1', name: 'Salários', type: 'expense', parentId: 'cat-4-0', cashFlowType: 'operational' },
  { id: 'cat-4-2', code: '4.2', name: 'Pró-Labore', type: 'expense', parentId: 'cat-4-0', cashFlowType: 'operational' },
  { id: 'cat-4-3', code: '4.3', name: 'Vale Transporte/Alimentação', type: 'expense', parentId: 'cat-4-0', cashFlowType: 'operational' },
  { id: 'cat-4-4', code: '4.4', name: 'Encargos Sociais (INSS/FGTS)', type: 'expense', parentId: 'cat-4-0', cashFlowType: 'operational' },
  { id: 'cat-4-5', code: '4.5', name: 'Adiantamentos', type: 'expense', parentId: 'cat-4-0', cashFlowType: 'operational' },

  // 5. MARKETING
  { id: 'cat-5-0', code: '5.0', name: 'Marketing e Vendas', type: 'expense', isSystemDefault: true, cashFlowType: 'operational' },
  { id: 'cat-5-1', code: '5.1', name: 'Publicidade e Propaganda', type: 'expense', parentId: 'cat-5-0', cashFlowType: 'operational' },
  { id: 'cat-5-2', code: '5.2', name: 'Comissões de Vendas', type: 'expense', parentId: 'cat-5-0', cashFlowType: 'operational' },
  { id: 'cat-5-3', code: '5.3', name: 'Brindes e Eventos', type: 'expense', parentId: 'cat-5-0', cashFlowType: 'operational' },

  // 6. IMPOSTOS
  { id: 'cat-6-0', code: '6.0', name: 'Impostos e Taxas', type: 'expense', isSystemDefault: true, cashFlowType: 'operational' },
  { id: 'cat-6-1', code: '6.1', name: 'Simples Nacional / DAS', type: 'expense', parentId: 'cat-6-0', cashFlowType: 'operational' },
  { id: 'cat-6-2', code: '6.2', name: 'ICMS / ISS', type: 'expense', parentId: 'cat-6-0', cashFlowType: 'operational' },
  { id: 'cat-6-3', code: '6.3', name: 'Taxas Bancárias', type: 'expense', parentId: 'cat-6-0', cashFlowType: 'operational' },

  // 7. CUSTOS OPERACIONAIS
  { id: 'cat-7-0', code: '7.0', name: 'Custos Operacionais', type: 'expense', isSystemDefault: true, cashFlowType: 'operational' },
  { id: 'cat-7-1', code: '7.1', name: 'Fornecedores', type: 'expense', parentId: 'cat-7-0', cashFlowType: 'operational' },
  { id: 'cat-7-2', code: '7.2', name: 'Matéria-Prima', type: 'expense', parentId: 'cat-7-0', cashFlowType: 'operational' },
  { id: 'cat-7-3', code: '7.3', name: 'Transporte e Fretes', type: 'expense', parentId: 'cat-7-0', cashFlowType: 'operational' },
  { id: 'cat-7-4', code: '7.4', name: 'Manutenção de Equipamentos', type: 'expense', parentId: 'cat-7-0', cashFlowType: 'operational' },

  // 8. DESPESAS FINANCEIRAS
  { id: 'cat-8-0', code: '8.0', name: 'Despesas Financeiras', type: 'expense', isSystemDefault: true, cashFlowType: 'financial' },
  { id: 'cat-8-1', code: '8.1', name: 'Juros Pagos', type: 'expense', parentId: 'cat-8-0', cashFlowType: 'financial' },
  { id: 'cat-8-2', code: '8.2', name: 'Multas e Juros', type: 'expense', parentId: 'cat-8-0', cashFlowType: 'financial' },
  { id: 'cat-8-3', code: '8.3', name: 'Tarifas Bancárias (Extra)', type: 'expense', parentId: 'cat-8-0', cashFlowType: 'financial' }
];

// --- SEED TRANSACTION GENERATOR ---
// Generates realistic transactions for the past 6 months and next 6 months
const generateInitialTransactions = (): Transaction[] => {
  const txs: Transaction[] = [];
  const today = new Date();

  const clients = ['Cliente Alpha', 'Cliente Beta', 'Cliente Gama', 'Loja do João', 'Tech Solutions', 'Consultoria XP'];
  const suppliers = ['Fornecedor ABC', 'Amazon AWS', 'Google Cloud', 'Imobiliária Central', 'Energia Local', 'Dell Computadores'];

  // Helper to add days
  const addDays = (d: Date, days: number) => {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  };

  // 1. Recurring Expenses (Rent, Salaries, Software)
  for (let i = -6; i <= 6; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 5); // 5th of each month
    const dateStr = date.toISOString().split('T')[0];
    const status = i <= 0 ? 'reconciled' : 'pending';

    // Rent
    txs.push({
      id: `seed-rent-${i}`, description: 'Aluguel Escritório', amount: -4500, type: 'expense',
      status, launchDate: dateStr, dueDate: dateStr, paymentDate: i <= 0 ? dateStr : undefined,
      categoryId: 'cat-4-1', bankAccountId: 'bank-1', costCenterId: 'cc-1',
      date: dateStr, category: 'Aluguel', isReconciled: status === 'reconciled'
    });

    // Salaries (bigger amount)
    const salaryDate = new Date(today.getFullYear(), today.getMonth() + i, 28);
    const salaryDateStr = salaryDate.toISOString().split('T')[0];
    txs.push({
      id: `seed-salary-${i}`, description: 'Folha de Pagamento', amount: -45000, type: 'expense',
      status: i < 0 ? 'reconciled' : 'pending', launchDate: salaryDateStr, dueDate: salaryDateStr,
      paymentDate: i < 0 ? salaryDateStr : undefined, categoryId: 'cat-3-1', bankAccountId: 'bank-1', costCenterId: 'cc-1',
      date: salaryDateStr, category: 'Salários', isReconciled: i < 0
    });

    // Software
    const swDate = new Date(today.getFullYear(), today.getMonth() + i, 15);
    const swDateStr = swDate.toISOString().split('T')[0];
    txs.push({
      id: `seed-sw-${i}`, description: 'Licenças de Software', amount: -1200, type: 'expense',
      status, launchDate: swDateStr, dueDate: swDateStr, paymentDate: i <= 0 ? swDateStr : undefined,
      categoryId: 'cat-4-3', bankAccountId: 'bank-2', costCenterId: 'cc-4',
      date: swDateStr, category: 'Software', isReconciled: status === 'reconciled'
    });
  }

  // 2. Random Sales (Income) - High Volume
  for (let i = -180; i <= 180; i += 2) { // Every 2 days roughly
    const date = addDays(today, i);
    if (Math.random() > 0.3) continue; // Skip some days

    const amount = Math.floor(Math.random() * 5000) + 1500;
    const status = i < 0 ? (Math.random() > 0.1 ? 'reconciled' : 'overdue') : 'pending';

    txs.push({
      id: `seed-sale-${i}`,
      description: `Venda ${Math.floor(Math.random() * 1000)}`,
      client: clients[Math.floor(Math.random() * clients.length)],
      amount: amount,
      type: 'income',
      status,
      launchDate: date,
      dueDate: date,
      paymentDate: status === 'reconciled' ? date : undefined,
      categoryId: Math.random() > 0.5 ? 'cat-1-1' : 'cat-1-2',
      bankAccountId: Math.random() > 0.5 ? 'bank-1' : 'bank-3',
      costCenterId: 'cc-2',
      date: date, category: 'Vendas', isReconciled: status === 'reconciled'
    });
  }

  // 3. Variable Costs (Linked to sales somewhat)
  for (let i = -180; i <= 180; i += 5) {
    const date = addDays(today, i);
    if (Math.random() > 0.4) continue;

    const amount = -Math.floor(Math.random() * 3000) - 500;
    const status = i < 0 ? 'reconciled' : 'pending';

    txs.push({
      id: `seed-cost-${i}`,
      description: `Compra de Insumos`,
      client: suppliers[Math.floor(Math.random() * suppliers.length)],
      amount: amount,
      type: 'expense',
      status,
      launchDate: date,
      dueDate: date,
      paymentDate: status === 'reconciled' ? date : undefined,
      categoryId: 'cat-2-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-3',
      date: date, category: 'Insumos', isReconciled: status === 'reconciled'
    });
  }

  return txs;
};

export const INITIAL_TRANSACTIONS = generateInitialTransactions();

// --- MOCK KPIS (Still used for layout, but values should ideally come from calculation) ---
export const MOCK_KPIS: KPI[] = [
  {
    id: '1',
    label: 'Saldo Disponível',
    value: 0, // Calculated dynamically in Dashboard
    projectedValue: 0,
    currency: true,
    change: 5.2,
    trend: 'up',
    color: 'yellow'
  },
  {
    id: '2',
    label: 'Entradas (30d)',
    value: 0,
    projectedValue: 0,
    currency: true,
    change: 12.5,
    trend: 'up',
    color: 'emerald'
  },
  {
    id: '3',
    label: 'Saídas (30d)',
    value: 0,
    projectedValue: 0,
    currency: true,
    change: -2.1,
    trend: 'down',
    color: 'amber'
  },
  {
    id: '4',
    label: 'Ponto de Equilíbrio',
    value: 680000,
    projectedValue: 700000,
    currency: true,
    change: -1.5,
    trend: 'neutral',
    color: 'slate'
  },
];

export const DEFAULT_SCENARIOS: Scenario[] = [
  { id: 'base', name: 'Cenário Base', description: 'Projeção atual baseada no ERP', params: { receivablesDelay: 0, payablesAcceleration: 0, salesGrowth: 0 } },
  { id: 'pessimistic', name: 'Estresse de Liquidez', description: 'Atraso em recebíveis de 15 dias', params: { receivablesDelay: 15, payablesAcceleration: 0, salesGrowth: -10 } },
  { id: 'aggressive', name: 'Expansão Agressiva', description: 'Investimento alto, pagamentos antecipados', params: { receivablesDelay: 0, payablesAcceleration: 10, salesGrowth: 20 } },
];

// --- COMPANY INFO ---
export const COMPANY_INFO = {
  name: 'Matriz SP',
  branchId: '001'
};
