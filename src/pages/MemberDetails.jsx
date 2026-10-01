import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Key,
  Dumbbell,
  CheckCircle2,
  Clock,
  Tag,
  Printer,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const formatMoney = (amount) => `৳${Number(amount || 0).toLocaleString()}`;

function printMemberInvoice(invoice, member, branding) {
  const rows = [
    ['Membership package', invoice.planName],
    ['Base price', formatMoney(invoice.baseAmount)],
    ...(invoice.discountAmount > 0
      ? [['Discount', `- ${formatMoney(invoice.discountAmount)}${invoice.discountReason ? ` (${invoice.discountReason})` : ''}`]]
      : []),
    ...(invoice.taxAmount > 0 ? [['Tax / VAT', formatMoney(invoice.taxAmount)]] : []),
  ];

  const invoiceHtml = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Invoice ${escapeHtml(invoice.number)}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 40px; color: #17202a; font: 14px Arial, sans-serif; }
          main { max-width: 720px; margin: 0 auto; }
          header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 2px solid #17202a; }
          h1 { margin: 0 0 8px; font-size: 26px; }
          h2 { margin: 28px 0 12px; font-size: 16px; }
          p { margin: 4px 0; color: #4b5563; }
          .invoice-title { text-align: right; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px 8px; border-bottom: 1px solid #d1d5db; text-align: left; }
          th:last-child, td:last-child { text-align: right; }
          .total td { border-top: 2px solid #17202a; border-bottom: 0; font-size: 17px; font-weight: 700; }
          .payment { margin-top: 16px; padding: 14px; background: #f3f4f6; }
          footer { margin-top: 48px; color: #6b7280; font-size: 12px; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <main>
          <header>
            <div>
              <h1>${escapeHtml(branding?.gymName || 'FitLife')}</h1>
              <p>${escapeHtml(branding?.address || '')}</p>
              <p>${escapeHtml(branding?.phone || '')}</p>
            </div>
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <p><strong>${escapeHtml(invoice.number)}</strong></p>
              <p>Date: ${escapeHtml(invoice.date)}</p>
            </div>
          </header>
          <section class="meta">
            <div>
              <h2>Bill to</h2>
              <p><strong>${escapeHtml(member.name)}</strong></p>
              <p>Member ID: ${escapeHtml(member.code)}</p>
              <p>${escapeHtml(member.phone)}</p>
              <p>${escapeHtml(member.email)}</p>
            </div>
            <div>
              <h2>Payment</h2>
              <p>Status: <strong>${escapeHtml(invoice.status)}</strong></p>
              <p>Method: ${escapeHtml(invoice.method || '—')}</p>
            </div>
          </section>
          <table>
            <thead><tr><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              ${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join('')}
              <tr class="total"><td>Net payable</td><td>${escapeHtml(formatMoney(invoice.netPayable))}</td></tr>
            </tbody>
          </table>
          <section class="payment">
            <p>Paid: <strong>${escapeHtml(formatMoney(invoice.paidAmount))}</strong></p>
            <p>Due: <strong>${escapeHtml(formatMoney(invoice.dueAmount))}</strong></p>
          </section>
          <footer>Thank you for choosing ${escapeHtml(branding?.gymName || 'FitLife')}.</footer>
        </main>
      </body>
    </html>`;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.alert('Please allow pop-ups to print this invoice.');
    return;
  }

  const invoiceUrl = URL.createObjectURL(new Blob([invoiceHtml], { type: 'text/html' }));
  let cleanupTimer;
  const cleanup = () => {
    window.clearTimeout(cleanupTimer);
    URL.revokeObjectURL(invoiceUrl);
  };
  cleanupTimer = window.setTimeout(cleanup, 60000);

  printWindow.addEventListener('load', () => {
    if (printWindow.location.href !== invoiceUrl) return;
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 300);
    cleanupTimer = window.setTimeout(cleanup, 60000);
  }, { once: true });
  printWindow.location.replace(invoiceUrl);
}

export default function MemberDetails() {
  const { id } = useParams();
  const { members, invoices, attendance, checkInMember, branding } = useGymData();

  const member = members.find((m) => m.id === Number(id)) || members[0];
  const memberInvoices = invoices.filter((i) => i.memberId === member?.id);
  const memberAttendance = attendance.filter((a) => a.memberId === member?.id);

  if (!member) {
    return (
      <div className="page">
        <Link to="/members" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Members
        </Link>
        <p>Member not found.</p>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/members" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="page-title-group">
            <h1 className="page-title">{member.name}</h1>
            <p className="page-subtitle">
              {member.code} • {member.gender} • Registered on {member.joined}
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => checkInMember(member.id)}>
          <CheckCircle2 size={16} /> Check In Today
        </button>
      </div>

      {/* Member Profile Summary Cards */}
      <div className="dashboard-metrics-grid">
        <div className="stat-widget">
          <span className="stat-widget-title">Membership Plan</span>
          <div className="stat-widget-value primary-highlight">{member.plan}</div>
          <div className="stat-widget-sub">Exp: {member.expiry}</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Assigned Locker</span>
          <div className="stat-widget-value">{member.lockerNumber || 'None'}</div>
          <div className="stat-widget-sub">Dedicated storage</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Personal Trainer</span>
          <div className="stat-widget-value">{member.trainer || 'None'}</div>
          <div className="stat-widget-sub">Assigned coach</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Total Gym Visits</span>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>{member.visits} Sessions</div>
          <div className="stat-widget-sub">Check-in telemetry</div>
        </div>
      </div>

      {/* Member Invoices & Discount History */}
      <div className="activity-card">
        <div className="activity-header">
          <span style={{ fontWeight: 800 }}>Billing Invoices & Discount History</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Plan Name</th>
                <th>Base Price</th>
                <th>Discount Applied</th>
                <th>Tax</th>
                <th>Net Payable</th>
                <th>Paid Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {memberInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No invoice records found for this member.
                  </td>
                </tr>
              ) : (
                memberInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.number}</td>
                    <td>{inv.planName}</td>
                    <td>৳{inv.baseAmount.toLocaleString()}</td>
                    <td>
                      {inv.discountAmount > 0 ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                          - ৳{inv.discountAmount} ({inv.discountReason})
                        </span>
                      ) : (
                        'None'
                      )}
                    </td>
                    <td>৳{inv.taxAmount}</td>
                    <td style={{ fontWeight: 800 }}>৳{inv.netPayable.toLocaleString()}</td>
                    <td style={{ color: '#10B981', fontWeight: 700 }}>৳{inv.paidAmount.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => printMemberInvoice(inv, member, branding)}
                        aria-label={`Print invoice ${inv.number}`}
                      >
                        <Printer size={14} /> Print
                      </button>
                    </td>
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
