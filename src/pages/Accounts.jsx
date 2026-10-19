import { useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Clock,
  Wallet,
  TrendingUp,
  FileSpreadsheet,
  Scale,
  DollarSign,
} from 'lucide-react';
import { FinanceProvider } from '../context/FinanceContext';
import FinancialOverviewTab from '../components/finance/FinancialOverviewTab';
import InvoiceListTab from '../components/finance/InvoiceListTab';
import PaymentCollectionTab from '../components/finance/PaymentCollectionTab';
import MemberDuesTab from '../components/finance/MemberDuesTab';
import PaymentMethodsTab from '../components/finance/PaymentMethodsTab';
import ExpenseManagementTab from '../components/finance/ExpenseManagementTab';
import RevenueRecognitionTab from '../components/finance/RevenueRecognitionTab';
import FinancialReportsTab from '../components/finance/FinancialReportsTab';
import MonthlyBalanceSheetTab from '../components/finance/MonthlyBalanceSheetTab';

export const ACCOUNTS_TABS = [
  { id: 'overview', label: 'Financial Overview', icon: LayoutDashboard },
  { id: 'invoices', label: 'Invoice List', icon: Receipt },
  { id: 'payments', label: 'Payment Collection', icon: CreditCard },
  { id: 'dues', label: 'Member Dues', icon: Clock },
  { id: 'methods', label: 'Payment Methods', icon: Wallet },
  { id: 'expenses', label: 'Expense Management', icon: DollarSign },
  { id: 'revenue-recognition', label: 'Revenue Recognition', icon: TrendingUp },
  { id: 'reports', label: 'Financial Reports', icon: FileSpreadsheet },
  { id: 'balance-sheet', label: 'Monthly Balance Sheet', icon: Scale },
];

export default function Accounts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = ACCOUNTS_TABS.some((t) => t.id === rawTab) ? rawTab : 'overview';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <FinanceProvider>
      <div className="page">
        {/* Header */}
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Accounts & Financial Management</h1>
            <p className="page-subtitle">
              Comprehensive accounting suite: partial-payment dues simulator, multi-channel gateways, dynamic revenue recognition, and reconciled statements.
            </p>
          </div>

          {/* Subtabs Bar — Scrollable on mobile, interactive */}
          <div className="subtabs-bar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: '100%' }}>
            {ACCOUNTS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`subtab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <FinancialOverviewTab onNavigateTab={handleTabChange} />
        )}

        {activeTab === 'invoices' && (
          <InvoiceListTab />
        )}

        {activeTab === 'payments' && (
          <PaymentCollectionTab />
        )}

        {activeTab === 'dues' && (
          <MemberDuesTab />
        )}

        {activeTab === 'methods' && (
          <PaymentMethodsTab />
        )}

        {activeTab === 'expenses' && (
          <ExpenseManagementTab />
        )}

        {activeTab === 'revenue-recognition' && (
          <RevenueRecognitionTab />
        )}

        {activeTab === 'reports' && (
          <FinancialReportsTab />
        )}

        {activeTab === 'balance-sheet' && (
          <MonthlyBalanceSheetTab />
        )}
      </div>
    </FinanceProvider>
  );
}
