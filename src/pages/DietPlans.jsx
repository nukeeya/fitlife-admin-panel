import { useState } from 'react';
import {
  Apple,
  Sparkles,
  Flame,
  PieChart,
  UserCheck,
  CheckCircle2,
  Clock,
  Utensils,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function DietPlans() {
  const { members } = useGymData();

  const [dietGoal, setDietGoal] = useState('Muscle Building (Hypertrophy)');
  const [caloricTarget, setCaloricTarget] = useState('2,800 kcal');
  const [dietaryPref, setDietaryPref] = useState('Non-Vegetarian (High Protein)');
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 1);

  const [dietPlansList, setDietPlansList] = useState([
    {
      id: 1,
      name: 'Lean Muscle Gain Protocol',
      target: 'Muscle Building',
      calories: '2,800 kcal',
      protein: '180g',
      carbs: '320g',
      fats: '75g',
      meals: [
        { time: '07:30 AM', name: 'Breakfast', detail: 'Oats with banana, 4 boiled egg whites, 1 scoop whey protein, almonds' },
        { time: '10:30 AM', name: 'Mid-Morning Snack', detail: 'Greek yogurt with blueberries and chia seeds' },
        { time: '01:30 PM', name: 'Lunch', detail: 'Grilled chicken breast (200g) with brown rice (150g) and steamed broccoli' },
        { time: '05:00 PM', name: 'Pre-Workout Fuel', detail: 'Whole grain toast with peanut butter & black coffee' },
        { time: '08:30 PM', name: 'Dinner', detail: 'Salmon fillet with roasted sweet potatoes and olive oil garden salad' },
      ],
    },
    {
      id: 2,
      name: 'Fat Loss Shred & Tone',
      target: 'Weight Loss & Caloric Deficit',
      calories: '1,850 kcal',
      protein: '165g',
      carbs: '140g',
      fats: '55g',
      meals: [
        { time: '08:00 AM', name: 'Breakfast', detail: '3 Egg white spinach omelette with whole grain toast' },
        { time: '11:00 AM', name: 'Snack', detail: 'Green apple slices with 1 tbsp almond butter' },
        { time: '01:30 PM', name: 'Lunch', detail: 'Grilled white fish fillet with cauliflower mash and green salad' },
        { time: '05:00 PM', name: 'Pre-Workout', detail: 'Whey protein isolate shake with water & 5g BCAAs' },
        { time: '08:00 PM', name: 'Dinner', detail: 'Lean minced turkey stir-fry with zucchini noodles and bell peppers' },
      ],
    },
    {
      id: 3,
      name: 'Athletic High Energy Balance',
      target: 'Endurance & General Fitness',
      calories: '2,300 kcal',
      protein: '145g',
      carbs: '260g',
      fats: '70g',
      meals: [
        { time: '07:30 AM', name: 'Breakfast', detail: 'Overnight oats with honey, mixed berries, and chia seeds' },
        { time: '11:00 AM', name: 'Snack', detail: 'Boiled chickpeas salad with cucumber and lemon dressing' },
        { time: '01:30 PM', name: 'Lunch', detail: 'Grilled chicken sandwich on sourdough bread with avocado' },
        { time: '05:00 PM', name: 'Snack', detail: 'Fruit bowl with walnuts and cottage cheese' },
        { time: '08:00 PM', name: 'Dinner', detail: 'Baked chicken thighs with jasmine rice and asparagus' },
      ],
    },
  ]);

  const handleGenerateDiet = (e) => {
    e.preventDefault();
    const newPlan = {
      id: dietPlansList.length + 1,
      name: `AI Custom ${dietGoal} Plan`,
      target: dietGoal,
      calories: caloricTarget,
      protein: '175g',
      carbs: '220g',
      fats: '65g',
      meals: [
        { time: '08:00 AM', name: 'Breakfast', detail: 'High protein oatmeal bowl with whey and crushed walnuts' },
        { time: '01:00 PM', name: 'Lunch', detail: 'Grilled lean chicken with quinoa and fresh leafy salad' },
        { time: '05:00 PM', name: 'Snack', detail: 'Greek yogurt with mixed berries' },
        { time: '08:30 PM', name: 'Dinner', detail: 'Fish fillet with sweet potato and sauteed vegetables' },
      ],
    };
    setDietPlansList([newPlan, ...dietPlansList]);
    alert(`AI Diet Plan generated for ${members.find(m => m.id === Number(selectedMemberId))?.name}!`);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">AI Personalized Diet & Nutrition Planner</h1>
          <p className="page-subtitle">
            Calculate basal metabolic rate (BMR), generate tailored macro targets, and design structured daily meal timelines.
          </p>
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

              {/* Macro Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'var(--bg-surface)', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Protein</span>
                  <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{plan.protein}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Carbs</span>
                  <div style={{ fontWeight: 800, color: '#06B6D4' }}>{plan.carbs}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Fats</span>
                  <div style={{ fontWeight: 800, color: '#F59E0B' }}>{plan.fats}</div>
                </div>
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
