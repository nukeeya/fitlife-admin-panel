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
  Activity,
  Cpu,
  Edit2,
  Save,
  Check,
  ExternalLink,
  Utensils,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { calculateNutritionProfile, calculateBMI } from '../utils/fitnessCalculations';
import { BANGLADESHI_FOODS } from '../data/bangladeshiFoods';
import { getResearchSourcesForGoal, SCIENTIFIC_SOURCES } from '../data/fitnessResearchSources';
import { generateFitnessPlanPDF } from '../utils/planPdfGenerator';
import IntakeProfileModal from '../components/fitness/IntakeProfileModal';
import ResearchPipelineModal from '../components/fitness/ResearchPipelineModal';
import FoodSubstitutionModal from '../components/fitness/FoodSubstitutionModal';
import {
  generateGeminiDietPlan,
  GROUNDING_SOURCES_DIET,
} from '../services/geminiFitnessService';

// Sample pre-calculated authentic Bangladeshi meal protocol
const DEFAULT_BANGLADESHI_MEALS = [
  {
    mealName: 'Meal 1 — Morning Energy Breakfast (সকালের নাস্তা)',
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
        fiber: 0,
      },
      {
        foodId: 'roti_atta',
        name: 'Whole Wheat Atta Roti',
        banglaName: 'হাতে বানানো আটার রুটি',
        portionGrams: 70,
        servingDesc: '2 medium rotis',
        calories: 180,
        protein: 6.2,
        carbs: 36,
        fat: 1.0,
        fiber: 5.6,
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
        fiber: 0,
      },
    ],
  },
  {
    mealName: 'Meal 2 — High Protein Anabolic Lunch (দুপুরের খাবার)',
    time: '01:30 PM',
    items: [
      {
        foodId: 'bhaat_shada',
        name: 'White Rice (Bhaat)',
        banglaName: 'সাদা ভাত / লাল চালের ভাত',
        portionGrams: 150,
        servingDesc: '1 medium vati (cup)',
        calories: 195,
        protein: 4.1,
        carbs: 43.5,
        fat: 0.4,
        fiber: 0.6,
      },
      {
        foodId: 'rui_maach',
        name: 'Rui Fish Curry',
        banglaName: 'রুই মাছ ঝোল',
        portionGrams: 150,
        servingDesc: '1 large piece (light olive/mustard oil)',
        calories: 165,
        protein: 29.6,
        carbs: 0,
        fat: 4.5,
        fiber: 0,
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
        fiber: 5.2,
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
        fiber: 3.8,
      },
    ],
  },
  {
    mealName: 'Meal 3 — Pre-Workout Sustained Fuel (বিকেলের নাস্তা)',
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
        fiber: 2.6,
      },
      {
        foodId: 'chhola_bhoot',
        name: 'Boiled Chickpeas (Chhola)',
        banglaName: 'সেদ্ধ ছোলা হালকা শসা সহ',
        portionGrams: 60,
        servingDesc: 'half cup boiled',
        calories: 98,
        protein: 5.3,
        carbs: 16.5,
        fat: 1.6,
        fiber: 4.6,
      },
    ],
  },
  {
    mealName: 'Meal 4 — Recovery Dinner (রাতের খাবার)',
    time: '08:30 PM',
    items: [
      {
        foodId: 'murgi_deshi',
        name: 'Deshi Chicken Curry',
        banglaName: 'দেশি মুরগির মাংস ভুনা',
        portionGrams: 160,
        servingDesc: '2 medium pieces, drained gravy',
        calories: 220,
        protein: 34.5,
        carbs: 1.2,
        fat: 8.5,
        fiber: 0.4,
      },
      {
        foodId: 'roti_atta',
        name: 'Whole Wheat Atta Roti',
        banglaName: 'হাতে বানানো লাল আটার রুটি',
        portionGrams: 70,
        servingDesc: '2 medium rotis',
        calories: 180,
        protein: 6.2,
        carbs: 36,
        fat: 1.0,
        fiber: 5.6,
      },
      {
        foodId: 'palong_shaak',
        name: 'Spinach / Palong Shaak',
        banglaName: 'পালং শাক ভাজি',
        portionGrams: 100,
        servingDesc: '1 small bowl',
        calories: 40,
        protein: 3.0,
        carbs: 4.2,
        fat: 1.2,
        fiber: 3.0,
      },
    ],
  },
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
    itemIndex: null,
  });

  // Active Client & Plan State
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 1);
  const activeMember = members.find((m) => m.id === Number(selectedMemberId)) || members[0] || {
    name: 'Rahim Ahmed',
    gender: 'Male',
    age: 28,
    weight: 76,
    height: 175,
  };

  // Dietary Preferences Form for Gemini AI
  const [dietForm, setDietForm] = useState({
    goal: 'fat_loss',
    activityLevel: 'moderate',
    preferences: 'halal_traditional',
    allergies: 'None',
    restrictions: 'None',
    mealFrequency: '4',
  });

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
    dislikedFoods: 'None',
    dailyWaterIntake: 2.5,
    averageSleepHours: 7.0,
    dailyStepCount: 7500,
    stressLevel: 'Moderate',
  });

  // Calculate biometrics and calories
  const nutritionCalculations = useMemo(() => {
    return calculateNutritionProfile(clientProfile);
  }, [clientProfile]);

  // Current Meals (allows interactive swapping)
  const [currentMeals, setCurrentMeals] = useState(DEFAULT_BANGLADESHI_MEALS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPlanSaved, setIsPlanSaved] = useState(false);
  const [showGroundingSources, setShowGroundingSources] = useState(true);

  // Totals calculated from active meals
  const mealTotals = useMemo(() => {
    let totalCals = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;
    let totalFib = 0;

    currentMeals.forEach((meal) => {
      meal.items.forEach((item) => {
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
      fiber: Math.round(totalFib),
    };
  }, [currentMeals]);

  // Handle member change
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

  // Generate Diet Plan with simulated Gemini AI
  const handleGenerateGeminiDiet = async () => {
    setIsGenerating(true);
    setGenerationStep('Gemini 2.5 Flash analyzing member caloric requirements & metabolic rate...');

    const stepTimer = setTimeout(() => {
      setGenerationStep('Synthesizing authentic Bangladeshi meals from verified nutritional composition database...');
    }, 600);

    try {
      const result = await generateGeminiDietPlan({
        member: activeMember,
        profile: {
          ...dietForm,
          weight: clientProfile.weight,
          height: clientProfile.height,
        },
      });

      // Update client profile goal
      setClientProfile((prev) => ({
        ...prev,
        goal: dietForm.goal,
        activityLevel: dietForm.activityLevel,
        allergies: dietForm.allergies,
      }));

      // Update meals with generated structure
      if (result.meals && result.meals.length > 0) {
        const formatted = result.meals.map((m) => ({
          mealName: m.mealName,
          time: m.time,
          items: m.items.map((it) => ({
            foodId: it.foodName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: it.foodName.split('(')[0]?.trim(),
            banglaName: it.foodName.includes('(') ? it.foodName.split('(')[1]?.replace(')', '') : '',
            portionGrams: it.grams,
            servingDesc: it.portion,
            calories: it.calories,
            protein: it.protein,
            carbs: it.carbs,
            fat: it.fat,
            fiber: 2,
          })),
        }));
        setCurrentMeals(formatted);
      }
      setIsEditMode(false);
    } catch (err) {
      console.error('Gemini diet generation error:', err);
    } finally {
      clearTimeout(stepTimer);
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Save Plan
  const handleSaveDietPlan = () => {
    const newPlanRecord = {
      id: Date.now(),
      clientName: clientProfile.name,
      memberId: selectedMemberId,
      goal: clientProfile.goal,
      dateGenerated: new Date().toISOString(),
      profile: clientProfile,
      calculations: nutritionCalculations,
      meals: currentMeals,
    };
    saveDietPlan(newPlanRecord);
    setIsPlanSaved(true);
    setTimeout(() => setIsPlanSaved(false), 2500);
  };

  // Handle Intake submission -> launch pipeline modal
  const handleIntakeSubmit = (profileData) => {
    setPendingProfileData(profileData);
    setIsIntakeOpen(false);
    setIsPipelineOpen(true);
  };

  // Handle Pipeline completion -> apply new plan
  const handlePipelineComplete = () => {
    if (pendingProfileData) {
      const resolvedGoal = pendingProfileData.goal || pendingProfileData.primaryGoal || 'fat_loss';
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
      setDietForm((prev) => ({
        ...prev,
        goal: resolvedGoal,
        activityLevel: normalizedProfile.activityLevel,
      }));

      const newPlanRecord = {
        id: Date.now(),
        clientName: normalizedProfile.name,
        memberId: selectedMemberId,
        goal: normalizedProfile.goal,
        dateGenerated: new Date().toISOString(),
        profile: normalizedProfile,
        calculations: calculateNutritionProfile(normalizedProfile),
        meals: currentMeals,
      };
      saveDietPlan(newPlanRecord);
    }
    setIsPipelineOpen(false);
  };

  // Handle food swap selection from modal
  const handleApplyFoodSwap = (mealIdx, itemIdx, newFoodSub) => {
    setCurrentMeals((prev) => {
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
        fiber: newFoodSub.fiber,
      };
      return nextMeals;
    });
    setSubModalState({ isOpen: false, item: null, mealIndex: null, itemIndex: null });
  };

  // Handle PDF Export
  const handleDownloadPDF = (type = 'diet') => {
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
      dietPlan: {
        calculations: nutritionCalculations,
        meals: currentMeals,
        totals: mealTotals,
      },
      workoutPlan: null,
      researchSources: GROUNDING_SOURCES_DIET,
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
              <Cpu size={12} /> Gemini AI & Clinical Nutrition Engine
            </span>
          </div>
          <h1 className="page-title">Make Diet Plan</h1>
          <p className="page-subtitle">
            Google Gemini 2.5 Architecture • Bangladeshi Food Composition • Mifflin-St Jeor Biometrics • A4 PDF Export
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
            Full Clinical Intake Modal
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
              Nutritional forms, portion calculator, and Bangladeshi food dataset are ready. Future backend route will pass these parameters to Gemini 2.5 Flash with search grounding.
            </span>
          </div>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '10px' }}>
          Frontend Simulation Mode
        </span>
      </div>

      {/* MEMBER SELECTION & DIETARY PREFERENCE FORM */}
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
            <Utensils size={18} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Member Selection & Dietary Preferences
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Configures caloric & macronutrient inputs for Gemini AI
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
            <label className="form-label">Nutritional Goal *</label>
            <select
              className="form-select"
              value={dietForm.goal}
              onChange={(e) => setDietForm((prev) => ({ ...prev, goal: e.target.value }))}
            >
              <option value="fat_loss">Fat Loss & Caloric Deficit (Shred)</option>
              <option value="hypertrophy">Lean Muscle Mass & Anabolic Surplus</option>
              <option value="maintenance">Maintenance & Body Recomposition</option>
            </select>
          </div>

          {/* Activity Level */}
          <div className="form-group">
            <label className="form-label">Activity Level *</label>
            <select
              className="form-select"
              value={dietForm.activityLevel}
              onChange={(e) => setDietForm((prev) => ({ ...prev, activityLevel: e.target.value }))}
            >
              <option value="sedentary">Sedentary (Desk Job, Minimal Movement)</option>
              <option value="light">Lightly Active (1 – 3 Gym Sessions/Week)</option>
              <option value="moderate">Moderately Active (3 – 5 Gym Sessions/Week)</option>
              <option value="very_active">Very Active (6 – 7 High-Intensity Sessions)</option>
              <option value="athlete">Athlete / Two-a-Day Heavy Training</option>
            </select>
          </div>

          {/* Food Preferences */}
          <div className="form-group">
            <label className="form-label">Food Preferences *</label>
            <select
              className="form-select"
              value={dietForm.preferences}
              onChange={(e) => setDietForm((prev) => ({ ...prev, preferences: e.target.value }))}
            >
              <option value="halal_traditional">Bangladeshi Halal Traditional (Fish, Meat, Dal, Rice)</option>
              <option value="high_protein">High Protein Bodybuilding Focus</option>
              <option value="pescatarian">Pescatarian (Fish, Eggs, Dairy, Vegetables)</option>
              <option value="balanced">Balanced General Health</option>
            </select>
          </div>

          {/* Allergies */}
          <div className="form-group">
            <label className="form-label">Known Allergies</label>
            <select
              className="form-select"
              value={dietForm.allergies}
              onChange={(e) => setDietForm((prev) => ({ ...prev, allergies: e.target.value }))}
            >
              <option value="None">None</option>
              <option value="Lactose">Lactose / Dairy Intolerance</option>
              <option value="Peanuts">Peanut / Tree Nut Allergy</option>
              <option value="Shellfish">Prawn / Shellfish Allergy</option>
              <option value="Gluten">Gluten Sensitivity</option>
            </select>
          </div>

          {/* Dietary Restrictions */}
          <div className="form-group">
            <label className="form-label">Dietary Restrictions</label>
            <select
              className="form-select"
              value={dietForm.restrictions}
              onChange={(e) => setDietForm((prev) => ({ ...prev, restrictions: e.target.value }))}
            >
              <option value="None">None (Standard Healthy)</option>
              <option value="Diabetic">Diabetic-Friendly (Low Glycemic Index)</option>
              <option value="LowSodium">Low Sodium (Hypertension-Safe)</option>
              <option value="HighFiber">High Fiber (Digestive Health)</option>
            </select>
          </div>

          {/* Meal Frequency */}
          <div className="form-group">
            <label className="form-label">Meal Frequency *</label>
            <select
              className="form-select"
              value={dietForm.mealFrequency}
              onChange={(e) => setDietForm((prev) => ({ ...prev, mealFrequency: e.target.value }))}
            >
              <option value="3">3 Main Meals / Day</option>
              <option value="4">4 Meals (3 Main + Pre-Workout Snack)</option>
              <option value="5">5 Meals (High Frequency Anabolic Protocol)</option>
            </select>
          </div>
        </div>

        {/* Generate Diet Plan Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateGeminiDiet}
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
                Generate Diet Plan
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
            Synthesizing Nutrition Protocol via Gemini 2.5 Flash
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            {generationStep || 'Calculating caloric expenditure and authentic Bangladeshi food portions...'}
          </p>
        </div>
      )}

      {/* TOP BIOMETRIC & CALORIC CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '1.5rem',
        }}
      >
        {/* Daily Target Calories */}
        <div className="stat-card" style={{ padding: '1.1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>CALORIC TARGET</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(200, 255, 0, 0.1)', color: 'var(--primary)' }}>
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

      {/* PLAN CONTROLS & PDF BAR */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {clientProfile?.name || 'Member'} — Nutritional Protocol
              </h3>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(200, 255, 0, 0.12)',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {(clientProfile?.goal || 'General Fitness').toString().replace(/_/g, ' ')}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {clientProfile?.age || 28} yrs • {clientProfile?.gender || 'Male'} • {clientProfile?.height || 175} cm • {clientProfile?.weight || 76} kg
              (BMI: {nutritionCalculations?.bmi?.bmi || 24.5} - {nutritionCalculations?.bmi?.classification || 'Normal Weight'})
            </div>
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
            {isEditMode ? 'Exit Edit Mode' : 'Edit Portions'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGenerateGeminiDiet}
            disabled={isGenerating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} />
            Regenerate
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveDietPlan}
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
            onClick={() => handleDownloadPDF('diet')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Download size={14} />
            PDF Export
          </button>
        </div>
      </div>

      {/* MEAL PLAN SCHEDULE CARDS (Authentic Bangladeshi Foods) */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame color="var(--primary)" size={20} />
              Bangladeshi Evidence-Based Meal Schedule
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Target: {nutritionCalculations.targetCalories} kcal | Current Total: {mealTotals.calories} kcal ({mealTotals.protein}g P • {mealTotals.carbs}g C • {mealTotals.fat}g F • {mealTotals.fiber}g Fiber)
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
                overflow: 'hidden',
              }}
            >
              {/* Meal Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(200, 255, 0, 0.12)',
                      color: 'var(--primary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {meal.time}
                  </span>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {meal.mealName}
                  </h4>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {meal.items.reduce((s, it) => s + (Number(it.calories) || 0), 0)} kcal •{' '}
                  <strong style={{ color: '#10b981' }}>{meal.items.reduce((s, it) => s + (Number(it.protein) || 0), 0).toFixed(1)}g Protein</strong>
                </div>
              </div>

              {/* Meal Items Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Food Item & Bengali Name</th>
                      <th>Portion & Serving Size</th>
                      <th>Calories</th>
                      <th>Protein</th>
                      <th>Carbs</th>
                      <th>Fats</th>
                      <th>Fiber</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Smart Swap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meal.items.map((item, itemIdx) => (
                      <tr key={itemIdx}>
                        <td>
                          {isEditMode ? (
                            <input
                              type="text"
                              className="form-input"
                              value={item.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCurrentMeals((prev) => {
                                  const copy = JSON.parse(JSON.stringify(prev));
                                  copy[mealIdx].items[itemIdx].name = val;
                                  return copy;
                                });
                              }}
                              style={{ height: '30px', fontSize: '12px' }}
                            />
                          ) : (
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</div>
                          )}
                          {item.banglaName && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '2px' }}>
                              {item.banglaName}
                            </div>
                          )}
                        </td>

                        <td>
                          {isEditMode ? (
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <input
                                type="number"
                                className="form-input"
                                value={item.portionGrams}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setCurrentMeals((prev) => {
                                    const copy = JSON.parse(JSON.stringify(prev));
                                    copy[mealIdx].items[itemIdx].portionGrams = val;
                                    return copy;
                                  });
                                }}
                                style={{ width: '60px', height: '30px', fontSize: '12px' }}
                              />
                              <span style={{ fontSize: '12px' }}>g</span>
                            </div>
                          ) : (
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.servingDesc}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                                ({item.portionGrams}g)
                              </span>
                            </div>
                          )}
                        </td>

                        <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.calories}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{item.protein}g</td>
                        <td style={{ color: '#3b82f6' }}>{item.carbs}g</td>
                        <td style={{ color: '#f59e0b' }}>{item.fat}g</td>
                        <td style={{ color: '#06b6d4' }}>{item.fiber || 0}g</td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() =>
                              setSubModalState({
                                isOpen: true,
                                item,
                                mealIndex: mealIdx,
                                itemIndex: itemIdx,
                              })
                            }
                            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                            title="Swap with equivalent macro Bangladeshi food"
                          >
                            Swap
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
              Grounding Sources & Nutritional Evidence (Gemini + Google Search Grounding)
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
            {GROUNDING_SOURCES_DIET.map((source, idx) => (
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

      <FoodSubstitutionModal
        isOpen={subModalState.isOpen}
        onClose={() => setSubModalState({ isOpen: false, item: null, mealIndex: null, itemIndex: null })}
        foodItem={subModalState.item}
        onSelectSubstitution={(newFood) =>
          handleApplyFoodSwap(subModalState.mealIndex, subModalState.itemIndex, newFood)
        }
      />
    </div>
  );
}
