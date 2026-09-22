import { useState, useEffect } from 'react';
import {
  HeartPulse,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
} from 'lucide-react';
import Modal from '../common/Modal';
import { ACTIVITY_MULTIPLIERS, GOAL_CONFIG } from '../../utils/fitnessCalculations';

export default function IntakeProfileModal({ isOpen, onClose, onComplete, onSubmit, initialProfile = {} }) {
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: initialProfile?.name || '',
    age: Number(initialProfile?.age) || 28,
    gender: initialProfile?.gender || 'Male',
    heightCm: Number(initialProfile?.heightCm || initialProfile?.height) || 175,
    weightKg: Number(initialProfile?.weightKg || initialProfile?.weight) || 75,
    targetWeightKg: Number(initialProfile?.targetWeightKg || initialProfile?.targetWeight) || 70,
    activityLevel: initialProfile?.activityLevel || 'moderate',
    location: initialProfile?.location || 'Bangladesh (Dhaka)',
    occupation: initialProfile?.occupation || 'Software Engineer / Desk Job',

    // Step 2: Goals & Body Metrics
    primaryGoal: initialProfile?.primaryGoal || (initialProfile?.goal ? String(initialProfile.goal).replace(/_/g, ' ') : 'Fat Loss'),
    timelineWeeks: initialProfile?.timelineWeeks || 12,
    bodyFatPercent: initialProfile?.bodyFatPercent || '',
    waistCircumferenceCm: initialProfile?.waistCircumferenceCm || '',
    previousWeightHistory: initialProfile?.previousWeightHistory || 'Stalled at current weight for 3 months',

    // Step 3: Training Parameters
    experienceLevel: initialProfile?.experienceLevel || (initialProfile?.experience ? String(initialProfile.experience) : 'Intermediate (1-2 years)'),
    workoutFrequencyDays: Number(initialProfile?.workoutFrequencyDays || initialProfile?.trainingDaysPerWeek) || 4,
    sessionDurationMins: Number(initialProfile?.sessionDurationMins || initialProfile?.sessionDuration) || 45,
    trainingEnvironment: initialProfile?.trainingEnvironment || 'Full Commercial Gym',
    availableEquipment: initialProfile?.availableEquipment || 'Barbells, Dumbbells, Cable Stations, Leg Press',
    injuriesOrLimitations: initialProfile?.injuriesOrLimitations || initialProfile?.limitations || 'None',

    // Step 4: Nutrition & Local Food Preferences
    dietaryPreference: initialProfile?.dietaryPreference || initialProfile?.dietPreference || 'Non-Vegetarian (Bengali Halal)',
    foodAllergies: initialProfile?.foodAllergies || initialProfile?.allergies || 'None',
    dislikedFoods: initialProfile?.dislikedFoods || 'Bitter gourd (Korela)',
    foodBudget: initialProfile?.foodBudget || initialProfile?.dailyBudget || 'Standard Everyday Grocery',
    mealsPerDay: Number(initialProfile?.mealsPerDay) || 4,
    cookingAvailability: initialProfile?.cookingAvailability || 'Home cooked meals available',
    currentSupplements: initialProfile?.currentSupplements || 'Whey Protein Isolate, Creatine Monohydrate',

    // Step 5: Lifestyle & Recovery
    sleepHours: Number(initialProfile?.sleepHours || initialProfile?.averageSleepHours) || 7.5,
    dailyStepsEstimate: Number(initialProfile?.dailyStepsEstimate || initialProfile?.dailyStepCount) || 8000,
    dailyWaterIntakeLiters: Number(initialProfile?.dailyWaterIntakeLiters || initialProfile?.dailyWaterIntake) || 2.5,
    stressLevel: initialProfile?.stressLevel || 'Moderate',

    // Step 6: Medical & Safety
    hasMedicalCondition: initialProfile?.hasMedicalCondition || false,
    medicalNotes: initialProfile?.medicalNotes || '',
    hasEatingDisorderHistory: initialProfile?.hasEatingDisorderHistory || false,
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: initialProfile?.name || '',
      age: Number(initialProfile?.age) || 28,
      gender: initialProfile?.gender || 'Male',
      heightCm: Number(initialProfile?.heightCm || initialProfile?.height) || 175,
      weightKg: Number(initialProfile?.weightKg || initialProfile?.weight) || 75,
      targetWeightKg: Number(initialProfile?.targetWeightKg || initialProfile?.targetWeight) || 70,
      activityLevel: initialProfile?.activityLevel || 'moderate',
      location: initialProfile?.location || 'Bangladesh (Dhaka)',
      occupation: initialProfile?.occupation || 'Software Engineer / Desk Job',

      primaryGoal: initialProfile?.primaryGoal || (initialProfile?.goal ? String(initialProfile.goal).replace(/_/g, ' ') : 'Fat Loss'),
      timelineWeeks: initialProfile?.timelineWeeks || 12,
      bodyFatPercent: initialProfile?.bodyFatPercent || '',
      waistCircumferenceCm: initialProfile?.waistCircumferenceCm || '',
      previousWeightHistory: initialProfile?.previousWeightHistory || 'Stalled at current weight for 3 months',

      experienceLevel: initialProfile?.experienceLevel || (initialProfile?.experience ? String(initialProfile.experience) : 'Intermediate (1-2 years)'),
      workoutFrequencyDays: Number(initialProfile?.workoutFrequencyDays || initialProfile?.trainingDaysPerWeek) || 4,
      sessionDurationMins: Number(initialProfile?.sessionDurationMins || initialProfile?.sessionDuration) || 45,
      trainingEnvironment: initialProfile?.trainingEnvironment || 'Full Commercial Gym',
      availableEquipment: initialProfile?.availableEquipment || 'Barbells, Dumbbells, Cable Stations, Leg Press',
      injuriesOrLimitations: initialProfile?.injuriesOrLimitations || initialProfile?.limitations || 'None',

      dietaryPreference: initialProfile?.dietaryPreference || initialProfile?.dietPreference || 'Non-Vegetarian (Bengali Halal)',
      foodAllergies: initialProfile?.foodAllergies || initialProfile?.allergies || 'None',
      dislikedFoods: initialProfile?.dislikedFoods || 'Bitter gourd (Korela)',
      foodBudget: initialProfile?.foodBudget || initialProfile?.dailyBudget || 'Standard Everyday Grocery',
      mealsPerDay: Number(initialProfile?.mealsPerDay) || 4,
      cookingAvailability: initialProfile?.cookingAvailability || 'Home cooked meals available',
      currentSupplements: initialProfile?.currentSupplements || 'Whey Protein Isolate, Creatine Monohydrate',

      sleepHours: Number(initialProfile?.sleepHours || initialProfile?.averageSleepHours) || 7.5,
      dailyStepsEstimate: Number(initialProfile?.dailyStepsEstimate || initialProfile?.dailyStepCount) || 8000,
      dailyWaterIntakeLiters: Number(initialProfile?.dailyWaterIntakeLiters || initialProfile?.dailyWaterIntake) || 2.5,
      stressLevel: initialProfile?.stressLevel || 'Moderate',

      hasMedicalCondition: initialProfile?.hasMedicalCondition || false,
      medicalNotes: initialProfile?.medicalNotes || '',
      hasEatingDisorderHistory: initialProfile?.hasEatingDisorderHistory || false,
    });
    setCurrentStep(1);
  }, [isOpen, initialProfile]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleFinish = (e) => {
    e.preventDefault();

    const resolvedGoal = formData.primaryGoal || 'Fat Loss';
    const resolvedWeight = Number(formData.weightKg) || 75;
    const resolvedHeight = Number(formData.heightCm) || 175;
    const resolvedTargetWeight = Number(formData.targetWeightKg) || 70;

    const normalizedData = {
      ...formData,
      name: formData.name || 'Member',
      goal: resolvedGoal,
      primaryGoal: resolvedGoal,
      weight: resolvedWeight,
      weightKg: resolvedWeight,
      height: resolvedHeight,
      heightCm: resolvedHeight,
      targetWeight: resolvedTargetWeight,
      targetWeightKg: resolvedTargetWeight,
      dietPreference: formData.dietaryPreference || 'Non-Vegetarian',
      dietaryPreference: formData.dietaryPreference || 'Non-Vegetarian',
      allergies: formData.foodAllergies || 'None',
      foodAllergies: formData.foodAllergies || 'None',
      dailyBudget: formData.foodBudget || 'Standard',
      foodBudget: formData.foodBudget || 'Standard',
      experience: String(formData.experienceLevel || '').toLowerCase().includes('beginner')
        ? 'beginner'
        : String(formData.experienceLevel || '').toLowerCase().includes('advanced')
        ? 'advanced'
        : 'intermediate',
      trainingDaysPerWeek: Number(formData.workoutFrequencyDays) || 4,
      sessionDuration: Number(formData.sessionDurationMins) || 60,
      equipment: String(formData.trainingEnvironment || '').toLowerCase().includes('home')
        ? 'home_minimal'
        : String(formData.trainingEnvironment || '').toLowerCase().includes('dumbbell')
        ? 'dumbbells_only'
        : 'full_gym',
    };

    if (onSubmit) onSubmit(normalizedData);
    else if (onComplete) onComplete(normalizedData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Client Intake & Evidence-Based Fitness Assessment"
      subtitle="Gathering comprehensive anthropometric, nutritional and training parameters"
      icon={HeartPulse}
      size="lg"
    >
      {/* Progress Steps Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-base)' }}>
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Goals & Metrics' },
          { num: 3, label: 'Training Info' },
          { num: 4, label: 'Nutrition & Diet' },
          { num: 5, label: 'Lifestyle & Safety' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => setCurrentStep(s.num)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              opacity: currentStep === s.num ? 1 : 0.6,
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: currentStep === s.num ? 'var(--primary)' : currentStep > s.num ? '#10B981' : 'var(--bg-surface)',
                color: currentStep === s.num ? '#000' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              {currentStep > s.num ? '✓' : s.num}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: currentStep === s.num ? 'var(--primary)' : 'var(--text-muted)' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleFinish}>
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              1. Basic Information & Demographics
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shakib Al Hasan"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Biological Sex *</label>
                <select
                  className="form-select"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="Male">Male (Mifflin-St Jeor formula +5)</option>
                  <option value="Female">Female (Mifflin-St Jeor formula -161)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Age (Years) *</label>
                <input
                  type="number"
                  required
                  min="14"
                  max="85"
                  className="form-input"
                  value={formData.age}
                  onChange={(e) => handleChange('age', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Height (Centimeters) *</label>
                <input
                  type="number"
                  required
                  min="120"
                  max="230"
                  className="form-input"
                  value={formData.heightCm}
                  onChange={(e) => handleChange('heightCm', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="form-input"
                  value={formData.weightKg}
                  onChange={(e) => handleChange('weightKg', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Goal Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="form-input"
                  value={formData.targetWeightKg}
                  onChange={(e) => handleChange('targetWeightKg', Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Daily Physical Activity Level (ACSM Multiplier) *</label>
                <select
                  className="form-select"
                  value={formData.activityLevel}
                  onChange={(e) => handleChange('activityLevel', e.target.value)}
                >
                  {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, opt]) => (
                    <option key={key} value={key}>
                      {opt.label} — ({opt.value}x BMR)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Body & Goals */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              2. Body Composition & Fitness Goal
            </h3>

            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Primary Training Goal *</label>
                <select
                  className="form-select"
                  value={formData.primaryGoal}
                  onChange={(e) => handleChange('primaryGoal', e.target.value)}
                >
                  {Object.keys(GOAL_CONFIG).map((g) => (
                    <option key={g} value={g}>
                      {g} ({GOAL_CONFIG[g].deficitPercentage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Timeline (Weeks)</label>
                <input
                  type="number"
                  min="4"
                  max="52"
                  className="form-input"
                  value={formData.timelineWeeks}
                  onChange={(e) => handleChange('timelineWeeks', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Body-Fat % (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 18%"
                  className="form-input"
                  value={formData.bodyFatPercent}
                  onChange={(e) => handleChange('bodyFatPercent', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Waist Measurement (cm / inches - Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 33 inches / 84 cm"
                  className="form-input"
                  value={formData.waistCircumferenceCm}
                  onChange={(e) => handleChange('waistCircumferenceCm', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weight History</label>
                <input
                  type="text"
                  placeholder="e.g. Gained 5kg over last 6 months"
                  className="form-input"
                  value={formData.previousWeightHistory}
                  onChange={(e) => handleChange('previousWeightHistory', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Training Parameters */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              3. Training Experience & Equipment Availability
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Lifting Experience</label>
                <select
                  className="form-select"
                  value={formData.experienceLevel}
                  onChange={(e) => handleChange('experienceLevel', e.target.value)}
                >
                  <option value="Beginner (< 6 months)">Beginner (&lt; 6 months)</option>
                  <option value="Intermediate (1-3 years)">Intermediate (1-3 years)</option>
                  <option value="Advanced (3+ years)">Advanced (3+ years)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Weekly Workout Frequency</label>
                <select
                  className="form-select"
                  value={formData.workoutFrequencyDays}
                  onChange={(e) => handleChange('workoutFrequencyDays', Number(e.target.value))}
                >
                  <option value="3">3 Days / Week (Full Body Protocol)</option>
                  <option value="4">4 Days / Week (Upper / Lower Periodization)</option>
                  <option value="5">5 Days / Week (Push / Pull / Legs Split)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Session Duration (Minutes)</label>
                <select
                  className="form-select"
                  value={formData.sessionDurationMins}
                  onChange={(e) => handleChange('sessionDurationMins', Number(e.target.value))}
                >
                  <option value="30">30 Minutes (High Density / Time Crunch)</option>
                  <option value="45">45 Minutes (Optimal Hypertrophy Density)</option>
                  <option value="60">60 Minutes (Standard Strength / Bodybuilding)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Training Facility Environment</label>
                <select
                  className="form-select"
                  value={formData.trainingEnvironment}
                  onChange={(e) => handleChange('trainingEnvironment', e.target.value)}
                >
                  <option value="Full Commercial Gym">Full Commercial Gym (FitLife Facility)</option>
                  <option value="Home Gym (Dumbbells & Bench)">Home Gym (Dumbbells & Bench)</option>
                  <option value="Bodyweight & Resistance Bands">Bodyweight & Calisthenics Only</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Physical Limitations / Restricted Exercises</label>
                <input
                  type="text"
                  placeholder="e.g. Mild lower back strain on conventional deadlifts, avoid high impact jumping"
                  className="form-input"
                  value={formData.injuriesOrLimitations}
                  onChange={(e) => handleChange('injuriesOrLimitations', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Nutrition & Local Food Preferences */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              4. Nutrition Preferences & Bangladeshi Food Access
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Dietary Pattern</label>
                <select
                  className="form-select"
                  value={formData.dietaryPreference}
                  onChange={(e) => handleChange('dietaryPreference', e.target.value)}
                >
                  <option value="Non-Vegetarian (Bengali Halal)">Non-Vegetarian (Bengali Halal - Chicken, Fish, Beef, Eggs)</option>
                  <option value="Pescatarian (Fish & Eggs Only)">Pescatarian (Freshwater Fish, Eggs, Dal)</option>
                  <option value="Vegetarian (Dairy & Dal)">Vegetarian (Tok Doi, Dal, Chola, Milk)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Daily Meal Schedule</label>
                <select
                  className="form-select"
                  value={formData.mealsPerDay}
                  onChange={(e) => handleChange('mealsPerDay', Number(e.target.value))}
                >
                  <option value="3">3 Main Meals (Breakfast, Lunch, Dinner)</option>
                  <option value="4">4 Meals (Breakfast, Lunch, Pre-Workout Snack, Dinner)</option>
                  <option value="5">5 Meals (High Frequency Athlete Split)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Food Allergies / Intolerances</label>
                <input
                  type="text"
                  placeholder="e.g. Lactose intolerant, peanut allergy, shrimp allergy"
                  className="form-input"
                  value={formData.foodAllergies}
                  onChange={(e) => handleChange('foodAllergies', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Disliked Foods (Excluded from Plan)</label>
                <input
                  type="text"
                  placeholder="e.g. Bitter gourd (Korela), beef, eggplant"
                  className="form-input"
                  value={formData.dislikedFoods}
                  onChange={(e) => handleChange('dislikedFoods', e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Current Dietary Supplements</label>
                <input
                  type="text"
                  placeholder="e.g. Whey protein isolate, Creatine monohydrate, Fish oil, Multivitamin"
                  className="form-input"
                  value={formData.currentSupplements}
                  onChange={(e) => handleChange('currentSupplements', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Lifestyle, Recovery & Clinical Safety */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              5. Lifestyle, Recovery & Clinical Safety Screening
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Average Sleep Duration (Hours/Night)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={formData.sleepHours}
                  onChange={(e) => handleChange('sleepHours', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Daily Steps</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.dailyStepsEstimate}
                  onChange={(e) => handleChange('dailyStepsEstimate', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Current Water Intake (Liters/Day)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={formData.dailyWaterIntakeLiters}
                  onChange={(e) => handleChange('dailyWaterIntakeLiters', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Occupational Stress Level</label>
                <select
                  className="form-select"
                  value={formData.stressLevel}
                  onChange={(e) => handleChange('stressLevel', e.target.value)}
                >
                  <option value="Low">Low (Minimal fatigue)</option>
                  <option value="Moderate">Moderate (Manageable workload)</option>
                  <option value="High">High (Demanding shifts / elevated cortisol)</option>
                </select>
              </div>
            </div>

            {/* Clinical Safety Disclaimer Box */}
            <div
              style={{
                marginTop: '10px',
                padding: '14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid var(--danger)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                <ShieldAlert size={18} />
                <span>Clinical & Safety Pre-Screening</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                If you have cardiovascular conditions, kidney disease, active pregnancy, or history of eating disorders, the AI planning engine will automatically prioritize non-aggressive guidelines.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.hasMedicalCondition}
                    onChange={(e) => handleChange('hasMedicalCondition', e.target.checked)}
                  />
                  <span>I have a diagnosed medical condition or require physician clearance</span>
                </label>
              </div>

              {formData.hasMedicalCondition && (
                <input
                  type="text"
                  placeholder="Describe condition (e.g. Hypertension, asthma, disc bulge)..."
                  className="form-input"
                  style={{ marginTop: '10px' }}
                  value={formData.medicalNotes}
                  onChange={(e) => handleChange('medicalNotes', e.target.value)}
                />
              )}
            </div>
          </div>
        )}

        {/* Modal Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-base)' }}>
          {currentStep > 1 ? (
            <button type="button" className="btn btn-secondary" onClick={prevStep}>
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          )}

          {currentStep < 5 ? (
            <button type="button" className="btn btn-primary" onClick={nextStep}>
              Next Step <ChevronRight size={16} />
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" style={{ background: '#10B981', borderColor: '#10B981', color: '#fff' }}>
              <Sparkles size={16} /> Synthesize Evidence & Generate Protocol
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
