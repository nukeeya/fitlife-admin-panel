/**
 * Authentic Bangladeshi Food Database & Smart Substitution Registry
 * 
 * Nutritional values sourced from Food and Agriculture Organization (FAO) 
 * Food Composition Table for Bangladesh and USDA FoodData Central.
 */

export const BANGLADESHI_FOODS = [
  // --- PROTEIN SOURCES ---
  {
    id: 'chick_breast',
    name: 'Deshi Chicken Breast (Skinless)',
    localName: 'মুরগির বুকের মাংস',
    category: 'protein',
    servingUnit: '150g (Cooked/Grilled)',
    servingWeightGrams: 150,
    calories: 245,
    protein: 45,
    carbs: 0,
    fat: 5,
    fiber: 0,
    notes: 'Leanest local animal protein with high leucine content for muscle protein synthesis.',
  },
  {
    id: 'chick_curry',
    name: 'Deshi Chicken Curry (Light Gravy)',
    localName: 'মুরগির ঝোল তরকারি',
    category: 'protein',
    servingUnit: '150g piece + light gravy',
    servingWeightGrams: 150,
    calories: 280,
    protein: 36,
    carbs: 4,
    fat: 12,
    fiber: 1,
    notes: 'Cooked with mustard/soybean oil, turmeric, ginger, garlic.',
  },
  {
    id: 'rui_fish',
    name: 'Rui Fish Curry (Rohu Carp)',
    localName: 'রুই মাছের ঝোল',
    category: 'protein',
    servingUnit: '150g piece',
    servingWeightGrams: 150,
    calories: 190,
    protein: 30,
    carbs: 1,
    fat: 7,
    fiber: 0,
    notes: 'Excellent freshwater protein rich in omega fatty acids and low saturated fat.',
  },
  {
    id: 'katla_fish',
    name: 'Katla Fish Steak',
    localName: 'কাতল মাছ',
    category: 'protein',
    servingUnit: '150g piece',
    servingWeightGrams: 150,
    calories: 195,
    protein: 29,
    carbs: 1,
    fat: 8,
    fiber: 0,
    notes: 'Popular freshwater carp with clean macronutrient balance.',
  },
  {
    id: 'ilish_fish',
    name: 'Ilish Fish (Hilsa Curry)',
    localName: 'ইলিশ মাছ',
    category: 'protein',
    servingUnit: '120g piece',
    servingWeightGrams: 120,
    calories: 275,
    protein: 26,
    carbs: 0,
    fat: 18,
    fiber: 0,
    notes: 'High in natural heart-healthy Omega-3 marine oils; count toward healthy fat quota.',
  },
  {
    id: 'lean_beef',
    name: 'Lean Beef Curry (Gorur Mangsho)',
    localName: 'গরুর মাংস (চর্বি ছাড়া)',
    category: 'protein',
    servingUnit: '130g lean cuts',
    servingWeightGrams: 130,
    calories: 270,
    protein: 34,
    carbs: 2,
    fat: 14,
    fiber: 0,
    notes: 'Rich in bioavailable heme iron, zinc, and natural creatine.',
  },
  {
    id: 'whole_egg',
    name: 'Boiled Farm Egg (Whole)',
    localName: 'সিদ্ধ ডিম (কুসুমসহ)',
    category: 'protein',
    servingUnit: '2 Large Eggs',
    servingWeightGrams: 100,
    calories: 144,
    protein: 13,
    carbs: 1,
    fat: 10,
    fiber: 0,
    notes: 'Complete amino acid profile + choline for brain and liver function.',
  },
  {
    id: 'egg_white',
    name: 'Egg Whites (Poached / Boiled)',
    localName: 'ডিমের সাদা অংশ',
    category: 'protein',
    servingUnit: '4 Egg Whites',
    servingWeightGrams: 130,
    calories: 68,
    protein: 15,
    carbs: 1,
    fat: 0.3,
    fiber: 0,
    notes: 'Pure albumin protein, zero cholesterol, virtually fat-free.',
  },
  {
    id: 'tok_doi',
    name: 'Tok Doi (Low-Fat Plain Yogurt)',
    localName: 'টক দই',
    category: 'dairy',
    servingUnit: '1 Cup (150g)',
    servingWeightGrams: 150,
    calories: 95,
    protein: 9,
    carbs: 8,
    fat: 3,
    fiber: 0,
    notes: 'Traditional Bengali probiotic powerhouse supporting gut microbiome and nutrient absorption.',
  },

  // --- CARBOHYDRATE SOURCES ---
  {
    id: 'sada_bhaat',
    name: 'Sada Bhaat (Boiled White Rice)',
    localName: 'সাদা ভাত',
    category: 'carbs',
    servingUnit: '1 Cup Cooked (150g)',
    servingWeightGrams: 150,
    calories: 195,
    protein: 4.2,
    carbs: 44,
    fat: 0.4,
    fiber: 0.6,
    notes: 'Fast-digesting complex carbohydrate ideal for pre/post-workout glycogen replenishment.',
  },
  {
    id: 'lal_chaal',
    name: 'Lal Chaal Bhaat (Brown / Red Rice)',
    localName: 'লাল চালের ভাত',
    category: 'carbs',
    servingUnit: '1 Cup Cooked (150g)',
    servingWeightGrams: 150,
    calories: 172,
    protein: 4.0,
    carbs: 36,
    fat: 1.5,
    fiber: 3.2,
    notes: 'Lower glycemic index, unpolished grain rich in B-vitamins and dietary fiber.',
  },
  {
    id: 'atta_roti',
    name: 'Hand-Made Atta Roti (Chapati)',
    localName: 'হাতে বানানো লাল আটার রুটি',
    category: 'carbs',
    servingUnit: '2 Medium Rotis (70g total)',
    servingWeightGrams: 70,
    calories: 180,
    protein: 6.5,
    carbs: 36,
    fat: 1.0,
    fiber: 4.5,
    notes: '100% whole wheat wholemeal flour without added shortening or butter.',
  },
  {
    id: 'boiled_potato',
    name: 'Boiled Potato (Shiddho Alu)',
    localName: 'সিদ্ধ আলু',
    category: 'carbs',
    servingUnit: '1 Medium (150g)',
    servingWeightGrams: 150,
    calories: 130,
    protein: 3.0,
    carbs: 30,
    fat: 0.2,
    fiber: 3.0,
    notes: 'High satiety index (highest on Holt satiety scale), rich in potassium.',
  },
  {
    id: 'oats',
    name: 'Rolled Oats (Shiddho Oats)',
    localName: 'ওটস',
    category: 'carbs',
    servingUnit: '50g (Raw measurement)',
    servingWeightGrams: 50,
    calories: 190,
    protein: 6.5,
    carbs: 34,
    fat: 3.5,
    fiber: 5.0,
    notes: 'Rich in beta-glucan soluble fiber that blunts insulin spikes.',
  },

  // --- LENTILS & LEGUMES ---
  {
    id: 'masoor_dal',
    name: 'Masoor Dal (Thick Red Lentil Soup)',
    localName: 'ঘন মসুর ডাল',
    category: 'lentils',
    servingUnit: '1 Cup Thick (180g)',
    servingWeightGrams: 180,
    calories: 165,
    protein: 11,
    carbs: 26,
    fat: 2,
    fiber: 6.5,
    notes: 'Plant protein staple providing folate, iron, and slow-burning carbohydrates.',
  },
  {
    id: 'chola_bhaja',
    name: 'Boiled Chola (Chickpeas / Garbanzo)',
    localName: 'সিদ্ধ ছোলা',
    category: 'lentils',
    servingUnit: '1 Cup (120g)',
    servingWeightGrams: 120,
    calories: 190,
    protein: 10.5,
    carbs: 31,
    fat: 3.2,
    fiber: 8.0,
    notes: 'Traditional high-satiety afternoon snack with low glycemic impact.',
  },

  // --- VEGETABLES & FIBER ---
  {
    id: 'palong_shaak',
    name: 'Palong Shaak Bhaji (Spinach)',
    localName: 'পালং শাক ভাজি',
    category: 'vegetables',
    servingUnit: '1 Cup Cooked (120g)',
    servingWeightGrams: 120,
    calories: 55,
    protein: 3.5,
    carbs: 5,
    fat: 2.5,
    fiber: 3.8,
    notes: 'High nitrates supporting vasodilation and natural nitric oxide production.',
  },
  {
    id: 'shobji_torkari',
    name: 'Mixed Seasonal Shobji (Papaya, Pui, Gourd)',
    localName: 'পাঁচমিশালি সবজি তরকারি',
    category: 'vegetables',
    servingUnit: '1 Big Bowl (200g)',
    servingWeightGrams: 200,
    calories: 85,
    protein: 3.0,
    carbs: 14,
    fat: 2.0,
    fiber: 5.5,
    notes: 'High volume, low caloric density, loaded with potassium and micronutrients.',
  },

  // --- FRUITS ---
  {
    id: 'peyara',
    name: 'Deshi Peyara (Fresh Guava)',
    localName: 'দেশি পেয়ারা',
    category: 'fruits',
    servingUnit: '1 Whole Fruit (150g)',
    servingWeightGrams: 150,
    calories: 95,
    protein: 3.8,
    carbs: 21,
    fat: 1.4,
    fiber: 8.0,
    notes: 'Contains over 300% of daily Vitamin C; super-high fiber content suppresses appetite.',
  },
  {
    id: 'kola',
    name: 'Shobri / Sagor Kola (Banana)',
    localName: 'কলা',
    category: 'fruits',
    servingUnit: '1 Medium Banana (118g)',
    servingWeightGrams: 118,
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.3,
    fiber: 3.1,
    notes: 'Fast portable carbs with potassium and magnesium to prevent muscle cramps.',
  },

  // --- NUTS & HEALTHY FATS ---
  {
    id: 'cheena_badam',
    name: 'Cheena Badam (Roasted Peanuts)',
    localName: 'ভাজা চিনা বাদাম',
    category: 'fats',
    servingUnit: '30g Handful',
    servingWeightGrams: 30,
    calories: 175,
    protein: 7.8,
    carbs: 5.0,
    fat: 14.5,
    fiber: 2.4,
    notes: 'Affordable local source of monounsaturated fats and arginine for blood flow.',
  },
];

/**
 * Smart Food Substitution Engine
 * 
 * Takes an original food item and finds suitable local alternatives within the same macro category,
 * calculating the exact portion multiplier to maintain protein or carbohydrate parity.
 */
export function getSmartSubstitutions(foodId) {
  const original = BANGLADESHI_FOODS.find((f) => f.id === foodId);
  if (!original) return [];

  // Filter candidates in the same functional macro category
  const candidates = BANGLADESHI_FOODS.filter(
    (f) => f.id !== foodId && (f.category === original.category || (original.category === 'protein' && f.category === 'dairy'))
  );

  return candidates.map((alt) => {
    let ratio = 1;
    let reason = '';

    if (original.category === 'protein') {
      // Scale portion so total protein matches original
      ratio = Number((original.protein / (alt.protein || 1)).toFixed(2));
      reason = `Portion adjusted (${Math.round(ratio * 100)}%) to deliver matching ~${original.protein}g protein`;
    } else if (original.category === 'carbs') {
      // Scale portion so total carbs match original
      ratio = Number((original.carbs / (alt.carbs || 1)).toFixed(2));
      reason = `Portion adjusted to deliver matching ~${original.carbs}g complex carbohydrates`;
    } else {
      ratio = Number((original.calories / (alt.calories || 1)).toFixed(2));
      reason = `Portion adjusted for equal caloric density (~${original.calories} kcal)`;
    }

    const portionGrams = Math.round((alt.servingWeightGrams || 100) * ratio);
    return {
      id: alt.id,
      foodId: alt.id,
      name: alt.name,
      banglaName: alt.localName || alt.name,
      localName: alt.localName || alt.name,
      portionGrams,
      servingDesc: alt.servingUnit || `${portionGrams}g`,
      calories: Math.round(alt.calories * ratio),
      protein: Math.round(alt.protein * ratio),
      carbs: Math.round(alt.carbs * ratio),
      fat: Math.round(alt.fat * ratio),
      fiber: Math.round(alt.fiber * ratio),
      rationale: reason,
      substitutionReason: reason,
      alternativeFood: alt,
      portionMultiplier: ratio,
      calculatedPortion: `${portionGrams}g (${alt.name})`,
    };
  });
}
