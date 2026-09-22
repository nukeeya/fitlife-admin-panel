import React, { useState, useMemo } from 'react';
import {
  Activity,
  Zap,
  Clock,
  Download,
  Plus,
  CheckCircle2,
  Info,
  RefreshCw,
  Shield,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Target
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import {
  generateWorkoutProgram,
  evaluateProgressiveOverload,
  adaptSession
} from '../utils/workoutEngine';
import { calculateBMI } from '../utils/fitnessCalculations';
import { getResearchSourcesForGoal } from '../data/fitnessResearchSources';
import { generateFitnessPlanPDF } from '../utils/planPdfGenerator';
import IntakeProfileModal from '../components/fitness/IntakeProfileModal';
import ResearchPipelineModal from '../components/fitness/ResearchPipelineModal';

export default function AIWorkoutManagement() {
  const { members, branding, saveWorkoutPlan, logMemberProgress } = useGymData();

  // Selected Member
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 1);
  const activeMember = members.find((m) => m.id === Number(selectedMemberId)) || members[0] || {
    name: 'Rahim Ahmed',
    gender: 'Male',
    age: 28,
    weight: 76,
    height: 175
  };

  // Modals
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState(null);

  // Active Profile
  const [clientProfile, setClientProfile] = useState({
    name: activeMember.name,
    age: 28,
    gender: activeMember.gender || 'Male',
    weight: 76,
    height: 175,
    targetWeight: 72,
    goal: 'hypertrophy',
    experience: 'intermediate',
    trainingDaysPerWeek: 4,
    sessionDuration: 60,
    equipment: 'full_gym',
    limitations: 'None',
    averageSleepHours: 7.5,
    dailyStepCount: 8000
  });

  // Current Generated Workout Program
  const [workoutProgram, setWorkoutProgram] = useState(() =>
    generateWorkoutProgram({
      goal: 'hypertrophy',
      experience: 'intermediate',
      trainingDaysPerWeek: 4,
      sessionDuration: 60,
      equipment: 'full_gym'
    })
  );

  // Active Selected Day Tab
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Progressive Overload Evaluator state
  const [overloadInput, setOverloadInput] = useState({
    exerciseName: 'Barbell Flat Bench Press',
    currentWeight: 70,
    targetRepsMin: 8,
    targetRepsMax: 10,
    set1Reps: 10,
    set2Reps: 10,
    set3Reps: 10,
    rpe: 8,
    stalledSessions: 0
  });
  const [overloadResult, setOverloadResult] = useState(null);
  const [isLogSaved, setIsLogSaved] = useState(false);

  // Active day split object
  const currentDaySplit = workoutProgram.splits[activeDayIndex] || workoutProgram.splits[0];

  // Research sources
  const researchSources = useMemo(() => {
    const rawGoal = clientProfile?.goal || clientProfile?.primaryGoal || 'hypertrophy';
    return getResearchSourcesForGoal(rawGoal);
  }, [clientProfile?.goal, clientProfile?.primaryGoal]);

  // Handle Intake Modal submit
  const handleIntakeSubmit = (profileData) => {
    setPendingProfileData(profileData);
    setIsIntakeOpen(false);
    setIsPipelineOpen(true);
  };

  // Handle Pipeline Complete
  const handlePipelineComplete = () => {
    if (pendingProfileData) {
      const normalizedGoal = pendingProfileData.goal || pendingProfileData.primaryGoal || 'hypertrophy';
      const normalizedExperience = String(pendingProfileData.experience || pendingProfileData.experienceLevel || 'intermediate').toLowerCase();
      const expKey = normalizedExperience.includes('beginner') ? 'beginner' : normalizedExperience.includes('advanced') ? 'advanced' : 'intermediate';
      const normalizedDays = Number(pendingProfileData.trainingDaysPerWeek || pendingProfileData.workoutFrequencyDays) || 4;
      const normalizedDuration = Number(pendingProfileData.sessionDuration || pendingProfileData.sessionDurationMins) || 60;
      const rawEquip = String(pendingProfileData.equipment || pendingProfileData.trainingEnvironment || '').toLowerCase();
      const normalizedEquip = rawEquip.includes('home') ? 'home_minimal' : rawEquip.includes('dumbbell') ? 'dumbbells_only' : 'full_gym';

      const normalizedProfile = {
        ...clientProfile,
        ...pendingProfileData,
        name: pendingProfileData.name || clientProfile.name || 'Member',
        goal: normalizedGoal,
        primaryGoal: normalizedGoal,
        experience: expKey,
        trainingDaysPerWeek: normalizedDays,
        sessionDuration: normalizedDuration,
        equipment: normalizedEquip,
        weight: Number(pendingProfileData.weight || pendingProfileData.weightKg) || 75,
        height: Number(pendingProfileData.height || pendingProfileData.heightCm) || 175,
      };

      setClientProfile(normalizedProfile);

      const newProg = generateWorkoutProgram({
        goal: normalizedGoal,
        experience: expKey,
        trainingDaysPerWeek: normalizedDays,
        sessionDuration: normalizedDuration,
        equipment: normalizedEquip
      });

      setWorkoutProgram(newProg);
      setActiveDayIndex(0);

      saveWorkoutPlan({
        id: Date.now(),
        clientName: normalizedProfile.name,
        memberId: selectedMemberId,
        dateGenerated: new Date().toISOString(),
        program: newProg
      });
    }
    setIsPipelineOpen(false);
  };

  // Handle On-The-Fly Session Adaptation
  const handleAdaptSession = (type) => {
    if (!currentDaySplit) return;
    const adapted = adaptSession(currentDaySplit, type);

    setWorkoutProgram((prev) => {
      const updatedSplits = [...prev.splits];
      updatedSplits[activeDayIndex] = adapted;
      return {
        ...prev,
        splits: updatedSplits
      };
    });
  };

  // Reset current session to default
  const handleResetSession = () => {
    const baseProg = generateWorkoutProgram({
      goal: clientProfile.goal,
      experience: clientProfile.experience,
      trainingDaysPerWeek: clientProfile.trainingDaysPerWeek,
      sessionDuration: clientProfile.sessionDuration,
      equipment: clientProfile.equipment
    });
    setWorkoutProgram((prev) => {
      const updatedSplits = [...prev.splits];
      updatedSplits[activeDayIndex] = baseProg.splits[activeDayIndex];
      return {
        ...prev,
        splits: updatedSplits
      };
    });
  };

  // Evaluate Progressive Overload
  const handleEvaluateOverload = (e) => {
    e.preventDefault();
    const evaluation = evaluateProgressiveOverload({
      exerciseName: overloadInput.exerciseName,
      currentWeight: overloadInput.currentWeight,
      targetRepsMin: Number(overloadInput.targetRepsMin),
      targetRepsMax: Number(overloadInput.targetRepsMax),
      stalledSessions: Number(overloadInput.stalledSessions),
      previousSets: [
        { set: 1, reps: Number(overloadInput.set1Reps) },
        { set: 2, reps: Number(overloadInput.set2Reps) },
        { set: 3, reps: Number(overloadInput.set3Reps) }
      ]
    });
    setOverloadResult(evaluation);
  };

  // Save Progress Log
  const handleSaveProgress = () => {
    if (!overloadResult) return;
    logMemberProgress({
      memberId: selectedMemberId,
      memberName: clientProfile.name,
      exercise: overloadInput.exerciseName,
      weightKg: overloadInput.currentWeight,
      sets: [
        Number(overloadInput.set1Reps),
        Number(overloadInput.set2Reps),
        Number(overloadInput.set3Reps)
      ],
      rpe: overloadInput.rpe,
      recommendation: overloadResult.recommendation,
      action: overloadResult.action
    });
    setIsLogSaved(true);
    setTimeout(() => setIsLogSaved(false), 3000);
  };

  // Handle PDF Export
  const handleDownloadPDF = (type = 'workout') => {
    const w = Number(clientProfile?.weight || clientProfile?.weightKg) || 75;
    const h = Number(clientProfile?.height || clientProfile?.heightCm) || 175;
    const bmiData = calculateBMI(w, h);
    generateFitnessPlanPDF({
      client: {
        ...clientProfile,
        name: clientProfile?.name || activeMember?.name || 'Member',
        weight: w,
        height: h,
        bmi: bmiData.bmi,
        bmiClassification: bmiData.classification
      },
      dietPlan: null,
      workoutPlan: workoutProgram,
      researchSources: researchSources || [],
      branding,
      type
    });
  };

  return (
    <div className="page" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              <Shield size={12} /> Biomechanical & Progressive Overload Engine
            </span>
          </div>
          <h1 className="page-title">AI Periodized Workout Management</h1>
          <p className="page-subtitle">
            Double Progression • Evidence-Based Volume Landmarks • Instant Session Adaptations • A4 PDF Export
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="form-select"
            value={selectedMemberId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedMemberId(id);
              const mem = members.find((m) => m.id === id);
              if (mem) {
                setClientProfile((prev) => ({
                  ...prev,
                  name: mem.name,
                  gender: mem.gender || 'Male'
                }));
              }
            }}
            style={{ minWidth: '180px' }}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsIntakeOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <Plus size={16} />
            Generate New Regime
          </button>
        </div>
      </div>

      {/* Program Summary & Download Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {workoutProgram.title}
            </h3>
            <span style={{
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {workoutProgram.splitStructure}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Client: <strong>{clientProfile.name}</strong> • Level: <strong>{workoutProgram.experience}</strong> • Duration: <strong>{workoutProgram.sessionDuration}</strong> • Progression: <strong>Double Progression</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleDownloadPDF('workout')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Download size={15} />
            Download Workout Plan PDF
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleDownloadPDF('complete')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Download size={15} />
            Download Complete Plan PDF
          </button>
        </div>
      </div>

      {/* Day Split Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '4px' }}>
        {workoutProgram.splits.map((split, idx) => {
          const isActive = idx === activeDayIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveDayIndex(idx)}
              style={{
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                background: isActive ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-card)',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              Day {idx + 1}: {split.day.split('-')[0]?.trim()}
            </button>
          );
        })}
      </div>

      {/* Active Day Workout Card */}
      {currentDaySplit && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '2rem',
          overflow: 'hidden'
        }}>
          {/* Day Header with Adaptation Quick Actions */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--border-color)',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentDaySplit.day}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} /> Est. Duration: {currentDaySplit.duration || workoutProgram.sessionDuration} • Focus: {currentDaySplit.targetFocus || 'Compound & Hypertrophy'}
              </div>
            </div>

            {/* Instant Adaptation Controls */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
                Instant Adapt:
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => handleAdaptSession('time_crunch_30')}
                style={{ fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Condense session into 30-min antagonistic supersets"
              >
                ⚡ 30-Min Express
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => handleAdaptSession('knee_friendly')}
                style={{ fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Replace axial knee loads with posterior-chain movements"
              >
                🦵 Knee-Friendly
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => handleAdaptSession('busy_gym')}
                style={{ fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Swap squat rack and barbells for dumbbells"
              >
                🏋️ Busy Gym (DBs)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleResetSession}
                style={{ fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Reset session to original prescription"
              >
                <RefreshCw size={12} /> Reset
              </button>
            </div>
          </div>

          {/* Adaptation Notice if active */}
          {currentDaySplit.adaptationNotice && (
            <div style={{
              padding: '0.75rem 1.25rem',
              background: 'rgba(239, 68, 68, 0.08)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '0.82rem',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Zap size={14} />
              <span><strong>Session Adapted:</strong> {currentDaySplit.adaptationNotice}</span>
            </div>
          )}

          {/* Exercise Table */}
          <div style={{ padding: '0.75rem 1.25rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>Exercise Name</th>
                  <th style={{ padding: '8px 6px' }}>Working Sets</th>
                  <th style={{ padding: '8px 6px' }}>Target Reps & RPE</th>
                  <th style={{ padding: '8px 6px' }}>Rest</th>
                  <th style={{ padding: '8px 6px' }}>Tempo</th>
                  <th style={{ padding: '8px 6px' }}>Biomechanical Cue</th>
                </tr>
              </thead>
              <tbody>
                {currentDaySplit.exercises.map((ex, exIdx) => (
                  <tr key={exIdx} style={{ borderBottom: exIdx < currentDaySplit.exercises.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none' }}>
                    <td style={{ padding: '12px 6px', fontWeight: 600, color: 'var(--text-main)', maxWidth: '240px' }}>
                      <div>{ex.name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {ex.muscle || ex.equipment}
                      </div>
                    </td>
                    <td style={{ padding: '12px 6px', fontWeight: 700, color: 'var(--primary)' }}>
                      {ex.sets}
                    </td>
                    <td style={{ padding: '12px 6px', color: 'var(--text-main)', fontWeight: 600 }}>
                      {ex.reps} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>({ex.rpe || 'RPE 8'})</span>
                    </td>
                    <td style={{ padding: '12px 6px', color: 'var(--text-muted)' }}>
                      {ex.rest}
                    </td>
                    <td style={{ padding: '12px 6px', color: '#10b981', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {ex.tempo || '3-0-1-0'}
                    </td>
                    <td style={{ padding: '12px 6px', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '320px', lineHeight: 1.4 }}>
                      {ex.techniqueCue || 'Maintain controlled eccentric; brace core throughout range of motion.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Progressive Overload Evaluator & Tracker */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '2rem'
      }}>
        {/* Overload Logger Form */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <TrendingUp color="var(--primary)" size={18} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Double Progression Evaluator
            </h3>
          </div>

          <form onSubmit={handleEvaluateOverload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Compound Lift</label>
              <select
                className="form-select"
                value={overloadInput.exerciseName}
                onChange={(e) => setOverloadInput({ ...overloadInput, exerciseName: e.target.value })}
              >
                <option value="Barbell Flat Bench Press">Barbell Flat Bench Press</option>
                <option value="Barbell Back Squat">Barbell Back Squat</option>
                <option value="Conventional Deadlift">Conventional Deadlift</option>
                <option value="Standing Overhead Press">Standing Overhead Press</option>
                <option value="Barbell Bent-Over Row">Barbell Bent-Over Row</option>
                <option value="Incline Dumbbell Press">Incline Dumbbell Press</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Current Load (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={overloadInput.currentWeight}
                  onChange={(e) => setOverloadInput({ ...overloadInput, currentWeight: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Target Rep Range</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={overloadInput.targetRepsMin}
                    onChange={(e) => setOverloadInput({ ...overloadInput, targetRepsMin: e.target.value })}
                    style={{ width: '60px' }}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    className="form-input"
                    value={overloadInput.targetRepsMax}
                    onChange={(e) => setOverloadInput({ ...overloadInput, targetRepsMax: e.target.value })}
                    style={{ width: '60px' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Completed Working Sets (Reps)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Set 1</span>
                  <input
                    type="number"
                    className="form-input"
                    value={overloadInput.set1Reps}
                    onChange={(e) => setOverloadInput({ ...overloadInput, set1Reps: e.target.value })}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Set 2</span>
                  <input
                    type="number"
                    className="form-input"
                    value={overloadInput.set2Reps}
                    onChange={(e) => setOverloadInput({ ...overloadInput, set2Reps: e.target.value })}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Set 3</span>
                  <input
                    type="number"
                    className="form-input"
                    value={overloadInput.set3Reps}
                    onChange={(e) => setOverloadInput({ ...overloadInput, set3Reps: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Activity size={16} />
              Evaluate Progression Stimulus
            </button>
          </form>
        </div>

        {/* Evaluator Output Card */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Progression Analysis & Prescription
              </h3>
              {overloadResult && (
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: overloadResult.color ? `${overloadResult.color}20` : 'rgba(239, 68, 68, 0.15)',
                  color: overloadResult.color || 'var(--primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                  {overloadResult.badge}
                </span>
              )}
            </div>

            {overloadResult ? (
              <div>
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Prescribed Next Session Action
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: overloadResult.color || 'var(--primary)', marginTop: '4px' }}>
                    {overloadResult.recommendation}
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-main)' }}>Scientific Justification: </strong>
                  {overloadResult.scientificReason}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <Target size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  Log the member's current working set reps and click <strong>Evaluate Progression Stimulus</strong> to generate scientific weight increment or deload guidance.
                </p>
              </div>
            )}
          </div>

          {overloadResult && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleSaveProgress}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {isLogSaved ? <CheckCircle2 color="#10b981" size={16} /> : <Plus size={16} />}
                {isLogSaved ? 'Progress Saved to Member Record!' : 'Save to Member Record'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Research Citations */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <BookOpen color="var(--primary)" size={18} />
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Exercise Physiology & Hypertrophy Literature
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {researchSources.map((source) => (
            <div
              key={source.id}
              style={{
                padding: '1rem',
                borderRadius: '10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--primary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  marginBottom: '6px'
                }}>
                  {source.institution}
                </span>
                <h5 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.4 }}>
                  {source.title}
                </h5>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {source.authors} ({source.year}) • {source.journal}
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                  {source.finding}
                </p>
              </div>

              {source.pubmedUrl && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <a
                    href={source.pubmedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    View PubMed Reference <ArrowRight size={12} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Intake Profile Modal */}
      <IntakeProfileModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        initialProfile={clientProfile}
        onSubmit={handleIntakeSubmit}
        mode="workout"
      />

      {/* Research Synthesis Pipeline Simulation Modal */}
      <ResearchPipelineModal
        isOpen={isPipelineOpen}
        onClose={() => setIsPipelineOpen(false)}
        onComplete={handlePipelineComplete}
      />
    </div>
  );
}
