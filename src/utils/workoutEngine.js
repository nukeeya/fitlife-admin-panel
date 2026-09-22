/**
 * Evidence-Based Progressive Overload & Workout Architecture Engine
 * 
 * Implements:
 * - Periodized split structures (Push/Pull/Legs, Upper/Lower, Full Body)
 * - Double Progression Model (Helms & Schoenfeld)
 * - RPE (Rate of Perceived Exertion) & RIR (Reps in Reserve) calibration
 * - Session Adaptations: Time crunch (30-min), Joint discomfort, Equipment busy
 */

export const EXERCISE_LIBRARY = [
  // Chest / Push
  {
    id: 'barbell_bench',
    name: 'Barbell Flat Bench Press',
    muscle: 'Chest (Pectoralis Major), Front Delts, Triceps',
    equipment: 'Barbell, Bench',
    tier: 'Compound (Primary)',
    tempo: '3-1-1-0 (3s eccentric, 1s pause on chest, 1s explosive drive)',
    techniqueCue: 'Retract scapulae into bench, arch slightly, drive feet into floor, touch mid-sternum.',
    alternatives: ['db_flat_bench', 'pushup_weighted', 'machine_chest_press'],
    jointStress: 'Moderate shoulder / wrist',
  },
  {
    id: 'db_incline_bench',
    name: 'Incline Dumbbell Press (30° Angle)',
    muscle: 'Upper Chest (Clavicular Head), Anterior Deltoid',
    equipment: 'Dumbbells, Adjustable Bench',
    tier: 'Compound',
    tempo: '3-0-1-0',
    techniqueCue: 'Keep elbows tucked at 45-60° relative to torso. Converge weights slightly at top without clanking.',
    alternatives: ['incline_barbell', 'cable_incline_fly'],
    jointStress: 'Low shoulder impingement risk',
  },
  {
    id: 'overhead_press',
    name: 'Standing Overhead Barbell Press (OHP)',
    muscle: 'Shoulders (Deltoids), Triceps, Upper Trapezius, Core',
    equipment: 'Barbell, Squat Rack',
    tier: 'Compound (Primary)',
    tempo: '2-1-1-0',
    techniqueCue: 'Squeeze glutes and brace core. Push vertically in straight line, moving head back to clear chin.',
    alternatives: ['seated_db_press', 'landmine_press', 'machine_shoulder_press'],
    jointStress: 'High shoulder/lumbar if arched',
  },
  {
    id: 'cable_lateral_raise',
    name: 'Single-Arm Cable Lateral Raise',
    muscle: 'Lateral Deltoid (Shoulder Width)',
    equipment: 'Cable Machine',
    tier: 'Isolation',
    tempo: '2-1-1-1 (1s peak contraction hold)',
    techniqueCue: 'Set pulley at hand height with cable behind body. Lead with elbow, elevate to shoulder height.',
    alternatives: ['db_lateral_raise', 'resistance_band_lateral'],
    jointStress: 'Low',
  },
  {
    id: 'cable_tricep_pushdown',
    name: 'Triceps Rope Pushdown',
    muscle: 'Triceps Brachii (Lateral & Medial Head)',
    equipment: 'Cable Machine, Rope Attachment',
    tier: 'Isolation',
    tempo: '2-0-1-1',
    techniqueCue: 'Lock elbows against ribcage. Spread rope ends apart at bottom for full tricep peak contraction.',
    alternatives: ['skullcrushers', 'overhead_cable_tricep'],
    jointStress: 'Low elbow',
  },

  // Back / Pull
  {
    id: 'barbell_deadlift',
    name: 'Conventional Barbell Deadlift',
    muscle: 'Posterior Chain (Hamstrings, Glutes, Erector Spinae, Lats)',
    equipment: 'Barbell, Plates, Chalk',
    tier: 'Compound (Primary)',
    tempo: '2-1-1-0',
    techniqueCue: 'Bar over mid-foot, drag bar up shins, push floor away through heels, lock hips simultaneously.',
    alternatives: ['romanian_deadlift', 'trap_bar_deadlift', 'db_romanian_deadlift'],
    jointStress: 'High lumbar load if form lapses',
  },
  {
    id: 'lat_pulldown',
    name: 'Wide-Grip Lat Pulldown',
    muscle: 'Latissimus Dorsi, Teres Major, Biceps',
    equipment: 'Lat Pulldown Machine',
    tier: 'Compound',
    tempo: '2-1-1-1',
    techniqueCue: 'Slight torso lean back (10°), drive elbows down toward rear hips, do not yank with lower back.',
    alternatives: ['pullup_bodyweight', 'neutral_grip_pulldown'],
    jointStress: 'Low',
  },
  {
    id: 'chest_supported_row',
    name: 'Chest-Supported Incline Dumbbell Row',
    muscle: 'Rhomboids, Middle Trapezius, Posterior Deltoid, Lats',
    equipment: 'Incline Bench, Dumbbells',
    tier: 'Compound',
    tempo: '2-1-1-1',
    techniqueCue: 'Sternum anchored against bench. Eliminates lower back axial fatigue so upper back can be isolated.',
    alternatives: ['bent_over_barbell_row', 'seated_cable_row'],
    jointStress: 'Zero spinal axial load (Back-friendly)',
  },
  {
    id: 'incline_db_curl',
    name: 'Incline Dumbbell Bicep Curl',
    muscle: 'Biceps Brachii (Long Head stretch)',
    equipment: 'Dumbbells, Incline Bench (45°)',
    tier: 'Isolation',
    tempo: '3-0-1-0',
    techniqueCue: 'Let arms hang vertically behind torso to place long head in extreme active stretch.',
    alternatives: ['standing_ez_bar_curl', 'cable_bayesian_curl', 'hammer_curl'],
    jointStress: 'Low',
  },

  // Legs / Lower
  {
    id: 'barbell_squat',
    name: 'Barbell Back Squat (High-Bar)',
    muscle: 'Quadriceps, Gluteus Maximus, Adductors, Core',
    equipment: 'Barbell, Squat Rack',
    tier: 'Compound (Primary)',
    tempo: '3-1-1-0',
    techniqueCue: 'Brace abdomen 360°, break hips and knees together, descend until thighs parallel with floor.',
    alternatives: ['goblet_squat', 'leg_press', 'bulgarian_split_squat', 'hack_squat'],
    jointStress: 'High knee / lumbar if valgus occurs',
  },
  {
    id: 'romanian_deadlift',
    name: 'Romanian Deadlift (RDL)',
    muscle: 'Hamstrings, Glutes, Lower Back',
    equipment: 'Barbell or Dumbbells',
    tier: 'Compound',
    tempo: '3-1-1-0',
    techniqueCue: 'Slight knee bend fixed in place, hinge hips backward like shutting car door with hips until hamstring tension peaks.',
    alternatives: ['seated_leg_curl', 'lying_leg_curl'],
    jointStress: 'Low knee / moderate hamstring stretch',
  },
  {
    id: 'bulgarian_split_squat',
    name: 'Bulgarian Split Squat (Rear Foot Elevated)',
    muscle: 'Quadriceps, Glute Medius, Stabilizers',
    equipment: 'Dumbbells, Bench',
    tier: 'Unilateral Compound',
    tempo: '3-1-1-0',
    techniqueCue: 'Back foot on bench laces-down. Descend until rear knee lightly touches floor, torso upright for quads.',
    alternatives: ['walking_lunges', 'step_ups'],
    jointStress: 'Low spinal load / addresses left-right asymmetries',
  },
  {
    id: 'standing_calf_raise',
    name: 'Standing Calf Raise',
    muscle: 'Gastrocnemius, Soleus',
    equipment: 'Calf Machine or Step with Dumbbell',
    tier: 'Isolation',
    tempo: '3-2-1-1 (2s dead stop at bottom stretch)',
    techniqueCue: 'Eliminate bounce/Achilles reflex. Pause 2s at full bottom stretch, explode onto big toe, hold 1s.',
    alternatives: ['seated_calf_raise'],
    jointStress: 'Low',
  },
];

/**
 * Generate Structured Periodized Program
 */
export function generateWorkoutProgram({
  goal = 'Fat Loss',
  experience = 'Intermediate',
  daysPerWeek = 4,
  sessionDuration = 45,
  equipment = 'Full Gym',
  injuries = '',
}) {
  const days = Number(daysPerWeek) || 4;

  let splits = [];

  if (days <= 3) {
    // 3-Day Full Body Split
    splits = [
      {
        day: 'Day 1 - Full Body (A: Quad & Horizontal Push/Pull Focus)',
        duration: `${sessionDuration} Mins`,
        focus: 'Compound Squat, Horizontal Press, Horizontal Pull',
        exercises: [
          { id: 'barbell_squat', sets: '3 Sets', reps: '6-8 Reps', rest: '120s', rpe: 'RPE 8 (2 RIR)', targetWeight: '75 kg' },
          { id: 'barbell_bench', sets: '3 Sets', reps: '8-10 Reps', rest: '90s', rpe: 'RPE 8 (2 RIR)', targetWeight: '60 kg' },
          { id: 'chest_supported_row', sets: '3 Sets', reps: '10-12 Reps', rest: '75s', rpe: 'RPE 8.5 (1 RIR)', targetWeight: '22 kg/DB' },
          { id: 'cable_lateral_raise', sets: '3 Sets', reps: '12-15 Reps', rest: '45s', rpe: 'RPE 9 (1 RIR)', targetWeight: '7.5 kg' },
          { id: 'cable_tricep_pushdown', sets: '3 Sets', reps: '12-15 Reps', rest: '45s', rpe: 'RPE 9 (1 RIR)', targetWeight: '20 kg' },
        ],
      },
      {
        day: 'Day 2 - Rest & Active Recovery',
        duration: '30 Mins',
        focus: 'Zone 2 Light Cardio & Hip Mobility Stretches',
        exercises: [
          { id: 'walking', name: 'Brisk Treadmill Incline Walk', sets: '1 Continuous', reps: '30 Mins', rest: '—', rpe: 'RPE 5 (Heart rate 115-125 bpm)', targetWeight: 'Bodyweight' },
        ],
      },
      {
        day: 'Day 3 - Full Body (B: Posterior Chain & Vertical Focus)',
        duration: `${sessionDuration} Mins`,
        focus: 'Hinge / Deadlift, Vertical Pull, Overhead Press',
        exercises: [
          { id: 'romanian_deadlift', sets: '3 Sets', reps: '8-10 Reps', rest: '90s', rpe: 'RPE 8 (2 RIR)', targetWeight: '70 kg' },
          { id: 'overhead_press', sets: '3 Sets', reps: '6-8 Reps', rest: '90s', rpe: 'RPE 8 (2 RIR)', targetWeight: '40 kg' },
          { id: 'lat_pulldown', sets: '3 Sets', reps: '10-12 Reps', rest: '75s', rpe: 'RPE 8.5 (1 RIR)', targetWeight: '55 kg' },
          { id: 'bulgarian_split_squat', sets: '3 Sets', reps: '10 Reps/leg', rest: '60s', rpe: 'RPE 8 (2 RIR)', targetWeight: '14 kg/DB' },
          { id: 'incline_db_curl', sets: '3 Sets', reps: '12 Reps', rest: '45s', rpe: 'RPE 9 (1 RIR)', targetWeight: '12 kg/DB' },
        ],
      },
      {
        day: 'Day 4 - Full Body (C: Hypertrophy & Unilateral Volume)',
        duration: `${sessionDuration} Mins`,
        focus: 'Incline Press, Upper Back, Hamstrings & Calves',
        exercises: [
          { id: 'db_incline_bench', sets: '3 Sets', reps: '10-12 Reps', rest: '75s', rpe: 'RPE 8 (2 RIR)', targetWeight: '24 kg/DB' },
          { id: 'lat_pulldown', sets: '3 Sets', reps: '10-12 Reps', rest: '75s', rpe: 'RPE 8.5 (1 RIR)', targetWeight: '55 kg' },
          { id: 'barbell_squat', sets: '3 Sets', reps: '10-12 Reps', rest: '90s', rpe: 'RPE 8 (2 RIR)', targetWeight: '65 kg' },
          { id: 'standing_calf_raise', sets: '4 Sets', reps: '15 Reps', rest: '45s', rpe: 'RPE 9.5 (0 RIR)', targetWeight: '45 kg' },
        ],
      },
    ];
  } else {
    // 4 to 5-Day Upper / Lower Periodized Split
    splits = [
      {
        day: 'Day 1 - Upper Body (Power & Mechanical Tension)',
        duration: `${sessionDuration} Mins`,
        focus: 'Heavy Horizontal Press, Vertical Pull & Shoulder Stability',
        exercises: [
          { id: 'barbell_bench', sets: '4 Sets', reps: '6-8 Reps', rest: '120s', rpe: 'RPE 8 (2 RIR)', targetWeight: '70 kg' },
          { id: 'chest_supported_row', sets: '4 Sets', reps: '8-10 Reps', rest: '90s', rpe: 'RPE 8 (2 RIR)', targetWeight: '26 kg/DB' },
          { id: 'overhead_press', sets: '3 Sets', reps: '8 Reps', rest: '90s', rpe: 'RPE 8.5 (1-2 RIR)', targetWeight: '42.5 kg' },
          { id: 'lat_pulldown', sets: '3 Sets', reps: '10-12 Reps', rest: '75s', rpe: 'RPE 8.5 (1 RIR)', targetWeight: '60 kg' },
          { id: 'cable_lateral_raise', sets: '3 Sets', reps: '15 Reps', rest: '45s', rpe: 'RPE 9 (1 RIR)', targetWeight: '8.5 kg' },
        ],
      },
      {
        day: 'Day 2 - Lower Body (Quad & Hip Drive Focus)',
        duration: `${sessionDuration} Mins`,
        focus: 'Knee-dominant Compound & Calf Density',
        exercises: [
          { id: 'barbell_squat', sets: '4 Sets', reps: '6-8 Reps', rest: '120s', rpe: 'RPE 8 (2 RIR)', targetWeight: '85 kg' },
          { id: 'romanian_deadlift', sets: '3 Sets', reps: '8-10 Reps', rest: '90s', rpe: 'RPE 8 (2 RIR)', targetWeight: '75 kg' },
          { id: 'bulgarian_split_squat', sets: '3 Sets', reps: '10 Reps/leg', rest: '75s', rpe: 'RPE 8.5 (1 RIR)', targetWeight: '16 kg/DB' },
          { id: 'standing_calf_raise', sets: '4 Sets', reps: '15 Reps (2s pause)', rest: '45s', rpe: 'RPE 9 (1 RIR)', targetWeight: '50 kg' },
        ],
      },
      {
        day: 'Day 3 - Rest & Active Recovery Protocol',
        duration: '30 Mins',
        focus: 'Tissue Hydration & Low-Impact Aerobic Flush',
        exercises: [
          { id: 'walking', name: 'Low Impact Outdoor / Incline Walk', sets: '1 Session', reps: '30-40 Mins', rest: '—', rpe: 'RPE 5 (115 bpm)', targetWeight: 'Bodyweight' },
        ],
      },
      {
        day: 'Day 4 - Upper Body (Hypertrophy & Pump Volume)',
        duration: `${sessionDuration} Mins`,
        focus: 'Incline Angles, Arm Flexors & Extensors',
        exercises: [
          { id: 'db_incline_bench', sets: '4 Sets', reps: '10-12 Reps', rest: '75s', rpe: 'RPE 8.5 (1 RIR)', targetWeight: '24 kg/DB' },
          { id: 'lat_pulldown', sets: '4 Sets', reps: '10-12 Reps', rest: '75s', rpe: 'RPE 8.5 (1 RIR)', targetWeight: '60 kg' },
          { id: 'cable_lateral_raise', sets: '4 Sets', reps: '15 Reps (Drop on 4th)', rest: '45s', rpe: 'RPE 9.5 (0 RIR)', targetWeight: '7.5 kg' },
          { id: 'cable_tricep_pushdown', sets: '3 Sets', reps: '12-15 Reps', rest: '45s', rpe: 'RPE 9 (1 RIR)', targetWeight: '22.5 kg' },
          { id: 'incline_db_curl', sets: '3 Sets', reps: '12 Reps', rest: '45s', rpe: 'RPE 9 (1 RIR)', targetWeight: '12 kg/DB' },
        ],
      },
      {
        day: 'Day 5 - Lower Body (Posterior Chain & Unilateral Strength)',
        duration: `${sessionDuration} Mins`,
        focus: 'Hamstring Peak Tension, Glute Drive & Core',
        exercises: [
          { id: 'barbell_deadlift', sets: '3 Sets', reps: '5 Reps', rest: '150s', rpe: 'RPE 8 (2 RIR)', targetWeight: '100 kg' },
          { id: 'bulgarian_split_squat', sets: '3 Sets', reps: '12 Reps/leg', rest: '75s', rpe: 'RPE 8.5 (1 RIR)', targetWeight: '14 kg/DB' },
          { id: 'standing_calf_raise', sets: '4 Sets', reps: '12-15 Reps', rest: '45s', rpe: 'RPE 9.5 (0 RIR)', targetWeight: '55 kg' },
        ],
      },
    ];
  }

  // Populate exercise details from library
  splits = splits.map((s) => ({
    ...s,
    exercises: s.exercises.map((item) => {
      const found = EXERCISE_LIBRARY.find((e) => e.id === item.id);
      return {
        ...item,
        name: found?.name || item.name || item.id,
        muscle: found?.muscle || 'Compound Target',
        tempo: found?.tempo || '2-0-1-0',
        techniqueCue: found?.techniqueCue || 'Control eccentric phase smoothly.',
      };
    }),
  }));

  return {
    title: `${days}-Day Evidence-Based Periodized ${goal} Program`,
    experience,
    goal,
    sessionDuration: `${sessionDuration} Minutes`,
    equipment,
    splits,
    progressionRule: 'Double Progression: When you hit the top of the rep range for all prescribed sets with target RPE, increase load by 2.5 kg (Upper) or 5 kg (Lower) in the subsequent session.',
  };
}

/**
 * Progressive Overload Evaluator
 */
export function evaluateProgressiveOverload(exerciseRecord) {
  const { targetRepsMin = 8, targetRepsMax = 10, previousSets = [] } = exerciseRecord;

  // Check if user hit the max rep ceiling across all sets
  const allHitsCeiling = previousSets.length > 0 && previousSets.every((s) => s.reps >= targetRepsMax);
  const stalledSessionsCount = exerciseRecord.stalledSessions || 0;

  if (allHitsCeiling) {
    return {
      action: 'INCREASE_LOAD',
      recommendation: `Add +2.5 kg next session. You completed all sets at ${targetRepsMax} reps. Reset to ${targetRepsMin} reps with new load.`,
      badge: 'Progression Ready',
      color: '#10B981',
      scientificReason: 'You have adapted to the current mechanical tension threshold. Overload stimulus requires progressive increase in external load to stimulate new myofibrillar hypertrophy.',
    };
  } else if (stalledSessionsCount >= 3) {
    return {
      action: 'DELOAD_RESET',
      recommendation: 'Perform a 1-week deload: Reduce working weight by 15% and drop 1 set per exercise.',
      badge: 'Deload Recommended',
      color: 'var(--warning)',
      scientificReason: 'Persistent failure to progress over 3 consecutive microcycles suggests cumulative central nervous system and connective tissue fatigue rather than muscle limitation.',
    };
  } else {
    return {
      action: 'INCREASE_REPS',
      recommendation: `Maintain current load (${exerciseRecord.currentWeight || 'current weight'}). Aim to add 1 additional rep to your first 2 working sets.`,
      badge: 'Rep Ceiling Hunt',
      color: 'var(--primary)',
      scientificReason: 'Double progression protocol: Build metabolic fatigue tolerance across the rep range before jumping external weight.',
    };
  }
}

/**
 * On-the-Fly Session Adaptation Engine
 */
export function adaptSession(splitDay, adaptationType) {
  const cloned = JSON.parse(JSON.stringify(splitDay));

  if (adaptationType === 'time_crunch_30') {
    // Trim isolation movements and pair compound exercises into antagonistic supersets
    cloned.day = `${cloned.day} (⚡ 30-Min Time Crunch Edition)`;
    cloned.duration = '30 Mins (High Density)';
    cloned.exercises = cloned.exercises.slice(0, 3).map((ex) => ({
      ...ex,
      sets: '3 Sets',
      rest: '45s (Antagonistic Superset)',
      techniqueCue: `[TIME CRUNCH] Minimize downtime. Focus strictly on explosive concentric drive.`,
    }));
    cloned.adaptationNotice = 'Session condensed to 3 primary compound movements with 45s recovery intervals to complete full workout volume in under 30 minutes.';
  } else if (adaptationType === 'knee_friendly') {
    cloned.day = `${cloned.day} (🦵 Knee-Friendly Deload)`;
    cloned.exercises = cloned.exercises.map((ex) => {
      if (ex.id === 'barbell_squat' || ex.name.toLowerCase().includes('squat')) {
        return {
          ...ex,
          name: 'Low-Angle Leg Press (Feet High & Wide) + Hamstring Curl',
          tempo: '3-1-1-0 (No knee shear)',
          techniqueCue: 'High foot placement shifts shear forces from patellar tendon onto the glutes and posterior chain.',
        };
      }
      return ex;
    });
    cloned.adaptationNotice = 'Replaced high-axial patellofemoral compressive movements with posterior-dominant knee-friendly alternatives.';
  } else if (adaptationType === 'busy_gym') {
    cloned.day = `${cloned.day} (🏋️ Busy Gym / Dumbbells & Cables Only)`;
    cloned.exercises = cloned.exercises.map((ex) => {
      if (ex.equipment?.includes('Squat Rack') || ex.id === 'barbell_squat') {
        return {
          ...ex,
          name: 'Heavy Dumbbell Goblet Squat with Elevated Heels',
          equipment: 'Dumbbell only',
          techniqueCue: 'No squat rack needed. Hold dumbbell vertically under chin; heel elevation targets quads cleanly.',
        };
      } else if (ex.id === 'barbell_bench') {
        return {
          ...ex,
          name: 'Dumbbell Flat Bench Press + Floor Flyes',
          equipment: 'Dumbbells',
        };
      }
      return ex;
    });
    cloned.adaptationNotice = 'Swapped busy barbell and rack stations for freely accessible dumbbells and cable variations.';
  }

  return cloned;
}
