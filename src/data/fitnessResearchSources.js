/**
 * Peer-Reviewed Fitness & Sports Nutrition Research Citations
 * 
 * Curated from authoritative organizations:
 * - American College of Sports Medicine (ACSM)
 * - International Society of Sports Nutrition (ISSN)
 * - British Journal of Sports Medicine (BJSM)
 * - National Center for Biotechnology Information (NCBI / PubMed)
 * - World Health Organization (WHO) & USDA
 */

export const FITNESS_RESEARCH_DATABASE = [
  {
    id: 'morton_2018',
    goal: 'Muscle Gain',
    category: 'Protein Intake',
    title: 'A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults',
    authors: 'Morton RW, Murphy KT, McKellar SR, Schoenfeld BJ, et al.',
    journal: 'British Journal of Sports Medicine (BJSM)',
    year: '2018',
    link: 'https://pubmed.ncbi.nlm.nih.gov/28698222/',
    tier: 'Tier 1: Systematic Review & Meta-Analysis (49 Studies, 1863 Participants)',
    keyTakeaway: 'Protein intakes beyond 1.62 g/kg/day show plateauing gains in fat-free mass, establishing 1.6 - 2.2 g/kg as the evidence-based benchmark for resistance-trained individuals.',
    appliedInSystem: 'Calculates the user daily protein target multiplier between 1.8g - 2.0g/kg bodyweight.',
  },
  {
    id: 'schoenfeld_2017',
    goal: 'Muscle Gain',
    category: 'Training Volume',
    title: 'Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis',
    authors: 'Schoenfeld BJ, Ogborn D, Krieger JW',
    journal: 'Journal of Sports Sciences',
    year: '2017',
    link: 'https://pubmed.ncbi.nlm.nih.gov/27433992/',
    tier: 'Tier 1: Meta-Analysis',
    keyTakeaway: 'There is a graded dose-response relationship whereby 10+ weekly working sets per muscle group produces significantly superior hypertrophy compared to lower volume routines.',
    appliedInSystem: 'Distributes 10-18 weekly sets per primary muscle group across the training days.',
  },
  {
    id: 'helms_2014',
    goal: 'Fat Loss',
    category: 'Muscle Retention during Calorie Deficit',
    title: 'Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation',
    authors: 'Helms ER, Aragon AA, Fitschen PJ',
    journal: 'Journal of the International Society of Sports Nutrition (JISSN)',
    year: '2014',
    link: 'https://jissn.biomedcentral.com/articles/10.1186/1550-2783-11-20',
    tier: 'Tier 1: ISSN Scientific Position Review',
    keyTakeaway: 'Weight loss rates between 0.5% to 1.0% of total body weight per week maximize adipose tissue oxidation while preserving skeletal lean tissue.',
    appliedInSystem: 'Caps calorie deficit to 400-500 kcal/day to ensure weekly weight reduction remains under 0.75 kg/week.',
  },
  {
    id: 'barakat_2020',
    goal: 'Body Recomposition',
    category: 'Simultaneous Muscle Gain & Fat Loss',
    title: 'Body Recomposition: Can Trained Individuals Build Muscle and Lose Fat at the Same Time?',
    authors: 'Barakat C, Pearson J, Escalante G, Campbell B, De Souza EO',
    journal: 'Strength & Conditioning Journal (NSCA)',
    year: '2020',
    link: 'https://journals.lww.com/nsca-scj/fulltext/2020/10000/body_recomposition__can_trained_individuals_build.3.aspx',
    tier: 'Tier 1: Peer-Reviewed Scientific Analysis',
    keyTakeaway: 'Simultaneous fat loss and hypertrophy occurs when heavy progressive resistance training is paired with high protein (≥2.0g/kg) and either eucaloric maintenance or slight negative energy balance.',
    appliedInSystem: 'Sets 2.2 g/kg protein target and assigns a near-maintenance (-150 kcal) intake for recomposition profiles.',
  },
  {
    id: 'acsm_2016',
    goal: 'Strength',
    category: 'Athletic Nutrition & Hydration',
    title: 'Nutrition and Athletic Performance: Joint Position Statement of the Academy of Nutrition and Dietetics, Dietitians of Canada, and the ACSM',
    authors: 'Thomas DT, Erdman KA, Burke LM',
    journal: 'Medicine & Science in Sports & Exercise',
    year: '2016',
    link: 'https://pubmed.ncbi.nlm.nih.gov/26891141/',
    tier: 'Tier 1: Multi-Organizational Position Stand',
    keyTakeaway: 'Carbohydrate availability of 3-7g/kg/day supports glycogen stores and neuromuscular drive during high-intensity training, while maintaining fluid balance prevents cardiovascular strain.',
    appliedInSystem: 'Guarantees minimum 25% dietary fat for endocrine hormone production, with remainder allocated to complex carbs, and prescribes 35-45 ml/kg water.',
  },
  {
    id: 'who_2020',
    goal: 'General Fitness',
    category: 'Physical Activity Guidelines',
    title: 'WHO Guidelines on physical activity and sedentary behaviour: at a glance',
    authors: 'World Health Organization (WHO)',
    journal: 'Geneva: World Health Organization',
    year: '2020',
    link: 'https://www.who.int/publications/i/item/9789240015128',
    tier: 'Tier 1: Global Health Standard',
    keyTakeaway: 'Adults should undertake at least 150–300 minutes of moderate-intensity aerobic physical activity, or 75–150 minutes of vigorous-intensity aerobic physical activity per week, plus muscle-strengthening activities on 2 or more days a week.',
    appliedInSystem: 'Sets minimum baseline recommendation of 8,000 - 10,000 daily steps alongside the workout regime.',
  },
];

export const SCIENTIFIC_SOURCES = FITNESS_RESEARCH_DATABASE;

/**
 * Retrieve targeted evidence citations based on user primary goal
 */
export function getResearchSourcesForGoal(goal = 'Fat Loss') {
  const normalized = (goal || '').toLowerCase().replace(/_/g, ' ');
  const matching = FITNESS_RESEARCH_DATABASE.filter((r) => {
    const rGoal = r.goal.toLowerCase();
    return rGoal.includes(normalized) || normalized.includes(rGoal);
  });
  const general = FITNESS_RESEARCH_DATABASE.filter((r) => r.goal === 'General Fitness' || r.goal === 'Strength');

  // Combine matching plus foundational sports nutrition guidelines
  const combined = [...matching, ...general.filter((g) => !matching.some((m) => m.id === g.id))];
  return (combined.length > 0 ? combined : FITNESS_RESEARCH_DATABASE).slice(0, 4);
}
