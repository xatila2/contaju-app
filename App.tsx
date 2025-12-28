import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TransactionModal } from './components/TransactionModal';
import { ClientModal } from './components/ClientModal';
import { Dashboard } from './pages/Dashboard';
import { CashFlow } from './pages/CashFlow';
import { Simulations } from './pages/Simulations';
import { Transactions } from './pages/Transactions';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { BankReconciliation } from './pages/BankReconciliation';
import { Planning } from './pages/Planning';
import { Purchases } from './pages/Purchases';
import { CreditCards } from './pages/CreditCards';
import { ClientsPage } from './pages/ClientsPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PendingApproval } from './pages/PendingApproval';
import { AdminPage } from './pages/AdminPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { NotificationSystem } from './components/NotificationSystem';
import { PageView, Transaction } from './types';
import { TransactionProvider, useTransactions } from './context/TransactionContext';

const MainLayout = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('finflux_theme');
    if (savedTheme) return savedTheme as 'light' | 'dark';
    return 'dark';
  });

  const [globalDateRange, setGlobalDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const {
    transactions, categories, bankAccounts, costCenters, notificationSettings, categoryRules, clients,
    handleSaveTransaction, handleAddCategoryRule, createClient
  } = useTransactions();

  const [selectedBankFilter, setSelectedBankFilter] = useState<string | undefined>(undefined);
  const [highlightTransactionId, setHighlightTransactionId] = useState<string | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('finflux_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavigate = (page: PageView) => {
    if (page === 'dashboard') navigate('/');
    else navigate(`/${page}`);
  };

  const handleNavigateToBankTransactions = (bankId: string) => {
    setSelectedBankFilter(bankId);
    navigate('/transactions');
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  return (
    <>
      <Layout
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenNewTransaction={handleOpenNewTransaction}
        dateRange={globalDateRange}
        onDateRangeChange={(start, end) => setGlobalDateRange({ start, end })}
      >
        <Routes>
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard
                onNavigate={handleNavigate}
                dateRange={globalDateRange}
                onViewBankTransactions={handleNavigateToBankTransactions}
                theme={theme}
              />
            </PrivateRoute>
          } />
          <Route path="/cashflow" element={<PrivateRoute><CashFlow /></PrivateRoute>} />
          <Route path="/simulations" element={<PrivateRoute><Simulations dateRange={globalDateRange} /></PrivateRoute>} />
          <Route path="/transactions" element={
            <PrivateRoute>
              <Transactions
                onEdit={handleEditTransaction}
                preSelectedBankId={selectedBankFilter}
                highlightTransactionId={highlightTransactionId}
              />
            </PrivateRoute>
          } />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/bank-reconciliation" element={<PrivateRoute><BankReconciliation /></PrivateRoute>} />
          <Route path="/planning" element={<PrivateRoute><Planning /></PrivateRoute>} />
          <Route path="/purchases" element={<PrivateRoute><Purchases /></PrivateRoute>} />
          <Route path="/credit-cards" element={<PrivateRoute><CreditCards /></PrivateRoute>} />
          <Route path="/clients" element={<PrivateRoute><ClientsPage /></PrivateRoute>} />
          <Route path="/clients" element={<PrivateRoute><ClientsPage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      <NotificationSystem
        transactions={transactions}
        settings={notificationSettings}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => { setIsTransactionModalOpen(false); setEditingTransaction(null); }}
        onSave={handleSaveTransaction}
        categories={categories}
        bankAccounts={bankAccounts}
        costCenters={costCenters}
        transactionToEdit={editingTransaction}
        categoryRules={categoryRules}
        onAddCategoryRule={handleAddCategoryRule}
        clients={clients}
        onCreateClient={(name) => {
          setNewClientName(name || '');
          setIsClientModalOpen(true);
        }}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        initialName={newClientName}
        onClose={() => setIsClientModalOpen(false)}
        onSave={async (clientData) => {
          const newClient = await createClient(clientData);
          if (newClient) {
            setIsClientModalOpen(false);
          }
        }}
      />
    </>
  );
};

const AppContent = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-zinc-500 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        <p className="animate-pulse">Carregando Sistema...</p>
        <button
          onClick={() => signOut()}
          className="mt-4 text-xs text-red-500 hover:text-red-700 underline"
        >
          Demorando muito? Sair
        </button>
      </div>
    );
  }

  // Approval Check: If user is logged in, has profile loaded, but NOT approved
  if (user && profile && !profile.is_approved) {
    return <PendingApproval />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <TransactionProvider>
          <AppContent />
        </TransactionProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
