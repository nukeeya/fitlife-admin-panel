import { useState } from 'react';
import { Flame, Users, Clock, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { dietPlans } from '../data/gymData';

function MacroBar({ label, value, color }) {
  return (
    <div className="macro-item">
      <span className="macro-label">{label}</span>
      <span className="macro-value" style={{ color }}>{value}</span>
    </div>
  );
}

function DietPlanCard({ plan }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`diet-card ${expanded ? 'expanded' : ''}`}>
      <div className="diet-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="diet-card-top">
          <div>
            <h3 className="diet-plan-name">{plan.name}</h3>
            <span className="diet-target">{plan.target}</span>
          </div>
          <div className="diet-expand-btn">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        <div className="diet-macros">
          <MacroBar label="CALORIES" value={plan.calories} color="var(--lime)" />
          <MacroBar label="PROTEIN" value={plan.protein} color="var(--white)" />
          <MacroBar label="CARBS" value={plan.carbs} color="var(--gray)" />
          <MacroBar label="FATS" value={plan.fats} color="var(--gray-dark)" />
        </div>

        <div className="diet-card-meta">
          <div className="diet-meta-item">
            <Clock size={14} />
            <span>{plan.duration}</span>
          </div>
          <div className="diet-meta-item">
            <Users size={14} />
            <span>{plan.members} MEMBERS</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="diet-meals">
          <h4 className="meals-title">
            <Flame size={16} className="meals-icon" />
            DAILY MEAL PLAN
          </h4>
          <div className="meals-timeline">
            {plan.meals.map((m, i) => (
              <div key={i} className="meal-row">
                <div className="meal-time">{m.time}</div>
                <div className="meal-dot" />
                <div className="meal-desc">{m.meal}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DietPlans() {
  const [filter, setFilter] = useState('All');
  const targets = ['All', ...new Set(dietPlans.map((p) => p.target))];

  const filtered = filter === 'All'
    ? dietPlans
    : dietPlans.filter((p) => p.target === filter);

  const totalMembers = dietPlans.reduce((sum, p) => sum + p.members, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">DIET PLANS</h1>
          <p className="page-subtitle">
            {dietPlans.length} PLANS ·{' '}
            <span className="highlight-number">{totalMembers.toLocaleString()}</span> MEMBERS ON PLAN
          </p>
        </div>
        <div className="header-actions">
          <div className="diet-filters">
            {targets.map((t) => (
              <button
                key={t}
                className={`diet-filter-btn ${filter === t ? 'active' : ''}`}
                onClick={() => setFilter(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="btn-primary">
            <Plus size={16} /> ADD PLAN
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-title">TOTAL PLANS</span>
          <div className="stat-value">{dietPlans.length}</div>
        </div>
        <div className="stat-card">
          <span className="stat-title">ACTIVE MEMBERS</span>
          <div className="stat-value">{totalMembers.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <span className="stat-title">AVG CALORIES</span>
          <div className="stat-value">2,280</div>
        </div>
        <div className="stat-card">
          <span className="stat-title">MOST POPULAR</span>
          <div className="stat-value" style={{ fontSize: '22px' }}>Balanced Wellness</div>
        </div>
      </div>

      {/* Diet Plan Cards */}
      <div className="diet-plans-list">
        {filtered.map((plan) => (
          <DietPlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
