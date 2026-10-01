import { useState } from 'react';
import { Check, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { supabase } from '../lib/supabase';
import Modal from '../components/common/Modal';

const EMPTY_FORM = {
  name: '',
  price: '',
  durationDays: '30',
  features: '',
};

export default function SubscriptionPlans() {
  const { plans, activePlans, refresh } = useGymData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [savingPlanId, setSavingPlanId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleAddPlan = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');

    const name = form.name.trim();
    const price = Number(form.price);
    const durationDays = Number(form.durationDays);
    const code = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      || `plan-${Date.now()}`;
    if (!name || !Number.isFinite(price) || price <= 0
      || !Number.isInteger(durationDays) || durationDays <= 0) {
      setError('Enter a plan name, a price greater than zero, and a valid duration in days.');
      setSubmitting(false);
      return;
    }

    try {
      const { data: createdPlan, error: insertError } = await supabase
        .from('plans')
        .insert({
          code,
          name,
          billing_period: 'monthly',
          duration_days: durationDays,
          base_price: price,
          vat_percentage: 0,
          is_popular: false,
          status: 'Active',
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      const features = form.features.split('\n').map((feature) => feature.trim()).filter(Boolean);
      if (features.length > 0) {
        const { error: featureError } = await supabase
          .from('plan_features')
          .insert(features.map((feature_name) => ({ plan_id: createdPlan.id, feature_name })));
        if (featureError) {
          const { error: rollbackError } = await supabase.from('plans').delete().eq('id', createdPlan.id);
          if (rollbackError) {
            console.error('Could not remove plan after feature save failed:', rollbackError);
          }
          throw featureError;
        }
      }

      await refresh();
      setForm(EMPTY_FORM);
      setShowAddModal(false);
      setNotice(`"${name}" was added to the subscription plans.`);
    } catch (saveError) {
      console.error('Could not add subscription plan:', saveError);
      setError(saveError.message || 'Could not add the plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPlanStatus = async (plan, status) => {
    if (status === 'Inactive' && activePlans.length <= 1) {
      setError('At least one active plan must remain available.');
      return;
    }
    if (status === 'Inactive' && !window.confirm(
      `Remove "${plan.name}" from new membership selections? Existing member and invoice history will be kept.`
    )) return;

    setSavingPlanId(plan.id);
    setError('');
    setNotice('');
    try {
      const { error: updateError } = await supabase
        .from('plans')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', plan.id);
      if (updateError) throw updateError;
      await refresh();
      setNotice(status === 'Inactive'
        ? `"${plan.name}" was removed from new membership selections.`
        : `"${plan.name}" is active again.`);
    } catch (saveError) {
      console.error('Could not update subscription plan status:', saveError);
      setError(saveError.message || 'Could not update the plan. Please try again.');
    } finally {
      setSavingPlanId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Subscription Plans & Package Catalog</h1>
          <p className="page-subtitle">Membership offers available at the Dhanmondi branch.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm(EMPTY_FORM);
          setError('');
          setShowAddModal(true);
        }}>
          <Plus size={16} /> ADD PLAN
        </button>
      </div>

      {notice && <p role="status" style={{ color: 'var(--success, #10B981)' }}>{notice}</p>}
      {error && !showAddModal && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              background: 'var(--bg-card)',
              border: `2px solid ${plan.popular && plan.status === 'Active' ? 'var(--primary)' : 'var(--border-base)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              opacity: plan.status === 'Active' ? 1 : 0.65,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${plan.status === 'Active' ? 'badge-success' : 'badge-secondary'}`}>
                {plan.status || 'Active'}
              </span>
              {plan.popular && plan.status === 'Active' && (
                <span className="badge badge-primary">Most Popular</span>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{plan.name}</h3>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', marginTop: 6 }}>
                ৳{plan.price.toLocaleString()}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {plan.durationDays} day{plan.durationDays === 1 ? '' : 's'}
              </span>
            </div>

            {plan.features.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-base)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Included Benefits:
                </span>
                {plan.features.map((feature) => (
                  <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="var(--primary)" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className={plan.status === 'Active' ? 'btn btn-secondary' : 'btn btn-primary'}
              style={{ marginTop: 'auto', justifyContent: 'center' }}
              disabled={savingPlanId === plan.id || (plan.status === 'Active' && activePlans.length <= 1)}
              title={plan.status === 'Active' && activePlans.length <= 1 ? 'Keep at least one plan active' : undefined}
              onClick={() => handleSetPlanStatus(plan, plan.status === 'Active' ? 'Inactive' : 'Active')}
            >
              {plan.status === 'Active' ? <><Trash2 size={14} /> REMOVE PLAN</> : <><RotateCcw size={14} /> RESTORE PLAN</>}
            </button>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Subscription Plan"
        subtitle="New plans are immediately available for membership applications."
      >
        <form onSubmit={handleAddPlan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
          <div className="form-group">
            <label className="form-label" htmlFor="plan-name">Plan Name *</label>
            <input
              id="plan-name"
              className="form-input"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="plan-price">Price (৳) *</label>
              <input
                id="plan-price"
                type="number"
                min="1"
                step="1"
                className="form-input"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="plan-duration">Duration (days) *</label>
              <input
                id="plan-duration"
                type="number"
                min="1"
                step="1"
                className="form-input"
                value={form.durationDays}
                onChange={(event) => setForm({ ...form, durationDays: event.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="plan-features">Benefits (one per line, optional)</label>
            <textarea
              id="plan-features"
              className="form-input"
              rows="3"
              value={form.features}
              onChange={(event) => setForm({ ...form, features: event.target.value })}
              placeholder="No Admission Fee"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'SAVING...' : 'ADD PLAN'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
