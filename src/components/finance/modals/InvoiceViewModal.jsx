import { Printer, Download, Receipt } from 'lucide-react';
import Modal from '../../common/Modal';
import { formatBDT, formatDatePretty } from '../../../utils/financeCalculators';
import { printInvoice } from '../../../utils/invoicePrinter';
import { useGymData } from '../../../context/GymDataContext';

export default function InvoiceViewModal({
  isOpen,
  onClose,
  invoice,
}) {
  const { branding } = useGymData();

  if (!invoice) return null;

  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax Invoice & Official Receipt #${invoice.number}`}
      subtitle={`Member: ${invoice.memberName} (${invoice.memberCode}) | Phone: ${invoice.memberPhone || '—'}`}
      icon={Receipt}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Status: <strong style={{ color: invoice.dueAmount > 0 ? 'var(--danger)' : '#10B981' }}>{invoice.status}</strong>
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => printInvoice(invoice, branding, 'print')}
            >
              <Printer size={15} />
              Print Invoice
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => printInvoice(invoice, branding, 'pdf')}
            >
              <Download size={15} />
              Save PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Invoice Meta Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '14px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-base)',
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Invoice Date</span>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>{formatDatePretty(invoice.date)}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Due Date</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: invoice.dueAmount > 0 ? 'var(--danger)' : 'inherit' }}>
              {formatDatePretty(invoice.dueDate)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Membership Period</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>
              {invoice.startDate ? `${formatDatePretty(invoice.startDate)} – ${formatDatePretty(invoice.endDate)}` : 'Active'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Payment State</span>
            <span className={`badge ${invoice.status === 'Paid' ? 'badge-success' : invoice.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Financial Line Item Table */}
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
            Billable Items & Consideration
          </span>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Duration</th>
                  <th>Standard Price</th>
                  <th>Applied Discount</th>
                  <th>Net Payable</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{invoice.planName}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Full facility gym access, biometric assessment
                    </div>
                  </td>
                  <td>{invoice.durationMonths ? `${invoice.durationMonths} Month(s)` : 'General'}</td>
                  <td>{formatBDT(invoice.baseAmount)}</td>
                  <td>
                    {invoice.discountAmount > 0 ? (
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                        - {formatBDT(invoice.discountAmount)}
                        {invoice.discountReason && (
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>
                            ({invoice.discountReason})
                          </span>
                        )}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)' }}>
                    {formatBDT(invoice.netPayable)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Settlement Summary Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <div style={{
            width: '280px',
            padding: '12px 16px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-base)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Base Subtotal:</span>
              <span>{formatBDT(invoice.baseAmount)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--danger)' }}>
                <span>Discounts Given:</span>
                <span>- {formatBDT(invoice.discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, borderTop: '1px solid var(--border-base)', paddingTop: '6px' }}>
              <span>Total Payable:</span>
              <span>{formatBDT(invoice.netPayable)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
              <span>Amount Paid:</span>
              <span>{formatBDT(invoice.paidAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: invoice.dueAmount > 0 ? 'var(--danger)' : '#10B981' }}>
              <span>Outstanding Due:</span>
              <span>{formatBDT(invoice.dueAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Installments Attached */}
        {payments.length > 0 && (
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
              Payment Receipts On This Invoice
            </span>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Transaction ID</th>
                    <th>Amount Paid</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.receiptNumber}</td>
                      <td>{formatDatePretty(p.date)}</td>
                      <td><span className="badge badge-primary">{p.method}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.reference || '—'}</td>
                      <td style={{ fontWeight: 800, color: '#10B981' }}>{formatBDT(p.amount)}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
