import React, { useState, useMemo } from 'react';
import {
  Activity,
  Zap,
  Clock,
  Download,
  Plus,
  CheckCircle2,
  RefreshCw,
  Shield,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Target,
  Cpu,
  Edit2,
  Save,
  ExternalLink,
  Search,
  Check,
  AlertCircle,
  Dumbbell,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import {
  generateWorkoutProgram,
  evaluateProgressiveOverload,
  adaptSession,
} from '../utils/workoutEngine';
import { calculateBMI } from '../utils/fitnessCalculations';
import { getResearchSourcesForGoal } from '../data/fitnessResearchSources';
import { generateFitnessPlanPDF } from '../utils/planPdfGenerator';
import IntakeProfileModal from '../components/fitness/IntakeProfileModal';
import ResearchPipelineModal from '../components/fitness/ResearchPipelineModal';
import {
  generateGeminiWorkoutPlan,
  GROUNDING_SOURCES_WORKOUT,
} from '../services/geminiFitnessService';

export default function AIWorkoutManagement() {
  const { members, branding, saveWorkoutPlan, logMemberProgress } = useGymData();

  // Selected Member
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 1);
  const activeMember = members.find((m) => m.id === Number(selectedMemberId)) || members[0] || {
    name: 'Rahim Ahmed',
    gender: 'Male',
    age: 28,
    weight: 76,
    height: 175,
  };

  // Modals
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState(null);

  // Form State for Gemini AI Generation
  const [fitnessForm, setFitnessForm] = useState({
    goal: 'hypertrophy',
    age: 28,
    height: 175,
    weight: 76,
    experience: 'intermediate',
    equipment: 'full_gym',
    frequency: 4,
    limitations: 'None',
  });

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
    dailyStepCount: 8000,
  });

  // Current Generated Workout Program
  const [workoutProgram, setWorkoutProgram] = useState(() =>
    generateWorkoutProgram({
      goal: 'hypertrophy',
      experience: 'intermediate',
      trainingDaysPerWeek: 4,
      sessionDuration: 60,
      equipment: 'full_gym',
    })
  );

  // Active Selected Day Tab
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPlanSaved, setIsPlanSaved] = useState(false);
  const [showGroundingSources, setShowGroundingSources] = useState(true);

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
    stalledSessions: 0,
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

  // Handle member selection change
  const handleMemberChange = (id) => {
    const numId = Number(id);
    setSelectedMemberId(numId);
    const mem = members.find((m) => m.id === numId);
    if (mem) {
      setClientProfile((prev) => ({
        ...prev,
        name: mem.name,
        gender: mem.gender || 'Male',
      }));
    }
  };

  // Generate Workout Plan with simulated Gemini AI
  const handleGenerateGeminiPlan = async () => {
    setIsGenerating(true);
    setGenerationStep('Gemini 2.5 Flash analyzing member biometrics & volume landmarks...');

    const stepTimer = setTimeout(() => {
      setGenerationStep('Synthesizing progressive overload parameters & structuring periodized splits...');
    }, 600);

    try {
      const result = await generateGeminiWorkoutPlan({
        member: activeMember,
        profile: fitnessForm,
      });

      // Update workoutProgram with generated split
      const updatedProg = generateWorkoutProgram({
        goal: fitnessForm.goal,
        experience: fitnessForm.experience,
        trainingDaysPerWeek: Number(fitnessForm.frequency),
        sessionDuration: 60,
        equipment: fitnessForm.equipment,
      });

      setClientProfile((prev) => ({
        ...prev,
        goal: fitnessForm.goal,
        experience: fitnessForm.experience,
        trainingDaysPerWeek: Number(fitnessForm.frequency),
        equipment: fitnessForm.equipment,
        limitations: fitnessForm.limitations,
        age: Number(fitnessForm.age),
        height: Number(fitnessForm.height),
        weight: Number(fitnessForm.weight),
      }));

      setWorkoutProgram(updatedProg);
      setActiveDayIndex(0);
      setIsEditMode(false);
    } catch (err) {
      console.error('Gemini plan generation error:', err);
    } finally {
      clearTimeout(stepTimer);
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Save Workout Plan
  const handleSavePlan = () => {
    saveWorkoutPlan({
      id: Date.now(),
      clientName: clientProfile.name,
      memberId: selectedMemberId,
      dateGenerated: new Date().toISOString(),
      program: workoutProgram,
      fitnessForm,
    });
    setIsPlanSaved(true);
    setTimeout(() => setIsPlanSaved(false), 2500);
  };

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
      setFitnessForm((prev) => ({
        ...prev,
        goal: normalizedGoal,
        experience: expKey,
        frequency: normalizedDays,
        equipment: normalizedEquip,
        weight: normalizedProfile.weight,
        height: normalizedProfile.height,
      }));

      const newProg = generateWorkoutProgram({
        goal: normalizedGoal,
        experience: expKey,
        trainingDaysPerWeek: normalizedDays,
        sessionDuration: normalizedDuration,
        equipment: normalizedEquip,
      });

      setWorkoutProgram(newProg);
      setActiveDayIndex(0);

      saveWorkoutPlan({
        id: Date.now(),
        clientName: normalizedProfile.name,
        memberId: selectedMemberId,
        dateGenerated: new Date().toISOString(),
        program: newProg,
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
        splits: updatedSplits,
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
      equipment: clientProfile.equipment,
    });
    setWorkoutProgram((prev) => {
      const updatedSplits = [...prev.splits];
      updatedSplits[activeDayIndex] = baseProg.splits[activeDayIndex];
      return {
        ...prev,
        splits: updatedSplits,
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
        { set: 3, reps: Number(overloadInput.set3Reps) },
      ],
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
        Number(overloadInput.set3Reps),
      ],
      rpe: overloadInput.rpe,
      recommendation: overloadResult.recommendation,
      action: overloadResult.action,
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
        bmiClassification: bmiData.classification,
      },
      dietPlan: null,
      workoutPlan: workoutProgram,
      researchSources: researchSources || [],
      branding,
      type,
    });
  };

  return (
    <div className="page" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(200, 255, 0, 0.12)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              <Cpu size={12} /> Gemini AI & Biomechanical Overload Engine
            </span>
          </div>
          <h1 className="page-title">Make Workout Plan</h1>
          <p className="page-subtitle">
            Google Gemini 2.5 Architecture • Double Progression • Volume Landmarks • A4 PDF Export
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsIntakeOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            Full Biometric Intake Modal
          </button>
        </div>
      </div>

      {/* GEMINI AI INTEGRATION ARCHITECTURE BANNER */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={20} style={{ color: '#3B82F6', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Google Gemini API & Search Grounding Prepared:</strong>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              Frontend parameters and structured JSON response schemas are ready. When your backend engineer connects the Gemini API key, this interface will populate live grounded AI responses.
            </span>
          </div>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '10px' }}>
          Frontend Simulation Mode
        </span>
      </div>

      {/* MEMBER SELECTION & FITNESS INFORMATION FORM */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '18px 20px',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dumbbell size={18} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Member Selection & Fitness Information
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Configures inputs for Gemini AI generation
          </span>
        </div>

        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Member Selection */}
          <div className="form-group">
            <label className="form-label">Select Gym Member *</label>
            <select
              className="form-select"
              value={selectedMemberId}
              onChange={(e) => handleMemberChange(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code || `FLM-${m.id}`})
                </option>
              ))}
            </select>
          </div>

          {/* Fitness Goal */}
          <div className="form-group">
            <label className="form-label">Primary Fitness Goal *</label>
            <select
              className="form-select"
              value={fitnessForm.goal}
              onChange={(e) => setFitnessForm((prev) => ({ ...prev, goal: e.target.value }))}
            >
              <option value="hypertrophy">Muscle Hypertrophy (Mass Building)</option>
              <option value="fat_loss">Fat Loss & Conditioning (Shred)</option>
              <option value="strength">Strength & Power (Powerlifting)</option>
              <option value="longevity">General Fitness & Longevity</option>
              <option value="athletic">Athletic Speed & Explosiveness</option>
            </select>
          </div>

          {/* Age, Height, Weight */}
          <div className="form-group">
            <label className="form-label">Age (Years)</label>
            <input
              type="number"
              min="14"
              max="90"
              className="form-input"
              value={fitnessForm.age}
              onChange={(e) => setFitnessForm((prev) => ({ ...prev, age: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Height (cm)</label>
            <input
              type="number"
              min="120"
              max="230"
              className="form-input"
              value={fitnessForm.height}
              onChange={(e) => setFitnessForm((prev) => ({ ...prev, height: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Weight (kg)</label>
            <input
              type="number"
              min="35"
              max="250"
              className="form-input"
              value={fitnessForm.weight}
              onChange={(e) => setFitnessForm((prev) => ({ ...prev, weight: e.target.value }))}
            />
          </div>

          {/* Training Experience */}
          <div className="form-group">
            <label className="form-label">Training Experience *</label>
            <select
              className="form-select"
              value={fitnessForm.experience}
              onChange={(e) => setFitnessForm((prev) => ({ ...prev, experience: e.target.value }))}
            >
              <option value="beginner">Beginner (&lt; 1 Year of Lifting)</option>
              <option value="intermediate">Intermediate (1 – 3 Years Experience)</option>
              <option value="advanced">Advanced (3+ Years Consistent Training)</option>
            </select>
          </div>

          {/* Available Equipment */}
          <div className="form-group">
            <label className="form-label">Available Equipment *</label>
            <select
              className="form-select"
              value={fitnessForm.equipment}
              onChange={(e) => setFitnessForm((prev) => ({ ...prev, equipment: e.target.value }))}
            >
              <option value="full_gym">Full Commercial Gym (Barbells, Cables, Machines)</option>
              <option value="dumbbells_only">Dumbbells & Adjustable Bench Only</option>
              <option value="home_minimal">Home / Minimal Bodyweight & Bands</option>
            </select>
          </div>

          {/* Workout Frequency */}
          <div className="form-group">
            <label className="form-label">Workout Frequency *</label>
            <select
              className="form-select"
              value={fitnessForm.frequency}
              onChange={(e) => setFitnessForm((prev) => ({ ...prev, frequency: e.target.value }))}
            >
              <option value="3">3 Days / Week (Full Body Split)</option>
              <option value="4">4 Days / Week (Upper / Lower Split)</option>
              <option value="5">5 Days / Week (Push / Pull / Legs + Upper)</option>
              <option value="6">6 Days / Week (Push / Pull / Legs × 2)</option>
            </select>
          </div>

          {/* Physical Limitations */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Relevant Physical Limitations / Joint Sensitivities</label>
            <input
              type="text"
              className="form-input"
              value={fitnessForm.limitations}
              onChange={(e) => setFitnessForm((prev) => ({ ...prev, limitations: e.target.value }))}
              placeholder="e.g. Lower Back Sensitivity, Shoulder Impingement, Knee Pain, None"
            />
          </div>
        </div>

        {/* Generate Workout Plan Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateGeminiPlan}
            disabled={isGenerating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 800 }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="spin-animation" />
                Generating with Gemini AI...
              </>
            ) : (
              <>
                <Cpu size={16} />
                Generate Workout Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI GENERATION LOADING STATE */}
      {isGenerating && (
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--primary)',
            padding: '28px 20px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <RefreshCw size={32} className="spin-animation" style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Synthesizing Workout Plan via Gemini 2.5 Flash
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            {generationStep || 'Processing biomechanical and periodization parameters...'}
          </p>
        </div>
      )}

      {/* PROGRAM SUMMARY BANNER & CONTROLS */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {workoutProgram.title}
            </h3>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(200, 255, 0, 0.12)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {workoutProgram.splitStructure}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Member: <strong>{clientProfile.name}</strong> • Level: <strong>{workoutProgram.experience}</strong> • Duration: <strong>{workoutProgram.sessionDuration}</strong> • Progression: <strong>Double Progression Model</strong>
          </div>
        </div>

        {/* Action Controls: Edit, Regenerate, Save, PDF */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsEditMode((prev) => !prev)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Edit2 size={14} />
            {isEditMode ? 'Exit Edit Mode' : 'Edit Plan'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGenerateGeminiPlan}
            disabled={isGenerating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} />
            Regenerate
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSavePlan}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            {isPlanSaved ? (
              <>
                <Check size={14} />
                Plan Saved!
              </>
            ) : (
              <>
                <Save size={14} />
                Save Plan
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleDownloadPDF('workout')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Download size={14} />
            PDF Export
          </button>
        </div>
      </div>

      {/* WEEKLY SCHEDULE DAY TABS */}
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
                background: isActive ? 'rgba(200, 255, 0, 0.12)' : 'var(--bg-card)',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              Day {idx + 1}: {split.day.split('-')[0]?.trim()}
            </button>
          );
        })}
      </div>

      {/* ACTIVE DAY WORKOUT DETAILS & EXERCISES TABLE */}
      {currentDaySplit && (
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            marginBottom: '2rem',
            overflow: 'hidden',
          }}
        >
          {/* Day Header with Adaptation Quick Actions */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid var(--border-color)',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentDaySplit.day}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} /> Est. Duration: {currentDaySplit.duration || workoutProgram.sessionDuration} • Target Focus: {currentDaySplit.targetFocus || 'Compound & Hypertrophy'}
              </div>
            </div>

            {/* Instant Adaptation Controls */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
                Adapt Session:
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => handleAdaptSession('time_crunch_30')}
                style={{ fontSize: '0.76rem' }}
                title="Condense session into 30-min express protocol"
              >
                30-Min Express
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => handleAdaptSession('knee_friendly')}
                style={{ fontSize: '0.76rem' }}
                title="Knee-friendly posterior-chain substitution"
              >
                Knee-Friendly
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => handleAdaptSession('lower_back_friendly')}
                style={{ fontSize: '0.76rem' }}
                title="Chest-supported back-friendly movements"
              >
                Back-Safe
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleResetSession}
                style={{ fontSize: '0.76rem' }}
                title="Reset session to original plan"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Warm-Up Guidance */}
          {currentDaySplit.warmup && (
            <div
              style={{
                padding: '0.75rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.015)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '0.74rem' }}>
                Mobility & Warmup:
              </span>
              <span>{currentDaySplit.warmup}</span>
            </div>
          )}

          {/* Exercises Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Exercise & Target Muscle</th>
                  <th>Sets × Reps</th>
                  <th>Rest Period</th>
                  <th>Equipment & Form Notes</th>
                </tr>
              </thead>
              <tbody>
                {currentDaySplit.exercises.map((ex, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>
                      {isEditMode ? (
                        <input
                          type="text"
                          className="form-input"
                          value={ex.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWorkoutProgram((prev) => {
                              const splits = [...prev.splits];
                              splits[activeDayIndex].exercises[i].name = val;
                              return { ...prev, splits };
                            });
                          }}
                          style={{ height: '32px', fontSize: '13px' }}
                        />
                      ) : (
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{ex.name}</div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '2px' }}>
                        {ex.muscleGroup || ex.target}
                      </div>
                    </td>

                    <td>
                      {isEditMode ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="number"
                            className="form-input"
                            value={ex.sets}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setWorkoutProgram((prev) => {
                                const splits = [...prev.splits];
                                splits[activeDayIndex].exercises[i].sets = val;
                                return { ...prev, splits };
                              });
                            }}
                            style={{ width: '50px', height: '32px', fontSize: '13px' }}
                          />
                          <span>×</span>
                          <input
                            type="text"
                            className="form-input"
                            value={ex.reps}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWorkoutProgram((prev) => {
                                const splits = [...prev.splits];
                                splits[activeDayIndex].exercises[i].reps = val;
                                return { ...prev, splits };
                              });
                            }}
                            style={{ width: '70px', height: '32px', fontSize: '13px' }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {ex.sets} Sets × {ex.reps} Reps
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                        {ex.rest || '90s'}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {ex.notes || ex.cues || 'Maintain continuous muscular tension with controlled eccentric tempo.'}
                      </div>
                      {ex.equipment && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          Equipment: {ex.equipment}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GROUNDING SOURCES & CITATIONS SECTION (Future Gemini API Grounding) */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '16px 20px',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => setShowGroundingSources((prev) => !prev)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Grounding Sources & Scientific References (Gemini + Google Search Grounding)
            </h3>
            <span className="badge badge-primary" style={{ fontSize: '10px' }}>
              Search Grounded
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {showGroundingSources ? 'Hide Citations' : 'View Citations'}
          </span>
        </div>

        {showGroundingSources && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {GROUNDING_SOURCES_WORKOUT.map((source, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-base)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>{source.title}</span>
                    <ExternalLink size={12} />
                  </a>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {source.publisher}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1.4 }}>
                  {source.snippet}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PROGRESSIVE OVERLOAD EVALUATOR (Double Progression Engine) */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Progressive Overload Evaluator & Micro-Load Adjuster
          </h3>
        </div>

        <form onSubmit={handleEvaluateOverload}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <div className="form-group">
              <label className="form-label">Exercise Name</label>
              <input
                type="text"
                className="form-input"
                value={overloadInput.exerciseName}
                onChange={(e) => setOverloadInput((prev) => ({ ...prev, exerciseName: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Working Weight (kg)</label>
              <input
                type="number"
                className="form-input"
                value={overloadInput.currentWeight}
                onChange={(e) => setOverloadInput((prev) => ({ ...prev, currentWeight: Number(e.target.value) }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Rep Bracket</label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="number"
                  className="form-input"
                  value={overloadInput.targetRepsMin}
                  onChange={(e) => setOverloadInput((prev) => ({ ...prev, targetRepsMin: e.target.value }))}
                />
                <span>–</span>
                <input
                  type="number"
                  className="form-input"
                  value={overloadInput.targetRepsMax}
                  onChange={(e) => setOverloadInput((prev) => ({ ...prev, targetRepsMax: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Set 1, 2, 3 Completed Reps</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  className="form-input"
                  value={overloadInput.set1Reps}
                  onChange={(e) => setOverloadInput((prev) => ({ ...prev, set1Reps: e.target.value }))}
                  placeholder="Set 1"
                />
                <input
                  type="number"
                  className="form-input"
                  value={overloadInput.set2Reps}
                  onChange={(e) => setOverloadInput((prev) => ({ ...prev, set2Reps: e.target.value }))}
                  placeholder="Set 2"
                />
                <input
                  type="number"
                  className="form-input"
                  value={overloadInput.set3Reps}
                  onChange={(e) => setOverloadInput((prev) => ({ ...prev, set3Reps: e.target.value }))}
                  placeholder="Set 3"
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              marginTop: '16px',
            }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                height: '38px',
                padding: '0 22px',
                fontWeight: 700,
              }}
            >
              Evaluate Overload
            </button>
          </div>
        </form>

        {overloadResult && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(200, 255, 0, 0.06)',
              border: '1px solid rgba(200, 255, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                {overloadResult.action.toUpperCase()}: {overloadResult.recommendation}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Next Session Suggested Weight: <strong>{overloadResult.suggestedWeight} kg</strong> ({overloadResult.reason})
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleSaveProgress}
            >
              {isLogSaved ? 'Progress Saved!' : 'Log to Member History'}
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <IntakeProfileModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onSubmit={handleIntakeSubmit}
        initialProfile={clientProfile}
      />

      <ResearchPipelineModal
        isOpen={isPipelineOpen}
        onClose={() => setIsPipelineOpen(false)}
        onComplete={handlePipelineComplete}
        profileData={pendingProfileData}
      />
    </div>
  );
}
