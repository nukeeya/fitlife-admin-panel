import { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  AlertCircle,
  Tag,
  RotateCcw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT } from '../../utils/financeCalculators';
import FinanceDateFilterBar from './FinanceDateFilterBar';
import RevenueSimulatorModal from './modals/RevenueSimulatorModal';

export default function FinancialOverviewTab({ onNavigateTab }) {
  const {
    financialMetrics,
    filteredInvoices,
    filteredPayments,
    filteredExpenses,
    paymentMethodSummary,
    activeDateRange,
  } = useFinance();

  const [showSimulator, setShowSimulator] = useState(false);

  // Chart 1: Daily/Period Collection vs Expense Trend
  const trendData = useMemo(() => {
    // Generate dates based on filtered items
    const map = {};
    filteredPayments.forEach((p) => {
      const d = p.date.slice(5); // MM-DD
      if (!map[d]) map[d] = { date: d, collected: 0, expense: 0, recognized: 0 };
      map[d].collected += Number(p.amount) || 0;
    });

    filteredExpenses.forEach((e) => {
      const d = e.date.slice(5);
      if (!map[d]) map[d] = { date: d, collected: 0, expense: 0, recognized: 0 };
      map[d].expense += Number(e.amount) || 0;
    });

    const list = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    if (list.length === 0) {
      return [
        { date: '10-01', collected: 15000, expense: 120000, recognized: 12500 },
        { date: '10-05', collected: 27500, expense: 95000, recognized: 12500 },
        { date: '10-10', collected: 11000, expense: 14500, recognized: 12500 },
        { date: '10-15', collected: 18000, expense: 15000, recognized: 12500 },
        { date: '10-19', collected: 5000, expense: 12300, recognized: 12500 },
      ];
    }
    return list;
  }, [filteredPayments, filteredExpenses]);

  // Chart 2: Cash Collected vs Recognized Revenue Comparison
  const cashVsAccrualData = useMemo(() => {
    return [
      {
        name: 'Liquid Cash Collected',
        amount: financialMetrics.netCashCollected,
        fill: '#10B981',
      },
      {
        name: 'Accrual Recognized Rev',
        amount: financialMetrics.recognizedRevenue,
        fill: '#3B82F6',
      },
      {
        name: 'Operating Expenses',
        amount: financialMetrics.totalExpenses,
        fill: '#EF4444',
      },
      {
        name: 'Outstanding Unpaid Dues',
        amount: financialMetrics.outstandingDues,
        fill: '#F59E0B',
      },
    ];
  }, [financialMetrics]);

  // Chart 3: Method Distribution
  const methodChartData = useMemo(() => {
    return paymentMethodSummary
      .filter((m) => m.totalAmount > 0)
      .map((m) => ({
        name: m.name,
        value: m.totalAmount,
        color: m.color,
      }));
  }, [paymentMethodSummary]);

  // Chart 4: Expense Category Breakdown
  const expenseCategoryData = useMemo(() => {
    const cats = {};
    filteredExpenses.forEach((e) => {
      cats[e.category] = (cats[e.category] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(cats).map(([name, amount]) => ({
      name: name.split('&')[0].trim(),
      amount,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Date Filter Header Bar */}
      <FinanceDateFilterBar />

      {/* 2. 10 KPI Dashboard Summary Cards */}
      <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
        {/* Card 1: Total Invoiced */}
        <div className="stat-widget" onClick={() => onNavigateTab?.('invoices')}>
          <div className="stat-widget-top">
            <span className="stat-widget-title">Total Invoiced</span>
            <div className="stat-widget-icon" style={{ color: 'var(--primary)' }}><Receipt size={17} /></div>
          </div>
          <div className="stat-widget-value primary-highlight">
            {formatBDT(financialMetrics.totalInvoiced)}
          </div>
          <div className="stat-widget-sub">
            {filteredInvoices.length} invoices issued in scope
          </div>
        </div>

        {/* Card 2: Total Collected */}
        <div className="stat-widget" onClick={() => onNavigateTab?.('payments')}>
          <div className="stat-widget-top">
            <span className="stat-widget-title">Total Collected (Cash)</span>
            <div className="stat-widget-icon" style={{ color: '#10B981' }}><DollarSign size={17} /></div>
          </div>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>
            {formatBDT(financialMetrics.totalCollected)}
          </div>
          <div className="stat-widget-sub">
            Liquid cash & MFS received
          </div>
        </div>

        {/* Card 3: Outstanding Dues */}
        <div className="stat-widget" onClick={() => onNavigateTab?.('dues')}>
          <div className="stat-widget-top">
            <span className="stat-widget-title">Outstanding Dues</span>
            <div className="stat-widget-icon" style={{ color: '#F59E0B' }}><Clock size={17} /></div>
          </div>
          <div className="stat-widget-value" style={{ color: '#F59E0B' }}>
            {formatBDT(financialMetrics.outstandingDues)}
          </div>
          <div className="stat-widget-sub">
            Active receivables on file
          </div>
        </div>

        {/* Card 4: Overdue Dues */}
        <div className="stat-widget" onClick={() => onNavigateTab?.('dues')}>
          <div className="stat-widget-top">
            <span className="stat-widget-title">Overdue Dues</span>
            <div className="stat-widget-icon" style={{ color: 'var(--danger)' }}><AlertCircle size={17} /></div>
          </div>
          <div className="stat-widget-value danger-highlight">
            {formatBDT(financialMetrics.overdueDues)}
          </div>
          <div className="stat-widget-sub">
            Past agreed payment date
          </div>
        </div>

        {/* Card 5: Recognized Membership Revenue */}
        <div className="stat-widget" onClick={() => onNavigateTab?.('revenue-recognition')}>
          <div className="stat-widget-top">
            <span className="stat-widget-title">Recognized Revenue</span>
            <div className="stat-widget-icon" style={{ color: 'var(--primary)' }}><TrendingUp size={17} /></div>
          </div>
          <div className="stat-widget-value primary-highlight">
            {formatBDT(financialMetrics.recognizedRevenue)}
          </div>
          <div className="stat-widget-sub">
            Accrual revenue earned to date
          </div>
        </div>

        {/* Card 6: Deferred Revenue */}
        <div className="stat-widget" onClick={() => onNavigateTab?.('revenue-recognition')}>
          <div className="stat-widget-top">
            <span className="stat-widget-title">Deferred Revenue</span>
            <div className="stat-widget-icon" style={{ color: '#8B5CF6' }}><Clock size={17} /></div>
          </div>
          <div className="stat-widget-value" style={{ color: 'var(--text-primary)' }}>
            {formatBDT(financialMetrics.deferredRevenue)}
          </div>
          <div className="stat-widget-sub">
            Unearned future gym service
          </div>
        </div>

        {/* Card 7: Total Discounts */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Total Discounts</span>
            <div className="stat-widget-icon" style={{ color: 'var(--danger)' }}><Tag size={17} /></div>
          </div>
          <div className="stat-widget-value" style={{ color: 'var(--danger)' }}>
            {formatBDT(financialMetrics.totalDiscounts)}
          </div>
          <div className="stat-widget-sub">
            Promotional & corporate cuts
          </div>
        </div>

        {/* Card 8: Total Refunds */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Total Refunds</span>
            <div className="stat-widget-icon" style={{ color: 'var(--text-muted)' }}><RotateCcw size={17} /></div>
          </div>
          <div className="stat-widget-value" style={{ color: 'var(--text-secondary)' }}>
            {formatBDT(financialMetrics.totalRefunds)}
          </div>
          <div className="stat-widget-sub">
            Approved member clawbacks
          </div>
        </div>

        {/* Card 9: Total Expenses */}
        <div className="stat-widget" onClick={() => onNavigateTab?.('expenses')}>
          <div className="stat-widget-top">
            <span className="stat-widget-title">Total Expenses</span>
            <div className="stat-widget-icon" style={{ color: 'var(--danger)' }}><ArrowDownRight size={17} /></div>
          </div>
          <div className="stat-widget-value danger-highlight">
            {formatBDT(financialMetrics.totalExpenses)}
          </div>
          <div className="stat-widget-sub">
            Rent, staff, electricity & stock
          </div>
        </div>

        {/* Card 10: Net Operating Profit */}
        <div className="stat-widget" onClick={() => onNavigateTab?.('balance-sheet')}>
          <div className="stat-widget-top">
            <span className="stat-widget-title">Net Operating Profit</span>
            <div className="stat-widget-icon" style={{ color: financialMetrics.accrualNetProfit >= 0 ? '#10B981' : 'var(--danger)' }}>
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className="stat-widget-value" style={{ color: financialMetrics.accrualNetProfit >= 0 ? '#10B981' : 'var(--danger)' }}>
            {formatBDT(financialMetrics.accrualNetProfit)}
          </div>
          <div className="stat-widget-sub">
            Accrual base (Cash: {formatBDT(financialMetrics.cashNetProfit)})
          </div>
        </div>
      </div>

      {/* Quick Action Shortcut Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-base)',
        borderRadius: 'var(--radius-lg)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Quick Accounting Tools:</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Test partial payments, revenue recognition, and reports.</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab?.('dues')}>
            <Receipt size={14} />
            Member Dues Simulator
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSimulator(true)}>
            <Calculator size={14} />
            Revenue Allocation Simulator
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab?.('reports')}>
            <FileSpreadsheet size={14} />
            Export Excel Reports
          </button>
        </div>
      </div>

      {/* 3. Recharts Visualizations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
        {/* Chart 1: Cash Collection vs Expense Trend */}
        <div className="activity-card" style={{ padding: '18px' }}>
          <div className="activity-header" style={{ padding: '0 0 12px 0' }}>
            <span style={{ fontWeight: 800, fontSize: '14px' }}>Cash Collection vs Operating Outflow</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Trend in Scope</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  formatter={(value) => [formatBDT(value), '']}
                  contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-base)', borderRadius: '8px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="collected" name="Cash Collected" stroke="#10B981" fillOpacity={1} fill="url(#colGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Expenses Paid" stroke="#EF4444" fillOpacity={1} fill="url(#expGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cash vs Accrual Reconciliation Comparison */}
        <div className="activity-card" style={{ padding: '18px' }}>
          <div className="activity-header" style={{ padding: '0 0 12px 0' }}>
            <span style={{ fontWeight: 800, fontSize: '14px' }}>Financial Metric Reconciliation</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cash vs Accrual vs Dues</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashVsAccrualData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `৳${v / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={130} />
                <Tooltip
                  formatter={(val) => [formatBDT(val), 'Amount']}
                  contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-base)', borderRadius: '8px' }}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {cashVsAccrualData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Payment Channel Distribution */}
        <div className="activity-card" style={{ padding: '18px' }}>
          <div className="activity-header" style={{ padding: '0 0 12px 0' }}>
            <span style={{ fontWeight: 800, fontSize: '14px' }}>Payment Method Distribution</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>bKash, Cash, Nagad, Rocket, Bank</span>
          </div>
          <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {methodChartData.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No payments in selected date filter</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {methodChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatBDT(val), 'Collection']}
                    contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-base)', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Operating Expenses by Category */}
        <div className="activity-card" style={{ padding: '18px' }}>
          <div className="activity-header" style={{ padding: '0 0 12px 0' }}>
            <span style={{ fontWeight: 800, fontSize: '14px' }}>Operational Expenses by Category</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total: {formatBDT(financialMetrics.totalExpenses)}</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseCategoryData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} angle={-20} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  formatter={(val) => [formatBDT(val), 'Amount']}
                  contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-base)', borderRadius: '8px' }}
                />
                <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Simulator Modal */}
      <RevenueSimulatorModal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
      />
    </div>
  );
}
