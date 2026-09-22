import { useState, useMemo, useEffect } from 'react';
import { Calculator, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import Modal from './common/Modal';

export default function MemberAdmissionModal({ isOpen, onClose }) {
  const {
    plans,
    lockers,
    trainers,
    calculatePricing,
    canRoleApplyDiscount,
    currentUserRole,
    roles,
    addMember,
  } = useGymData();

  const defaultFormState = useMemo(() => ({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    planId: plans[0]?.id || 1,
    trainerName: 'None',
    lockerNumber: 'None',
    discountType: 'percentage', // 'percentage' | 'flat'
    discountValue: 0,
    discountReason: '',
    paymentMethod: 'bKASH',
    paidAmount: '',
  }), [plans]);

  // Form State
  const [formData, setFormData] = useState(defaultFormState);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form whenever modal opens cleanly
  useEffect(() => {
    if (isOpen) {
      setFormData(defaultFormState);
      setIsSuccess(false);
      setErrorMsg('');
    }
  }, [isOpen, defaultFormState]);

  // Check role discount privileges
  const hasDiscountPrivilege = canRoleApplyDiscount();
  const currentRoleObj = roles.find((r) => r.name === currentUserRole);
  const maxDiscountAllowed = currentRoleObj?.maxDiscountPercentage ?? (hasDiscountPrivilege ? 100 : 0);

  // Selected plan
  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === Number(formData.planId)) || plans[0];
  }, [plans, formData.planId]);

  // Live Dynamic Price Calculation
  const pricing = useMemo(() => {
    return calculatePricing({
      basePrice: selectedPlan?.price || 0,
      discountType: formData.discountType,
      discountValue: hasDiscountPrivilege ? formData.discountValue : 0,
      vatPercent: selectedPlan?.vatPercent || 5,
    });
  }, [selectedPlan, formData.discountType, formData.discountValue, hasDiscountPrivilege, calculatePricing]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Please enter both member name and phone number.');
      return;
    }

    addMember({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      gender: formData.gender,
      planId: formData.planId,
      trainerName: formData.trainerName,
      lockerNumber: formData.lockerNumber,
      discountType: hasDiscountPrivilege ? formData.discountType : 'flat',
      discountValue: hasDiscountPrivilege ? formData.discountValue : 0,
      discountReason: formData.discountReason,
      paymentMethod: formData.paymentMethod,
      paidAmount: formData.paidAmount !== '' ? Number(formData.paidAmount) : pricing.netPayable,
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
      title="New Member Admission & Discount Engine"
      subtitle="Register member, calculate dynamic packages, and generate account invoice"
      icon={Sparkles}
      size="lg"
    >
      {isSuccess ? (
        <div style={{ padding: '50px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <CheckCircle2 size={48} color="#10B981" />
          <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Member Registered Successfully!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Invoice generated with live discounted revenue and synced to Accounts & Analytics.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '10px 14px', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Shakib Al Hasan"
                className="form-input"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+880 1700-000000"
                className="form-input"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="shakib@athlete.com"
                className="form-input"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Plan Selector */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Membership Package *</label>
              <select
                className="form-select"
                value={formData.planId}
                onChange={(e) => handleChange('planId', Number(e.target.value))}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.period}) — ৳{p.price.toLocaleString()} ({p.lockerZone} Included)
                  </option>
                ))}
              </select>
            </div>

            {/* Trainer Assignment */}
            <div className="form-group">
              <label className="form-label">Assign Personal Trainer</label>
              <select
                className="form-select"
                value={formData.trainerName}
                onChange={(e) => handleChange('trainerName', e.target.value)}
              >
                <option value="None">No Trainer Assigned</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.specialty})
                  </option>
                ))}
              </select>
            </div>

            {/* Locker Assignment */}
            <div className="form-group">
              <label className="form-label">Assign Locker Number</label>
              <select
                className="form-select"
                value={formData.lockerNumber}
                onChange={(e) => handleChange('lockerNumber', e.target.value)}
              >
                <option value="None">No Locker Assigned</option>
                {lockers
                  .filter((l) => l.status === 'Available')
                  .map((l) => (
                    <option key={l.id} value={l.number}>
                      {l.number} ({l.zone} - ৳{l.monthlyFee}/mo)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* DYNAMIC DISCOUNT ENGINE (RBAC Protected) */}
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
                <span style={{ fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Role-Based Dynamic Discount Engine
                </span>
                <span className="badge badge-primary">{currentUserRole} Privilege</span>
              </div>
              {!hasDiscountPrivilege && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', fontSize: '12px' }}>
                  <ShieldAlert size={14} />
                  <span>Your role cannot apply manual discounts</span>
                </div>
              )}
            </div>

            {hasDiscountPrivilege ? (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select
                    className="form-select"
                    value={formData.discountType}
                    onChange={(e) => handleChange('discountType', e.target.value)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (৳)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Discount Value {formData.discountType === 'percentage' ? `(Max ${maxDiscountAllowed}%)` : '(৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.discountType === 'percentage' ? maxDiscountAllowed : selectedPlan?.price}
                    className="form-input"
                    value={formData.discountValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (formData.discountType === 'percentage' && val > maxDiscountAllowed) {
                        handleChange('discountValue', maxDiscountAllowed);
                      } else {
                        handleChange('discountValue', val);
                      }
                    }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Discount Reason / Authorization Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Student Discount, Summer Flash Sale, Corporate Partner"
                    className="form-input"
                    value={formData.discountReason}
                    onChange={(e) => handleChange('discountReason', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Only Management, Partners, and Owners are authorized to apply custom admission discounts. Front desk and trainers must adhere to catalog rack rates.
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="form-grid" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-select"
                value={formData.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
              >
                <option value="bKASH">bKASH Merchant Payment</option>
                <option value="Nagad">Nagad Online</option>
                <option value="CASH">Cash Over Counter</option>
                <option value="CARD">Visa / Mastercard POS</option>
                <option value="BANK">Direct Bank Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Amount Paid (Leave blank for full payment)</label>
              <input
                type="number"
                placeholder={`৳${pricing.netPayable} (Full Settlement)`}
                className="form-input"
                value={formData.paidAmount}
                onChange={(e) => handleChange('paidAmount', e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Live Price Calculation Preview Box */}
          <div className="discount-calc-box" style={{ marginTop: '16px' }}>
            <div className="discount-calc-title">
              <Calculator size={16} />
              <span>Live Dynamic Calculation & Accounts Breakdown</span>
            </div>

            <div className="calc-row">
              <span>Package Base Price:</span>
              <span style={{ fontWeight: 700 }}>৳{pricing.basePrice.toLocaleString()}</span>
            </div>

            <div className="calc-row">
              <span>
                Applied Discount ({pricing.discountType === 'percentage' ? `${pricing.discountValue}%` : `৳${pricing.discountValue}`}):
              </span>
              <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                - ৳{pricing.discountAmount.toLocaleString()}
              </span>
            </div>

            <div className="calc-row">
              <span>Price After Discount:</span>
              <span>৳{pricing.priceAfterDiscount.toLocaleString()}</span>
            </div>

            <div className="calc-row">
              <span>Tax / VAT ({pricing.vatPercent}%):</span>
              <span>+ ৳{pricing.taxAmount.toLocaleString()}</span>
            </div>

            <div className="calc-row total-row">
              <span>Net Payable Amount:</span>
              <span>৳{pricing.netPayable.toLocaleString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Admission & Issue Invoice
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
