import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  Calculator,
  Calendar,
  AlertCircle,
  CreditCard,
  Receipt,
  Clock,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useFinance } from '../context/FinanceContext';
import { formatBDT } from '../utils/financeCalculators';
import Modal from './common/Modal';
import Avatar from './common/Avatar';

export default function ApprovalModal({ application, isOpen, onClose }) {
  const {
    activePlans,
    calculatePricing,
    canRoleApplyDiscount,
    currentUserRole,
    roles,
    approveApplication,
  } = useGymData();

  const { addAdmissionInvoice, demoDate } = useFinance();

  const [planId, setPlanId] = useState(application?.desiredPlanId || activePlans[0]?.id || 1);
  const [discountType, setDiscountType] = useState('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('Online Application Early Bird Promo');
  const [paymentOption, setPaymentOption] = useState('partial'); // 'full' | 'partial'
  const [initialPayment, setInitialPayment] = useState('10000');
  const [dueDate, setDueDate] = useState('2026-10-25');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [notes, setNotes] = useState('First installment paid on approval. Balance due by 25 Oct 2026.');
  const [validationError, setValidationError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);

  const desiredPlanId = application?.desiredPlanId;
  const hasApplication = Boolean(application);

  const selectedPlan = useMemo(() => {
    return activePlans.find((p) => p.id === Number(planId)) || activePlans[0] || { price: 15000, name: '3 Months' };
  }, [activePlans, planId]);

  const hasDiscountPrivilege = canRoleApplyDiscount();
  const currentRoleObj = roles.find((r) => r.name === currentUserRole);
  const maxDiscountAllowed = currentRoleObj?.maxDiscountPercent ?? 0;

  const pricing = useMemo(() => {
    return calculatePricing({
      basePrice: selectedPlan?.price || 15000,
      discountType,
      discountValue: hasDiscountPrivilege ? discountValue : 0,
      vatPercent: 0,
    });
  }, [selectedPlan, discountType, discountValue, hasDiscountPrivilege, calculatePricing]);

  // Synchronize state with current application when modal opens
  useEffect(() => {
    if (hasApplication && isOpen) {
      const requestedPlanIsActive = activePlans.some((plan) => plan.id === desiredPlanId);
      const planToSet = requestedPlanIsActive ? desiredPlanId : (activePlans[1]?.id || activePlans[0]?.id || 2);
      setPlanId(planToSet);

      // Default mock scenario from requirement prompt:
      // Package: ৳15,000, Initial: ৳10,000, Due: ৳5,000, Due date: 25 Oct 2026
      setDiscountType('flat');
      setDiscountValue(0);
      setDiscountReason('Online Application Early Bird Promo');
      setPaymentOption('partial');
      setInitialPayment('10000');
      setDueDate('2026-10-25');
      setPaymentMethod('bKash');
      setNotes('First installment paid on approval. Balance due on 25 Oct 2026.');
      setValidationError('');
      setIsSuccess(false);
      setSuccessDetails(null);
    }
  }, [application?.id, isOpen, desiredPlanId, activePlans, hasApplication]);

  // Dynamic initial payment & outstanding due calculation
  const calculatedInitialPay = useMemo(() => {
    if (paymentOption === 'full') {
      return pricing.netPayable;
    }
    const parsed = Number(initialPayment);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }, [paymentOption, initialPayment, pricing.netPayable]);

  const outstandingDue = useMemo(() => {
    return Math.max(0, pricing.netPayable - calculatedInitialPay);
  }, [pricing.netPayable, calculatedInitialPay]);

  if (!application) return null;

  const handlePaymentOptionChange = (option) => {
    setPaymentOption(option);
    setValidationError('');
    if (option === 'full') {
      setInitialPayment(String(pricing.netPayable));
    } else {
      // Default partial scenario
      const partialDefault = Math.round(pricing.netPayable * 0.65);
      setInitialPayment(String(partialDefault > 0 ? partialDefault : 10000));
      if (!dueDate) setDueDate('2026-10-25');
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Form Validation
    const payNum = Number(calculatedInitialPay);
    if (Number.isNaN(payNum) || payNum < 0) {
      setValidationError('Initial payment cannot be negative or invalid.');
      return;
    }
    if (payNum > pricing.netPayable) {
      setValidationError(`Initial payment cannot exceed the net payable amount (${formatBDT(pricing.netPayable)}).`);
      return;
    }
    if (outstandingDue > 0 && !dueDate) {
      setValidationError('Due clearance date is mandatory when an outstanding balance remains.');
      return;
    }

    try {
      // 1. Activate member in GymDataContext
      const res = await approveApplication({
        appId: application.id,
        planId,
        discountType: hasDiscountPrivilege ? discountType : 'flat',
        discountValue: hasDiscountPrivilege ? discountValue : 0,
        discountReason,
        paymentMethod,
        paidAmount: payNum,
        dueDate: outstandingDue > 0 ? dueDate : null,
        notes,
      });

      if (!res?.ok) {
        setValidationError(res?.message || 'Failed to approve application.');
        return;
      }

      // 2. Synchronize invoice and dues in FinanceContext
      const memberCode = res.member?.code || `FLM-${String(Date.now()).slice(-4)}`;
      addAdmissionInvoice({
        memberId: res.member?.id || application.id,
        memberName: application.name,
        memberCode,
        memberPhone: application.phone,
        memberAvatar: application.photo || application.avatar,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        durationMonths: selectedPlan.durationDays ? Math.round(selectedPlan.durationDays / 30) : 3,
        baseAmount: pricing.basePrice,
        discountAmount: pricing.discountAmount,
        discountReason,
        netPayable: pricing.netPayable,
        initialPayment: payNum,
        dueAmount: outstandingDue,
        dueDate: outstandingDue > 0 ? dueDate : demoDate,
        paymentMethod,
        notes,
      });

      setSuccessDetails({
        memberName: application.name,
        memberCode,
        planName: selectedPlan.name,
        packagePrice: pricing.basePrice,
        netPayable: pricing.netPayable,
        initialPayment: payNum,
        outstandingDue,
        dueDate: outstandingDue > 0 ? dueDate : 'Paid in Full',
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error('[ApprovalModal] approve failed:', err);
      setValidationError(err?.message || 'Unexpected error while approving application.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Admission Approval & Billing: ${application.name}`}
      subtitle="Verify applicant, configure partial/full payment, and establish due clearance date"
      icon={UserCheck}
      size="lg"
    >
      {isSuccess && successDetails ? (
        <div style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
            }}
          >
            <CheckCircle2 size={40} />
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Admission Approved & Membership Activated!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
              Member profile initialized for <strong>{successDetails.memberName}</strong> ({successDetails.memberCode}).
            </p>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-base)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              width: '100%',
              maxWidth: '440px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '13px',
              marginTop: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Assigned Package:</span>
              <strong>{successDetails.planName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Final Payable Amount:</span>
              <strong>{formatBDT(successDetails.netPayable)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Initial Payment Received:</span>
              <strong style={{ color: '#10B981' }}>{formatBDT(successDetails.initialPayment)}</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-base)',
                fontWeight: 800,
              }}
            >
              <span>Outstanding Due:</span>
              <span style={{ color: successDetails.outstandingDue > 0 ? '#F59E0B' : '#10B981' }}>
                {successDetails.outstandingDue > 0 ? formatBDT(successDetails.outstandingDue) : '৳0 (Paid in Full)'}
              </span>
            </div>
            {successDetails.outstandingDue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)', fontSize: '12px' }}>
                <span>Due Clearance Deadline:</span>
                <strong>{successDetails.dueDate}</strong>
              </div>
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Outstanding dues ledger and member profile updated automatically.
          </span>
        </div>
      ) : (
        <form onSubmit={handleApprove} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Validation Error Alert */}
          {validationError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Member Photo, Name & ID Header Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar
                src={application.photo || application.avatar}
                name={application.name}
                size={52}
                shape="circle"
              />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {application.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>ID: {application.code}</span>
                  <span>•</span>
                  <span>{application.phone}</span>
                  {application.email && (
                    <>
                      <span>•</span>
                      <span>{application.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '12px' }}>
              <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                Pending Review
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                Branch: {application.branch || 'Gulshan Flagship'}
              </span>
            </div>
          </div>

          {/* Package Selection & Discount Row */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Selected Membership Package *</label>
              <select
                className="form-select"
                value={planId}
                onChange={(e) => setPlanId(Number(e.target.value))}
              >
                {activePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatBDT(p.price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Channel *</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="bKash">bKash Merchant Payment</option>
                <option value="Cash">Cash at Reception Desk</option>
                <option value="Nagad">Nagad Digital Wallet</option>
                <option value="Rocket">Rocket (DBBL)</option>
                <option value="Bank Card">Visa / Mastercard POS</option>
              </select>
            </div>
          </div>

          {/* Dynamic Discount Authorization (Optional) */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-base)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>
                  Admission Discount / Promo Voucher
                </span>
                <span className="badge badge-primary" style={{ fontSize: '10px' }}>{currentUserRole}</span>
              </div>
              {!hasDiscountPrivilege && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', fontSize: '11px' }}>
                  <ShieldAlert size={13} />
                  <span>Requires manager role</span>
                </div>
              )}
            </div>

            {hasDiscountPrivilege ? (
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>Discount Type</label>
                  <select
                    className="form-select"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    style={{ height: '34px', fontSize: '12px' }}
                  >
                    <option value="flat">Flat Amount (৳)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px' }}>
                    Discount Value {discountType === 'percentage' ? `(Max ${maxDiscountAllowed}%)` : '(৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? maxDiscountAllowed : selectedPlan?.price}
                    className="form-input"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    style={{ height: '34px', fontSize: '12px' }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Promo Reason / Tag</label>
                  <input
                    type="text"
                    className="form-input"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    style={{ height: '34px', fontSize: '12px' }}
                  />
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Standard base price applies. Super Admin or Branch Manager authorization required for custom promo waivers.
              </p>
            )}
          </div>

          {/* Pricing & Net Payable Box */}
          <div
            style={{
              background: 'rgba(200, 255, 0, 0.04)',
              border: '1px solid rgba(200, 255, 0, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Package Price ({selectedPlan.name}):</span>
              <strong>{formatBDT(pricing.basePrice)}</strong>
            </div>
            {pricing.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                <span>Authorized Discount:</span>
                <strong>- {formatBDT(pricing.discountAmount)}</strong>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-base)',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              <span>Final Payable Amount:</span>
              <span style={{ color: 'var(--primary)' }}>{formatBDT(pricing.netPayable)}</span>
            </div>
          </div>

          {/* Payment Option: Full vs Partial Payment */}
          <div>
            <label className="form-label" style={{ fontWeight: 800 }}>Payment Terms & Installment Option *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handlePaymentOptionChange('full')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${paymentOption === 'full' ? 'var(--primary)' : 'var(--border-base)'}`,
                  background: paymentOption === 'full' ? 'rgba(200, 255, 0, 0.08)' : 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>Full Payment Upfront</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Collect {formatBDT(pricing.netPayable)} immediately · ৳0 due
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentOptionChange('partial')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${paymentOption === 'partial' ? 'var(--primary)' : 'var(--border-base)'}`,
                  background: paymentOption === 'partial' ? 'rgba(200, 255, 0, 0.08)' : 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>Partial Payment / Installment</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Initial payment + schedule remaining due date
                </div>
              </button>
            </div>
          </div>

          {/* Initial Payment & Auto Due Calculation Fields */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Initial Payment Amount (BDT) *
              </label>
              <input
                type="number"
                min="0"
                max={pricing.netPayable}
                className="form-input"
                value={paymentOption === 'full' ? pricing.netPayable : initialPayment}
                onChange={(e) => setInitialPayment(e.target.value)}
                disabled={paymentOption === 'full'}
                placeholder="e.g. 10000"
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {paymentOption === 'partial' ? 'Example mock scenario: ৳10,000 paid on admission' : 'Full settlement received'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Automatically Calculated Outstanding Due
              </label>
              <div
                style={{
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-base)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  fontWeight: 800,
                  fontSize: '15px',
                  color: outstandingDue > 0 ? '#F59E0B' : '#10B981',
                }}
              >
                {outstandingDue > 0 ? formatBDT(outstandingDue) : '৳0 (Fully Paid)'}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Net Payable ({formatBDT(pricing.netPayable)}) - Initial Payment ({formatBDT(calculatedInitialPay)})
              </span>
            </div>
          </div>

          {/* Due Clearance Date & Notes */}
          {outstandingDue > 0 && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#F59E0B" />
                <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                  Due Clearance Schedule (Mandatory for Remaining {formatBDT(outstandingDue)})
                </span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Agreed Due Clearance Date *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Example mock due date: <strong>25 October 2026</strong>
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Payment Clearance Remarks / Agreement Note
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Member committed to pay remaining ৳5,000 on 25th"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Approval & Issue Billing
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
