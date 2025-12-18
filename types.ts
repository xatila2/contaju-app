
export interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  balance: number;
  projected?: boolean;
}

export interface KPI {
  id: string;
  label: string;
  value: number;
  projectedValue?: number;
  currency?: boolean;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  color?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'reconciled' | 'pending' | 'scheduled' | 'overdue';

export interface RecurrenceConfig {
  active: boolean;
  frequency: 'weekly' | 'monthly' | 'yearly';
  interval: number;

  endDate?: string;
  occurrences?: number; // Stop after X repetitions
  endType?: 'date' | 'occurrences'; // Selector for manual termination
}

export interface BankAccount {
  id: string;
  name: string;
  initialBalance: number;
  initialBalanceDate: string;
  color: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
}

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';
export type PermissionModule = 'transactions' | 'reports' | 'settings' | 'bank-reconciliation' | 'purchases' | 'planning' | 'cashflow' | 'simulations';

export interface Permission {
  module: PermissionModule;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: string;
  lastLogin?: string;
  active: boolean;
  avatar?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  is_approved: boolean;
  role: 'admin' | 'user';
  created_at: string;
}


export interface InstallmentConfig {
  current: number;
  total: number;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  defaultBankAccountId: string;
  brand?: string;
  active: boolean;
}

export interface CreditCardInvoice {
  id: string;
  creditCardId: string;
  monthYear: string; // YYYY-MM
  closingDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'open' | 'closed' | 'paid' | 'partial';
}

export type TransactionOrigin = 'bank_account' | 'credit_card';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  // launchDate is used for creation date tracking
  launchDate: string;
  date: string; // Deprecated in favor of dueDate? Keeping for compatibility?
  dueDate: string;
  paymentDate?: string;
  type: TransactionType;
  category: string; // Deprecated
  categoryId: string;
  bankAccountId?: string; // Optional if credit card
  costCenterId?: string;
  status: TransactionStatus;

  // Credit Card Fields
  origin?: TransactionOrigin;
  creditCardId?: string;
  invoiceId?: string;

  // Additional fields
  client?: string; // Legacy text field
  clientId?: string; // Linked client ID
  notes?: string;
  isReconciled: boolean;
  recurrence?: RecurrenceConfig;
  installment?: InstallmentConfig;
  attachment?: string;
  attachmentName?: string;

  // Financial details
  interest?: number;
  penalty?: number;
  discount?: number;
  finalAmount?: number;

  // Transfer logic
  destinationBankAccountId?: string;
  // Transfer logic

}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  cpfCnpj?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  supplier: string;
  description: string;
  purchaseDate: string;
  totalAmount: number;
  installmentsCount: number;
  status: 'draft' | 'synced' | 'voided';
  categoryId: string;
  costCenterId?: string;
  invoiceNumber?: string;
  attachmentName?: string;
  linkedTransactionIds: string[];
}

export interface Category {
  id: string;
  code: string;
  name: string;
  type: TransactionType;
  parentId?: string;
  isSystemDefault?: boolean;
  cashFlowType?: 'operational' | 'investment' | 'financing';
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  params: {
    receivablesDelay: number;
    payablesAcceleration: number;
    salesGrowth: number;
  };
}

// --- RECONCILIATION TYPES ---
export interface BankStatementItem {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number;
  fitid?: string;
  memo?: string;
  isReconciled: boolean;
  reconciliationId?: string;
}

export interface ReconciliationGroup {
  id: string;
  companyId: string;
  bankAccountId: string;
  date: string;
  status: 'completed' | 'pending';
  totalAmount: number;
  links?: ReconciliationLink[];
}

export interface ReconciliationLink {
  id: string;
  reconciliationId: string;
  bankStatementItemId?: string;
  transactionId: string;
  amountAllocated?: number;
}


export interface PlanningData {
  month: string; // YYYY-MM
  revenueGoal: number;
  expenseGoal: number;
  profitGoal: number; // Usually calculated, but can be manual target
  profitSharingParams?: {
    totalPool: number;
    distributedAmount: number;
  };
}

export interface NotificationSettings {
  showOverdue: boolean;
  showDueToday: boolean;
  showUpcoming: boolean;
  daysInAdvance: number;
  // New fields for Custom Date Range Filter
  customRangeActive: boolean;
  customRangeStart: string;
  customRangeEnd: string;
}

export type PageView = 'dashboard' | 'cashflow' | 'working-capital' | 'simulations' | 'transactions' | 'settings' | 'reports' | 'bank-reconciliation' | 'planning' | 'purchases';

export interface CategoryRule {
  id: string;
  type: 'income' | 'expense';
  keyword: string;
  categoryId: string;
  priority: number; // Higher value = higher priority
  active: boolean;
}

export interface CategoryGroup {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  active: boolean;
}

export interface CategoryGroupItem {
  id: string;
  groupId: string;
  categoryId: string;
}


export interface CategoryGroupGoal {
  id: string;
  groupId: string;
  year: number;
  month: number;
  goalAmount: number;
}

// --- Dashboard Interfaces ---

export type ChartType =
  | 'line_simple' | 'line_double'  // --- Linhas ---
  | 'linha_simples' | 'linha_dupla' | 'linha_area' | 'linha_suavizada' | 'linha_com_pontos' | 'linha_media_movel'
  // --- Barras ---
  | 'barra_vertical' | 'barra_horizontal' | 'barras_agrupadas' | 'barras_empilhadas' | 'waterfall'
  // --- Pizza / Donut ---
  | 'pizza' | 'donut' | 'donut_duplo' | 'meia_pizza'
  // --- Dispersão ---
  | 'scatter' | 'bubble'
  // --- Financeiros ---
  | 'candlestick' | 'ohlc' | 'grafico_faixa_confianca'
  // --- Estatísticos ---
  | 'boxplot' | 'histogram' | 'density'
  // --- Combinados ---
  | 'linha_barra' | 'dual_axis'
  // --- Indicadores / KPIs ---
  | 'kpi_numero' | 'kpi_termometro' | 'kpi_gauge' | 'kpi_semaforo' | 'kpi_scorecard' | 'kpi_rich' | 'kpi_gradient'
  // --- Custom ---
  | 'custom_bank_card' | 'custom_bank_list' | 'custom_revenue_goal' | 'custom_reconciliation' | 'custom_working_capital'
  // --- Generic Fallback ---
  | 'default';

export interface CompanySettings {
  capitalGiroNecessario: number;
}

export interface CompanyData {
  name: string;
  document: string; // CNPJ/CPF
  email?: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface CardStyleConfig {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  accentColor?: string; // For charts
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontSize?: 'sm' | 'base' | 'lg';
  enableGradient?: boolean;
}

export interface CardConfig {
  period?: '7d' | '15d' | '30d' | 'ytd' | '1y';
  customRangeStart?: string;
  customRangeEnd?: string;
  type?: ChartType; // Allow override of chart type
  chartType?: ChartType; // Deprecated but kept for compatibility
  style?: CardStyleConfig;
  customTitle?: string; // NEW: Allow users to rename cards
  hideTitle?: boolean;  // NEW: Allow hiding the header
  categoryIds?: string[];
  accountIds?: string[];
  costCenterIds?: string[];
  showProjections?: boolean;
  // ... other filters
}

export interface GridItem {
  i: string; // cardId
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  items: GridItem[];
  configs: Record<string, CardConfig>;
}

export interface CardDefinition {
  id: string;
  title: string;
  description: string;
  category: 'Caixa' | 'Receita' | 'Despesa' | 'Lucro' | 'KPI' | 'Projeções' | 'Histórico' | 'Cartões' | 'Outros' | 'Oficial' | 'Financeiro';
  defaultSize: { w: number, h: number };
  defaultType: ChartType;
  allowedTypes: ChartType[];
}
