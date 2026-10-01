import { Check } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function SubscriptionPlans() {
  const { plans } = useGymData();

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Subscription Plans & Package Catalog</h1>
          <p className="page-subtitle">
            Membership offers available at the Dhanmondi branch.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {plans.map((p) => (
            <div
              key={p.id}
              style={{
                background: 'var(--bg-card)',
                border: `2px solid ${p.popular ? 'var(--primary)' : 'var(--border-base)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                boxShadow: p.popular ? '0 8px 30px var(--primary-glow)' : 'var(--shadow-card)',
              }}
            >
              {p.popular && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '20px',
                    background: 'var(--primary)',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    letterSpacing: '1px',
                  }}
                >
                  Most Popular
                </span>
              )}

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{p.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    ৳{p.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {p.features.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-base)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    Included Benefits:
                  </span>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={14} color="var(--primary)" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
        ))}
      </div>
    </div>
  );
}
