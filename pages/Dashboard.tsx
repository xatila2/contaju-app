
import React, { useState } from 'react';
import { PageView } from '../types';
import { DashboardProvider, useDashboard } from '../context/DashboardContext';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { useTransactions } from '../context/TransactionContext';
import { CardPickerModal } from '../components/dashboard/CardPickerModal';
import { Edit, Plus, Save, RotateCcw, Layout, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { CardConfigModal } from '../components/dashboard/CardConfigModal';
import { PremiumDashboard } from '../components/dashboard/PremiumDashboard';
import { CyberDashboard } from '../components/dashboard/CyberDashboard';
import { GoldDashboard } from '../components/dashboard/GoldDashboard';

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
    <div className="w-full">
      {/* Content Area - Always Official */}
      <GoldDashboard dateRange={dateRange} onViewBankTransactions={onViewBankTransactions} />
    </div>
  );
};
