
import React, { useState } from 'react';
import { PageView } from '../types';
import { DashboardProvider, useDashboard } from '../context/DashboardContext';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { useTransactions } from '../context/TransactionContext';
import { CardPickerModal } from '../components/dashboard/CardPickerModal';
import { Edit, Plus, Save, RotateCcw, Layout, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { CardConfigModal } from '../components/dashboard/CardConfigModal';
import { OfficialDashboard } from '../components/dashboard/OfficialDashboard';

// Wrapper component to provide context
export const Dashboard: React.FC<{
  onNavigate: (page: PageView) => void;
  dateRange: { start: string, end: string };
  onViewBankTransactions?: (bankId: string) => void;
  theme: 'light' | 'dark';
}> = (props) => {
  return (
    <DashboardProvider>
      <DashboardContent {...props} />
    </DashboardProvider>
  );
};

const DashboardContent: React.FC<{
  onNavigate: (page: PageView) => void;
  dateRange: { start: string, end: string };
  onViewBankTransactions?: (bankId: string) => void;
  theme: 'light' | 'dark';
}> = ({ onNavigate, dateRange, onViewBankTransactions, theme }) => {
  // We can strip out all the Custom Dashboard logic since the user wants it hidden/removed.
  // Kept imports just in case we need to revert or if we want to keep the file structure valid for potential future use,
  // but for now we simply render the Official Dashboard.

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950/50 pb-20">
      {/* Header with Title */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-30 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Visão Geral</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Acompanhe os indicadores financeiros da sua empresa.</p>
        </div>
      </div>

      {/* Content Area - Always Official */}
      <OfficialDashboard dateRange={dateRange} onViewBankTransactions={onViewBankTransactions} />
    </div>
  );
};
