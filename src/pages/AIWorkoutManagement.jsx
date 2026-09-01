import { useState } from 'react';
import {
  Cpu,
  Sparkles,
  Dumbbell,
  Target,
  UserCheck,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function AIWorkoutManagement() {
  const { members } = useGymData();

  // Generator form
  const [goal, setGoal] = useState('Hypertrophy (Muscle Gain)');
  const [level, setLevel] = useState('Intermediate');
  const [days, setDays] = useState('4 Days / Week');
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState({
    title: '4-Day Hypertrophy & Progressive Overload Split',
    target: 'Chest, Back, Delts & Quads',
    splits: [
      {
        day: 'Day 1 - Push Focus (Chest, Shoulders, Triceps)',
        exercises: [
          { name: 'Incline Barbell Bench Press', sets: '4 Sets', reps: '8-10 Reps', rest: '90s' },
          { name: 'Dumbbell Flat Press', sets: '3 Sets', reps: '10-12 Reps', rest: '60s' },
          { name: 'Standing Overhead Military Press', sets: '4 Sets', reps: '8 Reps', rest: '90s' },
          { name: 'Cable Lateral Raises (Drop-set)', sets: '3 Sets', reps: '15 Reps', rest: '45s' },
          { name: 'Triceps Rope Pushdowns', sets: '3 Sets', reps: '12-15 Reps', rest: '45s' },
        ],
      },
      {
        day: 'Day 2 - Pull Focus (Back, Rear Delts, Biceps)',
        exercises: [
          { name: 'Deadlifts (Conventional)', sets: '4 Sets', reps: '6 Reps', rest: '120s' },
          { name: 'Lat Pulldowns (Wide Grip)', sets: '3 Sets', reps: '10-12 Reps', rest: '60s' },
          { name: 'Seated Cable Rows', sets: '3 Sets', reps: '10 Reps', rest: '60s' },
          { name: 'Incline Dumbbell Bicep Curls', sets: '3 Sets', reps: '12 Reps', rest: '45s' },
          { name: 'Hammer Curls', sets: '3 Sets', reps: '12 Reps', rest: '45s' },
        ],
      },
      {
        day: 'Day 3 - Rest & Active Mobility Recovery',
        exercises: [
          { name: 'Foam Rolling & Hamstring Stretches', sets: '15 Mins', reps: 'Slow tempo', rest: '—' },
          { name: 'Light Zone 2 Cardio Walk', sets: '20 Mins', reps: 'Heart rate ~110bpm', rest: '—' },
        ],
      },
      {
        day: 'Day 4 - Legs & Core Power',
        exercises: [
          { name: 'Barbell Back Squats', sets: '4 Sets', reps: '8 Reps', rest: '120s' },
          { name: 'Romanian Deadlifts (RDL)', sets: '3 Sets', reps: '10 Reps', rest: '90s' },
          { name: 'Leg Press (Quad Focus)', sets: '3 Sets', reps: '12-15 Reps', rest: '60s' },
          { name: 'Hanging Leg Raises', sets: '3 Sets', reps: '15 Reps', rest: '45s' },
        ],
      },
    ],
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedRoutine({
        title: `${days} Customized ${goal} Architecture`,
        target: `${level} Fitness Archetype`,
        splits: [
          {
            day: 'Day 1 - Upper Power & Strength',
            exercises: [
              { name: 'Barbell Bench Press', sets: '4 Sets', reps: '6-8 Reps', rest: '90s' },
              { name: 'Bent-Over Barbell Rows', sets: '4 Sets', reps: '8 Reps', rest: '90s' },
              { name: 'Overhead DB Press', sets: '3 Sets', reps: '10 Reps', rest: '60s' },
              { name: 'EZ-Bar Skullcrushers', sets: '3 Sets', reps: '12 Reps', rest: '45s' },
            ],
          },
          {
            day: 'Day 2 - Lower Hypertrophy & Quads',
            exercises: [
              { name: 'Barbell Squats', sets: '4 Sets', reps: '8-10 Reps', rest: '120s' },
              { name: 'Walking Dumbbell Lunges', sets: '3 Sets', reps: '12 per leg', rest: '60s' },
              { name: 'Standing Calf Raises', sets: '4 Sets', reps: '15 Reps', rest: '45s' },
            ],
          },
        ],
      });
      alert('AI Workout Generated and synced!');
    }, 800);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">AI Workout Management Engine</h1>
          <p className="page-subtitle">
            Generate progressive overload regimes, periodized split routines, and assign regimes directly to members.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
        {/* Generator Controls */}
        <div className="activity-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary)" />
            AI Regime Parameters
          </h2>

          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Assign To Member</label>
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
              <label className="form-label">Primary Fitness Goal</label>
              <select
                className="form-select"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="Hypertrophy (Muscle Gain)">Hypertrophy (Muscle Gain)</option>
                <option value="Fat Loss & Calorie Burn">Fat Loss & Conditioning</option>
                <option value="Raw Strength (Powerlifting)">Raw Strength (Powerlifting)</option>
                <option value="Endurance & Functional HIIT">Endurance & Functional HIIT</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level</label>
              <select
                className="form-select"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="Beginner (0-6 months)">Beginner (0-6 months)</option>
                <option value="Intermediate (1-3 years)">Intermediate (1-3 years)</option>
                <option value="Advanced / Athlete (3+ years)">Advanced / Athlete (3+ years)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Training Frequency</label>
              <select
                className="form-select"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              >
                <option value="3 Days / Week (Full Body)">3 Days / Week (Full Body)</option>
                <option value="4 Days / Week (Upper / Lower)">4 Days / Week (Upper / Lower)</option>
                <option value="5 Days / Week (Push / Pull / Legs)">5 Days / Week (Push / Pull / Legs)</option>
                <option value="6 Days / Week (Pro Athlete Split)">6 Days / Week (Pro Athlete Split)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isGenerating}>
              <Cpu size={16} />
              {isGenerating ? 'Synthesizing Biometrics...' : 'Generate AI Workout Split'}
            </button>
          </form>
        </div>

        {/* Generated Workout Plan Visualization */}
        <div className="activity-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-base)', paddingBottom: '12px' }}>
            <div>
              <span className="badge badge-primary">AI Synthesized Plan</span>
              <h2 style={{ fontSize: '18px', fontWeight: 900, marginTop: '4px' }}>{generatedRoutine.title}</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{generatedRoutine.target}</span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => alert(`Assigned to member ${members.find(m => m.id === Number(selectedMemberId))?.name} successfully!`)}
            >
              <UserCheck size={14} /> Assign Regime
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
            {generatedRoutine.splits.map((split, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-base)',
                }}
              >
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
                  {split.day}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {split.exercises.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        padding: '4px 0',
                        borderBottom: exIdx < split.exercises.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>• {ex.name}</span>
                      <div style={{ display: 'flex', gap: '10px', color: 'var(--text-secondary)' }}>
                        <span>{ex.sets}</span>
                        <span>{ex.reps}</span>
                        <span>Rest: {ex.rest}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
