export const stats = {
  activeMembers: 2481,
  activeMembersChange: 8.4,
  checkIns: 284,
  checkInsChange: 12.6,
  monthlyRevenue: '৳8.42L',
  revenueChange: 6.8,
  expiringSoon: 32,
};

export const attendanceData = [
  { day: 'Mon', checkins: 210 },
  { day: 'Tue', checkins: 245 },
  { day: 'Wed', checkins: 198 },
  { day: 'Thu', checkins: 276 },
  { day: 'Fri', checkins: 302 },
  { day: 'Sat', checkins: 284 },
  { day: 'Sun', checkins: 220 },
];

export const membershipOverview = [
  { name: 'Premium', value: 1190, color: '#C8FF00' },
  { name: 'Standard', value: 793, color: '#666666' },
  { name: 'Basic', value: 498, color: '#444444' },
];

export const members = [
  { id: 1, name: 'Rahim Ahmed', plan: 'Premium', joined: '12 AUG', expiry: '12 SEP', status: 'Active', phone: '+880 1712-345678', visits: 24, avatar: 'RA' },
  { id: 2, name: 'Sakib Hasan', plan: 'Standard', joined: '05 AUG', expiry: '05 SEP', status: 'Active', phone: '+880 1834-567890', visits: 18, avatar: 'SH' },
  { id: 3, name: 'Nafisa Rahman', plan: 'Premium', joined: '28 JUL', expiry: '28 AUG', status: 'Expiring', phone: '+880 1912-234567', visits: 30, avatar: 'NR' },
  { id: 4, name: 'Tanvir Islam', plan: 'Basic', joined: '18 JUL', expiry: '18 AUG', status: 'Expired', phone: '+880 1756-789012', visits: 12, avatar: 'TI' },
  { id: 5, name: 'Arif Hossain', plan: 'Premium', joined: '15 JUL', expiry: '15 SEP', status: 'Active', phone: '+880 1634-567890', visits: 28, avatar: 'AH' },
];

export const attendanceRecords = [
  { id: 1, name: 'Rahim Ahmed', checkIn: '06:42 AM', checkOut: '—', status: 'In' },
  { id: 2, name: 'Sakib Hasan', checkIn: '07:15 AM', checkOut: '09:02 AM', status: 'Out' },
  { id: 3, name: 'Nafisa Rahman', checkIn: '08:21 AM', checkOut: '—', status: 'In' },
  { id: 4, name: 'Arif Hossain', checkIn: '09:04 AM', checkOut: '10:15 AM', status: 'Out' },
  { id: 5, name: 'Tanvir Islam', checkIn: '10:30 AM', checkOut: '—', status: 'In' },
  { id: 6, name: 'Farhan Kabir', checkIn: '11:00 AM', checkOut: '12:30 PM', status: 'Out' },
];

export const hourlyCheckins = [
  { hour: '6AM', count: 12 },
  { hour: '7AM', count: 28 },
  { hour: '8AM', count: 42 },
  { hour: '9AM', count: 35 },
  { hour: '10AM', count: 30 },
  { hour: '11AM', count: 25 },
  { hour: '12PM', count: 18 },
  { hour: '1PM', count: 15 },
  { hour: '2PM', count: 20 },
  { hour: '3PM', count: 22 },
  { hour: '4PM', count: 28 },
  { hour: '5PM', count: 35 },
];

export const payments = [
  { id: 1, member: 'Rahim Ahmed', plan: 'Premium', amount: '৳5,000', method: 'bKASH', status: 'Paid', date: '12 AUG' },
  { id: 2, member: 'Sakib Hasan', plan: 'Standard', amount: '৳3,000', method: 'CASH', status: 'Paid', date: '05 AUG' },
  { id: 3, member: 'Nafisa Rahman', plan: 'Premium', amount: '৳5,000', method: 'CARD', status: 'Paid', date: '28 JUL' },
  { id: 4, member: 'Tanvir Islam', plan: 'Basic', amount: '৳2,000', method: 'bKASH', status: 'Pending', date: '18 JUL' },
  { id: 5, member: 'Arif Hossain', plan: 'Premium', amount: '৳5,000', method: 'CASH', status: 'Paid', date: '15 JUL' },
];

export const paymentSummary = {
  totalRevenue: '৳8.42L',
  paid: '৳7.91L',
  pending: '৳51,000',
};

export const trainers = [
  { id: 1, name: 'Tanvir Rahman', role: 'Personal Trainer', clients: 24, available: true, avatar: 'TR', specialty: 'Strength & Conditioning' },
  { id: 2, name: 'Samiul Haq', role: 'Yoga Instructor', clients: 18, available: true, avatar: 'SH', specialty: 'Yoga & Flexibility' },
  { id: 3, name: 'Nusrat Jahan', role: 'Cardio Specialist', clients: 30, available: false, avatar: 'NJ', specialty: 'Cardio & HIIT' },
  { id: 4, name: 'Rakibul Hasan', role: 'CrossFit Coach', clients: 22, available: true, avatar: 'RH', specialty: 'CrossFit & Functional' },
  { id: 5, name: 'Fatima Khan', role: 'Nutrition Expert', clients: 35, available: true, avatar: 'FK', specialty: 'Nutrition & Diet' },
  { id: 6, name: 'Imran Sheikh', role: 'MMA Trainer', clients: 16, available: false, avatar: 'IS', specialty: 'MMA & Self Defense' },
];

export const membershipPlans = [
  {
    name: 'Basic',
    price: '৳2,000',
    period: '/month',
    features: ['Gym Access', 'Locker Access', 'Group Classes'],
    popular: false,
  },
  {
    name: 'Standard',
    price: '৳3,500',
    period: '/month',
    features: ['Gym Access', 'Locker Access', 'Group Classes', 'Cardio Zone', '1 Trainer Session'],
    popular: true,
  },
  {
    name: 'Premium',
    price: '৳5,000',
    period: '/month',
    features: ['Full Gym Access', 'Personal Trainer', 'Nutrition Guidance', 'All Classes', 'Premium Locker'],
    popular: false,
  },
];

export const revenueData = [
  { month: 'JAN', revenue: 420000 },
  { month: 'FEB', revenue: 510000 },
  { month: 'MAR', revenue: 580000 },
  { month: 'APR', revenue: 620000 },
  { month: 'MAY', revenue: 700000 },
  { month: 'JUN', revenue: 750000 },
  { month: 'JUL', revenue: 810000 },
  { month: 'AUG', revenue: 842000 },
];

export const memberGrowthData = [
  { month: 'JAN', members: 1850 },
  { month: 'FEB', members: 1920 },
  { month: 'MAR', members: 2050 },
  { month: 'APR', members: 2150 },
  { month: 'MAY', members: 2280 },
  { month: 'JUN', members: 2350 },
  { month: 'JUL', members: 2420 },
  { month: 'AUG', members: 2481 },
];

export const reportStats = {
  totalMembers: 2481,
  newMembers: 184,
  revenue: '৳8.42L',
  attendance: 7842,
};

export const employees = [
  { id: 1, name: 'Arman Sheikh', role: 'Front Desk Manager', department: 'Reception', phone: '+880 1712-111222', email: 'arman@fitlife.com', joined: '15 MAR 2024', salary: '৳35,000', status: 'Active', avatar: 'AS' },
  { id: 2, name: 'Sadia Akter', role: 'Gym Floor Supervisor', department: 'Operations', phone: '+880 1834-333444', email: 'sadia@fitlife.com', joined: '01 JAN 2024', salary: '৳40,000', status: 'Active', avatar: 'SA' },
  { id: 3, name: 'Rifat Chowdhury', role: 'Maintenance Technician', department: 'Maintenance', phone: '+880 1912-555666', email: 'rifat@fitlife.com', joined: '20 JUN 2024', salary: '৳28,000', status: 'Active', avatar: 'RC' },
  { id: 4, name: 'Nadia Hossain', role: 'Accountant', department: 'Finance', phone: '+880 1756-777888', email: 'nadia@fitlife.com', joined: '10 FEB 2024', salary: '৳45,000', status: 'Active', avatar: 'NH' },
  { id: 5, name: 'Zahid Hasan', role: 'Housekeeping Lead', department: 'Maintenance', phone: '+880 1634-999000', email: 'zahid@fitlife.com', joined: '05 APR 2024', salary: '৳22,000', status: 'On Leave', avatar: 'ZH' },
  { id: 6, name: 'Farhana Begum', role: 'Marketing Coordinator', department: 'Marketing', phone: '+880 1534-112233', email: 'farhana@fitlife.com', joined: '12 AUG 2024', salary: '৳38,000', status: 'Active', avatar: 'FB' },
];

export const dietPlans = [
  {
    id: 1,
    name: 'Lean Muscle Gain',
    target: 'Muscle Building',
    calories: '2,800 kcal',
    protein: '180g',
    carbs: '320g',
    fats: '85g',
    duration: '12 Weeks',
    members: 420,
    meals: [
      { time: '7:00 AM', meal: 'Oats with banana, whey protein, and almonds' },
      { time: '10:00 AM', meal: 'Grilled chicken breast with brown rice' },
      { time: '1:00 PM', meal: 'Lean beef steak with sweet potato and broccoli' },
      { time: '4:00 PM', meal: 'Greek yogurt with mixed berries and honey' },
      { time: '7:00 PM', meal: 'Salmon fillet with quinoa and avocado' },
      { time: '9:30 PM', meal: 'Casein protein shake with peanut butter' },
    ],
  },
  {
    id: 2,
    name: 'Fat Loss Shred',
    target: 'Weight Loss',
    calories: '1,800 kcal',
    protein: '160g',
    carbs: '150g',
    fats: '60g',
    duration: '8 Weeks',
    members: 680,
    meals: [
      { time: '7:00 AM', meal: 'Egg white omelette with spinach and tomatoes' },
      { time: '10:00 AM', meal: 'Apple slices with almond butter' },
      { time: '1:00 PM', meal: 'Grilled fish with mixed greens salad' },
      { time: '4:00 PM', meal: 'Protein shake with cucumber slices' },
      { time: '7:00 PM', meal: 'Chicken stir-fry with vegetables and light soy' },
    ],
  },
  {
    id: 3,
    name: 'Balanced Wellness',
    target: 'General Fitness',
    calories: '2,200 kcal',
    protein: '140g',
    carbs: '250g',
    fats: '75g',
    duration: 'Ongoing',
    members: 920,
    meals: [
      { time: '7:00 AM', meal: 'Whole grain toast with avocado and poached eggs' },
      { time: '10:30 AM', meal: 'Mixed nuts and a seasonal fruit' },
      { time: '1:00 PM', meal: 'Turkey wrap with hummus and fresh vegetables' },
      { time: '4:00 PM', meal: 'Cottage cheese with pineapple chunks' },
      { time: '7:30 PM', meal: 'Grilled chicken thighs with jasmine rice and salad' },
    ],
  },
  {
    id: 4,
    name: 'Pre-Workout Fuel',
    target: 'Performance',
    calories: '2,500 kcal',
    protein: '155g',
    carbs: '300g',
    fats: '70g',
    duration: '6 Weeks',
    members: 310,
    meals: [
      { time: '6:30 AM', meal: 'Banana with peanut butter and oats' },
      { time: '9:30 AM', meal: 'Sweet potato with lean ground turkey' },
      { time: '12:30 PM', meal: 'Whole wheat pasta with chicken marinara' },
      { time: '3:30 PM', meal: 'Rice cakes with honey and whey protein' },
      { time: '6:30 PM', meal: 'Grilled steak with brown rice and asparagus' },
      { time: '9:00 PM', meal: 'Casein shake with banana and flax seeds' },
    ],
  },
  {
    id: 5,
    name: 'Vegan Power',
    target: 'Plant-Based',
    calories: '2,100 kcal',
    protein: '120g',
    carbs: '280g',
    fats: '65g',
    duration: '10 Weeks',
    members: 185,
    meals: [
      { time: '7:00 AM', meal: 'Smoothie bowl with plant protein, berries, and seeds' },
      { time: '10:00 AM', meal: 'Hummus with raw vegetable sticks' },
      { time: '1:00 PM', meal: 'Lentil curry with brown basmati rice' },
      { time: '4:00 PM', meal: 'Trail mix with dried fruits and dark chocolate' },
      { time: '7:00 PM', meal: 'Tofu stir-fry with edamame and quinoa' },
    ],
  },
];
