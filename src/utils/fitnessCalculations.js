/**
 * Scientific Fitness Calculations Utility
 * 
 * References:
 * - Mifflin MD, St Jeor ST, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990.
 * - ACSM's Guidelines for Exercise Testing and Prescription (11th Ed.)
 * - International Society of Sports Nutrition (ISSN) Position Stand: Diets and body composition. J Int Soc Sports Nutr. 2017.
 * - Morton RW, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med. 2018.
 */

export const ACTIVITY_MULTIPLIERS = {
  sedentary: { label: 'Sedentary (Desk job, minimal daily movement)', value: 1.2 },
  light: { label: 'Lightly Active (1-3 days light exercise / walking)', value: 1.375 },
  moderate: { label: 'Moderately Active (3-5 days resistance/cardio training)', value: 1.55 },
  very_active: { label: 'Very Active (6-7 days hard training or active labor)', value: 1.725 },
  athlete: { label: 'Extra Active / Elite Athlete (Twice daily training or competitive sport)', value: 1.9 },
};

export const GOAL_CONFIG = {
  'Fat Loss': {
    calorieAdjustment: -450, // Safe moderate deficit
    proteinMultiplier: 2.0, // g per kg of bodyweight to preserve lean mass during deficit (Morton et al.)
    fatPercent: 0.25, // 25% of total calories
    weightRatePerWeek: '-0.45 kg to -0.65 kg/week',
    deficitPercentage: '18% - 22% Deficit',
  },
  'Muscle Gain': {
    calorieAdjustment: 350, // Moderate lean hypercaloric surplus
    proteinMultiplier: 1.8, // Optimal hypertrophy threshold
    fatPercent: 0.25,
    weightRatePerWeek: '+0.2 kg to +0.35 kg/week',
    deficitPercentage: '+10% - 15% Surplus',
  },
  'Body Recomposition': {
    calorieAdjustment: -150, // Slight deficit/near-maintenance with high protein
    proteinMultiplier: 2.2, // Highest protein threshold to support simultaneous muscle retention & fat oxidation
    fatPercent: 0.25,
    weightRatePerWeek: '-0.1 kg to -0.2 kg/week (Shift in body fat %)',
    deficitPercentage: 'Slight Deficit / Eucaloric',
  },
  'Strength': {
    calorieAdjustment: 200, // Mild surplus for neural recovery and glycogen fullness
    proteinMultiplier: 1.8,
    fatPercent: 0.28,
    weightRatePerWeek: '+0.15 kg/week',
    deficitPercentage: '+5% - 8% Surplus',
  },
  'Endurance': {
    calorieAdjustment: 100,
    proteinMultiplier: 1.5,
    fatPercent: 0.22,
    weightRatePerWeek: 'Maintenance',
    deficitPercentage: 'Eucaloric (High Glycogen)',
  },
  'General Fitness': {
    calorieAdjustment: 0,
    proteinMultiplier: 1.6,
    fatPercent: 0.25,
    weightRatePerWeek: 'Stable Weight Maintenance',
    deficitPercentage: 'Maintenance Target',
  },
  'Weight Maintenance': {
    calorieAdjustment: 0,
    proteinMultiplier: 1.6,
    fatPercent: 0.25,
    weightRatePerWeek: '±0.0 kg/week',
    deficitPercentage: 'Maintenance Target',
  },
};

/**
 * Calculate Body Mass Index (BMI) & WHO Classification
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return { bmi: 0, category: 'Unknown', color: 'var(--text-muted)' };
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  let category = 'Normal Weight';
  let color = '#10B981';

  if (bmi < 18.5) {
    category = 'Underweight';
    color = '#F59E0B';
  } else if (bmi < 25) {
    category = 'Normal Weight (Optimal Health)';
    color = '#10B981';
  } else if (bmi < 30) {
    category = 'Overweight';
    color = '#F59E0B';
  } else if (bmi < 35) {
    category = 'Obesity Class I';
    color = 'var(--danger)';
  } else {
    category = 'Obesity Class II+';
    color = 'var(--danger)';
  }

  return { bmi, category, color };
}

/**
 * Calculate Basal Metabolic Rate (BMR) via Mifflin-St Jeor Equation
 */
export function calculateBMR({ gender = 'Male', weightKg = 75, heightCm = 175, age = 28 }) {
  const w = Number(weightKg) || 75;
  const h = Number(heightCm) || 175;
  const a = Number(age) || 28;

  // Mifflin-St Jeor Equation:
  // Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  // Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
  let bmr = (10 * w) + (6.25 * h) - (5 * a);
  if (gender === 'Female') {
    bmr -= 161;
  } else {
    bmr += 5;
  }

  return Math.round(bmr);
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE) & Goal Targets
 */
export function calculateFitnessMetrics(profile) {
  const {
    gender = 'Male',
    age = 28,
    heightCm = 175,
    weightKg = 75,
    targetWeightKg = 70,
    activityLevel = 'moderate',
    primaryGoal = 'Fat Loss',
  } = profile;

  const w = Number(weightKg) || 75;
  const h = Number(heightCm) || 175;
  const a = Number(age) || 28;

  const bmr = calculateBMR({ gender, weightKg: w, heightCm: h, age: a });
  const multiplierObj = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  const activityMultiplier = multiplierObj.value;
  const tdee = Math.round(bmr * activityMultiplier);

  const goalConfig = GOAL_CONFIG[primaryGoal] || GOAL_CONFIG['Fat Loss'];
  let targetCalories = tdee + goalConfig.calorieAdjustment;

  // Safety floor bounds (avoid starvation deficits as per ACSM/NIH)
  const minSafeCalories = gender === 'Female' ? 1200 : 1500;
  if (targetCalories < minSafeCalories) {
    targetCalories = minSafeCalories;
  }

  // Protein calculation (ISSN: 1.6 - 2.2 g/kg)
  const proteinGrams = Math.round(w * goalConfig.proteinMultiplier);
  const proteinCalories = proteinGrams * 4;

  // Fat calculation (ACSM: 20-30% of total calories, minimum 0.7g/kg)
  let fatCalories = Math.round(targetCalories * goalConfig.fatPercent);
  let fatGrams = Math.round(fatCalories / 9);
  const minFatGrams = Math.round(w * 0.7);
  if (fatGrams < minFatGrams) {
    fatGrams = minFatGrams;
    fatCalories = fatGrams * 9;
  }

  // Carbohydrates (remainder of calories)
  let carbCalories = targetCalories - (proteinCalories + fatCalories);
  if (carbCalories < 400) {
    // Minimum 100g carbs for central nervous system & thyroid health
    carbCalories = 400;
    targetCalories = proteinCalories + fatCalories + carbCalories;
  }
  const carbGrams = Math.round(carbCalories / 4);

  // Fiber calculation (USDA/NIH guideline: 14g per 1,000 kcal)
  const fiberGrams = Math.round((targetCalories / 1000) * 14);

  // Daily Water Intake (ACSM: 35-45 ml per kg bodyweight + sweat adjustment)
  const waterLiters = Number(((w * 40) / 1000).toFixed(1));

  // BMI
  const bmiInfo = calculateBMI(w, h);

  // Timeline projection to reach target weight
  const weightDelta = Math.abs(w - (Number(targetWeightKg) || w));
  const estimatedWeeks = weightDelta > 0 ? Math.ceil(weightDelta / 0.5) : 0;

  return {
    bmi: bmiInfo.bmi,
    bmiCategory: bmiInfo.category,
    bmiColor: bmiInfo.color,
    bmr,
    tdee,
    activityMultiplier,
    activityLabel: multiplierObj.label,
    targetCalories,
    proteinGrams,
    carbGrams,
    fatGrams,
    fiberGrams,
    waterLiters,
    calorieDifference: targetCalories - tdee,
    weightRatePerWeek: goalConfig.weightRatePerWeek,
    estimatedWeeks,
    deficitSurplusTag: goalConfig.deficitPercentage,
  };
}

/**
 * Convenience wrapper returning structured macros and biometric breakdown
 */
export function calculateNutritionProfile(profile = {}) {
  const safeProfile = profile || {};
  const gender = safeProfile.gender || 'Male';
  const age = Number(safeProfile.age) || 28;
  const weightKg = Number(safeProfile.weight || safeProfile.weightKg) || 75;
  const heightCm = Number(safeProfile.height || safeProfile.heightCm) || 175;
  const targetWeightKg = Number(safeProfile.targetWeight || safeProfile.targetWeightKg) || (weightKg - 5);
  const activityLevel = safeProfile.activityLevel || 'moderate';

  // Normalize goal naming
  let primaryGoal = 'Fat Loss';
  const rawGoal = (safeProfile.goal || safeProfile.primaryGoal || '').toLowerCase();
  if (rawGoal.includes('muscle') || rawGoal.includes('hypertrophy') || rawGoal.includes('gain')) {
    primaryGoal = 'Muscle Gain';
  } else if (rawGoal.includes('recomp')) {
    primaryGoal = 'Body Recomposition';
  } else if (rawGoal.includes('strength')) {
    primaryGoal = 'Strength';
  } else if (rawGoal.includes('endurance')) {
    primaryGoal = 'Endurance';
  } else if (rawGoal.includes('maintain') || rawGoal.includes('general')) {
    primaryGoal = 'General Fitness';
  } else {
    primaryGoal = 'Fat Loss';
  }

  const metrics = calculateFitnessMetrics({
    gender,
    age,
    heightCm,
    weightKg,
    targetWeightKg,
    activityLevel,
    primaryGoal,
  });

  const bmiInfo = calculateBMI(weightKg, heightCm);
  const safeWeight = weightKg > 0 ? weightKg : 75;
  const safeTargetCalories = metrics.targetCalories > 0 ? metrics.targetCalories : 2000;

  return {
    ...metrics,
    bmi: {
      bmi: bmiInfo.bmi,
      classification: bmiInfo.category,
      category: bmiInfo.category,
      color: bmiInfo.color,
    },
    targetCalories: metrics.targetCalories,
    bmr: metrics.bmr,
    tdee: metrics.tdee,
    protein: {
      grams: metrics.proteinGrams,
      percent: Math.round(((metrics.proteinGrams * 4) / safeTargetCalories) * 100),
      ratioPerKg: (metrics.proteinGrams / safeWeight).toFixed(1),
    },
    carbs: {
      grams: metrics.carbGrams,
      percent: Math.round(((metrics.carbGrams * 4) / safeTargetCalories) * 100),
    },
    fats: {
      grams: metrics.fatGrams,
      percent: Math.round(((metrics.fatGrams * 9) / safeTargetCalories) * 100),
    },
    waterTarget: {
      litersMin: (metrics.waterLiters * 0.9).toFixed(1),
      litersMax: (metrics.waterLiters * 1.1).toFixed(1),
      liters: metrics.waterLiters,
    },
    fiberTargetGrams: metrics.fiberGrams,
  };
}

