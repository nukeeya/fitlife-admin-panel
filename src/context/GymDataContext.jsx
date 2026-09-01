import { createContext, useContext, useState, useEffect } from 'react';

const GymDataContext = createContext();

// Initial Mock Data
const INITIAL_PLANS = [
  {
    id: 1,
    code: 'PLN-BSC',
    name: 'Basic Membership',
    price: 2000,
    period: '/month',
    durationDays: 30,
    features: ['Standard Gym Access (6 AM - 10 PM)', 'Standard Locker Access', 'General Group Classes', 'Cardio Floor Access'],
    lockerZone: 'Zone A (Standard)',
    popular: false,
    vatPercent: 5,
  },
  {
    id: 2,
    code: 'PLN-STD',
    name: 'Standard Fitness',
    price: 3500,
    period: '/month',
    durationDays: 30,
    features: ['All Gym Access & Cardio', 'Standard Locker Included', 'Group HIIT & Yoga Classes', '2 Free Personal Trainer Sessions', 'Sauna & Steam Bath (2x/mo)'],
    lockerZone: 'Zone B (Digital Lock)',
    popular: true,
    vatPercent: 5,
  },
  {
    id: 3,
    code: 'PLN-PRM',
    name: 'Premium Pro',
    price: 5000,
    period: '/month',
    durationDays: 30,
    features: ['Unlimited 24/7 Access', 'Dedicated Executive Locker', 'Weekly 1-on-1 Personal Trainer', 'Personalized AI Nutrition & Diet', 'Free Guest Pass (2x/mo)', 'Complimentary Whey Protein Shake/Day'],
    lockerZone: 'Zone VIP (Executive)',
    popular: false,
    vatPercent: 5,
  },
  {
    id: 4,
    code: 'PLN-ELT',
    name: 'Elite VIP Athlete',
    price: 8000,
    period: '/month',
    durationDays: 30,
    features: ['All VIP Amenities', 'Daily Dedicated Master Trainer', 'Custom Biometric Tracking & Physio', 'Dedicated VIP Private Locker', 'Unlimited Supplement Bar Access', 'Valet Parking & Laundry Service'],
    lockerZone: 'VIP Suite (Master)',
    popular: false,
    vatPercent: 5,
  },
];

const INITIAL_MEMBERS = [
  {
    id: 1,
    code: 'FLM-8041',
    name: 'Rahim Ahmed',
    email: 'rahim.ahmed@gmail.com',
    phone: '+880 1712-345678',
    gender: 'Male',
    plan: 'Premium Pro',
    planId: 3,
    joined: '2026-08-12',
    expiry: '2026-09-12',
    status: 'Active',
    visits: 24,
    avatar: 'RA',
    trainer: 'Tanvir Rahman',
    lockerNumber: 'L-101',
    balanceDue: 0,
    paidTotal: 5000,
    discountApplied: '৳500 Flat (Promo)',
  },
  {
    id: 2,
    code: 'FLM-8042',
    name: 'Sakib Hasan',
    email: 'sakib.h@outlook.com',
    phone: '+880 1834-567890',
    gender: 'Male',
    plan: 'Standard Fitness',
    planId: 2,
    joined: '2026-08-05',
    expiry: '2026-09-05',
    status: 'Active',
    visits: 18,
    avatar: 'SH',
    trainer: 'Rakibul Hasan',
    lockerNumber: 'L-104',
    balanceDue: 0,
    paidTotal: 3500,
    discountApplied: 'None',
  },
  {
    id: 3,
    code: 'FLM-8043',
    name: 'Nafisa Rahman',
    email: 'nafisa.fit@yahoo.com',
    phone: '+880 1912-234567',
    gender: 'Female',
    plan: 'Premium Pro',
    planId: 3,
    joined: '2026-08-01',
    expiry: '2026-09-01', // Expiring today in mock time
    status: 'Expiring',
    visits: 30,
    avatar: 'NR',
    trainer: 'Fatima Khan',
    lockerNumber: 'L-202',
    balanceDue: 0,
    paidTotal: 4500,
    discountApplied: '10% (Referral)',
  },
  {
    id: 4,
    code: 'FLM-8044',
    name: 'Tanvir Islam',
    email: 'tanvir.is@gmail.com',
    phone: '+880 1756-789012',
    gender: 'Male',
    plan: 'Basic Membership',
    planId: 1,
    joined: '2026-07-18',
    expiry: '2026-08-18',
    status: 'Expired',
    visits: 12,
    avatar: 'TI',
    trainer: 'None',
    lockerNumber: 'None',
    balanceDue: 500,
    paidTotal: 1500,
    discountApplied: 'None',
  },
  {
    id: 5,
    code: 'FLM-8045',
    name: 'Arif Hossain',
    email: 'arif.hossain@gmail.com',
    phone: '+880 1634-567890',
    gender: 'Male',
    plan: 'Premium Pro',
    planId: 3,
    joined: '2026-08-15',
    expiry: '2026-09-15',
    status: 'Active',
    visits: 28,
    avatar: 'AH',
    trainer: 'Tanvir Rahman',
    lockerNumber: 'L-105',
    balanceDue: 0,
    paidTotal: 5000,
    discountApplied: 'None',
  },
  {
    id: 6,
    code: 'FLM-8046',
    name: 'Farhan Kabir',
    email: 'farhan.k@bdmail.com',
    phone: '+880 1711-223344',
    gender: 'Male',
    plan: 'Elite VIP Athlete',
    planId: 4,
    joined: '2026-08-20',
    expiry: '2026-09-20',
    status: 'Active',
    visits: 14,
    avatar: 'FK',
    trainer: 'Imran Sheikh',
    lockerNumber: 'VIP-01',
    balanceDue: 0,
    paidTotal: 7200,
    discountApplied: '10% (VIP Approval)',
  },
  {
    id: 7,
    code: 'FLM-8047',
    name: 'Mehnaz Chowdhury',
    email: 'mehnaz.c@gmail.com',
    phone: '+880 1822-445566',
    gender: 'Female',
    plan: 'Standard Fitness',
    planId: 2,
    joined: '2026-08-25',
    expiry: '2026-09-25',
    status: 'Active',
    visits: 9,
    avatar: 'MC',
    trainer: 'Nusrat Jahan',
    lockerNumber: 'L-108',
    balanceDue: 0,
    paidTotal: 3150,
    discountApplied: '10% (Promo)',
  },
];

const INITIAL_APPLICATIONS = [
  {
    id: 1,
    code: 'APP-9921',
    name: 'Mustafa Kamal',
    phone: '+880 1799-887766',
    email: 'mustafa.kamal@gmail.com',
    gender: 'Male',
    desiredPlan: 'Premium Pro',
    desiredPlanId: 3,
    goal: 'Muscle Building & Strength',
    medical: 'No history of chronic injury',
    status: 'Pending',
    submittedDate: '2026-09-01',
    photo: 'MK',
  },
  {
    id: 2,
    code: 'APP-9922',
    name: 'Zareen Anan',
    phone: '+880 1888-990011',
    email: 'zareen.anan@yahoo.com',
    gender: 'Female',
    desiredPlan: 'Standard Fitness',
    desiredPlanId: 2,
    goal: 'Weight Loss & Toning',
    medical: 'Asthma (Mild, uses inhaler)',
    status: 'Pending',
    submittedDate: '2026-09-01',
    photo: 'ZA',
  },
  {
    id: 3,
    code: 'APP-9923',
    name: 'Shahriar Nazim',
    phone: '+880 1677-332211',
    email: 'shahriar.nazim@hotmail.com',
    gender: 'Male',
    desiredPlan: 'Elite VIP Athlete',
    desiredPlanId: 4,
    goal: 'Athletic Conditioning for Football',
    medical: 'None',
    status: 'Pending',
    submittedDate: '2026-08-31',
    photo: 'SN',
  },
];

const INITIAL_LOCKERS = [
  { id: 1, number: 'L-101', zone: 'Zone A (Standard)', type: 'Key Lock', status: 'Occupied', assignedTo: 'Rahim Ahmed', memberCode: 'FLM-8041', expiryDate: '2026-09-12', monthlyFee: 500 },
  { id: 2, number: 'L-102', zone: 'Zone A (Standard)', type: 'Key Lock', status: 'Available', assignedTo: null, memberCode: null, expiryDate: null, monthlyFee: 500 },
  { id: 3, number: 'L-103', zone: 'Zone A (Standard)', type: 'Key Lock', status: 'Maintenance', assignedTo: null, memberCode: null, expiryDate: null, monthlyFee: 500 },
  { id: 4, number: 'L-104', zone: 'Zone B (Digital)', type: 'PIN Pad Digital', status: 'Occupied', assignedTo: 'Sakib Hasan', memberCode: 'FLM-8042', expiryDate: '2026-09-05', monthlyFee: 750 },
  { id: 5, number: 'L-105', zone: 'Zone B (Digital)', type: 'PIN Pad Digital', status: 'Occupied', assignedTo: 'Arif Hossain', memberCode: 'FLM-8045', expiryDate: '2026-09-15', monthlyFee: 750 },
  { id: 6, number: 'L-106', zone: 'Zone B (Digital)', type: 'PIN Pad Digital', status: 'Available', assignedTo: null, memberCode: null, expiryDate: null, monthlyFee: 750 },
  { id: 7, number: 'L-201', zone: 'Zone VIP (Executive)', type: 'RFID Sensor & Keypad', status: 'Available', assignedTo: null, memberCode: null, expiryDate: null, monthlyFee: 1200 },
  { id: 8, number: 'L-202', zone: 'Zone VIP (Executive)', type: 'RFID Sensor & Keypad', status: 'Occupied', assignedTo: 'Nafisa Rahman', memberCode: 'FLM-8043', expiryDate: '2026-09-01', monthlyFee: 1200 },
  { id: 9, number: 'VIP-01', zone: 'VIP Suite (Master)', type: 'Biometric Smart Lock', status: 'Occupied', assignedTo: 'Farhan Kabir', memberCode: 'FLM-8046', expiryDate: '2026-09-20', monthlyFee: 2000 },
  { id: 10, number: 'VIP-02', zone: 'VIP Suite (Master)', type: 'Biometric Smart Lock', status: 'Available', assignedTo: null, memberCode: null, expiryDate: null, monthlyFee: 2000 },
];

const INITIAL_TRAINERS = [
  { id: 1, name: 'Tanvir Rahman', role: 'Head Strength Coach', specialty: 'Strength & Hypertrophy', phone: '+880 1712-445566', email: 'tanvir.trainer@fitlife.com', clients: 24, rating: 4.9, available: true, avatar: 'TR', salary: 55000 },
  { id: 2, name: 'Samiul Haq', role: 'Yoga & Mobility Coach', specialty: 'Yoga & Flexibility', phone: '+880 1834-778899', email: 'samiul@fitlife.com', clients: 18, rating: 4.8, available: true, avatar: 'SH', salary: 45000 },
  { id: 3, name: 'Nusrat Jahan', role: 'Cardio & HIIT Specialist', specialty: 'Cardio & Fat Loss', phone: '+880 1912-334455', email: 'nusrat@fitlife.com', clients: 30, rating: 5.0, available: true, avatar: 'NJ', salary: 48000 },
  { id: 4, name: 'Rakibul Hasan', role: 'CrossFit Lead', specialty: 'CrossFit & Conditioning', phone: '+880 1756-112233', email: 'rakib@fitlife.com', clients: 22, rating: 4.7, available: true, avatar: 'RH', salary: 50000 },
  { id: 5, name: 'Fatima Khan', role: 'Clinical Dietitian & Trainer', specialty: 'Nutrition & Diet Plans', phone: '+880 1634-223344', email: 'fatima@fitlife.com', clients: 35, rating: 4.9, available: false, avatar: 'FK', salary: 52000 },
  { id: 6, name: 'Imran Sheikh', role: 'Combat & MMA Coach', specialty: 'MMA & Self Defense', phone: '+880 1534-667788', email: 'imran.coach@fitlife.com', clients: 16, rating: 4.8, available: true, avatar: 'IS', salary: 46000 },
];

const INITIAL_EMPLOYEES = [
  { id: 1, code: 'EMP-101', name: 'Arman Sheikh', role: 'Front Desk Manager', department: 'Reception', phone: '+880 1712-111222', email: 'arman@fitlife.com', joined: '2024-03-15', salary: 35000, status: 'Active', avatar: 'AS' },
  { id: 2, code: 'EMP-102', name: 'Sadia Akter', role: 'Gym Floor Supervisor', department: 'Operations', phone: '+880 1834-333444', email: 'sadia@fitlife.com', joined: '2024-01-01', salary: 40000, status: 'Active', avatar: 'SA' },
  { id: 3, code: 'EMP-103', name: 'Rifat Chowdhury', role: 'Maintenance Technician', department: 'Maintenance', phone: '+880 1912-555666', email: 'rifat@fitlife.com', joined: '2024-06-20', salary: 28000, status: 'Active', avatar: 'RC' },
  { id: 4, code: 'EMP-104', name: 'Nadia Hossain', role: 'Senior Accountant', department: 'Finance', phone: '+880 1756-777888', email: 'nadia@fitlife.com', joined: '2024-02-10', salary: 45000, status: 'Active', avatar: 'NH' },
  { id: 5, code: 'EMP-105', name: 'Zahid Hasan', role: 'Housekeeping Lead', department: 'Maintenance', phone: '+880 1634-999000', email: 'zahid@fitlife.com', joined: '2024-04-05', salary: 22000, status: 'On Leave', avatar: 'ZH' },
  { id: 6, code: 'EMP-106', name: 'Farhana Begum', role: 'Marketing Coordinator', department: 'Marketing', phone: '+880 1534-112233', email: 'farhana@fitlife.com', joined: '2024-08-12', salary: 38000, status: 'Active', avatar: 'FB' },
];

const INITIAL_INVOICES = [
  {
    id: 1,
    number: 'INV-2026-0041',
    memberId: 1,
    memberName: 'Rahim Ahmed',
    memberCode: 'FLM-8041',
    planName: 'Premium Pro',
    baseAmount: 5000,
    discountType: 'flat',
    discountValue: 500,
    discountAmount: 500,
    discountReason: 'Seasonal Promo',
    taxAmount: 225,
    netPayable: 4725,
    paidAmount: 4725,
    dueAmount: 0,
    status: 'Paid',
    method: 'bKASH',
    date: '2026-08-12',
  },
  {
    id: 2,
    number: 'INV-2026-0042',
    memberId: 2,
    memberName: 'Sakib Hasan',
    memberCode: 'FLM-8042',
    planName: 'Standard Fitness',
    baseAmount: 3500,
    discountType: 'flat',
    discountValue: 0,
    discountAmount: 0,
    discountReason: 'None',
    taxAmount: 175,
    netPayable: 3675,
    paidAmount: 3675,
    dueAmount: 0,
    status: 'Paid',
    method: 'CASH',
    date: '2026-08-05',
  },
  {
    id: 3,
    number: 'INV-2026-0043',
    memberId: 6,
    memberName: 'Farhan Kabir',
    memberCode: 'FLM-8046',
    planName: 'Elite VIP Athlete',
    baseAmount: 8000,
    discountType: 'percentage',
    discountValue: 10,
    discountAmount: 800,
    discountReason: 'VIP Approval (Director)',
    taxAmount: 360,
    netPayable: 7560,
    paidAmount: 7560,
    dueAmount: 0,
    status: 'Paid',
    method: 'CARD',
    date: '2026-09-01', // Today
  },
  {
    id: 4,
    number: 'INV-2026-0044',
    memberId: 7,
    memberName: 'Mehnaz Chowdhury',
    memberCode: 'FLM-8047',
    planName: 'Standard Fitness',
    baseAmount: 3500,
    discountType: 'percentage',
    discountValue: 10,
    discountAmount: 350,
    discountReason: 'Referral Discount',
    taxAmount: 157.5,
    netPayable: 3307.5,
    paidAmount: 3307.5,
    dueAmount: 0,
    status: 'Paid',
    method: 'bKASH',
    date: '2026-09-01', // Today
  },
  {
    id: 5,
    number: 'INV-2026-0045',
    memberId: 4,
    memberName: 'Tanvir Islam',
    memberCode: 'FLM-8044',
    planName: 'Basic Membership',
    baseAmount: 2000,
    discountType: 'flat',
    discountValue: 0,
    discountAmount: 0,
    discountReason: 'None',
    taxAmount: 100,
    netPayable: 2100,
    paidAmount: 1600,
    dueAmount: 500,
    status: 'Partial',
    method: 'bKASH',
    date: '2026-07-18',
  },
];

const INITIAL_EXPENSES = [
  { id: 1, title: 'Gym Equipment Cable Replacement', category: 'Equipment Maintenance', amount: 12500, method: 'BANK', date: '2026-08-28', notes: 'Replaced torn cables on 3 cable crossover stations', approvedBy: 'Admin' },
  { id: 2, title: 'August Electricity Bill', category: 'Utilities', amount: 48000, method: 'BANK', date: '2026-08-25', notes: 'DESCO AC commercial meter bill', approvedBy: 'Admin' },
  { id: 3, title: 'Bulk Whey Protein & BCAAs Resupply', category: 'Supplements', amount: 65000, method: 'CARD', date: '2026-08-20', notes: 'Optimum Nutrition Gold Standard 50 tubs', approvedBy: 'Admin' },
  { id: 4, title: 'Social Media Sponsored Ad Campaign', category: 'Marketing', amount: 15000, method: 'CARD', date: '2026-08-15', notes: 'Meta & Instagram Ads for Monsoon Promo', approvedBy: 'Admin' },
  { id: 5, title: 'Locker Room Deep Sanitization Supplies', category: 'Maintenance', amount: 8500, method: 'CASH', date: '2026-09-01', notes: 'Chemicals, fresh towels & air diffusers', approvedBy: 'Admin' },
];

const INITIAL_ATTENDANCE = [
  { id: 1, memberId: 1, memberCode: 'FLM-8041', name: 'Rahim Ahmed', avatar: 'RA', plan: 'Premium Pro', expiry: '12 SEP', checkIn: '06:42 AM', checkOut: null, status: 'In', date: '2026-09-01', method: 'RFID Card' },
  { id: 2, memberId: 3, memberCode: 'FLM-8043', name: 'Nafisa Rahman', avatar: 'NR', plan: 'Premium Pro', expiry: '01 SEP', checkIn: '08:21 AM', checkOut: null, status: 'In', date: '2026-09-01', method: 'Biometric' },
  { id: 3, memberId: 5, memberCode: 'FLM-8045', name: 'Arif Hossain', avatar: 'AH', plan: 'Premium Pro', expiry: '15 SEP', checkIn: '09:04 AM', checkOut: '10:15 AM', status: 'Out', date: '2026-09-01', method: 'Manual Admin' },
  { id: 4, memberId: 2, memberCode: 'FLM-8042', name: 'Sakib Hasan', avatar: 'SH', plan: 'Standard Fitness', expiry: '05 SEP', checkIn: '07:15 AM', checkOut: '09:02 AM', status: 'Out', date: '2026-09-01', method: 'RFID Card' },
  { id: 5, memberId: 6, memberCode: 'FLM-8046', name: 'Farhan Kabir', avatar: 'FK', plan: 'Elite VIP Athlete', expiry: '20 SEP', checkIn: '10:30 AM', checkOut: null, status: 'In', date: '2026-09-01', method: 'Biometric' },
  { id: 6, memberId: 7, memberCode: 'FLM-8047', name: 'Mehnaz Chowdhury', avatar: 'MC', plan: 'Standard Fitness', expiry: '25 SEP', checkIn: '11:00 AM', checkOut: '12:30 PM', status: 'Out', date: '2026-09-01', method: 'Manual Admin' },
];

const INITIAL_ROLES = [
  {
    id: 1,
    name: 'Super Admin',
    description: 'Full system control, financial authority, user management & unrestricted discount privileges',
    canApplyDiscount: true,
    maxDiscountPercent: 100,
    canApproveMembers: true,
    canManageLockers: true,
    canManageFinances: true,
    usersCount: 2,
  },
  {
    id: 2,
    name: 'Branch Manager',
    description: 'Branch oversight, member approval, attendance management and capped discounts',
    canApplyDiscount: true,
    maxDiscountPercent: 25,
    canApproveMembers: true,
    canManageLockers: true,
    canManageFinances: true,
    usersCount: 3,
  },
  {
    id: 3,
    name: 'Receptionist / Front Desk',
    description: 'Member check-in/check-out, standard registration, payment collection, zero direct discount authority',
    canApplyDiscount: false,
    maxDiscountPercent: 0,
    canApproveMembers: false,
    canManageLockers: true,
    canManageFinances: false,
    usersCount: 5,
  },
  {
    id: 4,
    name: 'Personal Trainer',
    description: 'Access to assigned clients, workout regimes, diet builder and attendance logs',
    canApplyDiscount: false,
    maxDiscountPercent: 0,
    canApproveMembers: false,
    canManageLockers: false,
    canManageFinances: false,
    usersCount: 8,
  },
  {
    id: 5,
    name: 'Accountant',
    description: 'Full invoice, payment collection, expense auditing, and balance sheet reports',
    canApplyDiscount: false,
    maxDiscountPercent: 0,
    canApproveMembers: false,
    canManageLockers: false,
    canManageFinances: true,
    usersCount: 2,
  },
];

const INITIAL_SMS_CAMPAIGNS = [
  { id: 1, title: 'Monsoon Fitness Promo - 15% OFF', recipientType: 'All Members', count: 2480, cost: 2480, message: 'Rainy days are for gains! Get 15% off renewal packages this week at FitLife Gym. Use code MONSOON15 at the front desk.', status: 'Sent', sentAt: '2026-08-25 10:30 AM' },
  { id: 2, title: 'Membership Expiry Reminder', recipientType: 'Expiring Members', count: 32, cost: 32, message: 'Dear Member, your FitLife Gym subscription is expiring soon. Renew today to avoid locker release and enjoy continuity.', status: 'Sent', sentAt: '2026-09-01 09:00 AM' },
  { id: 3, title: 'Special Weekend Yoga Workshop with Master Coach', recipientType: 'Active Only', count: 1840, cost: 1840, message: 'Join our exclusive Sunday Sunrise Yoga & Core Mobility workshop with Coach Samiul. Free for Standard & VIP members!', status: 'Scheduled', sentAt: '2026-09-05 08:00 AM' },
];

const INITIAL_ADS = [
  { id: 1, title: 'Annual VIP Athlete Pass - Save 25%', bannerUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80', targetUrl: 'https://fitlife.com/vip-pass', position: 'Dashboard Header Banner', impressions: 14280, clicks: 1240, startDate: '2026-08-01', endDate: '2026-09-30', status: 'Active' },
  { id: 2, title: 'FitLife Organic Whey Isolate Launch', bannerUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80', targetUrl: 'https://fitlife.com/store/protein', position: 'Member Mobile App Card', impressions: 8940, clicks: 812, startDate: '2026-08-15', endDate: '2026-09-15', status: 'Active' },
  { id: 3, title: 'Personal Training 1-on-1 Summer Camp', bannerUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80', targetUrl: 'https://fitlife.com/pt-camp', position: 'Locker TV Digital Display', impressions: 5600, clicks: 310, startDate: '2026-07-01', endDate: '2026-08-31', status: 'Expired' },
];

const INITIAL_JOBS = [
  { id: 1, title: 'Certified Female Fitness Trainer', department: 'Fitness', type: 'Full Time', salary: '৳35,000 - ৳55,000 / mo', vacancies: 2, status: 'Open', applicantsCount: 14, postedDate: '2026-08-20', description: 'Looking for a certified female fitness instructor with 2+ years of experience in HIIT, strength coaching and functional training.' },
  { id: 2, title: 'Front Desk & Guest Relations Executive', department: 'Reception', type: 'Full Time', salary: '৳25,000 - ৳32,000 / mo', vacancies: 1, status: 'Open', applicantsCount: 28, postedDate: '2026-08-24', description: 'Energetic front desk receptionist needed for morning/evening shifts. Strong computer & customer handling skills required.' },
  { id: 3, title: 'Sports Physiotherapist & Rehab Specialist', department: 'Fitness', type: 'Part Time', salary: '৳40,000 - ৳60,000 / mo', vacancies: 1, status: 'Open', applicantsCount: 8, postedDate: '2026-08-28', description: 'Provide injury prevention, rehabilitation guidance and mobility assessments for elite athletes and gym members.' },
];

export function GymDataProvider({ children }) {
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('fitlife-members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('fitlife-applications');
    return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
  });

  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('fitlife-plans');
    return saved ? JSON.parse(saved) : INITIAL_PLANS;
  });

  const [lockers, setLockers] = useState(() => {
    const saved = localStorage.getItem('fitlife-lockers');
    return saved ? JSON.parse(saved) : INITIAL_LOCKERS;
  });

  const [trainers, setTrainers] = useState(() => {
    const saved = localStorage.getItem('fitlife-trainers');
    return saved ? JSON.parse(saved) : INITIAL_TRAINERS;
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('fitlife-employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('fitlife-invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('fitlife-expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [attendance, setAttendance] = useState(() => {
    const saved = localStorage.getItem('fitlife-attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [roles, setRoles] = useState(() => {
    const saved = localStorage.getItem('fitlife-roles');
    return saved ? JSON.parse(saved) : INITIAL_ROLES;
  });

  const [smsCampaigns, setSmsCampaigns] = useState(() => {
    const saved = localStorage.getItem('fitlife-sms');
    return saved ? JSON.parse(saved) : INITIAL_SMS_CAMPAIGNS;
  });

  const [smsBalance, setSmsBalance] = useState(() => {
    const saved = localStorage.getItem('fitlife-sms-balance');
    return saved ? JSON.parse(saved) : 1420;
  });

  const [ads, setAds] = useState(() => {
    const saved = localStorage.getItem('fitlife-ads');
    return saved ? JSON.parse(saved) : INITIAL_ADS;
  });

  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('fitlife-jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  // Current active admin role
  const [currentUserRole, setCurrentUserRole] = useState('Super Admin');

  // Persistence effects
  useEffect(() => { localStorage.setItem('fitlife-members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('fitlife-applications', JSON.stringify(applications)); }, [applications]);
  useEffect(() => { localStorage.setItem('fitlife-plans', JSON.stringify(plans)); }, [plans]);
  useEffect(() => { localStorage.setItem('fitlife-lockers', JSON.stringify(lockers)); }, [lockers]);
  useEffect(() => { localStorage.setItem('fitlife-trainers', JSON.stringify(trainers)); }, [trainers]);
  useEffect(() => { localStorage.setItem('fitlife-employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('fitlife-invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('fitlife-expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('fitlife-attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('fitlife-roles', JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem('fitlife-sms', JSON.stringify(smsCampaigns)); }, [smsCampaigns]);
  useEffect(() => { localStorage.setItem('fitlife-sms-balance', JSON.stringify(smsBalance)); }, [smsBalance]);
  useEffect(() => { localStorage.setItem('fitlife-ads', JSON.stringify(ads)); }, [ads]);
  useEffect(() => { localStorage.setItem('fitlife-jobs', JSON.stringify(jobs)); }, [jobs]);

  // Dynamic Discount Calculation Engine
  const calculatePricing = ({ basePrice, discountType, discountValue, vatPercent = 5 }) => {
    const base = Number(basePrice) || 0;
    const value = Number(discountValue) || 0;
    let discountAmount = 0;

    if (discountType === 'percentage') {
      discountAmount = (base * Math.min(Math.max(value, 0), 100)) / 100;
    } else if (discountType === 'flat') {
      discountAmount = Math.min(Math.max(value, 0), base);
    }

    const priceAfterDiscount = Math.max(base - discountAmount, 0);
    const taxAmount = (priceAfterDiscount * vatPercent) / 100;
    const netPayable = Math.round(priceAfterDiscount + taxAmount);

    return {
      basePrice: base,
      discountType,
      discountValue: value,
      discountAmount,
      priceAfterDiscount,
      taxAmount,
      vatPercent,
      netPayable,
    };
  };

  // Check if current role has discount authority
  const canRoleApplyDiscount = () => {
    const roleObj = roles.find((r) => r.name === currentUserRole);
    return roleObj ? roleObj.canApplyDiscount : true;
  };

  // Add Member with Dynamic Discount Engine & Live Invoicing
  const addMember = ({
    name,
    email,
    phone,
    gender = 'Male',
    planId,
    trainerName = 'None',
    lockerNumber = 'None',
    discountType = 'flat',
    discountValue = 0,
    discountReason = '',
    paymentMethod = 'CASH',
    paidAmount = null,
  }) => {
    const selectedPlan = plans.find((p) => p.id === Number(planId)) || plans[0];
    const pricing = calculatePricing({
      basePrice: selectedPlan.price,
      discountType,
      discountValue,
      vatPercent: selectedPlan.vatPercent || 5,
    });

    const newId = members.length > 0 ? Math.max(...members.map((m) => m.id)) + 1 : 1;
    const memberCode = `FLM-80${40 + newId}`;
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const todayStr = '2026-09-01'; // local mock reference
    const expiryDate = '2026-10-01';

    const actualPaid = paidAmount !== null && paidAmount !== undefined ? Number(paidAmount) : pricing.netPayable;
    const due = Math.max(pricing.netPayable - actualPaid, 0);

    const discountSummary = pricing.discountAmount > 0
      ? `${pricing.discountType === 'percentage' ? `${pricing.discountValue}%` : `৳${pricing.discountValue}`} (${discountReason || 'Discount'})`
      : 'None';

    const newMember = {
      id: newId,
      code: memberCode,
      name,
      email,
      phone,
      gender,
      plan: selectedPlan.name,
      planId: selectedPlan.id,
      joined: todayStr,
      expiry: expiryDate,
      status: 'Active',
      visits: 0,
      avatar: initials || 'FL',
      trainer: trainerName,
      lockerNumber: lockerNumber || 'None',
      balanceDue: due,
      paidTotal: actualPaid,
      discountApplied: discountSummary,
    };

    // Auto-generate invoice with the discounted net payable
    const invId = invoices.length > 0 ? Math.max(...invoices.map((i) => i.id)) + 1 : 1;
    const newInvoice = {
      id: invId,
      number: `INV-2026-00${45 + invId}`,
      memberId: newId,
      memberName: name,
      memberCode,
      planName: selectedPlan.name,
      baseAmount: pricing.basePrice,
      discountType: pricing.discountType,
      discountValue: pricing.discountValue,
      discountAmount: pricing.discountAmount,
      discountReason: discountReason || 'None',
      taxAmount: pricing.taxAmount,
      netPayable: pricing.netPayable,
      paidAmount: actualPaid,
      dueAmount: due,
      status: due === 0 ? 'Paid' : actualPaid > 0 ? 'Partial' : 'Due',
      method: paymentMethod,
      date: todayStr,
    };

    setMembers((prev) => [newMember, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);

    // If locker assigned, update locker status
    if (lockerNumber && lockerNumber !== 'None') {
      setLockers((prev) =>
        prev.map((l) =>
          l.number === lockerNumber
            ? { ...l, status: 'Occupied', assignedTo: name, memberCode, expiryDate }
            : l
        )
      );
    }

    return newMember;
  };

  // Approve Online Application with Dynamic Discount
  const approveApplication = ({ appId, planId, discountType, discountValue, discountReason, paymentMethod }) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    addMember({
      name: app.name,
      email: app.email,
      phone: app.phone,
      gender: app.gender,
      planId: planId || app.desiredPlanId || 1,
      discountType: discountType || 'flat',
      discountValue: discountValue || 0,
      discountReason: discountReason || 'Online Application Promo',
      paymentMethod: paymentMethod || 'bKASH',
    });

    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: 'Approved' } : a))
    );
  };

  // Reject Application
  const rejectApplication = (appId, reason = 'Did not meet criteria') => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: 'Rejected', rejectionReason: reason } : a))
    );
  };

  // Attendance Check-In / Check-Out
  const checkInMember = (memberId, method = 'Manual Admin') => {
    const member = members.find((m) => m.id === Number(memberId));
    if (!member) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if already checked in today
    const existingIndex = attendance.findIndex(
      (a) => a.memberId === member.id && a.date === '2026-09-01' && a.status === 'In'
    );

    if (existingIndex >= 0) {
      alert(`${member.name} is already checked in!`);
      return;
    }

    const newAttId = attendance.length > 0 ? Math.max(...attendance.map((a) => a.id)) + 1 : 1;
    const newRecord = {
      id: newAttId,
      memberId: member.id,
      memberCode: member.code,
      name: member.name,
      avatar: member.avatar,
      plan: member.plan,
      expiry: member.expiry.split('-').slice(1).join('/'),
      checkIn: timeStr,
      checkOut: null,
      status: 'In',
      date: '2026-09-01',
      method,
    };

    setAttendance((prev) => [newRecord, ...prev]);
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, visits: m.visits + 1 } : m))
    );
  };

  const checkOutMember = (recordId) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAttendance((prev) =>
      prev.map((a) => (a.id === recordId ? { ...a, status: 'Out', checkOut: timeStr } : a))
    );
  };

  // Bulk Attendance Check In
  const bulkCheckIn = (memberIds) => {
    memberIds.forEach((id) => checkInMember(id, 'Bulk Admin Entry'));
  };

  // Payment Recording
  const collectPayment = ({ invoiceId, amount, method, trxId }) => {
    const amt = Number(amount) || 0;
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newPaid = inv.paidAmount + amt;
          const newDue = Math.max(inv.netPayable - newPaid, 0);
          return {
            ...inv,
            paidAmount: newPaid,
            dueAmount: newDue,
            status: newDue === 0 ? 'Paid' : 'Partial',
          };
        }
        return inv;
      })
    );
  };

  // Expense Recording
  const addExpense = ({ title, category, amount, method, notes }) => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map((e) => e.id)) + 1 : 1;
    const newExp = {
      id: newId,
      title,
      category,
      amount: Number(amount) || 0,
      method: method || 'CASH',
      date: '2026-09-01',
      notes: notes || '',
      approvedBy: currentUserRole,
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  // Locker Assignment
  const assignLocker = ({ lockerId, memberId, expiryDate }) => {
    const member = members.find((m) => m.id === Number(memberId));
    if (!member) return;

    setLockers((prev) =>
      prev.map((l) =>
        l.id === Number(lockerId)
          ? {
              ...l,
              status: 'Occupied',
              assignedTo: member.name,
              memberCode: member.code,
              expiryDate: expiryDate || '2026-10-01',
            }
          : l
      )
    );

    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, lockerNumber: lockerId } : m))
    );
  };

  const releaseLocker = (lockerId) => {
    setLockers((prev) =>
      prev.map((l) =>
        l.id === Number(lockerId)
          ? { ...l, status: 'Available', assignedTo: null, memberCode: null, expiryDate: null }
          : l
      )
    );
  };

  // SMS Campaign
  const sendSMS = ({ title, recipientType, message }) => {
    const count = recipientType === 'All Members' ? members.length : recipientType === 'Active Only' ? members.filter((m) => m.status === 'Active').length : 12;
    if (smsBalance < count) {
      alert('Insufficient SMS balance!');
      return false;
    }

    const newId = smsCampaigns.length > 0 ? Math.max(...smsCampaigns.map((s) => s.id)) + 1 : 1;
    const nowStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    const newCamp = {
      id: newId,
      title,
      recipientType,
      count,
      cost: count,
      message,
      status: 'Sent',
      sentAt: nowStr,
    };

    setSmsCampaigns((prev) => [newCamp, ...prev]);
    setSmsBalance((prev) => prev - count);
    return true;
  };

  // Role Permissions Modifier
  const updateRolePermission = (roleId, field, value) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, [field]: value } : r))
    );
  };

  // Aggregated Analytics Getters
  const getAnalytics = () => {
    const totalMembers = 2481 + (members.length - INITIAL_MEMBERS.length);
    const activeMembers = members.filter((m) => m.status === 'Active').length;
    const inactiveMembers = members.filter((m) => m.status === 'Inactive' || m.status === 'Expired').length;
    const pendingApps = applications.filter((a) => a.status === 'Pending').length;
    const totalPlans = plans.length;
    const totalEmployees = employees.length + trainers.length;

    // Real-time calculated sales based on actual discounted invoices
    const monthlySalesTotal = invoices.reduce((sum, inv) => sum + inv.netPayable, 0);
    const todaySalesInvoice = invoices
      .filter((inv) => inv.date === '2026-09-01')
      .reduce((sum, inv) => sum + inv.netPayable, 0);
    const todaySalesPayment = invoices
      .filter((inv) => inv.date === '2026-09-01')
      .reduce((sum, inv) => sum + inv.paidAmount, 0);

    const monthlyExpenseTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const newAdmissionsMonth = members.filter((m) => m.joined.startsWith('2026-08') || m.joined.startsWith('2026-09')).length;
    const expiringTodayCount = members.filter((m) => m.expiry === '2026-09-01' || m.status === 'Expiring').length;

    // Real-time attendance
    const presentNow = attendance.filter((a) => a.status === 'In').length;
    const checkedOutToday = attendance.filter((a) => a.status === 'Out').length;
    const totalDailyCheckIns = attendance.length;

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      pendingApps,
      totalPlans,
      totalEmployees,
      remainingSms: smsBalance,
      monthlySalesTotal,
      todaySalesInvoice,
      todaySalesPayment,
      monthlyExpenseTotal,
      newAdmissionsMonth,
      expiringTodayCount,
      presentNow,
      checkedOutToday,
      totalDailyCheckIns,
    };
  };

  return (
    <GymDataContext.Provider
      value={{
        members,
        setMembers,
        applications,
        plans,
        setPlans,
        lockers,
        trainers,
        employees,
        invoices,
        expenses,
        attendance,
        roles,
        smsCampaigns,
        smsBalance,
        ads,
        jobs,
        currentUserRole,
        setCurrentUserRole,
        calculatePricing,
        canRoleApplyDiscount,
        addMember,
        approveApplication,
        rejectApplication,
        checkInMember,
        checkOutMember,
        bulkCheckIn,
        collectPayment,
        addExpense,
        assignLocker,
        releaseLocker,
        sendSMS,
        updateRolePermission,
        getAnalytics,
      }}
    >
      {children}
    </GymDataContext.Provider>
  );
}

export function useGymData() {
  const context = useContext(GymDataContext);
  if (!context) {
    throw new Error('useGymData must be used within a GymDataProvider');
  }
  return context;
}
