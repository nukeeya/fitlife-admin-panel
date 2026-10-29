import { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  ShieldAlert,
  CheckCircle2,
  UserPlus,
  Clock,
  CreditCard,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import ProfilePhotoField from './ProfilePhotoField';
import { uploadProfilePhoto } from '../lib/profilePhotos';
import Modal from './common/Modal';

export default function MemberAdmissionModal({ isOpen, onClose }) {
  const {
    activePlans,
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
    planId: activePlans[0]?.id || 1,
    trainerName: 'None',
    discountType: 'percentage', // 'percentage' | 'flat'
    discountValue: 0,
    discountReason: '',
    paymentMethod: 'bKASH',
    paymentOption: 'full', // 'full' | 'partial'
    initialPayment: '',
    dueDate: '',
    paymentRemarks: '',
  }), [activePlans]);

  // Form State
  const [formData, setFormData] = useState(defaultFormState);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form whenever modal opens cleanly
  useEffect(() => {
    if (isOpen) {
      setFormData(defaultFormState);
      setProfilePhoto(null);
      setIsSuccess(false);
      setSuccessDetails(null);
      setErrorMsg('');
    }
  }, [isOpen, defaultFormState]);

  // Check role discount privileges
  const hasDiscountPrivilege = canRoleApplyDiscount();
  const currentRoleObj = roles.find((r) => r.name === currentUserRole);
  const maxDiscountAllowed = currentRoleObj?.maxDiscountPercent ?? 0;

  // Selected plan
  const selectedPlan = useMemo(() => {
    return activePlans.find((p) => p.id === Number(formData.planId)) || activePlans[0];
  }, [activePlans, formData.planId]);

  // Live Dynamic Price Calculation
  const pricing = useMemo(() => {
    return calculatePricing({
      basePrice: selectedPlan?.price || 0,
      discountType: formData.discountType,
      discountValue: hasDiscountPrivilege ? formData.discountValue : 0,
      vatPercent: 0,
    });
  }, [selectedPlan, formData.discountType, formData.discountValue, hasDiscountPrivilege, calculatePricing]);

  // Dynamic initial payment & outstanding due calculation
  const calculatedInitialPay = useMemo(() => {
    if (formData.paymentOption === 'full') {
      return pricing.netPayable;
    }
    const parsed = Number(formData.initialPayment);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }, [formData.paymentOption, formData.initialPayment, pricing.netPayable]);

  const outstandingDue = useMemo(() => {
    if (formData.paymentOption === 'full') {
      return 0;
    }
    return Math.max(0, pricing.netPayable - calculatedInitialPay);
  }, [formData.paymentOption, pricing.netPayable, calculatedInitialPay]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handlePaymentOptionChange = (option) => {
    if (errorMsg) setErrorMsg('');
    if (option === 'full') {
      setFormData((prev) => ({
        ...prev,
        paymentOption: 'full',
        initialPayment: String(pricing.netPayable),
      }));
    } else {
      const defaultPartial = Math.round(pricing.netPayable * 0.65);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      const defaultDateStr = d.toISOString().split('T')[0];

      setFormData((prev) => ({
        ...prev,
        paymentOption: 'partial',
        initialPayment: prev.initialPayment ? prev.initialPayment : String(defaultPartial > 0 ? defaultPartial : Math.round(pricing.netPayable / 2)),
        dueDate: prev.dueDate || defaultDateStr,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Please enter both member name and phone number.');
      return;
    }

    const payNum = Number(calculatedInitialPay);
    if (Number.isNaN(payNum) || payNum < 0) {
      setErrorMsg('Initial payment cannot be negative or invalid.');
      return;
    }

    if (payNum > pricing.netPayable) {
      setErrorMsg(`Initial payment (৳${payNum.toLocaleString()} BDT) cannot exceed the final payable amount (৳${pricing.netPayable.toLocaleString()} BDT).`);
      return;
    }

    if (formData.paymentOption === 'partial' && outstandingDue > 0 && !formData.dueDate) {
      setErrorMsg('Agreed due clearance date is mandatory whenever an outstanding balance remains.');
      return;
    }

    let uploadedPhoto = null;
    try {
      uploadedPhoto = await uploadProfilePhoto(profilePhoto, 'members');
      const { member: created, error: createError } = await addMember({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        planId: formData.planId,
        trainerName: formData.trainerName,
        discountType: hasDiscountPrivilege ? formData.discountType : 'flat',
        discountValue: hasDiscountPrivilege ? formData.discountValue : 0,
        discountReason: formData.discountReason,
        paymentMethod: formData.paymentMethod,
        paidAmount: payNum,
        avatar: uploadedPhoto,
        dueDate: outstandingDue > 0 ? formData.dueDate : null,
        notes: formData.paymentRemarks,
      });

      if (createError) {
        setErrorMsg(`Failed to save the member record: ${createError.message}`);
        return;
      }

      setSuccessDetails({
        memberName: formData.name.trim(),
        memberCode: created?.code || '—',
        planName: selectedPlan.name,
        // Amounts as saved by the database (it recalculates the price).
        netPayable: created.netPayable,
        initialPayment: created.paidTotal,
        outstandingDue: created.balanceDue,
        dueDate: outstandingDue > 0 ? formData.dueDate : 'Paid in Full (৳0 Due)',
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSuccessDetails(null);
        onClose();
      }, 2200);
    } catch (err) {
      console.error('Member admission failed:', err);
      setErrorMsg(err.message || 'Failed to save the member record. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Member Admission & Discount Engine"
      subtitle="Register member, configure full or partial installment terms, and issue accounts invoice"
      icon={UserPlus}
      size="lg"
    >
      {isSuccess && successDetails ? (
        <div style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
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
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
              Member Registered & Admitted Successfully!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '6px 0 0 0' }}>
              Admission invoice generated for <strong>{successDetails.memberName}</strong> ({successDetails.memberCode}).
            </p>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-base)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              width: '100%',
              maxWidth: '460px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '13px',
              marginTop: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Selected Package:</span>
              <strong>{successDetails.planName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Final Payable Amount:</span>
              <strong>৳{successDetails.netPayable.toLocaleString()} BDT</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Initial Payment Collected:</span>
              <strong style={{ color: '#10B981' }}>৳{successDetails.initialPayment.toLocaleString()} BDT</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-base)',
                fontWeight: 800,
              }}
            >
              <span>Outstanding Due:</span>
              <span style={{ color: successDetails.outstandingDue > 0 ? '#F59E0B' : '#10B981' }}>
                {successDetails.outstandingDue > 0 ? `৳${successDetails.outstandingDue.toLocaleString()} BDT` : '৳0 BDT (Paid in Full)'}
              </span>
            </div>
            {successDetails.outstandingDue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)', fontSize: '12px' }}>
                <span>Due Clearance Deadline:</span>
                <strong>{successDetails.dueDate}</strong>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                padding: '10px 14px',
                borderRadius: '8px',
                color: 'var(--danger)',
                fontSize: '13px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="form-grid">
            <ProfilePhotoField
              file={profilePhoto}
              onFileChange={setProfilePhoto}
            />

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
                {activePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ৳{p.price.toLocaleString()} BDT
                    {p.features?.includes('No Admission Fee') ? ' — No Admission Fee' : ''}
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
                    <option value="flat">Flat Amount (৳ BDT)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Discount Value {formData.discountType === 'percentage' ? `(Max ${maxDiscountAllowed}%)` : '(৳ BDT)'}
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

          {/* DYNAMIC PRICE CALCULATION PREVIEW BOX */}
          <div className="discount-calc-box" style={{ marginTop: '16px' }}>
            <div className="discount-calc-title">
              <Calculator size={16} />
              <span>Live Dynamic Calculation & Pricing Breakdown</span>
            </div>

            <div className="calc-row">
              <span>Package Base Price ({selectedPlan?.name}):</span>
              <span style={{ fontWeight: 700 }}>৳{pricing.basePrice.toLocaleString()} BDT</span>
            </div>

            {pricing.discountAmount > 0 && (
              <div className="calc-row">
                <span>
                  Applied Discount ({pricing.discountType === 'percentage' ? `${pricing.discountValue}%` : `৳${pricing.discountValue} BDT`}):
                </span>
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                  - ৳{pricing.discountAmount.toLocaleString()} BDT
                </span>
              </div>
            )}

            <div className="calc-row">
              <span>Price After Discount:</span>
              <span>৳{pricing.priceAfterDiscount.toLocaleString()} BDT</span>
            </div>

            <div className="calc-row total-row">
              <span>Final Payable Amount:</span>
              <span style={{ color: 'var(--primary)' }}>৳{pricing.netPayable.toLocaleString()} BDT</span>
            </div>
          </div>

          {/* PAYMENT METHOD & CHANNELS */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Payment Channel *</label>
            <select
              className="form-select"
              value={formData.paymentMethod}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
            >
              <option value="bKASH">bKash Merchant Payment</option>
              <option value="Nagad">Nagad Online</option>
              <option value="Rocket">Rocket (DBBL Mobile Banking)</option>
              <option value="CASH">Cash at Reception Desk</option>
              <option value="CARD">Visa / Mastercard POS</option>
              <option value="BANK">Direct Bank Transfer</option>
            </select>
          </div>

          {/* PAYMENT TERMS & INSTALLMENT OPTION */}
          <div style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ fontWeight: 800 }}>Payment Terms & Installment Option *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handlePaymentOptionChange('full')}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${formData.paymentOption === 'full' ? 'var(--primary)' : 'var(--border-base)'}`,
                  background: formData.paymentOption === 'full' ? 'rgba(200, 255, 0, 0.08)' : 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition-smooth)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Full Payment Upfront</span>
                  {formData.paymentOption === 'full' && (
                    <span className="badge badge-success" style={{ fontSize: '10px' }}>Selected</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Total Payable: <strong style={{ color: 'var(--text-primary)' }}>৳{pricing.netPayable.toLocaleString()} BDT</strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Full amount collected immediately · ৳0 balance remains due
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentOptionChange('partial')}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${formData.paymentOption === 'partial' ? 'var(--primary)' : 'var(--border-base)'}`,
                  background: formData.paymentOption === 'partial' ? 'rgba(200, 255, 0, 0.08)' : 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition-smooth)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Partial Payment / Installment</span>
                  {formData.paymentOption === 'partial' && (
                    <span className="badge badge-warning" style={{ fontSize: '10px' }}>Selected</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Pay initial deposit + schedule remaining due date
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Automatic outstanding balance tracking & clearance deadline
                </div>
              </button>
            </div>
          </div>

          {/* INITIAL PAYMENT & AUTO DUE CALCULATION FIELDS */}
          <div className="form-grid" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label className="form-label">
                Initial Payment Amount (৳ BDT) *
              </label>
              <input
                type="number"
                min="0"
                max={pricing.netPayable}
                className="form-input"
                value={formData.paymentOption === 'full' ? pricing.netPayable : formData.initialPayment}
                onChange={(e) => handleChange('initialPayment', e.target.value)}
                disabled={formData.paymentOption === 'full'}
                placeholder={`e.g. ${Math.round(pricing.netPayable * 0.65)}`}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {formData.paymentOption === 'partial'
                  ? 'Enter the upfront amount collected from the member at admission'
                  : 'Full settlement collected immediately at admission'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Automatically Calculated Outstanding Due (৳ BDT)
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
                {outstandingDue > 0 ? `৳${outstandingDue.toLocaleString()} BDT` : '৳0 BDT (Paid in Full)'}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Final Payable (৳{pricing.netPayable.toLocaleString()} BDT) - Initial Payment (৳{calculatedInitialPay.toLocaleString()} BDT)
              </span>
            </div>
          </div>

          {/* DUE CLEARANCE SCHEDULE PANEL (Mandatory when outstandingDue > 0) */}
          {formData.paymentOption === 'partial' && outstandingDue > 0 && (
            <div
              style={{
                marginTop: '14px',
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
                  Due Clearance Schedule (Mandatory for Remaining ৳{outstandingDue.toLocaleString()} BDT)
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
                    value={formData.dueDate}
                    onChange={(e) => handleChange('dueDate', e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Agreed deadline by which member must clear the remaining balance
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Payment Clearance Remarks / Agreement Note
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.paymentRemarks}
                    onChange={(e) => handleChange('paymentRemarks', e.target.value)}
                    placeholder="e.g. Committed to clear balance via bKash by 25th"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Recorded on invoice and member payment schedule ledger
                  </span>
                </div>
              </div>
            </div>
          )}

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
