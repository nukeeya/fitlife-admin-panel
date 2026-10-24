import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  CreditCard,
  CheckCircle2,
  Eye,
  History,
  Clock,
  AlertTriangle,
  Lock,
  User,
  Calendar,
  Filter,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT, formatDatePretty } from '../../utils/financeCalculators';
import RecordPaymentModal from './modals/RecordPaymentModal';
import PaymentHistoryModal from './modals/PaymentHistoryModal';
import InvoiceViewModal from './modals/InvoiceViewModal';
import ExtendDueDateModal from './modals/ExtendDueDateModal';
import Avatar from '../common/Avatar';

export default function MemberDuesTab() {
  const navigate = useNavigate();
  const {
    memberDues,
    upcomingDues,
    todayDues,
    overdueDues,
    extendedDues,
    clearedDues,
    packages,
    demoDate,
    setDemoDate,
  } = useFinance();

  // Due Category Tabs: 'all' | 'upcoming' | 'today' | 'overdue' | 'extended' | 'cleared'
  const [activeDueTab, setActiveDueTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [packageFilter, setPackageFilter] = useState('ALL');

  // Modals
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState(null);
  const [historyTargetInvoice, setHistoryTargetInvoice] = useState(null);
  const [viewTargetInvoice, setViewTargetInvoice] = useState(null);
  const [extensionTargetInvoice, setExtensionTargetInvoice] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Pick slice based on active due subtab
  const baseDues = useMemo(() => {
    switch (activeDueTab) {
      case 'upcoming':
        return upcomingDues;
      case 'today':
        return todayDues;
      case 'overdue':
        return overdueDues;
      case 'extended':
        return extendedDues;
      case 'cleared':
        return clearedDues;
      default:
        return memberDues;
    }
  }, [activeDueTab, memberDues, upcomingDues, todayDues, overdueDues, extendedDues, clearedDues]);

  // Filtered Dues
  const displayedDues = useMemo(() => {
    return baseDues.filter((item) => {
      const matchSearch =
        item.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.memberCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.memberPhone && item.memberPhone.includes(searchTerm));

      const matchPackage =
        packageFilter === 'ALL' || item.planName.toLowerCase() === packageFilter.toLowerCase();

      return matchSearch && matchPackage;
    });
  }, [baseDues, searchTerm, packageFilter]);

  // Aggregate Metrics for Dues Tab
  const totalBilled = displayedDues.reduce((s, i) => s + (Number(i.netPayable) || 0), 0);
  const totalCollected = displayedDues.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const totalRemainingDue = displayedDues.reduce((s, i) => s + (Number(i.dueAmount) || 0), 0);
  const totalOverdueAmount = displayedDues
    .filter((d) => d.effectiveStatus === 'Overdue')
    .reduce((s, d) => s + (Number(d.dueAmount) || 0), 0);

  const handlePaymentSuccess = (newPayment, updatedInvoice) => {
    setSuccessBanner({
      message: `Demo Payment of ${formatBDT(newPayment.amount)} recorded for ${updatedInvoice.memberName} (${updatedInvoice.memberCode}) via ${newPayment.method}! New Balance: ${formatBDT(updatedInvoice.dueAmount)}`,
      payment: newPayment,
      invoice: updatedInvoice,
    });
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controllable Demo Simulation Date Bar */}
      <div
        style={{
          padding: '14px 18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-base)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              Due Reminder Dashboard & Aging Controller
            </strong>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Current evaluation date: <strong>{formatDatePretty(demoDate)}</strong> ({demoDate}). Toggle dates to test overdue alerts.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Simulate Date:</span>
          <button
            type="button"
            className={`btn btn-sm ${demoDate === '2026-10-22' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '4px 10px' }}
            onClick={() => setDemoDate('2026-10-22')}
          >
            Today (22 Oct)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${demoDate === '2026-10-26' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '4px 10px' }}
            onClick={() => setDemoDate('2026-10-26')}
            title="Sets date past 25 Oct deadline to test Farhan Ahmed becoming overdue"
          >
            Advance to 26 Oct (Triggers Overdue)
          </button>
          <input
            type="date"
            className="form-control"
            value={demoDate}
            onChange={(e) => setDemoDate(e.target.value)}
            style={{ width: '135px', height: '32px', fontSize: '12px', padding: '2px 8px' }}
            title="Custom simulation date"
          />
        </div>
      </div>

      {/* Demo Scenario Callout Box (Farhan Ahmed scenario) */}
      <div
        style={{
          padding: '12px 18px',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              Featured Case: Farhan Ahmed (FLM-1008)
            </strong>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              3-Month Package ৳15,000 · Paid ৳10,000 + ৳3,000 · Remaining Due: <strong>৳2,000</strong> by <strong>25 Oct 2026</strong>.
              Record payment or grant the one-time extension.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/members/8')}
            style={{ whiteSpace: 'nowrap' }}
          >
            View Farhan's Profile
          </button>
        </div>
      </div>

      {/* Success Notification Banner after simulation */}
      {successBanner && (
        <div
          style={{
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
          }}
        >
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
            View Invoice
          </button>
        </div>
      )}

      {/* 4 Summary KPI Widgets */}
      <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <div className="stat-widget">
          <span className="stat-widget-title">Total Billed Consideration</span>
          <div className="stat-widget-value primary-highlight">{formatBDT(totalBilled)}</div>
          <div className="stat-widget-sub">{displayedDues.length} packages in view</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Total Installments Collected</span>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>{formatBDT(totalCollected)}</div>
          <div className="stat-widget-sub">Received across all channels</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Remaining Outstanding Dues</span>
          <div className="stat-widget-value" style={{ color: totalRemainingDue > 0 ? '#F59E0B' : '#10B981' }}>
            {formatBDT(totalRemainingDue)}
          </div>
          <div className="stat-widget-sub">Active gym receivables</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Overdue Receivables</span>
          <div className="stat-widget-value danger-highlight">{formatBDT(totalOverdueAmount)}</div>
          <div className="stat-widget-sub">Exceeded agreed due date</div>
        </div>
      </div>

      {/* 5-Tab Categorized Due Management Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border-base)',
          paddingBottom: '8px',
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${activeDueTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveDueTab('all')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>All Accounts</span>
          <span className="badge" style={{ background: 'rgba(0,0,0,0.2)', fontSize: '10px' }}>
            {memberDues.length}
          </span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeDueTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveDueTab('upcoming')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>Upcoming Dues</span>
          <span className="badge badge-info" style={{ fontSize: '10px' }}>
            {upcomingDues.length}
          </span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeDueTab === 'today' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveDueTab('today')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>Due Today</span>
          <span className="badge badge-warning" style={{ fontSize: '10px' }}>
            {todayDues.length}
          </span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeDueTab === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveDueTab('overdue')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ color: overdueDues.length > 0 ? 'var(--danger)' : undefined, fontWeight: 700 }}>
            Overdue Dues
          </span>
          <span className="badge badge-danger" style={{ fontSize: '10px' }}>
            {overdueDues.length}
          </span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeDueTab === 'extended' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveDueTab('extended')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>Extended Dues</span>
          <span className="badge badge-warning" style={{ fontSize: '10px' }}>
            {extendedDues.length}
          </span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeDueTab === 'cleared' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveDueTab('cleared')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>Cleared Dues (৳0)</span>
          <span className="badge badge-success" style={{ fontSize: '10px' }}>
            {clearedDues.length}
          </span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search member name, ID, phone, invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="form-control"
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            style={{ width: 'auto', fontSize: '12px', height: '36px', padding: '4px 8px' }}
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
            <span style={{ fontWeight: 800 }}>Member Due Accounts Ledger</span>
            <span className="badge badge-primary">{displayedDues.length} Records</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Evaluated against simulation date {demoDate}
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Member & Photo</th>
                <th>Member ID</th>
                <th>Contact</th>
                <th>Package</th>
                <th>Total Billed</th>
                <th>Paid</th>
                <th>Remaining Due</th>
                <th>Due Date</th>
                <th>Aging / Overdue Days</th>
                <th>Extension Status</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedDues.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No dues records found in this category.
                  </td>
                </tr>
              ) : (
                displayedDues.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      background: item.memberCode === 'FLM-1008' ? 'rgba(59, 130, 246, 0.04)' : undefined,
                    }}
                  >
                    {/* Member & Photo */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar
                          src={item.memberAvatar}
                          name={item.memberName}
                          size={38}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span
                            style={{ fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                            onClick={() => navigate(`/members/${item.memberId || item.memberCode}`)}
                            title="Open detailed member profile"
                          >
                            {item.memberName}
                            {item.memberCode === 'FLM-1008' && (
                              <span className="badge badge-info" style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 5px' }}>
                                Priority Due
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Inv: {item.number}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Member ID */}
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '12px' }}>
                      {item.memberCode}
                    </td>

                    {/* Contact */}
                    <td style={{ fontSize: '12px' }}>
                      {item.memberPhone}
                    </td>

                    {/* Package */}
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                        {item.planName}
                      </span>
                    </td>

                    {/* Total Billed */}
                    <td style={{ fontWeight: 700 }}>{formatBDT(item.netPayable)}</td>

                    {/* Amount Paid */}
                    <td style={{ fontWeight: 800, color: '#10B981' }}>{formatBDT(item.paidAmount)}</td>

                    {/* Remaining Due */}
                    <td style={{ fontWeight: 800, color: item.dueAmount > 0 ? 'var(--danger)' : '#10B981', fontSize: '14px' }}>
                      {item.dueAmount > 0 ? formatBDT(item.dueAmount) : '৳0 (Paid)'}
                    </td>

                    {/* Due Date */}
                    <td style={{ fontSize: '12px', fontWeight: 600 }}>
                      {item.dueDate ? formatDatePretty(item.dueDate) : '—'}
                    </td>

                    {/* Overdue Days */}
                    <td>
                      {item.daysOverdue > 0 ? (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                          <AlertTriangle size={11} /> {item.daysOverdue} Days Overdue
                        </span>
                      ) : item.dueAmount > 0 ? (
                        <span className="badge badge-info" style={{ fontSize: '11px' }}>
                          Within Term
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: '11px' }}>
                          Settled
                        </span>
                      )}
                    </td>

                    {/* Extension Status */}
                    <td>
                      {item.isExtended ? (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px' }} title="One-time extension consumed">
                          <Lock size={10} /> Extension Used
                        </span>
                      ) : item.dueAmount > 0 ? (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', fontSize: '10px' }}>
                          Eligible
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {/* Record Payment Action */}
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setPaymentTargetInvoice(item)}
                          title="Record partial or full installment payment"
                          style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CreditCard size={12} />
                          Pay
                        </button>

                        {/* Extend Due Date Action */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setExtensionTargetInvoice(item)}
                          disabled={item.isExtended || item.dueAmount <= 0}
                          title={
                            item.isExtended
                              ? 'Extension already used: One-time extension is locked permanently'
                              : item.dueAmount <= 0
                              ? 'No outstanding due'
                              : 'Extend payment deadline by up to 30 days (One-time only)'
                          }
                          style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {item.isExtended ? <Lock size={12} /> : <Clock size={12} />}
                          Extend
                        </button>

                        {/* Member Profile Action */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/members/${item.memberId || item.memberCode}`)}
                          title="View complete member profile"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                        >
                          <User size={12} />
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

      {/* Record Payment Modal */}
      {paymentTargetInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(paymentTargetInvoice)}
          onClose={() => setPaymentTargetInvoice(null)}
          invoice={paymentTargetInvoice}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Payment History Modal */}
      {historyTargetInvoice && (
        <PaymentHistoryModal
          isOpen={Boolean(historyTargetInvoice)}
          onClose={() => setHistoryTargetInvoice(null)}
          invoice={historyTargetInvoice}
        />
      )}

      {/* Invoice View Modal */}
      {viewTargetInvoice && (
        <InvoiceViewModal
          isOpen={Boolean(viewTargetInvoice)}
          onClose={() => setViewTargetInvoice(null)}
          invoice={viewTargetInvoice}
        />
      )}

      {/* Extend Due Date Modal */}
      {extensionTargetInvoice && (
        <ExtendDueDateModal
          isOpen={Boolean(extensionTargetInvoice)}
          onClose={() => setExtensionTargetInvoice(null)}
          dueRecord={extensionTargetInvoice}
        />
      )}
    </div>
  );
}
