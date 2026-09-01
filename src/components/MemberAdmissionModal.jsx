import { useState, useMemo } from 'react';
import { X, Calculator, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

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

  // Form State
  const [formData, setFormData] = useState({
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
  });

  const [isSuccess, setIsSuccess] = useState(false);

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

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Please enter member name and phone number.');
      return;
    }

    addMember({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      planId: formData.planId,
      trainerName: formData.trainerName,
      lockerNumber: formData.lockerNumber,
      discountType: hasDiscountPrivilege ? formData.discountType : 'flat',
      discountValue: hasDiscountPrivilege ? formData.discountValue : 0,
      discountReason: formData.discountReason,
      paymentMethod: formData.paymentMethod,
      paidAmount: formData.paidAmount !== '' ? formData.paidAmount : pricing.netPayable,
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
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>New Member Admission & Discount Engine</h2>
          </div>
          <button className="header-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

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
            <div className="modal-body">
              {/* Personal Details */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahfuzur Rahman"
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
                    placeholder="+880 1712-000000"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="mahfuz@gmail.com"
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
              </div>

              {/* Package & Assignments */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Select Membership Package *</label>
                  <select
                    className="form-select"
                    value={formData.planId}
                    onChange={(e) => handleChange('planId', e.target.value)}
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ৳{p.price.toLocaleString()} ({p.period})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Personal Trainer</label>
                  <select
                    className="form-select"
                    value={formData.trainerName}
                    onChange={(e) => handleChange('trainerName', e.target.value)}
                  >
                    <option value="None">None (General Floor Access)</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Locker</label>
                  <select
                    className="form-select"
                    value={formData.lockerNumber}
                    onChange={(e) => handleChange('lockerNumber', e.target.value)}
                  >
                    <option value="None">No Locker</option>
                    {lockers
                      .filter((l) => l.status === 'Available')
                      .map((l) => (
                        <option key={l.id} value={l.number}>
                          {l.number} - {l.zone} (৳{l.monthlyFee}/mo)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={formData.paymentMethod}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  >
                    <option value="bKASH">bKASH Digital</option>
                    <option value="CASH">Cash Over Counter</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="BANK">Bank Wire / Online</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Discount Engine Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calculator size={14} color="var(--primary)" />
                    Dynamic Discount Engine
                  </span>

                  {!hasDiscountPrivilege && (
                    <span style={{ fontSize: '11px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <ShieldAlert size={12} />
                      Role '{currentUserRole}' lacks discount authority
                    </span>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Discount Format</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        className={`customizer-card-btn ${formData.discountType === 'percentage' ? 'active' : ''}`}
                        disabled={!hasDiscountPrivilege}
                        onClick={() => handleChange('discountType', 'percentage')}
                      >
                        Percentage (%)
                      </button>
                      <button
                        type="button"
                        className={`customizer-card-btn ${formData.discountType === 'flat' ? 'active' : ''}`}
                        disabled={!hasDiscountPrivilege}
                        onClick={() => handleChange('discountType', 'flat')}
                      >
                        Flat Amount (৳)
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Discount Value ({formData.discountType === 'percentage' ? '%' : '৳'})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.discountType === 'percentage' ? maxDiscountAllowed : selectedPlan.price}
                      disabled={!hasDiscountPrivilege}
                      placeholder={formData.discountType === 'percentage' ? 'e.g. 10 or 20' : 'e.g. 500'}
                      className="form-input"
                      value={formData.discountValue}
                      onChange={(e) => handleChange('discountValue', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Note / Reason</label>
                  <input
                    type="text"
                    disabled={!hasDiscountPrivilege}
                    placeholder="e.g. Seasonal Promo, Referral, Management VIP Approval"
                    className="form-input"
                    value={formData.discountReason}
                    onChange={(e) => handleChange('discountReason', e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Live Price Calculation Preview Box */}
              <div className="discount-calc-box">
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

              {/* Initial Paid Amount */}
              <div className="form-group">
                <label className="form-label">Initial Amount Paid (Leave blank for full payment)</label>
                <input
                  type="number"
                  placeholder={`৳${pricing.netPayable} (Full Payment)`}
                  className="form-input"
                  value={formData.paidAmount}
                  onChange={(e) => handleChange('paidAmount', e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Confirm Admission & Issue Invoice
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
