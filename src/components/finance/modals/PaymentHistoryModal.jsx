import { Receipt } from 'lucide-react';
import Modal from '../../common/Modal';
import { formatBDT, formatDatePretty } from '../../../utils/financeCalculators';

export default function PaymentHistoryModal({
  isOpen,
  onClose,
  invoice,
  onOpenRecordPayment,
}) {
  if (!invoice) return null;

  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingDue = Math.max(0, invoice.netPayable - totalPaid);

  // Progressive installment breakdown calculation
  let runningPaid = 0;
  const progressiveInstallments = payments.map((p, index) => {
    runningPaid += Number(p.amount) || 0;
    const remainingAfterThis = Math.max(0, invoice.netPayable - runningPaid);
    return {
      ...p,
      installmentNumber: index + 1,
      runningPaid,
      remainingAfterThis,
    };
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Installment Payment Ledger & Audit"
      subtitle={`Invoice #${invoice.number} — ${invoice.memberName} (${invoice.memberCode})`}
      icon={Receipt}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {payments.length} installment{payments.length !== 1 ? 's' : ''} recorded on file
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {remainingDue > 0 && onOpenRecordPayment && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(invoice);
                }}
              >
                + Record Next Payment ({formatBDT(remainingDue)})
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header stats bar */}
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
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Package</span>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>{invoice.planName}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Total Consideration</span>
            <span style={{ fontSize: '14px', fontWeight: 800 }}>{formatBDT(invoice.netPayable)}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Cumulative Paid</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>{formatBDT(totalPaid)}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Current Balance Due</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: remainingDue > 0 ? 'var(--danger)' : '#10B981' }}>
              {remainingDue > 0 ? formatBDT(remainingDue) : '✓ Settled (৳0)'}
            </span>
          </div>
        </div>

        {/* Timeline of Installments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Sequential Installment Breakdown
          </span>

          {progressiveInstallments.length === 0 ? (
            <div style={{
              padding: '30px',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}>
              No installment payments recorded yet for this invoice.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th># Installment</th>
                    <th>Receipt No</th>
                    <th>Payment Date</th>
                    <th>Method & Channel</th>
                    <th>Trx Reference</th>
                    <th>Amount Paid</th>
                    <th>Remaining Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {progressiveInstallments.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        Installment {item.installmentNumber}
                      </td>
                      <td style={{ fontWeight: 700 }}>{item.receiptNumber || 'REC-AUTO'}</td>
                      <td>{formatDatePretty(item.date)}</td>
                      <td>
                        <span className="badge badge-primary">{item.method}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {item.reference || '—'}
                      </td>
                      <td style={{ fontWeight: 800, color: '#10B981' }}>
                        {formatBDT(item.amount)}
                      </td>
                      <td style={{ fontWeight: 700, color: item.remainingAfterThis > 0 ? 'var(--danger)' : '#10B981' }}>
                        {item.remainingAfterThis > 0 ? formatBDT(item.remainingAfterThis) : '৳0 (Fully Paid)'}
                      </td>
                      <td>
                        <span className="badge badge-success">Confirmed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit explanation */}
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-base)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
        }}>
          <strong>Installment Policy Audit:</strong> FitLife enables flexible multi-installment payments for 3, 6, and 12-month transformation memberships. Every partial payment generates a unique financial receipt and reduces outstanding debt in real-time.
        </div>
      </div>
    </Modal>
  );
}
