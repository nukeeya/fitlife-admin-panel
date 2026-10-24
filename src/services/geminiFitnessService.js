/**
 * Gemini AI Integration Architecture & Mock Service
 *
 * NOTE FOR BACKEND DEVELOPER:
 * This frontend service is structured to seamlessly plug into Google's Gemini 2.5 Flash / Pro API
 * and Google Search Grounding when you configure the backend.
 *
 * ARCHITECTURE OVERVIEW:
 * 1. Frontend sends structured member biometric parameters to your backend API route (e.g. POST /api/gemini/workout or POST /api/gemini/diet).
 * 2. Backend holds the secret GEMINI_API_KEY (never exposed to client) and invokes:
 *    - Model: 'gemini-2.5-flash'
 *    - Tools: [{ googleSearch: {} }] (Google Search Grounding for evidence-based exercise & diet research)
 *    - GenerationConfig: { responseMimeType: "application/json", responseSchema: ... }
 * 3. Backend returns the JSON structured response with citations metadata.
 * 4. Until the backend is deployed, this mock service returns simulated AI responses with identical schemas.
 */

export const GROUNDING_SOURCES_WORKOUT = [
  {
    title: 'ACSM Guidelines for Exercise Testing and Prescription (11th Edition)',
    uri: 'https://www.acsm.org/education-resources/books/guidelines-exercise-testing-prescription',
    snippet: 'Prescribed resistance training frequency (3-5 days/week), volume landmarks, and progressive overload protocols for muscular hypertrophy and strength.',
    publisher: 'American College of Sports Medicine (ACSM)',
  },
  {
    title: 'Loading Recommendations for Muscle Strength, Hypertrophy, and Local Endurance: A Systematic Review',
    uri: 'https://pubmed.ncbi.nlm.nih.gov/33497853/',
    snippet: 'Schoenfeld et al. (2021) double progression model: keeping 1-2 reps in reserve (RIR 8-9) with 2-3 minute compound rest intervals yields optimal protein synthesis.',
    publisher: 'Journal of Strength and Conditioning Research',
  },
  {
    title: 'Evidence-Based Resistance Training Periodization for Athletes',
    uri: 'https://www.nsca.com/education/articles/kinetic-select/periodization-for-resistance-training/',
    snippet: 'Non-linear undulating periodization minimizes overuse injuries while managing systemic fatigue across multi-joint compound movement patterns.',
    publisher: 'National Strength and Conditioning Association (NSCA)',
  },
];

export const GROUNDING_SOURCES_DIET = [
  {
    title: 'ISSN Position Stand: Protein and Exercise',
    uri: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8',
    snippet: 'An overall daily protein intake in the range of 1.4 to 2.0 g protein/kg/day is recommended for active individuals to optimize exercise-induced adaptations.',
    publisher: 'International Society of Sports Nutrition (JISSN)',
  },
  {
    title: 'Dietary Guidelines for Bangladesh & Nutrient Composition of Bangladeshi Foods',
    uri: 'https://www.fao.org/nutrition/education/food-based-dietary-guidelines/regions/countries/bangladesh/en/',
    snippet: 'Nutritional balance using local staples: parboiled rice, local freshwater fish (Rui/Katla), whole eggs, mung/masoor lentils, and fresh leafy vegetables.',
    publisher: 'Food and Agriculture Organization (FAO) & BIRTAN Bangladesh',
  },
  {
    title: 'Dietary Carbohydrates and Glycemic Response in South Asian Diets',
    uri: 'https://www.who.int/bangladesh',
    snippet: 'Balancing glycemic index by combining high-fiber whole wheat atta roti and sour curd (tok doi) alongside lean protein sources to sustain insulin sensitivity.',
    publisher: 'World Health Organization (WHO) South Asia Region',
  },
];

/**
 * Generate Workout Plan via Gemini AI (Frontend simulation with live async delay)
 */
export async function generateGeminiWorkoutPlan({ member, profile }) {
  // Simulate network latency of Google Gemini API generation with search grounding
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const goal = profile.goal || 'hypertrophy';
  const days = Number(profile.workoutFrequency || profile.trainingDaysPerWeek || 4);
  const equip = profile.equipment || 'full_gym';

  // Structured schedule response conforming to future Gemini JSON schema
  const planTitle =
    goal === 'hypertrophy'
      ? 'Hypertrophy Periodization Split (Evidence-Based)'
      : goal === 'fat_loss'
      ? 'Metabolic Conditioning & Hypertrophy Preservation Split'
      : goal === 'strength'
      ? 'Strength & Power Linear Overload Protocol'
      : 'Comprehensive Functional Health & Athleticism Split';

  const daysSchedule = [
    {
      dayNumber: 1,
      dayTitle: 'Day 1: Upper Body Push Focus',
      focus: 'Chest, Anterior/Lateral Deltoids, Triceps',
      warmup: '5 mins rotator cuff dynamic mobility + arm circles + band pull-aparts',
      exercises: [
        {
          name: 'Barbell Flat Bench Press',
          muscleGroup: 'Pectoralis Major, Triceps, Anterior Deltoid',
          sets: 4,
          reps: '6 - 8',
          rest: '120s',
          equipment: 'Barbell & Flat Bench',
          notes: 'Arch upper back slightly, tuck elbows 45 degrees, explode upward.',
        },
        {
          name: 'Incline Dumbbell Press',
          muscleGroup: 'Clavicular Pectoralis (Upper Chest)',
          sets: 3,
          reps: '8 - 10',
          rest: '90s',
          equipment: 'Adjustable Bench & Dumbbells',
          notes: 'Set bench to 30-degree angle. Full stretch at bottom, squeeze at peak.',
        },
        {
          name: 'Cable Lateral Raise',
          muscleGroup: 'Lateral Deltoids (Side Shoulders)',
          sets: 4,
          reps: '12 - 15',
          rest: '60s',
          equipment: 'Cable Crossover Machine',
          notes: 'Maintain slight forward lean, lead with elbows, slow eccentric tempo.',
        },
        {
          name: 'Cable Tricep Rope Pushdown',
          muscleGroup: 'Lateral & Medial Triceps Head',
          sets: 3,
          reps: '10 - 12',
          rest: '60s',
          equipment: 'Cable Machine & Rope Attachment',
          notes: 'Pin elbows to ribs, spread rope handles apart at full lockout.',
        },
      ],
    },
    {
      dayNumber: 2,
      dayTitle: 'Day 2: Lower Body Quad & Core Focus',
      focus: 'Quadriceps, Glutes, Core Stabilization',
      warmup: '5 mins hip 90/90 mobility + bodyweight air squats + dynamic lunges',
      exercises: [
        {
          name: 'Barbell Back Squat',
          muscleGroup: 'Quadriceps, Gluteus Maximus, Erector Spinae',
          sets: 4,
          reps: '6 - 8',
          rest: '120s - 150s',
          equipment: 'Power Squat Rack & Barbell',
          notes: 'Brace core with Valsalva maneuver, break at hips and knees simultaneously.',
        },
        {
          name: 'Romanian Deadlift (RDL)',
          muscleGroup: 'Hamstrings, Glute-Ham Tie-in',
          sets: 3,
          reps: '8 - 10',
          rest: '90s',
          equipment: 'Barbell or Heavy Dumbbells',
          notes: 'Hinge hips backward until deep hamstring stretch. Keep back neutral.',
        },
        {
          name: 'Leg Press (Quad Stance)',
          muscleGroup: 'Quadriceps Hypertrophy',
          sets: 3,
          reps: '10 - 12',
          rest: '90s',
          equipment: '45-Degree Leg Press Machine',
          notes: 'Feet shoulder-width on lower platform. Avoid knee hyperextension.',
        },
        {
          name: 'Hanging Leg Raise',
          muscleGroup: 'Rectus Abdominis & Deep Hip Flexors',
          sets: 3,
          reps: '12 - 15',
          rest: '60s',
          equipment: 'Pull-up Bar or Captains Chair',
          notes: 'Curl pelvis toward sternum without swinging momentum.',
        },
      ],
    },
    {
      dayNumber: 3,
      dayTitle: 'Day 3: Upper Body Pull & Rear Delts',
      focus: 'Latissimus Dorsi, Rhomboids, Biceps, Rear Delts',
      warmup: '5 mins dead hangs + scapular pull-ups + band dislocations',
      exercises: [
        {
          name: 'Conventional Barbell Row',
          muscleGroup: 'Mid-Back, Latissimus Dorsi, Biceps',
          sets: 4,
          reps: '6 - 8',
          rest: '90s - 120s',
          equipment: 'Barbell & Plates',
          notes: 'Hinge at 45 degrees, pull barbell towards belly button with tucked elbows.',
        },
        {
          name: 'Wide-Grip Lat Pulldown',
          muscleGroup: 'Latissimus Dorsi (Back Width)',
          sets: 3,
          reps: '8 - 10',
          rest: '90s',
          equipment: 'Cable Lat Pulldown Station',
          notes: 'Drive elbows downward towards hip pockets, squeeze shoulder blades.',
        },
        {
          name: 'Face Pull with External Rotation',
          muscleGroup: 'Rear Deltoids, Rotator Cuff, Upper Traps',
          sets: 4,
          reps: '15 - 20',
          rest: '60s',
          equipment: 'Cable Machine & Rope',
          notes: 'Pull rope toward eyes while rotating wrists back into thumbs-up position.',
        },
        {
          name: 'Incline Dumbbell Bicep Curl',
          muscleGroup: 'Biceps Brachii (Long Head)',
          sets: 3,
          reps: '10 - 12',
          rest: '60s',
          equipment: 'Incline Bench & Dumbbells',
          notes: 'Set bench to 60 degrees. Full stretch at bottom, curl without shoulder drift.',
        },
      ],
    },
    {
      dayNumber: 4,
      dayTitle: 'Day 4: Posterior Chain & Arms Specialization',
      focus: 'Hamstrings, Calves, Triceps Long Head, Forearms',
      warmup: '5 mins glute bridges + high knees + hamstring sweeps',
      exercises: [
        {
          name: 'Seated or Lying Hamstring Curl',
          muscleGroup: 'Biceps Femoris & Semitendinosus',
          sets: 4,
          reps: '10 - 12',
          rest: '75s',
          equipment: 'Leg Curl Machine',
          notes: '2-second controlled eccentric descent on every repetition.',
        },
        {
          name: 'Dumbbell Walking Lunges',
          muscleGroup: 'Glutes, Quads, Unilateral Stabilizers',
          sets: 3,
          reps: '12 steps/leg',
          rest: '90s',
          equipment: 'Pair of Dumbbells',
          notes: 'Keep torso upright and knee tracking over toes.',
        },
        {
          name: 'Standing Calf Raise',
          muscleGroup: 'Gastrocnemius & Soleus',
          sets: 4,
          reps: '15 - 20',
          rest: '60s',
          equipment: 'Calf Raise Block or Smith Machine',
          notes: 'Hold peak contraction for 1 full second; full deep stretch at bottom.',
        },
        {
          name: 'Overhead EZ-Bar Cable Extension',
          muscleGroup: 'Triceps Brachii (Long Head Stretch)',
          sets: 3,
          reps: '10 - 12',
          rest: '60s',
          equipment: 'Cable Station & EZ-Bar / Rope',
          notes: 'Keep elbows high and stationary to load the long head stretch.',
        },
      ],
    },
  ];

  return {
    isGeminiSimulated: true,
    model: 'gemini-2.5-flash (grounded with Google Search)',
    title: planTitle,
    frequencyDays: days,
    experienceLevel: profile.experience || 'intermediate',
    primaryGoal: goal,
    equipmentEnvironment: equip,
    limitationsConsidered: profile.limitations || 'None',
    sessionDurationMins: profile.sessionDuration || 60,
    generatedAt: new Date().toISOString(),
    groundingCitations: GROUNDING_SOURCES_WORKOUT,
    splits: daysSchedule.slice(0, Math.min(days, 4)),
  };
}

/**
 * Generate Diet Plan via Gemini AI (Frontend simulation with live async delay)
 */
export async function generateGeminiDietPlan({ member, profile }) {
  // Simulate network latency of Google Gemini API generation with search grounding
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const goal = profile.goal || 'fat_loss';
  const memberWeight = Number(profile.weight || 75);

  const calories =
    goal === 'fat_loss'
      ? Math.round(memberWeight * 28 - 400)
      : goal === 'hypertrophy'
      ? Math.round(memberWeight * 33 + 300)
      : Math.round(memberWeight * 30);

  const proteinGrams = Math.round(memberWeight * 1.8);
  const fatGrams = Math.round((calories * 0.25) / 9);
  const carbGrams = Math.round((calories - (proteinGrams * 4 + fatGrams * 9)) / 4);

  return {
    isGeminiSimulated: true,
    model: 'gemini-2.5-flash (grounded with Google Search)',
    title: `${goal === 'fat_loss' ? 'Bangladeshi High-Protein Fat Shred' : 'Clean Mass Anabolic Protocol'} (${calories} kcal)`,
    targetCalories: calories,
    macros: {
      protein: proteinGrams,
      carbs: carbGrams,
      fat: fatGrams,
      fiber: 32,
      waterLiters: (memberWeight * 0.04).toFixed(1),
    },
    mealFrequency: profile.mealFrequency || '4 Meals',
    dietaryPreferences: profile.preferences || 'Bangladeshi Halal High-Protein',
    allergies: profile.allergies || 'None',
    generatedAt: new Date().toISOString(),
    groundingCitations: GROUNDING_SOURCES_DIET,
    meals: [
      {
        mealName: 'Meal 1 — Morning Energy Breakfast (সকালের নাস্তা)',
        time: '08:00 AM',
        targetSummary: 'High Bioavailability Protein + Complex Carbs',
        items: [
          {
            foodName: 'Whole Boiled Egg (সিদ্ধ ডিম)',
            portion: '2 whole large eggs',
            grams: 100,
            calories: 143,
            protein: 12.6,
            carbs: 0.8,
            fat: 9.5,
            notes: 'Rich in choline and healthy essential fatty acids.',
          },
          {
            foodName: 'Egg Whites (ডিমের সাদা অংশ)',
            portion: '2 egg whites boiled',
            grams: 66,
            calories: 34,
            protein: 7.2,
            carbs: 0.4,
            fat: 0.1,
            notes: 'Pure lean albumin protein without added fats.',
          },
          {
            foodName: 'Whole Wheat Atta Roti (হাতে বানানো লাল আটার রুটি)',
            portion: '2 medium rotis',
            grams: 70,
            calories: 180,
            protein: 6.2,
            carbs: 36,
            fat: 1.0,
            notes: 'Slow-burning complex carbohydrate with dietary fiber.',
          },
          {
            foodName: 'Tok Doi / Sour Curd (টক দই)',
            portion: '1 medium cup',
            grams: 150,
            calories: 90,
            protein: 5.3,
            carbs: 7.0,
            fat: 4.8,
            notes: 'Probiotic digestion booster and natural casein source.',
          },
        ],
      },
      {
        mealName: 'Meal 2 — High Protein Anabolic Lunch (দুপুরের খাবার)',
        time: '01:30 PM',
        targetSummary: 'Lean Fish / Poultry + Lentils + Steamed Rice + Greens',
        items: [
          {
            foodName: 'White Rice / Bhaat (সাদা ভাত / লাল চালের ভাত)',
            portion: '1 medium vati (cup)',
            grams: 150,
            calories: 195,
            protein: 4.1,
            carbs: 43.5,
            fat: 0.4,
            notes: 'Primary fuel source for muscle glycogen restoration.',
          },
          {
            foodName: 'Rui Fish Curry (রুই মাছের ঝোল)',
            portion: '1 large piece (light olive/mustard oil)',
            grams: 150,
            calories: 165,
            protein: 29.6,
            carbs: 0,
            fat: 4.5,
            notes: 'Rich in omega-3 fatty acids and complete essential amino acids.',
          },
          {
            foodName: 'Yellow Mung Dal (মুগ ডাল পাতলা ঝোল)',
            portion: '1 medium bowl',
            grams: 150,
            calories: 140,
            protein: 9.8,
            carbs: 22.0,
            fat: 1.2,
            notes: 'Plant-based micro-nutrient source with soluble fiber.',
          },
          {
            foodName: 'Sauteed Red Amaranth (লাল শাক ভাজি)',
            portion: '1 small katori (light oil)',
            grams: 100,
            calories: 45,
            protein: 3.2,
            carbs: 5.0,
            fat: 1.5,
            notes: 'Loaded with dietary nitrates for enhanced blood flow.',
          },
        ],
      },
      {
        mealName: 'Meal 3 — Pre-Workout Sustained Fuel (বিকেলের নাস্তা)',
        time: '05:30 PM',
        targetSummary: 'Pre-Training Carbohydrate & Potassium Loading',
        items: [
          {
            foodName: 'Shobri Kola / Banana (সবরি কলা)',
            portion: '1 medium banana',
            grams: 100,
            calories: 89,
            protein: 1.1,
            carbs: 22.8,
            fat: 0.3,
            notes: 'Natural electrolyte and rapidly accessible ATP energy.',
          },
          {
            foodName: 'Boiled Chickpeas / Chhola (সেদ্ধ ছোলা হালকা শসা সহ)',
            portion: 'half cup boiled',
            grams: 75,
            calories: 122,
            protein: 6.6,
            carbs: 20.6,
            fat: 2.0,
            notes: 'Sustained energy release without blood sugar spike.',
          },
        ],
      },
      {
        mealName: 'Meal 4 — Lean Recovery Dinner (রাতের খাবার)',
        time: '08:30 PM',
        targetSummary: 'Lean Poultry Protein + Fiber + Low Glycemic Carbs',
        items: [
          {
            foodName: 'Deshi Chicken Curry (দেশি মুরগির মাংস ভুনা/ঝোল)',
            portion: '2 medium breast pieces',
            grams: 160,
            calories: 220,
            protein: 34.5,
            carbs: 1.2,
            fat: 8.5,
            notes: 'Maximum leucine content to trigger nighttime muscle protein synthesis.',
          },
          {
            foodName: 'Whole Wheat Atta Roti (হাতে বানানো লাল আটার রুটি)',
            portion: '2 medium rotis',
            grams: 70,
            calories: 180,
            protein: 6.2,
            carbs: 36,
            fat: 1.0,
            notes: 'Slow-digesting carbohydrate to prevent nocturnal cortisol elevation.',
          },
          {
            foodName: 'Palong Shaak / Spinach (পালং শাক ভাজি/ঝোল)',
            portion: '1 small bowl',
            grams: 100,
            calories: 40,
            protein: 3.0,
            carbs: 4.2,
            fat: 1.2,
            notes: 'Magnesium and iron to support muscle recovery and sleep quality.',
          },
        ],
      },
    ],
  };
}
