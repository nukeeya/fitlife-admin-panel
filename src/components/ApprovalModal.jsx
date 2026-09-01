import { useState, useMemo } from 'react';
import { X, CheckCircle2, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

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
  const [discountValue, setDiscountValue] = useState(10); // Default 10% welcome promo for online approvals
  const [discountReason, setDiscountReason] = useState('Online Application Early Bird Promo');
  const [paymentMethod, setPaymentMethod] = useState('bKASH');
  const [isSuccess, setIsSuccess] = useState(false);

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

  if (!isOpen || !application) return null;

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
              Approve Member Application: {application.name}
            </h2>
          </div>
          <button className="header-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

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
            <div className="modal-body">
              {/* Applicant Info Summary */}
              <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div><strong>Code:</strong> {application.code}</div>
                <div><strong>Phone:</strong> {application.phone}</div>
                <div><strong>Email:</strong> {application.email}</div>
                <div><strong>Goal:</strong> {application.goal}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Medical:</strong> {application.medical || 'None'}</div>
              </div>

              {/* Package & Payment */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Assign Package</label>
                  <select
                    className="form-select"
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ৳{p.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="bKASH">bKASH Digital</option>
                    <option value="CASH">Cash Over Counter</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="BANK">Bank Wire</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Discount Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="form-label">Apply Discount on Approval</span>
                  {!hasDiscountPrivilege && (
                    <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 700 }}>
                      <ShieldAlert size={12} /> Discount Locked for {currentUserRole}
                    </span>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        className={`customizer-card-btn ${discountType === 'percentage' ? 'active' : ''}`}
                        disabled={!hasDiscountPrivilege}
                        onClick={() => setDiscountType('percentage')}
                      >
                        % Discount
                      </button>
                      <button
                        type="button"
                        className={`customizer-card-btn ${discountType === 'flat' ? 'active' : ''}`}
                        disabled={!hasDiscountPrivilege}
                        onClick={() => setDiscountType('flat')}
                      >
                        Flat (৳)
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <input
                      type="number"
                      min="0"
                      max={discountType === 'percentage' ? maxDiscountAllowed : selectedPlan.price}
                      disabled={!hasDiscountPrivilege}
                      placeholder="Discount Value"
                      className="form-input"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    disabled={!hasDiscountPrivilege}
                    placeholder="Discount Reason (e.g. Online Early Bird Promo)"
                    className="form-input"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                  />
                </div>
              </div>

              {/* Live Calculation Preview */}
              <div className="discount-calc-box">
                <div className="calc-row">
                  <span>Package Base Price:</span>
                  <span style={{ fontWeight: 700 }}>৳{pricing.basePrice.toLocaleString()}</span>
                </div>
                <div className="calc-row">
                  <span>Discount Amount:</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                    - ৳{pricing.discountAmount.toLocaleString()}
                  </span>
                </div>
                <div className="calc-row">
                  <span>Tax (5%):</span>
                  <span>+ ৳{pricing.taxAmount.toLocaleString()}</span>
                </div>
                <div className="calc-row total-row">
                  <span>Net Payable Real Revenue:</span>
                  <span>৳{pricing.netPayable.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Approve & Activate Member
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
