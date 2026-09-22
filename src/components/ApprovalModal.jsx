import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, ShieldAlert, Sparkles, UserCheck, Calculator } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import Modal from './common/Modal';

export default function ApprovalModal({ application, isOpen, onClose }) {
  const {
    plans,
    calculatePricing,
    canRoleApplyDiscount,
    currentUserRole,
    roles,
    approveApplication,
  } = useGymData();

  const [planId, setPlanId] = useState(application?.desiredPlanId || 1);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [discountReason, setDiscountReason] = useState('Online Application Early Bird Promo');
  const [paymentMethod, setPaymentMethod] = useState('bKASH');
  const [isSuccess, setIsSuccess] = useState(false);

  // Synchronize state with current application to prevent cross-record contamination
  useEffect(() => {
    if (application && isOpen) {
      setPlanId(application.desiredPlanId || 1);
      setDiscountType('percentage');
      setDiscountValue(10);
      setDiscountReason('Online Application Early Bird Promo');
      setPaymentMethod('bKASH');
      setIsSuccess(false);
    }
  }, [application?.id, isOpen]);

  const hasDiscountPrivilege = canRoleApplyDiscount();
  const currentRoleObj = roles.find((r) => r.name === currentUserRole);
  const maxDiscountAllowed = currentRoleObj?.maxDiscountPercentage ?? 100;

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === Number(planId)) || plans[0];
  }, [plans, planId]);

  const pricing = useMemo(() => {
    return calculatePricing({
      basePrice: selectedPlan?.price || 0,
      discountType,
      discountValue: hasDiscountPrivilege ? discountValue : 0,
      vatPercent: selectedPlan?.vatPercent || 5,
    });
  }, [selectedPlan, discountType, discountValue, hasDiscountPrivilege, calculatePricing]);

  if (!application) return null;

  const handleApprove = (e) => {
    e.preventDefault();
    approveApplication({
      appId: application.id,
      planId,
      discountType: hasDiscountPrivilege ? discountType : 'flat',
      discountValue: hasDiscountPrivilege ? discountValue : 0,
      discountReason,
      paymentMethod,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Approve Member Application: ${application.name}`}
      subtitle={`Verify applicant dossier, assign membership plan, and authorize discount`}
      icon={UserCheck}
      size="lg"
    >
      {isSuccess ? (
        <div style={{ padding: '50px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <CheckCircle2 size={48} color="#10B981" />
          <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Application Approved & Activated!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Member created with code, invoice issued, and dynamic discount recorded.
          </p>
        </div>
      ) : (
        <form onSubmit={handleApprove}>
          {/* Applicant Info Summary */}
          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px', border: '1px solid var(--border-base)', marginBottom: '16px' }}>
            <div><strong>Code:</strong> {application.code}</div>
            <div><strong>Phone:</strong> {application.phone}</div>
            <div><strong>Email:</strong> {application.email || '—'}</div>
            <div><strong>Goal:</strong> {application.goal || 'General Fitness'}</div>
            <div><strong>Medical:</strong> {application.medical || 'None'}</div>
          </div>

          {/* Package & Payment */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Assign Package</label>
              <select
                className="form-select"
                value={planId}
                onChange={(e) => setPlanId(Number(e.target.value))}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.period}) — ৳{p.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Approved Payment Channel</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="bKASH">bKASH Merchant Payment</option>
                <option value="Nagad">Nagad Online</option>
                <option value="CASH">Cash at Reception Desk</option>
                <option value="CARD">Visa / Mastercard POS</option>
                <option value="BANK">Bank Wire</option>
              </select>
            </div>
          </div>

          {/* Role Discount Privilege Engine */}
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-base)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>
                  Dynamic Approval Discount Authorization
                </span>
                <span className="badge badge-primary">{currentUserRole} Access</span>
              </div>

              {!hasDiscountPrivilege && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', fontSize: '12px' }}>
                  <ShieldAlert size={14} />
                  <span>No discount privilege</span>
                </div>
              )}
            </div>

            {hasDiscountPrivilege ? (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select
                    className="form-select"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (৳)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Discount Value {discountType === 'percentage' ? `(Max ${maxDiscountAllowed}%)` : '(৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? maxDiscountAllowed : selectedPlan?.price}
                    className="form-input"
                    value={discountValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (discountType === 'percentage' && val > maxDiscountAllowed) {
                        setDiscountValue(maxDiscountAllowed);
                      } else {
                        setDiscountValue(val);
                      }
                    }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Authorization Note / Promo Tag</label>
                  <input
                    type="text"
                    className="form-input"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Only Management and Owners can apply custom discount codes on membership approvals.
              </p>
            )}
          </div>

          {/* Pricing Calc Breakdown */}
          <div className="discount-calc-box" style={{ marginTop: '16px' }}>
            <div className="discount-calc-title">
              <Calculator size={16} />
              <span>Live Approval Price Breakdown</span>
            </div>

            <div className="calc-row">
              <span>Selected Package ({selectedPlan.name}):</span>
              <span>৳{pricing.basePrice.toLocaleString()}</span>
            </div>

            <div className="calc-row">
              <span>Authorized Discount ({pricing.discountType === 'percentage' ? `${pricing.discountValue}%` : `৳${pricing.discountValue}`}):</span>
              <span style={{ color: 'var(--danger)', fontWeight: 700 }}>- ৳{pricing.discountAmount.toLocaleString()}</span>
            </div>

            <div className="calc-row">
              <span>Government Tax / VAT ({pricing.vatPercent}%):</span>
              <span>+ ৳{pricing.taxAmount.toLocaleString()}</span>
            </div>

            <div className="calc-row total-row">
              <span>Net Payable Invoice:</span>
              <span>৳{pricing.netPayable.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Sparkles size={14} /> Authorize & Activate Member
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
