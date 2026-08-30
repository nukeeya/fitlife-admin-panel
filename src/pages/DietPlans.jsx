import { useState, useEffect } from 'react';
import { Flame, Users, Clock, ChevronDown, ChevronUp, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

      {expanded && plan.meals && plan.meals.length > 0 && (
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
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchDietPlans();
  }, []);

  async function fetchDietPlans() {
    const { data: dietData, error } = await supabase
      .from('diet_plans')
      .select('*')
      .order('id', { ascending: true });

    if (!error && dietData) {
      // Fetch meals for each plan
      const plansWithMeals = await Promise.all(
        dietData.map(async (plan) => {
          const { data: meals } = await supabase
            .from('diet_plan_meals')
            .select('time, meal')
            .eq('diet_plan_id', plan.id)
            .order('sort_order', { ascending: true });

          return {
            id: plan.id,
            name: plan.name,
            target: plan.target,
            calories: plan.calories,
            protein: plan.protein,
            carbs: plan.carbs,
            fats: plan.fats,
            duration: plan.duration,
            members: plan.member_count,
            meals: meals || [],
          };
        })
      );
      setPlans(plansWithMeals);
    }
    setLoading(false);
  }

  const targets = ['All', ...new Set(plans.map((p) => p.target))];

  const filtered = filter === 'All'
    ? plans
    : plans.filter((p) => p.target === filter);

  const totalMembers = plans.reduce((sum, p) => sum + p.members, 0);

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--lime)' }} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">DIET PLANS</h1>
          <p className="page-subtitle">
            {plans.length} PLANS ·{' '}
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
          <div className="stat-value">{plans.length}</div>
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
