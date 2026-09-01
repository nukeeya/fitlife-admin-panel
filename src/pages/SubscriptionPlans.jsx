import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  Check,
  Plus,
  Edit,
  Key,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function SubscriptionPlans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'plans'; // 'plans' | 'features' | 'lockers'

  const { plans } = useGymData();

  const allFeatures = [
    { id: 1, name: 'Standard Gym Floor Access', basic: true, standard: true, premium: true, elite: true },
    { id: 2, name: 'Cardio & Treadmill Zone', basic: true, standard: true, premium: true, elite: true },
    { id: 3, name: 'Group HIIT & Yoga Classes', basic: false, standard: true, premium: true, elite: true },
    { id: 4, name: 'Personal Trainer 1-on-1 Sessions', basic: false, standard: '2 Sessions', premium: 'Weekly', elite: 'Daily Master' },
    { id: 5, name: 'Dedicated Smart Locker', basic: 'Optional (+৳500)', standard: 'Standard Locker', premium: 'Executive Locker', elite: 'VIP Suite Locker' },
    { id: 6, name: 'Sauna & Steam Bath', basic: false, standard: '2x/Month', premium: 'Unlimited', elite: 'Unlimited + Jacuzzi' },
    { id: 7, name: 'AI Personalized Nutrition & Workout', basic: false, standard: false, premium: true, elite: true },
    { id: 8, name: 'Supplement Bar & Valet Parking', basic: false, standard: false, premium: false, elite: true },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Subscription Plans & Package Catalog</h1>
          <p className="page-subtitle">
            Configure membership pricing, duration cycles, bundled locker zones, and feature matrices.
          </p>
        </div>

        <div className="subtabs-bar">
          <button
            className={`subtab-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'plans' })}
          >
            Subscription Plan List
          </button>
          <button
            className={`subtab-btn ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'features' })}
          >
            Subscription Feature List
          </button>
          <button
            className={`subtab-btn ${activeTab === 'lockers' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'lockers' })}
          >
            Subscription Locker List
          </button>
        </div>
      </div>

      {/* 1. PLAN LIST SUBTAB */}
      {activeTab === 'plans' && (
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
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.period}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  + {p.vatPercent || 5}% Tax/VAT Included
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-base)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Included Amenities:
                </span>
                {p.features.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} color="var(--primary)" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'auto', background: 'var(--bg-surface)', padding: '10px', borderRadius: '8px', fontSize: '11px' }}>
                <strong>Locker Zone:</strong> {p.lockerZone}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. FEATURE LIST SUBTAB */}
      {activeTab === 'features' && (
        <div className="activity-card">
          <div className="activity-header">
            <span style={{ fontWeight: 800 }}>Subscription Feature Comparison Matrix</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Feature Name</th>
                  <th>Basic (৳2k)</th>
                  <th>Standard (৳3.5k)</th>
                  <th>Premium (৳5k)</th>
                  <th>Elite VIP (৳8k)</th>
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 700 }}>{f.name}</td>
                    <td>{typeof f.basic === 'boolean' ? (f.basic ? <Check size={16} color="#10B981" /> : '—') : f.basic}</td>
                    <td>{typeof f.standard === 'boolean' ? (f.standard ? <Check size={16} color="#10B981" /> : '—') : f.standard}</td>
                    <td>{typeof f.premium === 'boolean' ? (f.premium ? <Check size={16} color="#10B981" /> : '—') : f.premium}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {typeof f.elite === 'boolean' ? (f.elite ? <Check size={16} color="var(--primary)" /> : '—') : f.elite}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. LOCKER LIST SUBTAB */}
      {activeTab === 'lockers' && (
        <div className="activity-card">
          <div className="activity-header">
            <span style={{ fontWeight: 800 }}>Plan Locker Allocations & Surcharges</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Plan Tier</th>
                  <th>Designated Locker Zone</th>
                  <th>Security Tech</th>
                  <th>Complimentary / Fee</th>
                  <th>Availability</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700 }}>Basic Membership</td>
                  <td>Zone A</td>
                  <td>Key Padlock</td>
                  <td>৳500 / month surcharge</td>
                  <td><span className="badge badge-success">38 Slots Free</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Standard Fitness</td>
                  <td>Zone B (Digital)</td>
                  <td>Digital PIN Pad</td>
                  <td>Complimentary</td>
                  <td><span className="badge badge-success">24 Slots Free</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Premium Pro</td>
                  <td>Zone VIP (Executive)</td>
                  <td>RFID Card & Keypad</td>
                  <td>Complimentary</td>
                  <td><span className="badge badge-success">15 Slots Free</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Elite VIP Athlete</td>
                  <td>VIP Suite (Master)</td>
                  <td>Biometric Smart Sensor</td>
                  <td>Complimentary Private Suite</td>
                  <td><span className="badge badge-success">6 Suites Free</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
