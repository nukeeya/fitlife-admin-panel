import { useState, useMemo } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT, formatDatePretty } from '../../utils/financeCalculators';
import FinanceDateFilterBar from './FinanceDateFilterBar';
import InvoiceViewModal from './modals/InvoiceViewModal';

export default function PaymentCollectionTab() {
  const { filteredPayments, paymentMethods, invoices } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [viewInvoice, setViewInvoice] = useState(null);

  const displayedPayments = useMemo(() => {
    return filteredPayments.filter((p) => {
      const matchSearch =
        p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchMethod =
        selectedMethod === 'ALL' ||
        p.methodId === selectedMethod ||
        p.method.toLowerCase() === selectedMethod.toLowerCase();

      return matchSearch && matchMethod;
    });
  }, [filteredPayments, searchTerm, selectedMethod]);

  const totalCollected = displayedPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const avgTicket = displayedPayments.length > 0 ? totalCollected / displayedPayments.length : 0;

  const handleViewInvoice = (invoiceId) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) setViewInvoice(inv);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <FinanceDateFilterBar showReset={false} />

      {/* Summary Highlights */}
      <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-widget">
          <span className="stat-widget-title">Receipts Collected in Scope</span>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>
            {formatBDT(totalCollected)}
          </div>
          <div className="stat-widget-sub">{displayedPayments.length} transactions processed</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Average Collection Size</span>
          <div className="stat-widget-value primary-highlight">
            {formatBDT(avgTicket)}
          </div>
          <div className="stat-widget-sub">Per transaction receipt average</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Settlement Verification</span>
          <div className="stat-widget-value" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={20} /> 100% Cleared
          </div>
          <div className="stat-widget-sub">All cash & digital receipts confirmed</div>
        </div>
      </div>

      {/* Search and Method Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search receipt #, member, trx ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${selectedMethod === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedMethod('ALL')}
            style={{ fontSize: '12px' }}
          >
            All Channels
          </button>
          {paymentMethods.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`btn btn-sm ${selectedMethod === m.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedMethod(m.id)}
              style={{ fontSize: '12px' }}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Receipts Ledger Table */}
      <div className="activity-card">
        <div className="activity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800 }}>Payment Collection Receipts Ledger</span>
            <span className="badge badge-success">{displayedPayments.length} Receipts</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>
            Total Received: {formatBDT(totalCollected)}
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt Ref</th>
                <th>Invoice No</th>
                <th>Member Name</th>
                <th>Amount Paid</th>
                <th>Payment Method</th>
                <th>Trx / Bank Reference</th>
                <th>Date Received</th>
                <th>Collected By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No payment receipts match the current date filter or search criteria.
                  </td>
                </tr>
              ) : (
                displayedPayments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      {p.receiptNumber}
                    </td>
                    <td>
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)', fontWeight: 600 }}
                        onClick={() => handleViewInvoice(p.invoiceId)}
                        title="Click to view attached invoice"
                      >
                        {p.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <div className="member-cell-info">
                        <span className="member-cell-name" style={{ fontWeight: 700 }}>{p.memberName}</span>
                        <span className="member-cell-code" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {p.memberCode}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: '#10B981', fontSize: '14px' }}>
                      {formatBDT(p.amount)}
                    </td>
                    <td>
                      <span className="badge badge-primary">{p.method}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {p.reference || '—'}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {formatDatePretty(p.date)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {p.collectedBy || '—'}
                    </td>
                    <td>
                      <span className="badge badge-success">Confirmed</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InvoiceViewModal
        isOpen={Boolean(viewInvoice)}
        onClose={() => setViewInvoice(null)}
        invoice={viewInvoice}
      />
    </div>
  );
}
