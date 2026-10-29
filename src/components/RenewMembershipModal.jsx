import { useState, useMemo, useEffect } from 'react';
import { RefreshCw, ShieldAlert, AlertCircle } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { formatBDT, formatDatePretty } from '../utils/financeCalculators';
import { PAYMENT_METHODS } from '../data/financeConfig';
import { todayStr, addDays } from '../lib/supabaseData';
import Modal from './common/Modal';

// Renewal form for an existing member. Saving goes through renew_membership
// (migration 015), which re-checks every rule here: the amounts on this form
// are a preview, the database decides.
export default function RenewMembershipModal({ member, memberInvoices = [], isOpen, onClose, onRenewed }) {
  const {
    activePlans,
    calculatePricing,
    canRoleApplyDiscount,
    currentUserRole,
    roles,
    renewMembership,
  } = useGymData();

  const today = todayStr();
  // Same default as the database: continue from the current expiry if it is
  // still running, otherwise start today.
  const defaultStart = member?.expiry && member.expiry > today ? member.expiry : today;
  const minStart = addDays(today, -30);
  const maxStart = addDays(defaultStart, 90);

  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [discountType, setDiscountType] = useState('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [paymentOption, setPaymentOption] = useState('full'); // 'full' | 'partial'
  const [initialPayment, setInitialPayment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fresh form each time it opens; the member's current plan is preselected
  // when it is still active.
  useEffect(() => {
    if (!isOpen || !member) return;
    const currentPlan = activePlans.find((p) => p.name === member.plan);
    setPlanId(currentPlan?.id || activePlans[0]?.id || '');
    setStartDate(defaultStart);
    setDiscountType('flat');
    setDiscountValue(0);
    setDiscountReason('');
    setPaymentOption('full');
    setInitialPayment('');
    setPaymentMethod('CASH');
    setDueDate('');
    setNotes('');
    setError('');
    setSaving(false);
    // Only reset on open / member change, not on every data reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, member?.id]);

  const selectedPlan = useMemo(
    () => activePlans.find((p) => p.id === Number(planId)) || null,
    [activePlans, planId]
  );

  const hasDiscountPrivilege = canRoleApplyDiscount();
  const maxDiscountAllowed = roles.find((r) => r.name === currentUserRole)?.maxDiscountPercent ?? 0;

  // VAT-free, same as admission and the database function.
  const pricing = useMemo(
    () => calculatePricing({
      basePrice: selectedPlan?.price || 0,
      discountType,
      discountValue: hasDiscountPrivilege ? discountValue : 0,
      vatPercent: 0,
    }),
    [selectedPlan, discountType, discountValue, hasDiscountPrivilege, calculatePricing]
  );

  const paidNow = paymentOption === 'full'
    ? pricing.netPayable
    : Math.max(0, Number(initialPayment) || 0);
  const outstandingDue = Math.max(0, pricing.netPayable - paidNow);

  // Same rule as the database: expiry = start + plan duration (default 30 days)
  const endDate = startDate ? addDays(startDate, selectedPlan?.durationDays || 30) : '';
  const endsTooEarly = Boolean(member?.expiry && endDate && endDate <= member.expiry);

  const oldDues = memberInvoices.filter((inv) => Number(inv.dueAmount) > 0);
  const oldDueTotal = oldDues.reduce((sum, inv) => sum + Number(inv.dueAmount), 0);

  if (!member) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPlan) {
      setError('Select an active membership plan.');
      return;
    }
    if (!startDate || startDate < minStart || startDate > maxStart) {
      setError(`Start date must be between ${formatDatePretty(minStart)} and ${formatDatePretty(maxStart)}.`);
      return;
    }
    if (endsTooEarly) {
      setError(`This renewal would end on ${formatDatePretty(endDate)}, which is not after the current expiry (${formatDatePretty(member.expiry)}).`);
      return;
    }
    if (paymentOption === 'partial' && paidNow > pricing.netPayable) {
      setError(`Paid amount cannot be more than ${formatBDT(pricing.netPayable)}.`);
      return;
    }
    if (outstandingDue > 0 && !dueDate) {
      setError('Choose a due date for the unpaid balance.');
      return;
    }

    setSaving(true);
    const { renewal, error: saveError } = await renewMembership({
      memberId: member.id,
      planId: selectedPlan.id,
      startDate,
      discountType: hasDiscountPrivilege ? discountType : 'flat',
      discountValue: hasDiscountPrivilege ? discountValue : 0,
      discountReason,
      paymentMethod,
      paidAmount: paidNow,
      dueDate: outstandingDue > 0 ? dueDate : null,
      notes,
    });
    setSaving(false);

    if (saveError) {
      setError(saveError.message || 'Renewal failed. Nothing was saved.');
      return;
    }
    onRenewed?.({ ...renewal, planName: selectedPlan.name });
    onClose();
  };

  const rowStyle = { display: 'flex', justifyContent: 'space-between' };

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? () => {} : onClose}
      title="Renew Membership"
      subtitle={`Member: ${member.name} (${member.code})`}
      icon={RefreshCw}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="renew-sub-form" className="btn btn-primary" disabled={saving || !selectedPlan}>
            {saving ? 'Saving…' : 'Confirm Renewal'}
          </button>
        </div>
      }
    >
      <form id="renew-sub-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {oldDues.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--warning)', color: 'var(--warning)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>
              This member still owes <strong>{formatBDT(oldDueTotal)}</strong> on {oldDues.map((inv) => inv.number).join(', ')}.
              You can still renew; that due stays on its own invoice.
            </span>
          </div>
        )}

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Current plan: <strong style={{ color: 'var(--text-main)' }}>{member.plan || '—'}</strong>
          {member.expiry && (
            <> · {member.expiry > today ? 'expires' : 'expired'} <strong style={{ color: 'var(--text-main)' }}>{formatDatePretty(member.expiry)}</strong></>
          )}
        </div>

        <div className="form-grid">
          <label className="form-group">
            <span className="form-label">Plan *</span>
            <select className="form-select" value={planId} onChange={(e) => setPlanId(Number(e.target.value))}>
              {activePlans.length === 0 && <option value="">No active plans</option>}
              {activePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatBDT(p.price)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Payment Method *</span>
            <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-grid">
          <label className="form-group">
            <span className="form-label">Start Date *</span>
            <input
              type="date"
              className="form-input"
              value={startDate}
              min={minStart}
              max={maxStart}
              onChange={(e) => {
                setStartDate(e.target.value);
                setError('');
              }}
              required
            />
          </label>
          <div className="form-group">
            <span className="form-label">Ends</span>
            <div
              className="form-input"
              style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', color: endsTooEarly ? 'var(--danger)' : 'var(--text-secondary)' }}
            >
              {endDate ? formatDatePretty(endDate) : '—'}
              <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                ({selectedPlan?.durationDays || 30} days)
              </span>
            </div>
          </div>
        </div>

        {/* Discount: needs the role permission; the database enforces the limit */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
          <div style={{ ...rowStyle, alignItems: 'center', marginBottom: hasDiscountPrivilege ? '8px' : 0 }}>
            <span style={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>Discount</span>
            {!hasDiscountPrivilege && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', fontSize: '11px' }}>
                <ShieldAlert size={13} /> Your role cannot give discounts
              </span>
            )}
          </div>
          {hasDiscountPrivilege && (
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              <label className="form-group">
                <span className="form-label" style={{ fontSize: '11px' }}>Type</span>
                <select className="form-select" value={discountType} onChange={(e) => setDiscountType(e.target.value)} style={{ height: '34px', fontSize: '12px' }}>
                  <option value="flat">Flat Amount (৳)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </label>
              <label className="form-group">
                <span className="form-label" style={{ fontSize: '11px' }}>
                  Value {discountType === 'percentage' ? `(max ${maxDiscountAllowed}%)` : '(৳)'}
                </span>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percentage' ? maxDiscountAllowed : selectedPlan?.price}
                  className="form-input"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  style={{ height: '34px', fontSize: '12px' }}
                />
              </label>
              {pricing.discountAmount > 0 && (
                <label className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <span className="form-label" style={{ fontSize: '11px' }}>Reason</span>
                  <input
                    type="text"
                    className="form-input"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="e.g. Loyal member"
                    style={{ height: '34px', fontSize: '12px' }}
                  />
                </label>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
          <div style={rowStyle}>
            <span>Plan price</span>
            <strong>{formatBDT(pricing.basePrice)}</strong>
          </div>
          {pricing.discountAmount > 0 && (
            <div style={{ ...rowStyle, color: 'var(--danger)' }}>
              <span>Discount</span>
              <strong>- {formatBDT(pricing.discountAmount)}</strong>
            </div>
          )}
          <div style={{ ...rowStyle, paddingTop: '6px', borderTop: '1px solid var(--border-base)', fontWeight: 800, fontSize: '14px' }}>
            <span>Total to pay</span>
            <span style={{ color: 'var(--primary)' }}>{formatBDT(pricing.netPayable)}</span>
          </div>
        </div>

        <div className="form-grid">
          <label className="form-group">
            <span className="form-label">Payment *</span>
            <select
              className="form-select"
              value={paymentOption}
              onChange={(e) => {
                setPaymentOption(e.target.value);
                setError('');
              }}
            >
              <option value="full">Paid in full</option>
              <option value="partial">Paid partly / not yet</option>
            </select>
          </label>
          {paymentOption === 'partial' && (
            <label className="form-group">
              <span className="form-label">Amount Paid Now (৳)</span>
              <input
                type="number"
                min="0"
                max={pricing.netPayable}
                className="form-input"
                value={initialPayment}
                onChange={(e) => setInitialPayment(e.target.value)}
                placeholder="0"
              />
            </label>
          )}
        </div>

        <div style={{ ...rowStyle, alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255,255,255,0.04))' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Left to pay</span>
          <strong style={{ fontSize: '15px', color: outstandingDue > 0 ? 'var(--danger)' : '#10B981' }}>
            {formatBDT(outstandingDue)}
          </strong>
        </div>

        {outstandingDue > 0 && (
          <label className="form-group">
            <span className="form-label">Due Date *</span>
            <input
              className="form-input"
              type="date"
              min={today}
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        )}

        <label className="form-group">
          <span className="form-label">Notes</span>
          <input type="text" className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </label>

        {error && (
          <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}
