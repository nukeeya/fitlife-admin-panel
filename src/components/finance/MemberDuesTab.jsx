import { useState, useMemo } from 'react';
import {
  Search,
  CreditCard,
  CheckCircle2,
  Eye,
  History,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT, formatDatePretty } from '../../utils/financeCalculators';
import RecordPaymentModal from './modals/RecordPaymentModal';
import PaymentHistoryModal from './modals/PaymentHistoryModal';
import InvoiceViewModal from './modals/InvoiceViewModal';

export default function MemberDuesTab() {
  const { memberDues, packages } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue'
  const [packageFilter, setPackageFilter] = useState('ALL');

  // Modals
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState(null);
  const [historyTargetInvoice, setHistoryTargetInvoice] = useState(null);
  const [viewTargetInvoice, setViewTargetInvoice] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Filtered Dues
  const displayedDues = useMemo(() => {
    return memberDues.filter((item) => {
      const matchSearch =
        item.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.memberCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.planName.toLowerCase().includes(searchTerm.toLowerCase());

      let matchStatus = true;
      if (statusFilter === 'Paid') {
        matchStatus = item.status === 'Paid';
      } else if (statusFilter === 'Partially Paid') {
        matchStatus = item.status === 'Partially Paid';
      } else if (statusFilter === 'Unpaid') {
        matchStatus = item.status === 'Unpaid';
      } else if (statusFilter === 'Overdue') {
        matchStatus = item.effectiveStatus === 'Overdue';
      }

      const matchPackage =
        packageFilter === 'ALL' || item.planName.toLowerCase() === packageFilter.toLowerCase();

      return matchSearch && matchStatus && matchPackage;
    });
  }, [memberDues, searchTerm, statusFilter, packageFilter]);

  // Aggregate Metrics for Dues Tab
  const totalBilled = displayedDues.reduce((s, i) => s + (Number(i.netPayable) || 0), 0);
  const totalCollected = displayedDues.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const totalRemainingDue = displayedDues.reduce((s, i) => s + (Number(i.dueAmount) || 0), 0);
  const totalOverdueAmount = displayedDues
    .filter((d) => d.effectiveStatus === 'Overdue')
    .reduce((s, d) => s + (Number(d.dueAmount) || 0), 0);

  const handlePaymentSuccess = (newPayment, updatedInvoice) => {
    setSuccessBanner({
      message: `Demo Payment of ${formatBDT(newPayment.amount)} recorded successfully for ${updatedInvoice.memberName} (${updatedInvoice.memberCode}) via ${newPayment.method}! New Balance: ${formatBDT(updatedInvoice.dueAmount)}`,
      payment: newPayment,
      invoice: updatedInvoice,
    });
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Demo Scenario Callout Box (Specifically highlighting Farhan Ahmed FLM-1008) */}
      <div style={{
        padding: '14px 18px',
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              Interactive Partial-Payment Simulator Active (Frontend Demo)
            </strong>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Test multi-installment payments on any invoice. Try <strong>Farhan Ahmed (FLM-1008)</strong>: Package ৳15,000 with ৳10k & ৳3k paid, now has <strong>৳2,000 due</strong>. Record the final ৳2,000 to see it reach ৳0 in real time!
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            const farhan = memberDues.find((m) => m.memberCode === 'FLM-1008');
            if (farhan) setPaymentTargetInvoice(farhan);
          }}
          style={{ whiteSpace: 'nowrap' }}
        >
          Pay Farhan's Due (৳2,000)
        </button>
      </div>

      {/* Success Notification Banner after simulation */}
      {successBanner && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#10B981',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{successBanner.message}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setViewTargetInvoice(successBanner.invoice)}
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            View Updated Invoice
          </button>
        </div>
      )}

      {/* Summary KPI Widgets */}
      <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <div className="stat-widget">
          <span className="stat-widget-title">Total Invoiced Consideration</span>
          <div className="stat-widget-value primary-highlight">{formatBDT(totalBilled)}</div>
          <div className="stat-widget-sub">{displayedDues.length} packages in view</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Total Collected</span>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>{formatBDT(totalCollected)}</div>
          <div className="stat-widget-sub">Received across all installments</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Remaining Outstanding Due</span>
          <div className="stat-widget-value" style={{ color: totalRemainingDue > 0 ? '#F59E0B' : '#10B981' }}>
            {formatBDT(totalRemainingDue)}
          </div>
          <div className="stat-widget-sub">Total active receivables</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Overdue Receivables</span>
          <div className="stat-widget-value danger-highlight">{formatBDT(totalOverdueAmount)}</div>
          <div className="stat-widget-sub">Past agreed payment deadline</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search member, ID, invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['ALL', 'Overdue', 'Partially Paid', 'Unpaid', 'Paid'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(st)}
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Package filter dropdown */}
          <select
            className="form-control"
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            style={{ width: 'auto', fontSize: '12px', height: '32px', padding: '2px 8px' }}
          >
            <option value="ALL">All Packages</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.name}>
                {pkg.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Interactive Dues Table */}
      <div className="activity-card">
        <div className="activity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800 }}>Member Dues & Installment Accounts</span>
            <span className="badge badge-primary">{displayedDues.length} Members</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing dues based on actual payment history
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Member & ID</th>
                <th>Invoice No</th>
                <th>Package Plan</th>
                <th>Pkg Price</th>
                <th>Discount</th>
                <th>Net Payable</th>
                <th>Amount Paid</th>
                <th>Remaining Due</th>
                <th>Service Period</th>
                <th>Due Date & Aging</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedDues.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No dues records found matching your filters.
                  </td>
                </tr>
              ) : (
                displayedDues.map((item) => (
                  <tr key={item.id} style={{ background: item.memberCode === 'FLM-1008' ? 'rgba(59, 130, 246, 0.04)' : undefined }}>
                    <td>
                      <div className="member-cell-info">
                        <span className="member-cell-name" style={{ fontWeight: 700 }}>
                          {item.memberName}
                          {item.memberCode === 'FLM-1008' && (
                            <span className="badge badge-info" style={{ marginLeft: '6px', fontSize: '9px', padding: '2px 6px' }}>
                              Demo Case
                            </span>
                          )}
                        </span>
                        <span className="member-cell-code" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.memberCode} • {item.memberPhone}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setViewTargetInvoice(item)}
                        title="Click to view invoice"
                      >
                        {item.number}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-primary">{item.planName}</span>
                    </td>
                    <td>{formatBDT(item.baseAmount)}</td>
                    <td>
                      {item.discountAmount > 0 ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                          - {formatBDT(item.discountAmount)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatBDT(item.netPayable)}</td>
                    <td style={{ fontWeight: 800, color: '#10B981' }}>{formatBDT(item.paidAmount)}</td>
                    <td style={{ fontWeight: 800, color: item.dueAmount > 0 ? 'var(--danger)' : '#10B981', fontSize: '14px' }}>
                      {item.dueAmount > 0 ? formatBDT(item.dueAmount) : '৳0 (Paid)'}
                    </td>
                    <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {item.startDate ? `${formatDatePretty(item.startDate)} – ${formatDatePretty(item.endDate)}` : 'Active'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{formatDatePretty(item.dueDate)}</span>
                        {item.daysOverdue > 0 ? (
                          <span style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: 800 }}>
                            ⚠️ {item.daysOverdue} Days Overdue
                          </span>
                        ) : item.dueAmount > 0 ? (
                          <span style={{ fontSize: '10px', color: '#10B981' }}>
                            Current (Within Term)
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Settled
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        item.effectiveStatus === 'Paid'
                          ? 'badge-success'
                          : item.effectiveStatus === 'Overdue'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}>
                        {item.effectiveStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {item.dueAmount > 0 ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setPaymentTargetInvoice(item)}
                            title="Open partial payment simulator"
                            style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}
                          >
                            <CreditCard size={12} /> Pay Due
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>
                            ✓ Settled
                          </span>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setHistoryTargetInvoice(item)}
                          title="View installments history log"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <History size={12} /> History
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setViewTargetInvoice(item)}
                          title="View tax invoice & print preview"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <Eye size={12} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RecordPaymentModal
        isOpen={Boolean(paymentTargetInvoice)}
        onClose={() => setPaymentTargetInvoice(null)}
        invoice={paymentTargetInvoice}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <PaymentHistoryModal
        isOpen={Boolean(historyTargetInvoice)}
        onClose={() => setHistoryTargetInvoice(null)}
        invoice={historyTargetInvoice}
        onOpenRecordPayment={(inv) => setPaymentTargetInvoice(inv)}
      />

      <InvoiceViewModal
        isOpen={Boolean(viewTargetInvoice)}
        onClose={() => setViewTargetInvoice(null)}
        invoice={viewTargetInvoice}
      />
    </div>
  );
}
