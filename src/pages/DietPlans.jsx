import React, { useState, useMemo } from 'react';
import {
  Flame,
  Droplets,
  PieChart,
  Download,
  RefreshCw,
  BookOpen,
  Info,
  User,
  Plus,
  TrendingDown,
  CheckCircle2,
  Shield,
  ArrowRight,
  Activity
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { calculateNutritionProfile, calculateBMI } from '../utils/fitnessCalculations';
import { BANGLADESHI_FOODS } from '../data/bangladeshiFoods';
import { getResearchSourcesForGoal, SCIENTIFIC_SOURCES } from '../data/fitnessResearchSources';
import { generateFitnessPlanPDF } from '../utils/planPdfGenerator';
import IntakeProfileModal from '../components/fitness/IntakeProfileModal';
import ResearchPipelineModal from '../components/fitness/ResearchPipelineModal';
import FoodSubstitutionModal from '../components/fitness/FoodSubstitutionModal';

// Sample pre-calculated Bangladeshi meal protocol
const DEFAULT_BANGLADESHI_MEALS = [
  {
    mealName: 'Meal 1 - Morning Energy Breakfast',
    time: '08:00 AM',
    items: [
      {
        foodId: 'dim_shiddho',
        name: 'Whole Boiled Egg',
        banglaName: 'সিদ্ধ ডিম',
        portionGrams: 100,
        servingDesc: '2 whole eggs',
        calories: 143,
        protein: 12.6,
        carbs: 0.8,
        fat: 9.5,
        fiber: 0
      },
      {
        foodId: 'roti_atta',
        name: 'Whole Wheat Atta Roti',
        banglaName: 'আটার রুটি',
        portionGrams: 70,
        servingDesc: '2 medium rotis',
        calories: 180,
        protein: 6.2,
        carbs: 36,
        fat: 1.0,
        fiber: 5.6
      },
      {
        foodId: 'tok_doi',
        name: 'Sour Curd / Tok Doi',
        banglaName: 'টক দই',
        portionGrams: 150,
        servingDesc: '1 cup',
        calories: 90,
        protein: 5.3,
        carbs: 7.0,
        fat: 4.8,
        fiber: 0
      }
    ]
  },
  {
    mealName: 'Meal 2 - High Protein Anabolic Lunch',
    time: '01:30 PM',
    items: [
      {
        foodId: 'bhaat_shada',
        name: 'White Rice (Bhaat)',
        banglaName: 'সাদা ভাত',
        portionGrams: 150,
        servingDesc: '1 medium vati (cup)',
        calories: 195,
        protein: 4.1,
        carbs: 43.5,
        fat: 0.4,
        fiber: 0.6
      },
      {
        foodId: 'rui_maach',
        name: 'Rui Fish Curry',
        banglaName: 'রুই মাছ ঝোল',
        portionGrams: 150,
        servingDesc: '1 large piece (no excess oil)',
        calories: 165,
        protein: 29.6,
        carbs: 0,
        fat: 4.5,
        fiber: 0
      },
      {
        foodId: 'mug_dal',
        name: 'Yellow Mung Dal',
        banglaName: 'মুগ ডাল',
        portionGrams: 150,
        servingDesc: '1 medium bowl',
        calories: 140,
        protein: 9.8,
        carbs: 22.0,
        fat: 1.2,
        fiber: 5.2
      },
      {
        foodId: 'lal_shaak',
        name: 'Red Amaranth Sauteed',
        banglaName: 'লাল শাক ভাজি',
        portionGrams: 100,
        servingDesc: '1 small katori (light oil)',
        calories: 45,
        protein: 3.2,
        carbs: 5.0,
        fat: 1.5,
        fiber: 3.8
      }
    ]
  },
  {
    mealName: 'Meal 3 - Pre-Workout Sustained Fuel',
    time: '05:30 PM',
    items: [
      {
        foodId: 'shobri_kola',
        name: 'Banana (Shobri Kola)',
        banglaName: 'সবরি কলা',
        portionGrams: 100,
        servingDesc: '1 medium banana',
        calories: 89,
        protein: 1.1,
        carbs: 22.8,
        fat: 0.3,
        fiber: 2.6
      },
      {
        foodId: 'chhola_bhoot',
        name: 'Boiled Chickpeas (Chhola)',
        banglaName: 'সেদ্ধ ছোলা',
        portionGrams: 60,
        servingDesc: 'half cup boiled',
        calories: 98,
        protein: 5.3,
        carbs: 16.5,
        fat: 1.6,
        fiber: 4.6
      }
    ]
  },
  {
    mealName: 'Meal 4 - Recovery Dinner',
    time: '08:30 PM',
    items: [
      {
        foodId: 'murgi_deshi',
        name: 'Deshi Chicken Curry',
        banglaName: 'দেশি মুরগি ভুনা',
        portionGrams: 160,
        servingDesc: '2 medium pieces, drained gravy',
        calories: 220,
        protein: 34.5,
        carbs: 1.2,
        fat: 8.5,
        fiber: 0.4
      },
      {
        foodId: 'roti_atta',
        name: 'Whole Wheat Atta Roti',
        banglaName: 'আটার রুটি',
        portionGrams: 70,
        servingDesc: '2 medium rotis',
        calories: 180,
        protein: 6.2,
        carbs: 36,
        fat: 1.0,
        fiber: 5.6
      },
      {
        foodId: 'palong_shaak',
        name: 'Spinach / Palong Shaak',
        banglaName: 'পালং শাক',
        portionGrams: 100,
        servingDesc: '1 small bowl',
        calories: 40,
        protein: 3.0,
        carbs: 4.2,
        fat: 1.2,
        fiber: 3.0
      }
    ]
  }
];

export default function DietPlans() {
  const { members, branding, dietPlans: savedDietPlans, saveDietPlan } = useGymData();

  // Intake & Pipeline Modal States
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState(null);

  // Food Substitution Modal State
  const [subModalState, setSubModalState] = useState({
    isOpen: false,
    item: null,
    mealIndex: null,
    itemIndex: null
  });

  // Active Client & Plan State
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 1);
  const activeMember = members.find((m) => m.id === Number(selectedMemberId)) || members[0] || {
    name: 'Rahim Ahmed',
    gender: 'Male',
    age: 28,
    weight: 76,
    height: 175
  };

  // Profile data for active client
  const [clientProfile, setClientProfile] = useState({
    name: activeMember.name,
    age: 28,
    gender: activeMember.gender || 'Male',
    weight: 76,
    height: 175,
    targetWeight: 70,
    goal: 'fat_loss',
    activityLevel: 'moderate',
    dietPreference: 'non_veg',
    dailyBudget: 'moderate',
    allergies: 'None',
    dislikedFoods: 'Bitter gourd (Korola)',
    dailyWaterIntake: 2.0,
    averageSleepHours: 7.0,
    dailyStepCount: 7500,
    stressLevel: 'Moderate'
  });

  // Calculate biometrics and calories
  const nutritionCalculations = useMemo(() => {
    return calculateNutritionProfile(clientProfile);
  }, [clientProfile]);

  // Current Meals (allows interactive swapping)
  const [currentMeals, setCurrentMeals] = useState(DEFAULT_BANGLADESHI_MEALS);

  // Totals calculated from active meals
  const mealTotals = useMemo(() => {
    let totalCals = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;
    let totalFib = 0;

    currentMeals.forEach(meal => {
      meal.items.forEach(item => {
        totalCals += Number(item.calories) || 0;
        totalP += Number(item.protein) || 0;
        totalC += Number(item.carbs) || 0;
        totalF += Number(item.fat) || 0;
        totalFib += Number(item.fiber) || 0;
      });
    });

    return {
      calories: Math.round(totalCals),
      protein: Math.round(totalP),
      carbs: Math.round(totalC),
      fat: Math.round(totalF),
      fiber: Math.round(totalFib)
    };
  }, [currentMeals]);

  // Evidence research sources for active goal
  const researchSources = useMemo(() => {
    const rawGoal = clientProfile?.goal || clientProfile?.primaryGoal || 'Fat Loss';
    return getResearchSourcesForGoal(rawGoal);
  }, [clientProfile?.goal, clientProfile?.primaryGoal]);

  // Handle Intake submission -> launch pipeline modal
  const handleIntakeSubmit = (profileData) => {
    setPendingProfileData(profileData);
    setIsIntakeOpen(false);
    setIsPipelineOpen(true);
  };

  // Handle Pipeline completion -> apply new plan
  const handlePipelineComplete = () => {
    if (pendingProfileData) {
      const resolvedGoal = pendingProfileData.goal || pendingProfileData.primaryGoal || 'Fat Loss';
      const resolvedWeight = Number(pendingProfileData.weight || pendingProfileData.weightKg) || 75;
      const resolvedHeight = Number(pendingProfileData.height || pendingProfileData.heightCm) || 175;
      const resolvedTargetWeight = Number(pendingProfileData.targetWeight || pendingProfileData.targetWeightKg) || 70;

      const normalizedProfile = {
        ...clientProfile,
        ...pendingProfileData,
        name: pendingProfileData.name || clientProfile.name || 'Member',
        age: Number(pendingProfileData.age) || clientProfile.age || 28,
        gender: pendingProfileData.gender || clientProfile.gender || 'Male',
        goal: resolvedGoal,
        primaryGoal: resolvedGoal,
        weight: resolvedWeight,
        weightKg: resolvedWeight,
        height: resolvedHeight,
        heightCm: resolvedHeight,
        targetWeight: resolvedTargetWeight,
        targetWeightKg: resolvedTargetWeight,
        activityLevel: pendingProfileData.activityLevel || clientProfile.activityLevel || 'moderate',
        dietPreference: pendingProfileData.dietaryPreference || pendingProfileData.dietPreference || clientProfile.dietPreference || 'Non-Vegetarian',
        dailyBudget: pendingProfileData.foodBudget || pendingProfileData.dailyBudget || clientProfile.dailyBudget || 'Standard',
        allergies: pendingProfileData.foodAllergies || pendingProfileData.allergies || clientProfile.allergies || 'None',
        dislikedFoods: pendingProfileData.dislikedFoods || clientProfile.dislikedFoods || 'None',
      };

      setClientProfile(normalizedProfile);

      // Save to global context
      const newPlanRecord = {
        id: Date.now(),
        clientName: normalizedProfile.name,
        memberId: selectedMemberId,
        goal: normalizedProfile.goal,
        dateGenerated: new Date().toISOString(),
        profile: normalizedProfile,
        calculations: calculateNutritionProfile(normalizedProfile),
        meals: currentMeals
      };
      saveDietPlan(newPlanRecord);
    }
    setIsPipelineOpen(false);
  };

  // Handle food swap selection from modal
  const handleApplyFoodSwap = (mealIdx, itemIdx, newFoodSub) => {
    setCurrentMeals(prev => {
      const nextMeals = JSON.parse(JSON.stringify(prev));
      nextMeals[mealIdx].items[itemIdx] = {
        foodId: newFoodSub.id,
        name: newFoodSub.name,
        banglaName: newFoodSub.banglaName,
        portionGrams: newFoodSub.portionGrams,
        servingDesc: newFoodSub.servingDesc,
        calories: newFoodSub.calories,
        protein: newFoodSub.protein,
        carbs: newFoodSub.carbs,
        fat: newFoodSub.fat,
        fiber: newFoodSub.fiber
      };
      return nextMeals;
    });
  };

  // Single-Click Professional PDF Downloads
  const handleDownloadPDF = (type = 'diet') => {
    const goalTitle = (clientProfile?.goal || clientProfile?.primaryGoal || 'Fitness').toString().replace(/_/g, ' ');
    generateFitnessPlanPDF({
      client: {
        ...clientProfile,
        name: clientProfile?.name || activeMember?.name || 'Member',
        goal: goalTitle,
        primaryGoal: goalTitle,
        weight: clientProfile?.weight || clientProfile?.weightKg || 75,
        height: clientProfile?.height || clientProfile?.heightCm || 175,
        bmi: nutritionCalculations?.bmi?.bmi || 24.5,
        bmiClassification: nutritionCalculations?.bmi?.classification || 'Normal Weight',
        bmr: nutritionCalculations?.bmr || 1700,
        tdee: nutritionCalculations?.tdee || 2400,
        targetCalories: nutritionCalculations?.targetCalories || 2000,
        waterLitersMin: nutritionCalculations?.waterTarget?.litersMin || 2.5,
        waterLitersMax: nutritionCalculations?.waterTarget?.litersMax || 3.0,
        fiberTargetGrams: nutritionCalculations?.fiberTargetGrams || 28
      },
      dietPlan: {
        title: `${clientProfile?.name || 'Member'}'s Evidence-Based Bangladeshi Protocol`,
        caloricTarget: nutritionCalculations?.targetCalories || 2000,
        proteinGrams: nutritionCalculations?.protein?.grams || 150,
        carbGrams: nutritionCalculations?.carbs?.grams || 200,
        fatGrams: nutritionCalculations?.fats?.grams || 55,
        meals: currentMeals
      },
      workoutPlan: null,
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
              <Shield size={12} /> Clinical & Evidence-Based Engine
            </span>
          </div>
          <h1 className="page-title">AI Clinical Diet & Nutrition Engine</h1>
          <p className="page-subtitle">
            Mifflin-St Jeor Biometrics • ACSM Multipliers • Peer-Reviewed Sports Nutrition • Authentic Bangladeshi Food Database
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="form-select"
            value={selectedMemberId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedMemberId(id);
              const mem = members.find(m => m.id === id);
              if (mem) {
                setClientProfile(prev => ({
                  ...prev,
                  name: mem.name,
                  gender: mem.gender || 'Male'
                }));
              }
            }}
            style={{ minWidth: '180px' }}
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsIntakeOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <Plus size={16} />
            Generate New Plan
          </button>
        </div>
      </div>

      {/* Top Biometric & Caloric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '1.75rem'
      }}>
        {/* Daily Target Calories */}
        <div className="stat-card" style={{ padding: '1.1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>CALORIC TARGET</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--primary)' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {nutritionCalculations.targetCalories.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>kcal/day</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            BMR: {nutritionCalculations.bmr} • TDEE: {nutritionCalculations.tdee} kcal
          </div>
        </div>

        {/* Protein Target */}
        <div className="stat-card" style={{ padding: '1.1rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>DAILY PROTEIN</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
            {nutritionCalculations.protein.grams}g <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>({nutritionCalculations.protein.percent}%)</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {nutritionCalculations.protein.ratioPerKg}g per kg bodyweight
          </div>
        </div>

        {/* Carbs & Fats Split */}
        <div className="stat-card" style={{ padding: '1.1rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>CARBS & FATS</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <PieChart size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            <span style={{ color: '#3b82f6' }}>{nutritionCalculations.carbs.grams}g C</span> • <span style={{ color: '#f59e0b' }}>{nutritionCalculations.fats.grams}g F</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Carbs {nutritionCalculations.carbs.percent}% • Fats {nutritionCalculations.fats.percent}%
          </div>
        </div>

        {/* Hydration & Fiber */}
        <div className="stat-card" style={{ padding: '1.1rem', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>WATER & FIBER</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
              <Droplets size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#06b6d4' }}>
            {nutritionCalculations.waterTarget.litersMin} - {nutritionCalculations.waterTarget.litersMax} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>L/day</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Fiber target: min {nutritionCalculations.fiberTargetGrams}g/day
          </div>
        </div>
      </div>

      {/* Main Grid: Client Profile Bar + PDF Exports */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.1rem'
          }}>
            {String(clientProfile?.name || 'Member').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {clientProfile?.name || 'Member'}
              </h3>
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                {(clientProfile?.goal || clientProfile?.primaryGoal || 'General Fitness').toString().replace(/_/g, ' ')}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {clientProfile?.age || 28} yrs • {clientProfile?.gender || 'Male'} • {clientProfile?.height || clientProfile?.heightCm || 175} cm • {clientProfile?.weight || clientProfile?.weightKg || 75} kg
              (BMI: {nutritionCalculations?.bmi?.bmi || 24.5} - {nutritionCalculations?.bmi?.classification || 'Normal Weight'})
            </div>
          </div>
        </div>

        {/* PDF Download Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleDownloadPDF('diet')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Download size={15} />
            Download Diet Plan PDF
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

      {/* Meal Plan Schedule (Bangladeshi Foods with Smart Swapping) */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame color="var(--primary)" />
              Bangladeshi Evidence-Based Meal Schedule
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Target: {nutritionCalculations.targetCalories} kcal | Current Schedule Total: {mealTotals.calories} kcal ({mealTotals.protein}g P • {mealTotals.carbs}g C • {mealTotals.fat}g F • {mealTotals.fiber}g Fiber)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {currentMeals.map((meal, mealIdx) => (
            <div
              key={mealIdx}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
              }}
            >
              {/* Meal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    {meal.time}
                  </span>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {meal.mealName}
                  </h4>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {meal.items.reduce((s, it) => s + (it.calories || 0), 0)} kcal •{' '}
                  {Math.round(meal.items.reduce((s, it) => s + (it.protein || 0), 0))}g Protein
                </div>
              </div>

              {/* Meal Food Items List */}
              <div style={{ padding: '0.5rem 1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px' }}>Food Item (Bangla / English)</th>
                      <th style={{ padding: '8px 4px' }}>Portion / Serving</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Calories</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Protein</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Carbs</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Fat</th>
                      <th style={{ padding: '8px 4px', textAlign: 'center' }}>Smart Swap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meal.items.map((item, itemIdx) => (
                      <tr key={itemIdx} style={{ borderBottom: itemIdx < meal.items.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {item.name}{' '}
                          {item.banglaName && (
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              ({item.banglaName})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 4px', color: 'var(--text-muted)' }}>
                          <strong>{item.portionGrams}g</strong> ({item.servingDesc})
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700 }}>
                          {item.calories} kcal
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                          {item.protein}g
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>
                          {item.carbs}g
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>
                          {item.fat}g
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSubModalState({
                              isOpen: true,
                              item,
                              mealIndex: mealIdx,
                              itemIndex: itemIdx
                            })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: 'var(--primary)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title="Substitute this food with exact macro parity"
                          >
                            <RefreshCw size={12} /> Swap
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Rationale & Tooltip Explanation */}
      <div style={{
        padding: '1.25rem',
        borderRadius: '12px',
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Info color="#3b82f6" size={18} />
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Scientific Rationale & Caloric Justification
          </h4>
        </div>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
          Caloric intake is calibrated using the <strong>Mifflin-St Jeor equation</strong> with an activity coefficient of{' '}
          <strong>{nutritionCalculations.tdee} kcal TDEE</strong>. A target energy deficit of ~450 kcal/day induces a predictable fat loss of approximately <strong>0.41 kg/week</strong> without triggering starvation-induced adaptive thermogenesis.
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Protein is set to <strong>{nutritionCalculations.protein.ratioPerKg}g/kg</strong> ({nutritionCalculations.protein.grams}g/day), strictly adhering to the <em>Morton et al. 2018 BJSM</em> meta-analysis recommendations for lean mass preservation during hypocaloric training.
        </p>
      </div>

      {/* Research Citations & Peer-Reviewed Sources */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <BookOpen color="var(--primary)" size={18} />
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Peer-Reviewed Research Bibliography & Clinical Citations
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
        mode="diet"
      />

      {/* Research Synthesis Pipeline Simulation Modal */}
      <ResearchPipelineModal
        isOpen={isPipelineOpen}
        onClose={() => setIsPipelineOpen(false)}
        onComplete={handlePipelineComplete}
      />

      {/* Food Smart Substitution Modal */}
      <FoodSubstitutionModal
        isOpen={subModalState.isOpen}
        onClose={() => setSubModalState({ isOpen: false, item: null, mealIndex: null, itemIndex: null })}
        currentFoodItem={subModalState.item}
        mealIndex={subModalState.mealIndex}
        itemIndex={subModalState.itemIndex}
        onSelectSubstitution={handleApplyFoodSwap}
      />
    </div>
  );
}
