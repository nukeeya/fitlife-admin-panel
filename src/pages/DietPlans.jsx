import { useState } from 'react';
import { Flame, Users, Clock, ChevronDown, ChevronUp, Plus, Sparkles, Apple, CheckCircle2 } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
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
                <div className="meal-desc">{m.meal || m.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DietPlans() {
  const { members: liveMembers } = useGymData();
  const members = liveMembers || [];

  const [dietPlansList, setDietPlansList] = useState(dietPlans);
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 1);
  const [dietGoal, setDietGoal] = useState('Muscle Building (Hypertrophy)');
  const [caloricTarget, setCaloricTarget] = useState('2,200 kcal');
  const [dietaryPref, setDietaryPref] = useState('Non-Vegetarian (High Protein)');
  const [isGenerated, setIsGenerated] = useState(false);

  const totalMembers = dietPlansList.reduce((sum, p) => sum + (p.members || 1), 0);

  const handleGenerateDiet = (e) => {
    e.preventDefault();
    const assignedMember = members.find((m) => m.id === Number(selectedMemberId));
    const memberName = assignedMember ? assignedMember.name : 'Member';

    const newPlan = {
      id: Date.now(),
      name: `${memberName}'s ${dietGoal.split(' ')[0]} Protocol`,
      target: `${dietGoal} • ${dietaryPref}`,
      calories: caloricTarget,
      protein: '165g',
      carbs: '220g',
      fats: '55g',
      duration: '4 WEEKS',
      members: 1,
      meals: [
        { time: '08:00 AM', name: 'Power Breakfast', detail: 'High-protein oatmeal, whey isolate, blueberries & flaxseed' },
        { time: '01:00 PM', name: 'Anabolic Lunch', detail: 'Lean chicken breast / paneer, brown rice, broccoli & olive oil' },
        { time: '05:00 PM', name: 'Pre-Workout Fuel', detail: 'Greek yogurt with banana, honey and rice cakes' },
        { time: '08:30 PM', name: 'Recovery Dinner', detail: 'Grilled salmon / egg whites, sweet potato mash & asparagus' },
      ],
    };

    setDietPlansList([newPlan, ...dietPlansList]);
    setIsGenerated(true);
    setTimeout(() => setIsGenerated(false), 3000);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">AI Personalized Diet & Nutrition Planner</h1>
          <p className="page-subtitle">
            {dietPlans.length} PLANS ·{' '}
            <span className="highlight-number">{totalMembers.toLocaleString()}</span> MEMBERS ON PLAN
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
          <div className="stat-value" style={{ fontSize: '20px' }}>Balanced Wellness</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '20px' }}>
        {/* Diet Generator Controls */}
        <div className="activity-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary)" />
            AI Nutrition Synthesizer
          </h2>

          <form onSubmit={handleGenerateDiet} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Assign to Member</label>
              <select
                className="form-select"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code} - {m.plan})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Body Goal</label>
              <select
                className="form-select"
                value={dietGoal}
                onChange={(e) => setDietGoal(e.target.value)}
              >
                <option value="Muscle Building (Hypertrophy)">Muscle Building (Hypertrophy)</option>
                <option value="Fat Loss Shred (Deficit)">Fat Loss Shred (Deficit)</option>
                <option value="Lean Mass Maintenance">Lean Mass Maintenance</option>
                <option value="Athletic Peak Performance">Athletic Peak Performance</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Caloric Target (Daily)</label>
              <select
                className="form-select"
                value={caloricTarget}
                onChange={(e) => setCaloricTarget(e.target.value)}
              >
                <option value="1,800 kcal">1,800 kcal (Aggressive Cut)</option>
                <option value="2,200 kcal">2,200 kcal (Moderate Cut / Maintenance)</option>
                <option value="2,800 kcal">2,800 kcal (Lean Bulk)</option>
                <option value="3,400 kcal">3,400 kcal (Heavy Hypertrophy Surplus)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Dietary Preference</label>
              <select
                className="form-select"
                value={dietaryPref}
                onChange={(e) => setDietaryPref(e.target.value)}
              >
                <option value="Non-Vegetarian (High Protein)">Non-Vegetarian (High Protein)</option>
                <option value="Pescatarian (Fish & Seafood)">Pescatarian (Fish & Seafood)</option>
                <option value="Vegetarian / Egg-Tarian">Vegetarian / Egg-Tarian</option>
                <option value="Strict Plant-Based Vegan">Strict Plant-Based Vegan</option>
                <option value="Keto / Low-Carb High-Fat">Keto / Low-Carb High-Fat</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              <Apple size={16} />
              Generate AI Diet Plan
            </button>

            {isGenerated && (
              <div className="badge badge-success" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <CheckCircle2 size={16} /> Diet Plan Generated Successfully!
              </div>
            )}
          </form>
        </div>

        {/* Diet Plans List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {dietPlansList.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-base)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>{plan.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{plan.target}</span>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '12px' }}>
                  🔥 {plan.calories}
                </span>
              </div>

              {/* Meals Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {plan.meals.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '12px',
                      fontSize: '12px',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--primary)', minWidth: '70px' }}>
                      {m.time}
                    </span>
                    <div>
                      <strong>{m.name}:</strong> <span style={{ color: 'var(--text-secondary)' }}>{m.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
