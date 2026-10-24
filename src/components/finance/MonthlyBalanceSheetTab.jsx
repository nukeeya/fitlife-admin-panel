import { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT } from '../../utils/financeCalculators';
import { exportReportToExcel } from '../../utils/excelExporter';
import FinanceDateFilterBar from './FinanceDateFilterBar';

export default function MonthlyBalanceSheetTab() {
  const { financialMetrics, activeDateRange } = useFinance();
  const [exportNotice, setExportNotice] = useState(null);

  // Excel export of the balance sheet
  const handleExportExcel = () => {
    const columns = [
      { key: 'section', label: 'Financial Category' },
      { key: 'item', label: 'Statement Line Item' },
      { key: 'amountStr', label: 'Amount (BDT)' },
      { key: 'basis', label: 'Accounting Treatment' },
    ];

    const rows = [
      // 1. Inflow & Billings
      { section: '1. Gross Billing Ledger', item: 'Total Billed Consideration', amountStr: formatBDT(financialMetrics.totalInvoiced), basis: 'Gross contracted value across member invoices' },
      { section: '1. Gross Billing Ledger', item: 'Promotional Discounts Granted', amountStr: `- ${formatBDT(financialMetrics.totalDiscounts)}`, basis: 'Net deduction from gross fees' },
      { section: '1. Gross Billing Ledger', item: 'Net Contracted Invoiced Value', amountStr: formatBDT(financialMetrics.totalInvoiced), basis: 'Net payable billing baseline' },

      // 2. Liquid Cash Assets
      { section: '2. Liquid Cash & Bank Receipts', item: 'Total Gross Cash & Digital Collected', amountStr: formatBDT(financialMetrics.totalCollected), basis: 'Bank & MFS cash liquid deposits' },
      { section: '2. Liquid Cash & Bank Receipts', item: 'Processed Member Refunds', amountStr: `- ${formatBDT(financialMetrics.totalRefunds)}`, basis: 'Liquid clawbacks' },
      { section: '2. Liquid Cash & Bank Receipts', item: 'Net Bankable Liquid Inflow', amountStr: formatBDT(financialMetrics.netCashCollected), basis: 'Net liquid receipts received in period' },

      // 3. Receivables & Liabilities
      { section: '3. Receivables & Deferred Revenue', item: 'Accounts Receivable (Outstanding Dues)', amountStr: formatBDT(financialMetrics.outstandingDues), basis: 'Current gym asset receivable' },
      { section: '3. Receivables & Deferred Revenue', item: 'Overdue Dues (>0 Days Past Due)', amountStr: formatBDT(financialMetrics.overdueDues), basis: 'High-aging collection risk' },
      { section: '3. Receivables & Deferred Revenue', item: 'Deferred Revenue (Unearned Income)', amountStr: formatBDT(financialMetrics.deferredRevenue), basis: 'Liability: Paid for future gym months' },

      // 4. Accrual Revenue & Expenses
      { section: '4. Accrual Operating Statement', item: 'Recognized Membership Revenue', amountStr: formatBDT(financialMetrics.recognizedRevenue), basis: 'Earned revenue under monthly allocation' },
      { section: '4. Accrual Operating Statement', item: 'Operational Expenses (Disbursed)', amountStr: `- ${formatBDT(financialMetrics.totalExpenses)}`, basis: 'Rent, payroll, bills, maintenance' },
      { section: '4. Accrual Operating Statement', item: 'NET OPERATING PROFIT (Accrual Basis)', amountStr: formatBDT(financialMetrics.accrualNetProfit), basis: 'Recognized Revenue minus Operating Expenses' },
      { section: '4. Accrual Operating Statement', item: 'NET CASH OPERATING RESULT (Cash Basis)', amountStr: formatBDT(financialMetrics.cashNetProfit), basis: 'Liquid Cash Inflow minus Operating Expenses' },
    ];

    const res = exportReportToExcel({
      filename: `gym-balance-sheet-${activeDateRange.start}-to-${activeDateRange.end}.xlsx`,
      reportTitle: 'FitLife Monthly Financial Summary & Balance Statement',
      dateRangeLabel: activeDateRange.label,
      columns,
      rows,
      summaryTotals: {
        item: 'NET ACCRUAL OPERATING PROFIT',
        amountStr: formatBDT(financialMetrics.accrualNetProfit),
      },
      sheetName: 'Balance Sheet',
    });

    if (res.success) {
      setExportNotice(`Exported Balance Sheet to ${res.filename}`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <FinanceDateFilterBar showReset={false} />

      {/* Statutory Disclaimers Card */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <strong>Internal Management Accounts:</strong> Reconciled operational statement separating cash-basis liquid inflows from accrual recognized revenue. This display represents management accounting, not statutory audit compliance.
          </span>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleExportExcel}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileSpreadsheet size={14} />
          Export Balance Sheet (.xlsx)
        </button>
      </div>

      {exportNotice && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#10B981',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={16} />
          {exportNotice}
        </div>
      )}

      {/* 9 Reconciled Financial Metrics Grid */}
      <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <div className="stat-widget">
          <span className="stat-widget-title">1. Total Invoiced</span>
          <div className="stat-widget-value primary-highlight">{formatBDT(financialMetrics.totalInvoiced)}</div>
          <div className="stat-widget-sub">Contracted billing amount</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">2. Total Liquid Collected</span>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>{formatBDT(financialMetrics.totalCollected)}</div>
          <div className="stat-widget-sub">Gross cash, cards & MFS</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">3. Recognized Revenue</span>
          <div className="stat-widget-value" style={{ color: 'var(--primary)' }}>{formatBDT(financialMetrics.recognizedRevenue)}</div>
          <div className="stat-widget-sub">Earned accrual revenue</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">4. Outstanding Dues</span>
          <div className="stat-widget-value" style={{ color: '#F59E0B' }}>{formatBDT(financialMetrics.outstandingDues)}</div>
          <div className="stat-widget-sub">Accounts receivable</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">5. Deferred Revenue</span>
          <div className="stat-widget-value" style={{ color: 'var(--text-primary)' }}>{formatBDT(financialMetrics.deferredRevenue)}</div>
          <div className="stat-widget-sub">Unearned liability on books</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">6. Total Discounts Given</span>
          <div className="stat-widget-value" style={{ color: 'var(--danger)' }}>{formatBDT(financialMetrics.totalDiscounts)}</div>
          <div className="stat-widget-sub">Promotional concessions</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">7. Processed Refunds</span>
          <div className="stat-widget-value" style={{ color: 'var(--text-muted)' }}>{formatBDT(financialMetrics.totalRefunds)}</div>
          <div className="stat-widget-sub">Clawbacks from revenue</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">8. Operational Expenses</span>
          <div className="stat-widget-value danger-highlight">{formatBDT(financialMetrics.totalExpenses)}</div>
          <div className="stat-widget-sub">Disbursed operating costs</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">9. Net Operating Profit</span>
          <div className="stat-widget-value" style={{ color: financialMetrics.accrualNetProfit >= 0 ? '#10B981' : 'var(--danger)' }}>
            {formatBDT(financialMetrics.accrualNetProfit)}
          </div>
          <div className="stat-widget-sub">
            Accrual Net Result (Cash: {formatBDT(financialMetrics.cashNetProfit)})
          </div>
        </div>
      </div>

      {/* Structured Ledger Table: Assets vs Liabilities & Operating Result */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Left: Liquid Assets & Operating Inflows */}
        <div className="activity-card" style={{ padding: '18px' }}>
          <div className="activity-header" style={{ padding: '0 0 12px 0' }}>
            <span style={{ fontWeight: 800, fontSize: '14px' }}>Liquid Assets & Receivables</span>
            <span className="badge badge-success">Cash Position</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <tbody>
                <tr>
                  <td>Liquid Cash in Reception Drawers</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{formatBDT(32500)}</td>
                </tr>
                <tr>
                  <td>bKash Merchant Operating Balance</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{formatBDT(48000)}</td>
                </tr>
                <tr>
                  <td>Nagad & Rocket Digital Wallets</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{formatBDT(63500)}</td>
                </tr>
                <tr>
                  <td>City Bank Operating Account</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{formatBDT(87000)}</td>
                </tr>
                <tr style={{ background: 'var(--bg-surface)' }}>
                  <td><strong>Total Liquid Funds Available</strong></td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#10B981' }}>
                    {formatBDT(financialMetrics.netCashCollected)}
                  </td>
                </tr>
                <tr>
                  <td>Accounts Receivable (Current Member Dues)</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#F59E0B' }}>
                    {formatBDT(financialMetrics.outstandingDues - financialMetrics.overdueDues)}
                  </td>
                </tr>
                <tr>
                  <td>Delinquent Accounts (&gt;0 Days Overdue)</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                    {formatBDT(financialMetrics.overdueDues)}
                  </td>
                </tr>
                <tr style={{ background: 'var(--bg-surface)' }}>
                  <td><strong>Total Accounts Receivable</strong></td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--danger)' }}>
                    {formatBDT(financialMetrics.outstandingDues)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Deferred Liabilities & Net Accrual Result */}
        <div className="activity-card" style={{ padding: '18px' }}>
          <div className="activity-header" style={{ padding: '0 0 12px 0' }}>
            <span style={{ fontWeight: 800, fontSize: '14px' }}>Deferred Liabilities & Accrual Earnings</span>
            <span className="badge badge-primary">Accrual Result</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <tbody>
                <tr>
                  <td>Deferred Membership Revenue (Unearned Service)</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                    {formatBDT(financialMetrics.deferredRevenue)}
                  </td>
                </tr>
                <tr>
                  <td>Pending Facility Expenses to be Disbursed</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                    {formatBDT(5500)}
                  </td>
                </tr>
                <tr style={{ background: 'var(--bg-surface)' }}>
                  <td><strong>Total Deferred Obligations</strong></td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>
                    {formatBDT(financialMetrics.deferredRevenue + 5500)}
                  </td>
                </tr>
                <tr>
                  <td>Accrual Recognized Revenue for Active Scope</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>
                    + {formatBDT(financialMetrics.recognizedRevenue)}
                  </td>
                </tr>
                <tr>
                  <td>Operating Expenses Incurred in Scope</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                    - {formatBDT(financialMetrics.totalExpenses)}
                  </td>
                </tr>
                <tr style={{
                  background: financialMetrics.accrualNetProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderTop: '2px solid var(--border-base)',
                }}>
                  <td>
                    <strong style={{ fontSize: '13px' }}>Net Operating Profit (Accrual)</strong>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '15px', color: financialMetrics.accrualNetProfit >= 0 ? '#10B981' : 'var(--danger)' }}>
                    {formatBDT(financialMetrics.accrualNetProfit)}
                  </td>
                </tr>
                <tr style={{
                  background: financialMetrics.cashNetProfit >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                }}>
                  <td>
                    <strong style={{ fontSize: '13px' }}>Alternative Net Cash Flow (Liquid Cash Basis)</strong>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px', color: financialMetrics.cashNetProfit >= 0 ? '#10B981' : 'var(--danger)' }}>
                    {formatBDT(financialMetrics.cashNetProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
