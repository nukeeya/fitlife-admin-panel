import { useState, useMemo } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Clock,
  Receipt,
  CreditCard,
  PlusCircle,
  HelpCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatBDT, formatDatePretty } from '../../utils/financeCalculators';
import { exportReportToExcel } from '../../utils/excelExporter';
import Modal from '../common/Modal';

export default function MonthlyAccountClosingTab() {
  const {
    invoices,
    expenses,
    allPayments,
    refunds,
    closedMonths,
    closeMonth,
    isMonthClosed,
    periodAdjustments,
    addPeriodAdjustment,
    revenueRecognitionSchedules,
    today,
  } = useFinance();
  const { staff } = useAuth();

  // Current month plus the previous 11, newest first
  const monthOptions = useMemo(() => {
    const [y, m] = today.split('-').map(Number);
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(y, m - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const suffix = i === 0 ? ' (Current Period)' : closedMonths[key]?.isClosed ? ' (Closed)' : '';
      return { key, label: `${name}${suffix}` };
    });
  }, [today, closedMonths]);

  // Selected Month for Closing Review
  const [selectedMonth, setSelectedMonth] = useState(() => today.slice(0, 7)); // 'YYYY-MM'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [closingAdmin, setClosingAdmin] = useState(staff?.name || '');
  const [successBanner, setSuccessBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  // Period Adjustment Modal
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjType, setAdjType] = useState('credit');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjAuditor, setAdjAuditor] = useState(staff?.name || '');

  const isCurrentSelectedClosed = isMonthClosed(selectedMonth);
  const closedRecord = closedMonths[selectedMonth];

  // Transactions belonging to selected month
  const monthInvoices = useMemo(() => {
    return invoices.filter((i) => (i.date || '').startsWith(selectedMonth));
  }, [invoices, selectedMonth]);

  const monthPayments = useMemo(() => {
    return allPayments.filter((p) => (p.date || '').startsWith(selectedMonth));
  }, [allPayments, selectedMonth]);

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => (e.date || '').startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const monthRefunds = useMemo(() => {
    return refunds.filter((r) => (r.date || '').startsWith(selectedMonth));
  }, [refunds, selectedMonth]);

  // Financial Summary Values for Selected Month
  const summary = useMemo(() => {
    // 1. Invoicing & Discounts
    const totalInvoiced = monthInvoices.reduce((s, i) => s + (Number(i.netPayable) || 0), 0);
    const totalDiscounts = monthInvoices.reduce((s, i) => s + (Number(i.discountAmount) || 0), 0);
    const totalBasePrice = monthInvoices.reduce((s, i) => s + (Number(i.baseAmount) || 0), 0);

    // 2. Liquid Collections & Gateways
    const totalCollected = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    // Payment methods are stored as CASH / bKASH / NAGAD / ROCKET / CARD / BANK.
    const collectedVia = (...codes) => monthPayments
      .filter((p) => codes.includes(String(p.methodId || p.method || '').toUpperCase()))
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const cashCollected = collectedVia('CASH');
    const bkashCollected = collectedVia('BKASH');
    const nagadCollected = collectedVia('NAGAD');
    const rocketCollected = collectedVia('ROCKET');
    const bankCollected = collectedVia('BANK', 'CARD');

    // 3. Receivables & Dues
    const outstandingDues = monthInvoices.reduce((s, i) => s + (Number(i.dueAmount) || 0), 0);
    const overdueDues = monthInvoices
      .filter((i) => i.dueAmount > 0 && i.dueDate && i.dueDate < today)
      .reduce((s, i) => s + (Number(i.dueAmount) || 0), 0);

    // 4. Accrual Recognition: revenue allocated to this month across all
    // memberships, and what this month's invoices still owe to later months.
    let recognizedRevenue = 0;
    let deferredRevenue = 0;
    for (const inv of revenueRecognitionSchedules) {
      for (const slot of inv.recognition.monthlySchedule) {
        if (slot.monthKey === selectedMonth) recognizedRevenue += slot.allocatedRevenue;
        if ((inv.date || '').startsWith(selectedMonth) && slot.monthKey > selectedMonth) {
          deferredRevenue += slot.allocatedRevenue;
        }
      }
    }
    recognizedRevenue = Math.round(recognizedRevenue * 100) / 100;
    deferredRevenue = Math.round(deferredRevenue * 100) / 100;

    // 5. Refunds & Expenses
    const totalRefunds = monthRefunds.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const totalExpenses = monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    // 6. Net Results
    const netCashOperatingResult = Math.max(0, totalCollected - totalRefunds) - totalExpenses;
    const netAccrualProfit = recognizedRevenue - totalExpenses;

    return {
      totalInvoiced,
      totalDiscounts,
      totalBasePrice,
      totalCollected,
      cashCollected,
      bkashCollected,
      nagadCollected,
      rocketCollected,
      bankCollected,
      outstandingDues,
      overdueDues,
      recognizedRevenue,
      deferredRevenue,
      totalRefunds,
      totalExpenses,
      netCashOperatingResult,
      netAccrualProfit,
    };
  }, [monthInvoices, monthPayments, monthExpenses, monthRefunds, revenueRecognitionSchedules, selectedMonth, today]);

  // Adjustments list for this month
  const adjustments = periodAdjustments[selectedMonth] || [];

  // Handle Closing Execution
  const handleExecuteClose = async () => {
    if (saving) return;
    setSaving(true);
    const res = await closeMonth({
      monthKey: selectedMonth,
      notes: closingNotes,
      closedBy: closingAdmin,
    });
    setSaving(false);

    if (res.success) {
      setShowConfirmModal(false);
      setSuccessBanner(
        `Accounting Period ${selectedMonth} marked as FINALIZED & CLOSED. Ordinary edits disabled.`
      );
      setTimeout(() => setSuccessBanner(null), 6000);
    } else {
      alert(res.error);
    }
  };

  // Export Finalized Excel Report
  const handleExportFinalReport = () => {
    const columns = [
      { key: 'metric', label: 'Financial Metric' },
      { key: 'amount', label: 'Reconciled Amount (BDT)' },
      { key: 'notes', label: 'Reconciliation Policy' },
    ];

    const rows = [
      { metric: 'Total Invoiced Consideration', amount: formatBDT(summary.totalInvoiced), notes: 'Total billed packages in period' },
      { metric: 'Total Liquid Collected', amount: formatBDT(summary.totalCollected), notes: 'All channels combined' },
      { metric: '• Collections via bKash Merchant', amount: formatBDT(summary.bkashCollected), notes: 'Digital MFS QR & Gateway' },
      { metric: '• Collections via Cash (Reception)', amount: formatBDT(summary.cashCollected), notes: 'Physical till receipts' },
      { metric: '• Collections via Nagad', amount: formatBDT(summary.nagadCollected), notes: 'Digital wallet' },
      { metric: '• Collections via Rocket', amount: formatBDT(summary.rocketCollected), notes: 'DBBL MFS' },
      { metric: '• Collections via Bank Wire & POS', amount: formatBDT(summary.bankCollected), notes: 'City Bank merchant portal' },
      { metric: 'Outstanding Dues (Receivables)', amount: formatBDT(summary.outstandingDues), notes: 'Uncollected balances' },
      { metric: 'Overdue Dues (>0 Days Past Deadline)', amount: formatBDT(summary.overdueDues), notes: 'Aging risk' },
      { metric: 'Recognized Accrual Revenue', amount: formatBDT(summary.recognizedRevenue), notes: 'Monthly earned service allocation' },
      { metric: 'Deferred Unearned Revenue', amount: formatBDT(summary.deferredRevenue), notes: 'Prepaid future gym months' },
      { metric: 'Promotional Discounts Authorized', amount: `- ${formatBDT(summary.totalDiscounts)}`, notes: 'Fee reductions' },
      { metric: 'Member Refunds Processed', amount: `- ${formatBDT(summary.totalRefunds)}`, notes: 'Clawbacks' },
      { metric: 'Total Operating Expenses', amount: `- ${formatBDT(summary.totalExpenses)}`, notes: 'Rent, salaries, maintenance' },
      { metric: 'NET OPERATING PROFIT (Accrual)', amount: formatBDT(summary.netAccrualProfit), notes: 'Recognized Revenue minus Expenses' },
      { metric: 'NET CASH RESULT (Cash Basis)', amount: formatBDT(summary.netCashOperatingResult), notes: 'Collected minus Disbursed' },
    ];

    exportReportToExcel({
      filename: `monthly-closing-${selectedMonth}.xlsx`,
      reportTitle: `Monthly Closing & Finalized Statement (${selectedMonth})`,
      dateRangeLabel: `Accounting Period: ${selectedMonth}`,
      columns,
      rows,
      summaryTotals: {
        metric: 'FINAL ACCRUAL OPERATING RESULT',
        amount: formatBDT(summary.netAccrualProfit),
      },
      sheetName: 'Monthly Closing',
    });
  };

  // Save Period Adjustment
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!adjAmount || Number(adjAmount) <= 0) {
      alert('Please enter a valid adjustment amount.');
      return;
    }
    if (!adjReason.trim()) {
      alert('Adjustment reason is mandatory for audit logging.');
      return;
    }

    setSaving(true);
    const res = await addPeriodAdjustment({
      monthKey: selectedMonth,
      type: adjType,
      amount: Number(adjAmount),
      reason: adjReason.trim(),
      authorizedBy: adjAuditor.trim(),
    });
    setSaving(false);
    if (!res.success) {
      alert(res.error);
      return;
    }

    setShowAdjustmentModal(false);
    setAdjAmount('');
    setAdjReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Month Selector Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-base)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: isCurrentSelectedClosed
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(200, 255, 0, 0.15)',
              color: isCurrentSelectedClosed ? '#10B981' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCurrentSelectedClosed ? <Lock size={22} /> : <Calendar size={22} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Monthly Account Closing Simulation
              </h2>
              {isCurrentSelectedClosed ? (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} /> Closed & Finalized
                </span>
              ) : (
                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Unlock size={12} /> Open Period
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Reconcile revenues, cash receipts, outstanding dues, and operating expenses. Lock accounting periods to simulate audit finalization.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Month Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
              Period:
            </label>
            <select
              className="form-control"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: 'auto', fontWeight: 700, fontSize: '13px' }}
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Close Month Button */}
          {isCurrentSelectedClosed ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportFinalReport}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileSpreadsheet size={15} />
              Export Final Statement (.xlsx)
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setClosingNotes(`Reconciled closing for ${selectedMonth} by management.`);
                setShowConfirmModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Lock size={15} />
              Close Month ({selectedMonth})
            </button>
          )}

          {/* Demo Adjustment Button */}
          {isCurrentSelectedClosed && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAdjustmentModal(true)}
              title="Record an authorized audit correction on closed period"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} />
              Audit Adjustment
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10B981',
            color: '#10B981',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Closed Period Metadata Alert */}
      {isCurrentSelectedClosed && closedRecord && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="#10B981" />
            <div>
              <strong style={{ fontSize: '13px', color: '#10B981' }}>
                Period Finalized & Locked
              </strong>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Closed on: <strong>{new Date(closedRecord.closedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</strong> · Authorized by: <strong>{closedRecord.closedBy}</strong> · Notes: <em>{closedRecord.notes}</em>
              </p>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Ordinary edits disabled for transactions within this calendar month.
          </span>
        </div>
      )}

      {/* Closing scope notice */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(59, 130, 246, 0.06)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Info size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Closing Audit Notice:</strong> Closing a month is saved to the database and locks its expenses. Only a Super Admin can re-open a closed month; use period adjustments for later corrections.
        </span>
      </div>

      {/* Financial Summary Metric Cards Grid */}
      <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-widget">
          <span className="stat-widget-title">1. Total Invoiced</span>
          <div className="stat-widget-value primary-highlight">{formatBDT(summary.totalInvoiced)}</div>
          <div className="stat-widget-sub">{monthInvoices.length} invoices issued</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">2. Total Liquid Collected</span>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>{formatBDT(summary.totalCollected)}</div>
          <div className="stat-widget-sub">{monthPayments.length} transactions received</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">3. Outstanding Dues</span>
          <div className="stat-widget-value" style={{ color: summary.outstandingDues > 0 ? '#F59E0B' : '#10B981' }}>
            {formatBDT(summary.outstandingDues)}
          </div>
          <div className="stat-widget-sub">Receivables billed in {selectedMonth}</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">4. Overdue Dues</span>
          <div className="stat-widget-value danger-highlight">{formatBDT(summary.overdueDues)}</div>
          <div className="stat-widget-sub">Past clearance deadline</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">5. Recognized Revenue</span>
          <div className="stat-widget-value">{formatBDT(summary.recognizedRevenue)}</div>
          <div className="stat-widget-sub">Accrual earned portion</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">6. Deferred Revenue</span>
          <div className="stat-widget-value" style={{ color: 'var(--text-muted)' }}>
            {formatBDT(summary.deferredRevenue)}
          </div>
          <div className="stat-widget-sub">Unearned advance fees</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">7. Promotional Discounts</span>
          <div className="stat-widget-value" style={{ color: 'var(--danger)' }}>
            - {formatBDT(summary.totalDiscounts)}
          </div>
          <div className="stat-widget-sub">Authorized deductions</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">8. Total Operating Expenses</span>
          <div className="stat-widget-value danger-highlight">
            - {formatBDT(summary.totalExpenses)}
          </div>
          <div className="stat-widget-sub">{monthExpenses.length} expense items</div>
        </div>

        <div className="stat-widget" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <span className="stat-widget-title">9. Net Operating Profit (Accrual)</span>
          <div
            className="stat-widget-value"
            style={{ color: summary.netAccrualProfit >= 0 ? '#10B981' : 'var(--danger)' }}
          >
            {formatBDT(summary.netAccrualProfit)}
          </div>
          <div className="stat-widget-sub">Recognized Revenue – Expenses</div>
        </div>

        <div className="stat-widget" style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}>
          <span className="stat-widget-title">10. Net Cash Result (Cash Basis)</span>
          <div
            className="stat-widget-value"
            style={{ color: summary.netCashOperatingResult >= 0 ? '#10B981' : 'var(--danger)' }}
          >
            {formatBDT(summary.netCashOperatingResult)}
          </div>
          <div className="stat-widget-sub">Net Collected – Expenses</div>
        </div>
      </div>

      {/* Gateway & Payment Method Reconciliation Breakdown */}
      <div className="activity-card">
        <div className="activity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} color="var(--primary)" />
            <span style={{ fontWeight: 800 }}>Channel & Gateway Settlement Breakdown</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Reconciled collections for period {selectedMonth}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            padding: '16px 20px',
          }}
        >
          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-base)' }}>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 800 }}>CASH RECEPTION</span>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{formatBDT(summary.cashCollected)}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Physical till drawers</span>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-base)' }}>
            <span style={{ fontSize: '11px', color: '#D12053', fontWeight: 800 }}>bKASH MERCHANT</span>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{formatBDT(summary.bkashCollected)}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Online & QR gateway</span>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-base)' }}>
            <span style={{ fontSize: '11px', color: '#F7931E', fontWeight: 800 }}>NAGAD DIGITAL</span>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{formatBDT(summary.nagadCollected)}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Post Office wallet</span>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-base)' }}>
            <span style={{ fontSize: '11px', color: '#8C3494', fontWeight: 800 }}>ROCKET (DBBL)</span>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{formatBDT(summary.rocketCollected)}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dutch-Bangla MFS</span>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-base)' }}>
            <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 800 }}>BANK & POS CARDS</span>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{formatBDT(summary.bankCollected)}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>City Bank POS swipe</span>
          </div>
        </div>
      </div>

      {/* Adjustments History Table (if any adjustments logged) */}
      {adjustments.length > 0 && (
        <div className="activity-card">
          <div className="activity-header">
            <span style={{ fontWeight: 800 }}>Authorized Audit Adjustments ({selectedMonth})</span>
            <span className="badge badge-info">{adjustments.length} Recorded</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Adjustment ID</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Auditor Reason</th>
                  <th>Authorized By</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adj) => (
                  <tr key={adj.id}>
                    <td style={{ fontWeight: 700 }}>{adj.id}</td>
                    <td>{formatDatePretty(adj.date)}</td>
                    <td>
                      <span className="badge badge-primary">{adj.type.toUpperCase()}</span>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatBDT(adj.amount)}</td>
                    <td>{adj.reason}</td>
                    <td>{adj.authorizedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Transaction Preview */}
      <div className="activity-card">
        <div className="activity-header">
          <span style={{ fontWeight: 800 }}>Period Transaction Preview ({selectedMonth})</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {monthPayments.length} payments · {monthExpenses.length} expenses
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Reference / Invoice</th>
                <th>Party / Member / Payee</th>
                <th>Category / Plan</th>
                <th>Channel</th>
                <th>Date</th>
                <th>Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              {monthPayments.slice(0, 6).map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="badge badge-success" style={{ fontSize: '10px' }}>
                      COLLECTION
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.receiptNumber}</td>
                  <td>{p.memberName} ({p.memberCode})</td>
                  <td>{p.planName}</td>
                  <td>{p.method}</td>
                  <td>{formatDatePretty(p.date)}</td>
                  <td style={{ fontWeight: 800, color: '#10B981' }}>+ {formatBDT(p.amount)}</td>
                </tr>
              ))}

              {monthExpenses.slice(0, 4).map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className="badge badge-danger" style={{ fontSize: '10px' }}>
                      EXPENSE
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{e.id}</td>
                  <td>{e.vendor}</td>
                  <td>{e.category}</td>
                  <td>{e.method}</td>
                  <td>{formatDatePretty(e.date)}</td>
                  <td style={{ fontWeight: 800, color: 'var(--danger)' }}>- {formatBDT(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Close Month Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={`Finalize & Close Accounting Month: ${selectedMonth}`}
        subtitle="Review consolidated reconciliation totals before finalizing this period"
        icon={Lock}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExecuteClose}
            >
              <CheckCircle2 size={16} />
              Confirm & Lock Month ({selectedMonth})
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Warning banner */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#F59E0B',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Finalization Warning:</strong> Closing will lock transactions for <strong>{selectedMonth}</strong>. Ordinary edit and delete actions will be disabled to preserve statement reconciliation.
            </span>
          </div>

          {/* Snapshot Summary Box */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-base)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Invoiced:</span>
              <strong>{formatBDT(summary.totalInvoiced)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Gross Collections (All Channels):</span>
              <strong style={{ color: '#10B981' }}>{formatBDT(summary.totalCollected)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Operating Expenses:</span>
              <strong style={{ color: 'var(--danger)' }}>- {formatBDT(summary.totalExpenses)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Outstanding Receivables:</span>
              <strong style={{ color: '#F59E0B' }}>{formatBDT(summary.outstandingDues)}</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-base)',
                fontWeight: 800,
              }}
            >
              <span>Net Accrual Operating Profit:</span>
              <span style={{ color: summary.netAccrualProfit >= 0 ? '#10B981' : 'var(--danger)' }}>
                {formatBDT(summary.netAccrualProfit)}
              </span>
            </div>
          </div>

          <div>
            <label className="form-label">Closing Admin Name</label>
            <input
              type="text"
              className="form-control"
              value={closingAdmin}
              onChange={(e) => setClosingAdmin(e.target.value)}
              placeholder="e.g. Imran Admin (Finance Director)"
              required
            />
          </div>

          <div>
            <label className="form-label">Audit & Closing Remarks (Optional)</label>
            <textarea
              className="form-control"
              rows={2}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="e.g. All bank feeds reconciled against City Bank and bKash merchant reports."
            />
          </div>
        </div>
      </Modal>

      {/* Demo Adjustment Modal */}
      <Modal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        title={`Audit Correction Entry: ${selectedMonth}`}
        subtitle="Record authorized journal adjustment on a finalized period"
        icon={PlusCircle}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAdjustmentModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="adjustment-form"
              className="btn btn-primary"
            >
              Post Audit Adjustment
            </button>
          </div>
        }
      >
        <form id="adjustment-form" onSubmit={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="form-label">Adjustment Type</label>
            <select
              className="form-control"
              value={adjType}
              onChange={(e) => setAdjType(e.target.value)}
            >
              <option value="credit">Credit Adjustment (Revenue Addition)</option>
              <option value="debit">Debit Adjustment (Charge Deduction)</option>
              <option value="reclassification">Reclassification Entry</option>
            </select>
          </div>

          <div>
            <label className="form-label">Amount (BDT) *</label>
            <input
              type="number"
              className="form-control"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
          </div>

          <div>
            <label className="form-label">Mandatory Audit Justification *</label>
            <textarea
              className="form-control"
              rows={2}
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="e.g. Late reconciliation voucher approved by external auditor."
              required
            />
          </div>

          <div>
            <label className="form-label">Authorized Auditor / Lead</label>
            <input
              type="text"
              className="form-control"
              value={adjAuditor}
              onChange={(e) => setAdjAuditor(e.target.value)}
              placeholder="e.g. External Audit Lead"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
