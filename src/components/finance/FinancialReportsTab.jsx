import { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT, formatDatePretty } from '../../utils/financeCalculators';
import { exportReportToExcel } from '../../utils/excelExporter';
import FinanceDateFilterBar from './FinanceDateFilterBar';

export const REPORT_TYPES = [
  { id: 'daily-collection', name: 'Daily Collection Report', category: 'Collections' },
  { id: 'weekly-collection', name: 'Weekly Collection Report', category: 'Collections' },
  { id: 'monthly-collection', name: 'Monthly Collection Report', category: 'Collections' },
  { id: 'quarterly-collection', name: 'Quarterly Collection Report', category: 'Collections' },
  { id: 'yearly-collection', name: 'Yearly Collection Report', category: 'Collections' },
  { id: 'custom-collection', name: 'Custom Date Range Report', category: 'Collections' },
  { id: 'payment-methods', name: 'Payment Method Report', category: 'Methods' },
  { id: 'member-dues', name: 'Member Dues Report', category: 'Receivables' },
  { id: 'invoices', name: 'Invoice Statement Report', category: 'Billing' },
  { id: 'revenue-recognition', name: 'Revenue Recognition Report', category: 'Accounting' },
  { id: 'expenses', name: 'Expense Audit Report', category: 'Expenses' },
  { id: 'profit-loss', name: 'Profit & Loss Report', category: 'P&L' },
  { id: 'discounts-refunds', name: 'Discount and Refund Report', category: 'Audits' },
];

export default function FinancialReportsTab() {
  const {
    filteredPayments,
    filteredInvoices,
    memberDues,
    paymentMethodSummary,
    revenueRecognitionSchedules,
    filteredExpenses,
    filteredRefunds,
    financialMetrics,
    activeDateRange,
  } = useFinance();

  const [selectedReportId, setSelectedReportId] = useState('monthly-collection');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportNotice, setExportNotice] = useState(null);

  // Build report dataset dynamically
  const reportData = useMemo(() => {
    switch (selectedReportId) {
      case 'daily-collection':
      case 'weekly-collection':
      case 'monthly-collection':
      case 'quarterly-collection':
      case 'yearly-collection':
      case 'custom-collection': {
        const rows = filteredPayments.map((p) => ({
          receiptNo: p.receiptNumber,
          invoiceNo: p.invoiceNumber,
          member: p.memberName,
          memberCode: p.memberCode,
          plan: p.planName,
          amount: p.amount,
          amountStr: formatBDT(p.amount),
          method: p.method,
          reference: p.reference || '—',
          date: p.date,
          datePretty: formatDatePretty(p.date),
        }));

        const total = rows.reduce((s, r) => s + r.amount, 0);

        return {
          title: REPORT_TYPES.find((r) => r.id === selectedReportId)?.name || 'Collection Report',
          filename: `gym-${selectedReportId}-${activeDateRange.start}-to-${activeDateRange.end}.xlsx`,
          columns: [
            { key: 'receiptNo', label: 'Receipt No' },
            { key: 'invoiceNo', label: 'Invoice No' },
            { key: 'member', label: 'Member Name' },
            { key: 'memberCode', label: 'Member ID' },
            { key: 'plan', label: 'Plan' },
            { key: 'amountStr', label: 'Amount Paid' },
            { key: 'method', label: 'Payment Method' },
            { key: 'reference', label: 'Trx Reference' },
            { key: 'datePretty', label: 'Payment Date' },
          ],
          rows,
          summaryCards: [
            { label: 'Total Collections', value: formatBDT(total), color: '#10B981' },
            { label: 'Receipt Count', value: `${rows.length} Receipts`, color: 'var(--primary)' },
            { label: 'Average Ticket', value: formatBDT(rows.length > 0 ? total / rows.length : 0), color: 'var(--text-primary)' },
          ],
          summaryTotals: {
            receiptNo: 'TOTAL',
            amountStr: formatBDT(total),
          },
        };
      }

      case 'payment-methods': {
        const rows = paymentMethodSummary.map((m) => ({
          method: m.name,
          account: m.accountNumber,
          fee: `${m.feePercent}%`,
          count: m.count,
          totalStr: formatBDT(m.totalAmount),
          refundsStr: formatBDT(m.refundAmount),
          netStr: formatBDT(m.netCollection),
          totalAmount: m.totalAmount,
        }));
        const total = rows.reduce((s, r) => s + r.totalAmount, 0);

        return {
          title: 'Payment Method Performance Report',
          filename: `gym-payment-methods-${activeDateRange.start}-to-${activeDateRange.end}.xlsx`,
          columns: [
            { key: 'method', label: 'Payment Channel' },
            { key: 'account', label: 'Account / Reference' },
            { key: 'fee', label: 'Fee Rate' },
            { key: 'count', label: 'Transactions' },
            { key: 'totalStr', label: 'Gross Collection' },
            { key: 'refundsStr', label: 'Refunds' },
            { key: 'netStr', label: 'Net Liquid Settled' },
          ],
          rows,
          summaryCards: [
            { label: 'Consolidated Gross', value: formatBDT(total), color: '#10B981' },
            { label: 'Active Channels', value: `${rows.length} Gateways`, color: 'var(--primary)' },
          ],
          summaryTotals: {
            method: 'CONSOLIDATED TOTAL',
            totalStr: formatBDT(total),
          },
        };
      }

      case 'member-dues': {
        const rows = memberDues.map((d) => ({
          member: d.memberName,
          code: d.memberCode,
          invoiceNo: d.number,
          plan: d.planName,
          payableStr: formatBDT(d.netPayable),
          paidStr: formatBDT(d.paidAmount),
          dueStr: formatBDT(d.dueAmount),
          dueAmount: d.dueAmount,
          dueDateStr: formatDatePretty(d.dueDate),
          aging: d.daysOverdue > 0 ? `${d.daysOverdue} Days Overdue` : 'Current',
          status: d.effectiveStatus,
        }));

        const totalDue = rows.reduce((s, r) => s + r.dueAmount, 0);

        return {
          title: 'Member Outstanding Dues & Aging Report',
          filename: `gym-member-dues-${activeDateRange.start}.xlsx`,
          columns: [
            { key: 'member', label: 'Member Name' },
            { key: 'code', label: 'Member ID' },
            { key: 'invoiceNo', label: 'Invoice No' },
            { key: 'plan', label: 'Membership Plan' },
            { key: 'payableStr', label: 'Net Payable' },
            { key: 'paidStr', label: 'Amount Paid' },
            { key: 'dueStr', label: 'Outstanding Due' },
            { key: 'dueDateStr', label: 'Due Date' },
            { key: 'aging', label: 'Aging Status' },
            { key: 'status', label: 'Status' },
          ],
          rows,
          summaryCards: [
            { label: 'Total Outstanding Dues', value: formatBDT(totalDue), color: 'var(--danger)' },
            { label: 'Unpaid Accounts', value: `${rows.filter((r) => r.dueAmount > 0).length} Members`, color: '#F59E0B' },
          ],
          summaryTotals: {
            member: 'TOTAL DUES',
            dueStr: formatBDT(totalDue),
          },
        };
      }

      case 'invoices': {
        const rows = filteredInvoices.map((inv) => ({
          number: inv.number,
          member: inv.memberName,
          code: inv.memberCode,
          plan: inv.planName,
          baseStr: formatBDT(inv.baseAmount),
          discountStr: formatBDT(inv.discountAmount),
          payableStr: formatBDT(inv.netPayable),
          netPayable: inv.netPayable,
          paidStr: formatBDT(inv.paidAmount),
          dueStr: formatBDT(inv.dueAmount),
          dateStr: formatDatePretty(inv.date),
          status: inv.status,
        }));
        const total = rows.reduce((s, r) => s + r.netPayable, 0);

        return {
          title: 'Invoicing & Consideration Report',
          filename: `gym-invoices-${activeDateRange.start}-to-${activeDateRange.end}.xlsx`,
          columns: [
            { key: 'number', label: 'Invoice No' },
            { key: 'member', label: 'Member' },
            { key: 'code', label: 'Member ID' },
            { key: 'plan', label: 'Plan' },
            { key: 'baseStr', label: 'Base Price' },
            { key: 'discountStr', label: 'Discount' },
            { key: 'payableStr', label: 'Net Payable' },
            { key: 'paidStr', label: 'Paid' },
            { key: 'dueStr', label: 'Due' },
            { key: 'dateStr', label: 'Invoice Date' },
            { key: 'status', label: 'Status' },
          ],
          rows,
          summaryCards: [
            { label: 'Total Billed', value: formatBDT(total), color: 'var(--primary)' },
            { label: 'Invoices Issued', value: `${rows.length} Invoices`, color: 'var(--text-primary)' },
          ],
          summaryTotals: {
            number: 'TOTAL BILLED',
            payableStr: formatBDT(total),
          },
        };
      }

      case 'revenue-recognition': {
        const rows = revenueRecognitionSchedules.map((item) => ({
          member: item.memberName,
          code: item.memberCode,
          plan: item.planName,
          duration: `${item.durationMonths} Mo`,
          considerationStr: formatBDT(item.recognition.netConsideration),
          netConsideration: item.recognition.netConsideration,
          period: `${item.startDate} to ${item.endDate}`,
          recognizedStr: formatBDT(item.recognition.recognizedToDate),
          recognized: item.recognition.recognizedToDate,
          deferredStr: formatBDT(item.recognition.deferredRevenue),
          deferred: item.recognition.deferredRevenue,
        }));

        const totalRec = rows.reduce((s, r) => s + r.recognized, 0);
        const totalDef = rows.reduce((s, r) => s + r.deferred, 0);

        return {
          title: 'Revenue Recognition & Deferred Revenue Report',
          filename: `gym-revenue-recognition-${activeDateRange.start}.xlsx`,
          columns: [
            { key: 'member', label: 'Member' },
            { key: 'code', label: 'Member ID' },
            { key: 'plan', label: 'Plan' },
            { key: 'duration', label: 'Duration' },
            { key: 'considerationStr', label: 'Paid (excl. VAT)' },
            { key: 'period', label: 'Period' },
            { key: 'recognizedStr', label: 'Recognized to Date' },
            { key: 'deferredStr', label: 'Deferred Revenue' },
          ],
          rows,
          summaryCards: [
            { label: 'Total Recognized', value: formatBDT(totalRec), color: '#10B981' },
            { label: 'Total Deferred (Unearned)', value: formatBDT(totalDef), color: 'var(--primary)' },
          ],
          summaryTotals: {
            member: 'TOTALS',
            recognizedStr: formatBDT(totalRec),
            deferredStr: formatBDT(totalDef),
          },
        };
      }

      case 'expenses': {
        const rows = filteredExpenses.map((exp) => ({
          title: exp.title,
          category: exp.category,
          amountStr: formatBDT(exp.amount),
          amount: exp.amount,
          method: exp.method,
          dateStr: formatDatePretty(exp.date),
          vendor: exp.vendor,
          status: exp.approvalStatus,
          approvedBy: exp.approvedBy,
        }));
        const total = rows.reduce((s, r) => s + r.amount, 0);

        return {
          title: 'Operating Expenses Report',
          filename: `gym-expenses-${activeDateRange.start}-to-${activeDateRange.end}.xlsx`,
          columns: [
            { key: 'title', label: 'Expense Title' },
            { key: 'category', label: 'Category' },
            { key: 'amountStr', label: 'Amount' },
            { key: 'method', label: 'Channel' },
            { key: 'dateStr', label: 'Date' },
            { key: 'vendor', label: 'Vendor' },
            { key: 'status', label: 'Status' },
            { key: 'approvedBy', label: 'Approved By' },
          ],
          rows,
          summaryCards: [
            { label: 'Total Incurred', value: formatBDT(total), color: 'var(--danger)' },
            { label: 'Expenses Logged', value: `${rows.length} Items`, color: 'var(--text-primary)' },
          ],
          summaryTotals: {
            title: 'TOTAL EXPENSES',
            amountStr: formatBDT(total),
          },
        };
      }

      case 'profit-loss': {
        const rows = [
          { item: 'Accrual Recognized Membership Revenue', type: 'Revenue (+)', amountStr: formatBDT(financialMetrics.recognizedRevenue), amount: financialMetrics.recognizedRevenue },
          { item: 'Liquid Cash Collected (Alternative Cash Basis)', type: 'Cash Inflow', amountStr: formatBDT(financialMetrics.netCashCollected), amount: financialMetrics.netCashCollected },
          { item: 'Operating Facility Rent', type: 'Expense (-)', amountStr: formatBDT(120000), amount: -120000 },
          { item: 'Staff & Trainer Payroll', type: 'Expense (-)', amountStr: formatBDT(95000), amount: -95000 },
          { item: 'Electricity & Utilities (DESCO)', type: 'Expense (-)', amountStr: formatBDT(28500), amount: -28500 },
          { item: 'Equipment Maintenance & Parts', type: 'Expense (-)', amountStr: formatBDT(14500), amount: -14500 },
          { item: 'Cleaning & Sanitation Supplies', type: 'Expense (-)', amountStr: formatBDT(8200), amount: -8200 },
          { item: 'Digital Marketing & Social Ads', type: 'Expense (-)', amountStr: formatBDT(15000), amount: -15000 },
          { item: 'Coffee Shop Restock', type: 'Expense (-)', amountStr: formatBDT(32000), amount: -32000 },
          { item: 'Administration & Miscellaneous', type: 'Expense (-)', amountStr: formatBDT(6800), amount: -6800 },
          { item: 'NET OPERATING RESULT (Accrual)', type: 'Net Profit', amountStr: formatBDT(financialMetrics.accrualNetProfit), amount: financialMetrics.accrualNetProfit },
        ];

        return {
          title: 'Profit & Loss Statement (Management Accounts)',
          filename: `gym-profit-loss-${activeDateRange.start}-to-${activeDateRange.end}.xlsx`,
          columns: [
            { key: 'item', label: 'Accounting Line Item' },
            { key: 'type', label: 'Classification' },
            { key: 'amountStr', label: 'Amount (BDT)' },
          ],
          rows,
          summaryCards: [
            { label: 'Recognized Revenue', value: formatBDT(financialMetrics.recognizedRevenue), color: 'var(--primary)' },
            { label: 'Total Operating Expenses', value: formatBDT(financialMetrics.totalExpenses), color: 'var(--danger)' },
            { label: 'Net Operating Profit', value: formatBDT(financialMetrics.accrualNetProfit), color: financialMetrics.accrualNetProfit >= 0 ? '#10B981' : 'var(--danger)' },
          ],
          summaryTotals: {
            item: 'NET OPERATING RESULT',
            amountStr: formatBDT(financialMetrics.accrualNetProfit),
          },
        };
      }

      case 'discounts-refunds': {
        const discRows = filteredInvoices
          .filter((i) => i.discountAmount > 0)
          .map((i) => ({
            type: 'Discount Given',
            ref: i.number,
            member: i.memberName,
            amountStr: formatBDT(i.discountAmount),
            amount: i.discountAmount,
            reason: i.discountReason || 'Promotional Cut',
            dateStr: formatDatePretty(i.date),
          }));

        const refRows = filteredRefunds.map((r) => ({
          type: 'Member Refund',
          ref: r.receiptNumber,
          member: r.memberName,
          amountStr: formatBDT(r.amount),
          amount: r.amount,
          reason: r.reason,
          dateStr: formatDatePretty(r.date),
        }));

        const rows = [...discRows, ...refRows];
        const total = rows.reduce((s, r) => s + r.amount, 0);

        return {
          title: 'Discount and Refund Audit Report',
          filename: `gym-discounts-and-refunds-${activeDateRange.start}.xlsx`,
          columns: [
            { key: 'type', label: 'Transaction Type' },
            { key: 'ref', label: 'Reference No' },
            { key: 'member', label: 'Member Name' },
            { key: 'amountStr', label: 'Amount' },
            { key: 'reason', label: 'Reason / Policy Clause' },
            { key: 'dateStr', label: 'Date' },
          ],
          rows,
          summaryCards: [
            { label: 'Total Discounts Given', value: formatBDT(financialMetrics.totalDiscounts), color: 'var(--danger)' },
            { label: 'Total Refunds Processed', value: formatBDT(financialMetrics.totalRefunds), color: 'var(--text-secondary)' },
          ],
          summaryTotals: {
            type: 'TOTAL ADJUSTMENTS',
            amountStr: formatBDT(total),
          },
        };
      }

      default:
        return {
          title: 'Financial Report',
          filename: 'gym-report.xlsx',
          columns: [],
          rows: [],
          summaryCards: [],
        };
    }
  }, [
    selectedReportId,
    filteredPayments,
    filteredInvoices,
    memberDues,
    paymentMethodSummary,
    revenueRecognitionSchedules,
    filteredExpenses,
    filteredRefunds,
    financialMetrics,
    activeDateRange,
  ]);

  // Handle Excel download
  const handleDownloadExcel = () => {
    const res = exportReportToExcel({
      filename: reportData.filename,
      reportTitle: reportData.title,
      dateRangeLabel: activeDateRange.label,
      columns: reportData.columns,
      rows: reportData.rows,
      summaryTotals: reportData.summaryTotals,
      sheetName: 'Financial Report',
    });

    if (res.success) {
      setExportNotice(`Downloaded genuine Excel spreadsheet: ${res.filename}`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  // Filter rows by local search
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return reportData.rows;
    const term = searchTerm.toLowerCase();
    return reportData.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(term))
    );
  }, [reportData.rows, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <FinanceDateFilterBar showReset={false} />

      {/* Report Selector Pills Bar */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '14px 18px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 800 }}>Standard Financial Reports & Export:</span>
            <span className="badge badge-primary">{reportData.title}</span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleDownloadExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Download size={14} />
            Download Excel (.xlsx)
          </button>
        </div>

        {/* 13 Report Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
          {REPORT_TYPES.map((rep) => {
            const isActive = selectedReportId === rep.id;
            return (
              <button
                key={rep.id}
                type="button"
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setSelectedReportId(rep.id);
                  setSearchTerm('');
                }}
                style={{ fontSize: '11px', padding: '5px 10px', whiteSpace: 'nowrap' }}
              >
                {rep.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Success notification for export */}
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

      {/* Report Summary Cards */}
      {reportData.summaryCards && reportData.summaryCards.length > 0 && (
        <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))` }}>
          {reportData.summaryCards.map((c, i) => (
            <div key={i} className="stat-widget" style={{ padding: '14px' }}>
              <span className="stat-widget-title">{c.label}</span>
              <div className="stat-widget-value" style={{ color: c.color, fontSize: '20px' }}>
                {c.value}
              </div>
              <div className="stat-widget-sub">Calculated from mock dataset</div>
            </div>
          ))}
        </div>
      )}

      {/* Search within report */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder={`Filter ${reportData.title}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '36px', fontSize: '12px' }}
          />
        </div>

        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Showing {filteredRows.length} of {reportData.rows.length} rows
        </span>
      </div>

      {/* Main Report Table */}
      <div className="activity-card">
        <div className="activity-header">
          <span style={{ fontWeight: 800 }}>{reportData.title}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scope: {activeDateRange.label}</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                {reportData.columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={reportData.columns.length || 1} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No report records found matching the active scope or search.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={idx}>
                    {reportData.columns.map((col) => (
                      <td key={col.key}>
                        {row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
