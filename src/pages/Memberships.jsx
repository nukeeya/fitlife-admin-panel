import { Check } from 'lucide-react';
import { membershipPlans } from '../data/gymData';

export default function Memberships() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">MEMBERSHIP PLANS</h1>
          <p className="page-subtitle">CHOOSE THE PLAN THAT FITS YOUR GOALS.</p>
        </div>
      </div>

      <div className="plans-grid">
        {membershipPlans.map((plan) => (
          <div
            key={plan.name}
            className={`plan-card ${plan.popular ? 'popular' : ''}`}
          >
            {plan.popular && <div className="popular-badge">MOST POPULAR</div>}
            <h3 className="plan-name">{plan.name}</h3>
            <div className="plan-price">
              <span className="price-amount">{plan.price}</span>
              <span className="price-period">{plan.period}</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}>
                  <Check size={16} className="check-icon" />
                  {f}
                </li>
              ))}
            </ul>
            <button className={plan.popular ? 'btn-primary plan-btn' : 'btn-outline plan-btn'}>
              EDIT PLAN
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
