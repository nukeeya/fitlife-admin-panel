import { useState, useMemo } from 'react';
import { Search, Printer, Eye } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT } from '../../utils/financeCalculators';
import { printInvoice } from '../../utils/invoicePrinter';
import { useGymData } from '../../context/GymDataContext';
import RecordPaymentModal from './modals/RecordPaymentModal';
import InvoiceViewModal from './modals/InvoiceViewModal';
import PaymentHistoryModal from './modals/PaymentHistoryModal';

export default function InvoiceListTab() {
  const { filteredInvoices } = useFinance();
  const { branding } = useGymData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState(null);
  const [selectedInvoiceForHistory, setSelectedInvoiceForHistory] = useState(null);

  // Filtered invoices
  const displayedInvoices = useMemo(() => {
    return filteredInvoices.filter((inv) => {
      const matchSearch =
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.memberCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.planName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' || inv.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [filteredInvoices, searchTerm, statusFilter]);

  const totalBilled = displayedInvoices.reduce((s, i) => s + (Number(i.netPayable) || 0), 0);
  const totalPaid = displayedInvoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const totalDue = displayedInvoices.reduce((s, i) => s + (Number(i.dueAmount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Filter & Search Controls */}
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
            placeholder="Search invoice #, member, plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
          />
        </div>

        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'Paid', 'Partially Paid', 'Unpaid', 'Overdue'].map((st) => (
            <button
              key={st}
              type="button"
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(st)}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="activity-card">
        <div className="activity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800 }}>Invoices & Dynamic Discount Audit</span>
            <span className="badge badge-primary">{displayedInvoices.length} Invoices</span>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Billed: <strong>{formatBDT(totalBilled)}</strong></span>
            <span style={{ color: '#10B981' }}>Paid: <strong>{formatBDT(totalPaid)}</strong></span>
            <span style={{ color: 'var(--danger)' }}>Due: <strong>{formatBDT(totalDue)}</strong></span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Member</th>
                <th>Membership Plan</th>
                <th>Base Price</th>
                <th>Applied Discount</th>
                <th>Net Payable</th>
                <th>Paid / Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No invoices matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                displayedInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setSelectedInvoiceForView(inv)}
                        title="Click to view invoice details"
                      >
                        {inv.number}
                      </span>
                    </td>
                    <td>
                      <div className="member-cell-info">
                        <span className="member-cell-name" style={{ fontWeight: 700 }}>{inv.memberName}</span>
                        <span className="member-cell-code" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {inv.memberCode} • {inv.memberPhone || 'No Phone'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{inv.planName}</span>
                    </td>
                    <td>{formatBDT(inv.baseAmount)}</td>
                    <td>
                      {inv.discountAmount > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                            - {formatBDT(inv.discountAmount)}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {inv.discountReason}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px' }}>
                      {formatBDT(inv.netPayable)}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <span style={{ color: '#10B981', fontWeight: 600 }}>Paid: {formatBDT(inv.paidAmount)}</span>
                        {inv.dueAmount > 0 && (
                          <span style={{ color: 'var(--danger)', display: 'block', fontWeight: 700 }}>
                            Due: {formatBDT(inv.dueAmount)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedInvoiceForView(inv)}
                          title="View complete invoice statement"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <Eye size={13} /> View
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => printInvoice(inv, branding, 'print')}
                          title="Print invoice"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <Printer size={13} /> Print
                        </button>

                        {inv.dueAmount > 0 ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedInvoiceForPayment(inv)}
                            title="Collect due partial or full payment"
                            style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}
                          >
                            Collect Due
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>
                            ✓ Settled
                          </span>
                        )}
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
        isOpen={Boolean(selectedInvoiceForPayment)}
        onClose={() => setSelectedInvoiceForPayment(null)}
        invoice={selectedInvoiceForPayment}
      />

      <InvoiceViewModal
        isOpen={Boolean(selectedInvoiceForView)}
        onClose={() => setSelectedInvoiceForView(null)}
        invoice={selectedInvoiceForView}
      />

      <PaymentHistoryModal
        isOpen={Boolean(selectedInvoiceForHistory)}
        onClose={() => setSelectedInvoiceForHistory(null)}
        invoice={selectedInvoiceForHistory}
        onOpenRecordPayment={(inv) => setSelectedInvoiceForPayment(inv)}
      />
    </div>
  );
}
