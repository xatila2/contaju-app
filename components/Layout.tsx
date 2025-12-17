import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  LineChart,
  PieChart,
  ArrowLeftRight,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Wallet,
  Building2,
  ChevronDown,
  Moon,
  Sun,
  Plus,
  FileText,
  Scale,
  Target,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Landmark,
  CreditCard,
  LogOut
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DateRangePicker } from './DateRangePicker';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenNewTransaction: () => void;
  dateRange?: { start: string, end: string };
  onDateRangeChange?: (start: string, end: string) => void;
}

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  collapsed
}: {
  icon: React.ElementType,
  label: string,
  active: boolean,
  onClick: () => void,
  collapsed: boolean
}) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${active
      ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black shadow-lg shadow-yellow-500/20'
      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-yellow-500'
      }`}
  >
    <Icon size={20} className={active ? 'text-black' : 'text-zinc-400 group-hover:text-yellow-500 transition-colors'} />
    {!collapsed && <span className="font-medium text-sm animate-in fade-in duration-200">{label}</span>}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({
  children, theme, toggleTheme, onOpenNewTransaction,
  dateRange, onDateRangeChange
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { transactions, notificationSettings, companyName } = useTransactions();
  const { user, signOut } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [readNotifications, setReadNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem('finflux_read_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate Notifications with Read/Unread tracking
  const notifications = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let filtered = transactions;

    if (notificationSettings.customRangeActive && notificationSettings.customRangeStart && notificationSettings.customRangeEnd) {
      filtered = transactions.filter(t => t.dueDate >= notificationSettings.customRangeStart && t.dueDate <= notificationSettings.customRangeEnd);
    }

    const notifs: Array<{ id: string; tx: typeof transactions[0]; type: 'overdue' | 'dueToday' | 'upcoming' }> = [];

    if (notificationSettings.showOverdue) {
      filtered
        .filter(t => t.type === 'expense' && t.status !== 'reconciled' && (t.status === 'overdue' || t.dueDate < today))
        .forEach(tx => notifs.push({ id: `${tx.id}-overdue`, tx, type: 'overdue' }));
    }

    if (notificationSettings.showDueToday) {
      filtered
        .filter(t => t.type === 'expense' && t.status !== 'reconciled' && t.dueDate === today)
        .forEach(tx => notifs.push({ id: `${tx.id}-today`, tx, type: 'dueToday' }));
    }

    if (notificationSettings.showUpcoming) {
      const future = new Date();
      future.setDate(future.getDate() + notificationSettings.daysInAdvance);
      const futureStr = future.toISOString().split('T')[0];
      filtered
        .filter(t => t.type === 'expense' && t.status !== 'reconciled' && t.dueDate > today && t.dueDate <= futureStr)
        .forEach(tx => notifs.push({ id: `${tx.id}-upcoming`, tx, type: 'upcoming' }));
    }

    return notifs;
  }, [transactions, notificationSettings]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readNotifications.includes(n.id)).length;
  }, [notifications, readNotifications]);

  const markAsRead = (notifId: string) => {
    const updated = [...readNotifications, notifId];
    setReadNotifications(updated);
    localStorage.setItem('finflux_read_notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(allIds);
    localStorage.setItem('finflux_read_notifications', JSON.stringify(allIds));
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handlePeriodShift = (direction: 'prev' | 'next') => {
    if (!dateRange || !onDateRangeChange) return;

    // Timezone-safe parsing: parse YYYY-MM-DD strings manually
    const [startY, startM, startD] = dateRange.start.split('-').map(Number);
    const [endY, endM, endD] = dateRange.end.split('-').map(Number);

    const start = new Date(startY, startM - 1, startD); // Month is 0-indexed
    const end = new Date(endY, endM - 1, endD);

    // Calculate difference in days
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const modifier = direction === 'next' ? 1 : -1;

    // Smart shift logic
    if (diffDays >= 27 && diffDays <= 31) {
      // Month shift - move to next/prev month
      const targetMonth = start.getMonth() + modifier;
      const newStart = new Date(start.getFullYear(), targetMonth, 1);
      const newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0);
      onDateRangeChange(newStart.toISOString().split('T')[0], newEnd.toISOString().split('T')[0]);
    } else if (diffDays >= 360) {
      // Year shift
      const newStart = new Date(start.getFullYear() + modifier, start.getMonth(), start.getDate());
      const newEnd = new Date(end.getFullYear() + modifier, end.getMonth(), end.getDate());
      onDateRangeChange(newStart.toISOString().split('T')[0], newEnd.toISOString().split('T')[0]);
    } else {
      // Default shift by the period length
      const shiftAmount = diffDays + 1;
      const newStart = new Date(start);
      const newEnd = new Date(end);
      newStart.setDate(start.getDate() + (shiftAmount * modifier));
      newEnd.setDate(end.getDate() + (shiftAmount * modifier));
      onDateRangeChange(newStart.toISOString().split('T')[0], newEnd.toISOString().split('T')[0]);
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('finflux_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('finflux_sidebar_collapsed', String(newVal));
      return newVal;
    });
  };

  // Auto-collapse Logic
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const startCollapseTimer = () => {
    // Only set timer if it's currently expanded (not collapsed)
    // We check state in the timeout callback to be sure, but we can also avoid setting it if already true.
    // However, the cleanest is to always clear existing and set new if not collapsed.
    if (!isCollapsed) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsCollapsed(true);
        // Optionally update localStorage if we want this auto-event to persist "preference"
        // But usually auto-hide is transient. If user refreshes, do we want it collapsed? 
        // The prompt says "hide it", implying a behavior. I'll stick to updating state.
        // If I update localStorage here, next load starts collapsed, which is probably fine.
        localStorage.setItem('finflux_sidebar_collapsed', 'true');
      }, 15000); // 15 seconds
    }
  };

  const clearCollapseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Effect to manage initial timer and cleanup
  React.useEffect(() => {
    // If it starts expanded, start the timer
    // If it starts collapsed, do nothing
    if (!isCollapsed) {
      startCollapseTimer();
    }
    return () => clearCollapseTimer();
  }, [isCollapsed]); // When state changes, we reset logic

  const handleSidebarEnter = () => clearCollapseTimer();
  const handleSidebarLeave = () => startCollapseTimer();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans transition-colors duration-300 relative">

      {/* Sidebar */}
      <aside
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        className={`
        fixed inset-y-0 left-0 z-50 bg-black border-r border-zinc-800 text-white transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        md:relative md:translate-x-0 
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        <div className={`h-full flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
          <div className={`px-4 py-6 flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'} border-b border-zinc-800/50 transition-all`}>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/10">
                <Wallet size={20} className="text-black" />
              </div>
              {!isCollapsed && (
                <div className="animate-in fade-in duration-300">
                  <h1 className="text-xl font-bold tracking-tight text-white">Contaju</h1>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Gestão Inteligente</p>
                </div>
              )}
            </div>

            {/* Manual Collapse Button */}
            <button
              onClick={toggleSidebar}
              className={`p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all shadow-sm group ${isCollapsed ? 'rotate-180' : ''}`}
              title={isCollapsed ? "Expandir" : "Recolher"}
            >
              <ChevronLeft size={18} className={`transition-transform duration-300`} />
            </button>
          </div>

          <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-800">
            {!isCollapsed && <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2 animate-in fade-in">Analytics</div>}
            <SidebarItem collapsed={isCollapsed} icon={LayoutDashboard} label="Dashboard" active={isActive('/')} onClick={() => handleNavigation('/')} />
            <SidebarItem collapsed={isCollapsed} icon={Wallet} label="Transações" active={isActive('/transactions')} onClick={() => handleNavigation('/transactions')} />
            <SidebarItem collapsed={isCollapsed} icon={Target} label="Planejamento" active={isActive('/planning')} onClick={() => handleNavigation('/planning')} />
            <SidebarItem collapsed={isCollapsed} icon={LineChart} label="Fluxo de Caixa" active={isActive('/cashflow')} onClick={() => handleNavigation('/cashflow')} />
            <SidebarItem collapsed={isCollapsed} icon={ArrowLeftRight} label="Simulações" active={isActive('/simulations')} onClick={() => handleNavigation('/simulations')} />
            <SidebarItem collapsed={isCollapsed} icon={FileText} label="Relatórios" active={isActive('/reports')} onClick={() => handleNavigation('/reports')} />

            {!isCollapsed && <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-8 mb-4 px-2 animate-in fade-in">Operacional</div>}
            <SidebarItem collapsed={isCollapsed} icon={ShoppingBag} label="Compras" active={isActive('/purchases')} onClick={() => handleNavigation('/purchases')} />
            <SidebarItem collapsed={isCollapsed} icon={CreditCard} label="Cartões" active={isActive('/credit-cards')} onClick={() => handleNavigation('/credit-cards')} />
            <SidebarItem collapsed={isCollapsed} icon={Scale} label="Conciliação" active={isActive('/bank-reconciliation')} onClick={() => handleNavigation('/bank-reconciliation')} />
            <SidebarItem collapsed={isCollapsed} icon={Settings} label="Configurações" active={isActive('/settings')} onClick={() => handleNavigation('/settings')} />
          </nav>

          <div className="p-4 border-t border-zinc-800/50">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} bg-zinc-900 p-2 rounded-lg border border-zinc-800`}>
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigation('/settings?tab=users')}>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center text-xs font-bold text-black shadow-md shrink-0">
                  {user?.email?.slice(0, 2).toUpperCase() || 'US'}
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden animate-in fade-in">
                    <p className="text-sm font-medium text-white truncate max-w-[100px]" title={user?.email || ''}>{user?.email?.split('@')[0] || 'Usuario'}</p>
                    <p className="text-xs text-zinc-500 truncate">Admin</p>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button
                  onClick={signOut}
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded transition-colors"
                  title="Sair"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-8 z-40 shadow-sm transition-colors duration-300">
          <div className="flex items-center flex-1">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden mr-4 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="hidden lg:flex items-center text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950/50 rounded-lg px-3 py-2 w-64 focus-within:ring-2 focus-within:ring-yellow-500 focus-within:bg-white dark:focus-within:bg-zinc-950 transition-all border border-transparent dark:border-zinc-800">
                <Search size={18} className="mr-2" />
                <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-sm w-full text-zinc-900 dark:text-zinc-100 placeholder-zinc-400" />
              </div>
              <div className="flex-1 sm:flex-none"></div>
              {isActive('/') && dateRange && onDateRangeChange && (
                <div className="mr-2 hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => handlePeriodShift('prev')}
                    className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={onDateRangeChange} align="right" />
                  <button
                    onClick={() => handlePeriodShift('next')}
                    className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
              <button onClick={onOpenNewTransaction} className="flex items-center space-x-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-yellow-500/20 transition shadow-sm whitespace-nowrap">
                <Plus size={18} />
                <span className="hidden sm:inline">Nova Transação</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-6 ml-4">
            <button onClick={toggleTheme} className="p-2 text-zinc-500 hover:text-yellow-600 dark:text-zinc-400 dark:hover:text-yellow-400 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>



            <div className="hidden md:flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700">
              <Building2 size={14} className="text-zinc-400" />
              <span className="font-medium">{companyName || 'Minha Empresa'}</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${isOnline
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50'
                : 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-zinc-400'}`}></div>
                {isOnline ? 'Conectado' : 'Offline'}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-zinc-500 hover:text-yellow-600 dark:text-zinc-400 dark:hover:text-yellow-400 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 max-h-[500px] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                      <h3 className="font-bold text-zinc-900 dark:text-white">Notificações</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-yellow-600 hover:text-yellow-700 font-medium"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400">
                          <Bell size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma notificação</p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const isRead = readNotifications.includes(notif.id);
                          return (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id);
                                navigate(`/transactions?highlight=${notif.tx.id}`);
                                setIsNotificationOpen(false);
                              }}
                              className={`p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${!isRead ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-zinc-900 dark:text-white">{notif.tx.description}</p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    Vencimento: {new Date(notif.tx.dueDate).toLocaleDateString('pt-BR')}
                                  </p>
                                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">
                                    R$ {Math.abs(notif.tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {!isRead && <div className="w-2 h-2 bg-yellow-500 rounded-full" />}
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${notif.type === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    notif.type === 'dueToday' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                    {notif.type === 'overdue' ? 'Vencida' : notif.type === 'dueToday' ? 'Hoje' : 'Próxima'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className={`flex-1 overflow-y-auto transition-colors duration-300 bg-zinc-50 dark:bg-zinc-950 ${location.pathname === '/' ? 'p-0' : 'p-4 sm:p-8'}`}>
          <div className={`${location.pathname === '/' ? 'w-full h-full' : 'max-w-7xl mx-auto animate-fade-in'}`}>
            {children}
          </div>
        </main>
      </div>
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
    </div>
  );
};
