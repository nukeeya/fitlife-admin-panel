import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import Modal from '../../common/Modal';
import { useFinance } from '../../../context/FinanceContext';
import { formatBDT } from '../../../utils/financeCalculators';

export default function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) {
  const { paymentMethods, recordDemoPayment } = useFinance();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bKash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoice) {
      const initialPay = invoice.dueAmount > 0 ? invoice.dueAmount : invoice.netPayable;
      setAmount(String(initialPay));
      setMethod('bKash');
      setReference(`TRX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      setNotes('Installment payment');
      setError('');
    }
  }, [invoice]);

  if (!invoice) return null;

  const currentDue = Number(invoice.dueAmount || 0);
  const payNum = Number(amount) || 0;
  const simulatedRemaining = Math.max(0, currentDue - payNum);
  const isSettlingFull = payNum >= currentDue;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (payNum <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }
    if (payNum > currentDue && currentDue > 0) {
      setError(`Payment cannot exceed outstanding due of ${formatBDT(currentDue)}.`);
      return;
    }

    const result = recordDemoPayment({
      invoiceId: invoice.id,
      amount: payNum,
      method,
      reference,
      notes,
    });

    if (result.success) {
      onPaymentSuccess?.(result.newPayment, result.updatedInvoice);
      onClose();
    } else {
      setError(result.error || 'Failed to record payment');
    }
  };

  const handleQuickAmount = (val) => {
    setAmount(String(Math.min(val, currentDue > 0 ? currentDue : invoice.netPayable)));
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      subtitle={`Invoice #${invoice.number} — ${invoice.memberName} (${invoice.memberCode})`}
      icon={CreditCard}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="record-payment-form" className="btn btn-primary">
            <CheckCircle2 size={16} />
            Confirm Payment ({formatBDT(payNum)})
          </button>
        </div>
      }
    >
      <form id="record-payment-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Payment Notice Banner */}
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <strong>Transaction Notice:</strong> This transaction will update the payment ledger, dues balance, and monthly accounts immediately.
          </span>
        </div>

        {/* Invoice Summary Box */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          padding: '12px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-base)',
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Net Payable</span>
            <span style={{ fontSize: '14px', fontWeight: 800 }}>{formatBDT(invoice.netPayable)}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Already Paid</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>{formatBDT(invoice.paidAmount)}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Current Due</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--danger)' }}>{formatBDT(invoice.dueAmount)}</span>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Amount Input & Quick Fill Buttons */}
        <div>
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment Amount (BDT) *</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max: {formatBDT(currentDue)}</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>
              ৳
            </span>
            <input
              type="number"
              className="form-control"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              min="1"
              max={currentDue > 0 ? currentDue : invoice.netPayable}
              step="any"
              style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '15px' }}
              required
            />
          </div>

          {/* Quick buttons */}
          {currentDue > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickAmount(currentDue)}
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                Pay Full Due ({formatBDT(currentDue)})
              </button>
              {currentDue > 2000 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickAmount(Math.round(currentDue / 2))}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  Pay 50% ({formatBDT(Math.round(currentDue / 2))})
                </button>
              )}
              {currentDue >= 2000 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickAmount(2000)}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  Pay ৳2,000
                </button>
              )}
              {currentDue >= 1000 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickAmount(1000)}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  Pay ৳1,000
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Balance Preview Card */}
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: isSettlingFull ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
          border: `1px solid ${isSettlingFull ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>
              Live Outstanding Balance Preview
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              {formatBDT(currentDue)} - {formatBDT(payNum)} = <strong>{formatBDT(simulatedRemaining)}</strong>
            </span>
          </div>
          <div>
            <span className={`badge ${isSettlingFull ? 'badge-success' : 'badge-warning'}`}>
              {isSettlingFull ? '✓ Settle in Full (Paid)' : 'Partially Paid'}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="form-label">Payment Channel / Method *</label>
          <select
            className="form-control"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            required
          >
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} — {m.accountNumber} ({m.feePercent}% Fee)
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Reference & Notes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Transaction Ref / Trx ID</label>
            <input
              type="text"
              className="form-control"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. BK-9X82K1"
            />
          </div>
          <div>
            <label className="form-label">Installment Notes</label>
            <input
              type="text"
              className="form-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 2nd partial installment"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
