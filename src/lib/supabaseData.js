/**
 * Supabase data layer for GymDataContext.
 *
 * Fetches business entities from Supabase and maps DB rows (snake_case) to the
 * camelCase shapes the UI already consumes. Also exposes write helpers used by
 * the context actions. See database/schema.sql for the source of truth.
 */

import { supabase } from './supabase';

// -----------------------------------------------------------------------------
// Fallback seeds — used ONLY while the DB is loading or if core tables are
// unreachable, so every page keeps rendering. Shapes mirror the mappers' output.
// -----------------------------------------------------------------------------

export const FALLBACK_DATA = {
  plans: [
    {
      id: 1, code: '1-month', name: '1 Month', price: 7000, period: '', durationDays: 30,
      features: [],
      lockerZone: null, popular: false, vatPercent: 5, status: 'Active',
    },
    {
      id: 2, code: '3-months', name: '3 Months', price: 18000, period: '', durationDays: 90,
      features: [],
      lockerZone: null, popular: true, vatPercent: 5, status: 'Active',
    },
    {
      id: 3, code: '6-months', name: '6 Months', price: 30000, period: '', durationDays: 180,
      features: [],
      lockerZone: null, popular: false, vatPercent: 5, status: 'Active',
    },
    {
      id: 4, code: '1-year', name: '1 Year', price: 50000, period: '', durationDays: 365,
      features: [],
      lockerZone: null, popular: false, vatPercent: 5, status: 'Active',
    },
    {
      id: 5, code: '1-day-trial', name: '1 Day Trial', price: 500, period: '', durationDays: 1,
      features: ['No Admission Fee'],
      lockerZone: null, popular: false, vatPercent: 5, status: 'Active',
    },
  ],
  members: [],
  applications: [],
  invoices: [],
  expenses: [],
  attendance: [],
  lockers: [],
  trainers: [],
  employees: [],
  roles: [
    { id: 1, name: 'Super Admin', description: 'Full system access', canApplyDiscount: true, maxDiscountPercent: 100, canApproveMembers: true, canManageLockers: true, canManageFinances: true, usersCount: 0 },
    { id: 2, name: 'Branch Manager', description: 'Branch-level management', canApplyDiscount: true, maxDiscountPercent: 15, canApproveMembers: true, canManageLockers: true, canManageFinances: true, usersCount: 0 },
    { id: 3, name: 'Receptionist', description: 'Front desk: admissions, check-ins, lockers', canApplyDiscount: false, maxDiscountPercent: 0, canApproveMembers: false, canManageLockers: true, canManageFinances: false, usersCount: 0 },
    { id: 4, name: 'Trainer', description: 'Coaching staff', canApplyDiscount: false, maxDiscountPercent: 0, canApproveMembers: false, canManageLockers: false, canManageFinances: false, usersCount: 0 },
    { id: 5, name: 'Accountant', description: 'Finance & payroll', canApplyDiscount: true, maxDiscountPercent: 5, canApproveMembers: false, canManageLockers: false, canManageFinances: true, usersCount: 0 },
  ],
  smsCampaigns: [],
  ads: [],
  jobs: [],
  shopProducts: [],
};

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(dateStr, days) {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * '06:42:00' (DB time) -> '06:42 AM' (UI).
 * Passes through strings already in display format ('06:42 AM') so optimistic
 * temp records render identically to DB-loaded ones.
 */
export function toDisplayTime(t) {
  if (!t) return null;
  const s = String(t);
  if (/[AP]M/i.test(s)) return s;
  const [hStr, m] = s.split(':');
  let h = Number(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

/** '06:42 AM' (UI) -> '06:42:00' (DB time) */
export function toDbTime(display) {
  if (!display) return null;
  const m = String(display).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = (m[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}:00`;
}

export function nowDisplayTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function initialsOf(name) {
  return String(name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'FL';
}

export function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  return {
    firstName: parts[0] || 'Member',
    lastName: parts.slice(1).join(' ') || parts[0] || 'Member',
  };
}

/** Generate a unique invoice number: INV-2026-482913 */
export function generateInvoiceNumber() {
  return `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

export function normalizeDietPreference(pref) {
  const p = String(pref || '').toLowerCase();
  if (p.includes('vegan')) return 'Vegan';
  if (p.includes('keto')) return 'Keto';
  if (p.includes('high protein')) return 'High Protein';
  if (p.includes('vegetarian') || p === 'veg') return 'Vegetarian';
  return 'Non-Veg';
}

/** UI camelCase product -> shop_products row (snake_case) */
export function shopProductToRow(product) {
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    name: String(product.name || '').trim() || 'Unnamed Product',
    category: product.category === 'Food' ? 'Food' : 'Gym Wear',
    brand: product.brand || null,
    price: num(product.price),
    cost: num(product.cost),
    stock: Math.max(Math.round(num(product.stock)), 0),
    unit: product.unit || 'pcs',
    size: product.size || null,
    image_url: product.imageUrl || null,
    description: product.description || null,
    status: ['Active', 'Draft', 'Archived'].includes(product.status) ? product.status : 'Active',
  };
}

// -----------------------------------------------------------------------------
// Mappers: DB row -> UI shape
// -----------------------------------------------------------------------------

export function mapPlan(row, featuresByPlanId = {}) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    price: Number(row.base_price),
    period: '',
    durationDays: row.duration_days,
    features: featuresByPlanId[row.id] || [],
    lockerZone: null,
    popular: !!row.is_popular,
    vatPercent: Number(row.vat_percentage ?? 5),
    status: row.status || 'Active',
  };
}

export function mapRole(row, usersByRoleId = {}) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    canApplyDiscount: !!row.can_apply_discount,
    maxDiscountPercent: Number(row.max_discount_percentage ?? 0),
    canApproveMembers: !!row.can_approve_members,
    canManageLockers: !!row.can_manage_lockers,
    canManageFinances: !!row.can_manage_finances,
    usersCount: usersByRoleId[row.id] || 0,
  };
}

export function mapTrainer(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    role: row.specialty, // UI shows a role line; specialty is the closest DB field
    specialty: row.specialty,
    phone: row.phone,
    email: row.email || '',
    clients: row.active_clients ?? 0,
    rating: Number(row.rating ?? 5),
    available: !!row.is_available,
    avatar: row.avatar || initialsOf(row.name),
    salary: Number(row.monthly_salary ?? 0),
  };
}

export function mapEmployee(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.employee_code || `EMP-${100 + row.id}`,
    name: row.name,
    role: row.role,
    department: row.department,
    phone: row.phone,
    email: row.email || '',
    joined: row.joined_date,
    salary: Number(row.monthly_salary ?? 0),
    status: row.status,
    avatar: row.avatar || initialsOf(row.name),
  };
}

export function mapLocker(row) {
  if (!row) return null;
  return {
    id: row.id,
    number: row.locker_number,
    zone: row.zone,
    type: row.type,
    status: row.status,
    assignedTo: null,
    memberCode: null,
    expiryDate: null,
    monthlyFee: Number(row.monthly_fee ?? 0),
  };
}

export function mapApplication(row, plans = []) {
  if (!row) return null;
  const planBySlug = plans.find((p) => p.code === row.plan);
  return {
    id: row.id,
    code: `APP-${9000 + row.id}`,
    name: `${row.first_name} ${row.last_name}`.trim(),
    phone: row.phone,
    email: row.email || '',
    gender: row.gender ? row.gender.charAt(0).toUpperCase() + row.gender.slice(1) : 'Male',
    desiredPlan: planBySlug?.name || row.plan,
    desiredPlanId: planBySlug?.id || plans[0]?.id || 1,
    branch: row.branch || 'Main Branch',
    goal: row.goal || 'General Fitness & Health',
    medical: row.medical_conditions || 'None',
    allergies: row.allergies || 'None',
    bloodGroup: row.blood_group || 'N/A',
    height: row.height ? `${row.height} cm` : 'N/A',
    weight: row.weight ? `${row.weight} kg` : 'N/A',
    emergencyName: row.emergency_name || 'N/A',
    emergencyPhone: row.emergency_phone || 'N/A',
    emergencyRelation: row.emergency_relation || '',
    status: row.status,
    submittedDate: (row.submitted_at || '').slice(0, 10),
    photo: initialsOf(`${row.first_name} ${row.last_name}`),
    rejectionReason: row.rejection_reason || undefined,
  };
}

/**
 * Members need enrichment from other loaded arrays (plans by name, trainer/
 * locker display values, invoice-derived financials) — done in the context
 * where those arrays are available. This mapper handles the row-only fields.
 */
export function mapMemberBase(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.member_code || `FLM-${String(row.id).padStart(4, '0')}`,
    dbFirstName: row.first_name,
    dbLastName: row.last_name,
    email: row.email || '',
    phone: row.phone,
    gender: row.gender || 'Male',
    plan: row.plan || 'Basic',
    joined: row.joined,
    expiry: row.expiry,
    status: row.status,
    visits: row.visits ?? 0,
    avatar: row.avatar || initialsOf(`${row.first_name} ${row.last_name}`),
    trainerId: row.trainer_id || null,
    lockerId: row.locker_id || null,
  };
}

export function mapExpense(row, approvedByLabel = 'Admin') {
  if (!row) return null;
  return {
    id: row.id,
    title: row.expense_title,
    category: row.category,
    amount: Number(row.amount ?? 0),
    method: row.payment_method || 'BANK',
    date: row.expense_date,
    notes: row.notes || '',
    approvedBy: approvedByLabel,
  };
}

export function mapSmsCampaign(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    recipientType: row.recipient_type,
    count: row.recipient_count ?? 0,
    cost: row.cost_credits ?? 0,
    message: row.message,
    status: row.status,
    sentAt: row.sent_at ? new Date(row.sent_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '',
  };
}

export function mapAd(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    bannerUrl: row.banner_url,
    targetUrl: row.target_url || '',
    position: row.position,
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  };
}

export function mapJob(row, appsByJobId = {}) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.job_title,
    department: row.department,
    type: row.job_type,
    salary: row.salary_range || 'Negotiable',
    vacancies: row.vacancies ?? 1,
    status: row.status,
    applicantsCount: appsByJobId[row.id] || 0,
    postedDate: row.posted_date,
    description: row.description || '',
  };
}

export function mapDietPlan(row) {
  if (!row) return null;
  const payload = row.meals_json || {};
  return {
    ...payload,
    id: row.id,
    clientName: row.plan_title || payload.clientName || 'Member',
    memberId: row.member_id ?? payload.memberId ?? null,
    goal: row.target_goal || payload.goal,
    dateGenerated: row.created_at || payload.dateGenerated,
    profile: payload.profile || {},
    calculations: payload.calculations || {},
    meals: payload.meals || [],
  };
}

export function mapWorkoutPlan(row) {
  if (!row) return null;
  const payload = row.routine_json || {};
  return {
    ...payload,
    id: row.id,
    clientName: row.plan_title || payload.clientName || 'Member',
    memberId: row.member_id ?? payload.memberId ?? null,
    dateGenerated: row.created_at || payload.dateGenerated,
    program: payload.program || payload,
  };
}

export function mapProgressLog(row) {
  if (!row) return null;
  return { ...(row.data || {}), id: row.id, timestamp: row.created_at || row.timestamp };
}

export function mapShopProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category, // 'Gym Wear' | 'Food'
    brand: row.brand || '',
    price: Number(row.price ?? 0),
    cost: Number(row.cost ?? 0),
    stock: row.stock ?? 0,
    unit: row.unit || 'pcs',
    size: row.size || null,
    imageUrl: row.image_url || '',
    description: row.description || '',
    status: row.status || 'Active',
  };
}

// -----------------------------------------------------------------------------
// Fetch everything (parallel). Returns { data, errors } — each slice falls back
// to `null` when its query failed so the context can keep its fallback data.
// -----------------------------------------------------------------------------

export async function fetchAllData() {
  const jobs = {
    plans: () => supabase.from('plans').select('*').order('id'),
    planFeatures: () => supabase.from('plan_features').select('*'),
    members: () => supabase.from('members').select('*').order('id', { ascending: false }),
    applications: () => supabase.from('admission_submissions').select('*').order('submitted_at', { ascending: false }),
    lockers: () => supabase.from('lockers').select('*').order('id'),
    lockerAssignments: () => supabase.from('locker_assignments').select('*'),
    trainers: () => supabase.from('trainers').select('*').order('id'),
    employees: () => supabase.from('employees').select('*').order('id'),
    invoices: () => supabase.from('invoices').select('*').order('id', { ascending: false }),
    discounts: () => supabase.from('discounts').select('*').order('id', { ascending: false }),
    expenses: () => supabase.from('expenses').select('*').order('id', { ascending: false }),
    attendance: () => supabase.from('attendance').select('*').order('id', { ascending: false }),
    roles: () => supabase.from('roles').select('*').order('id'),
    users: () => supabase.from('users').select('role_id'),
    smsCampaigns: () => supabase.from('sms_campaigns').select('*').order('id', { ascending: false }),
    smsSettings: () => supabase.from('sms_settings').select('*').limit(1),
    ads: () => supabase.from('advertisements').select('*').order('id'),
    jobs: () => supabase.from('job_postings').select('*').order('id', { ascending: false }),
    jobApplications: () => supabase.from('job_applications').select('job_id'),
    dietPlans: () => supabase.from('ai_diet_plans').select('*').order('id', { ascending: false }),
    workoutPlans: () => supabase.from('ai_workout_plans').select('*').order('id', { ascending: false }),
    shopProducts: () => supabase.from('shop_products').select('*').order('id', { ascending: false }),
    progressLogs: () => supabase.from('progress_logs').select('*').order('id', { ascending: false }),
    appSettings: () => supabase.from('app_settings').select('*'),
  };

  const keys = Object.keys(jobs);
  const results = await Promise.all(
    keys.map(async (k) => {
      try {
        const { data, error } = await jobs[k]();
        if (error) throw error;
        return [k, data];
      } catch (e) {
        console.warn(`[supabaseData] Failed to load '${k}':`, e.message);
        return [k, null];
      }
    })
  );

  const data = Object.fromEntries(results);
  const errors = Object.fromEntries(results.filter(([, v]) => v === null).map(([k]) => [k, true]));
  return { data, errors };
}

// -----------------------------------------------------------------------------
// Write helpers — thin wrappers so the context stays readable.
// Each returns { data, error } from supabase-js.
// -----------------------------------------------------------------------------

export const db = {
  // Members ------------------------------------------------------------------
  async insertMember({ name, email, phone, gender, planName, trainerId, lockerId, avatar = null, status = 'Active', joined, expiry, visits = 0 }) {
    const { firstName, lastName } = splitName(name);
    return supabase
      .from('members')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone,
        gender,
        plan: planName,
        trainer_id: trainerId || null,
        locker_id: lockerId || null,
        avatar,
        status,
        joined: joined || todayStr(),
        expiry: expiry || addDays(todayStr(), 30),
        visits,
      })
      .select('*')
      .single();
  },

  updateMember(id, patch) {
    return supabase.from('members').update(patch).eq('id', id).select('*').single();
  },

  // Applications ---------------------------------------------------------------
  updateApplication(id, patch) {
    return supabase.from('admission_submissions').update(patch).eq('id', id).select('*').single();
  },

  // Discounts / Invoices / Payments --------------------------------------------
  insertDiscount({ discountType, discountValue, discountAmount, reason }) {
    return supabase
      .from('discounts')
      .insert({
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
        discount_amount: Number(discountAmount) || 0,
        reason_note: reason || null,
      })
      .select('*')
      .single();
  },

  insertInvoice(payload) {
    return supabase.from('invoices').insert(payload).select('*').single();
  },

  updateInvoice(id, patch) {
    return supabase.from('invoices').update(patch).eq('id', id).select('*').single();
  },

  insertPayment(payload) {
    return supabase.from('payments').insert(payload).select('*').single();
  },

  // Expenses -------------------------------------------------------------------
  insertExpense({ title, category, amount, method, notes, approvedById }) {
    return supabase
      .from('expenses')
      .insert({
        expense_title: title,
        category,
        amount: Number(amount) || 0,
        payment_method: method || 'CASH',
        expense_date: todayStr(),
        notes: notes || null,
        approved_by: approvedById || null,
      })
      .select('*')
      .single();
  },

  // Attendance -------------------------------------------------------------------
  insertAttendance({ memberId, method, checkInDisplay }) {
    const row = {
      member_id: memberId,
      attendance_date: todayStr(),
      status: 'In',
      method,
    };
    // Only set the time when parseable — otherwise omit so the column default
    // (now()::time) applies instead of violating the not-null constraint.
    const t = toDbTime(checkInDisplay);
    if (t) row.check_in_time = t;
    return supabase.from('attendance').insert(row).select('*').single();
  },

  updateAttendance(id, { checkOutDisplay }) {
    return supabase
      .from('attendance')
      .update({ check_out_time: toDbTime(checkOutDisplay), status: 'Out' })
      .eq('id', id)
      .select('*')
      .single();
  },

  // Lockers ------------------------------------------------------------------------
  updateLocker(id, patch) {
    return supabase.from('lockers').update(patch).eq('id', id).select('*').single();
  },

  insertLockerAssignment({ lockerId, memberId, expiryDate }) {
    return supabase
      .from('locker_assignments')
      .insert({ locker_id: lockerId, member_id: memberId, expiry_date: expiryDate || addDays(todayStr(), 30) })
      .select('*')
      .single();
  },

  updateLockerAssignment(lockerId, patch) {
    return supabase.from('locker_assignments').update(patch).eq('locker_id', lockerId);
  },

  // SMS ------------------------------------------------------------------------------
  insertSmsCampaign({ title, recipientType, message, count, status = 'Sent' }) {
    return supabase
      .from('sms_campaigns')
      .insert({
        title,
        recipient_type: recipientType,
        message,
        recipient_count: count,
        cost_credits: count,
        status,
      })
      .select('*')
      .single();
  },

  async decrementSmsBalance(settingsId, by, current) {
    const next = Math.max(Number(current) - Number(by), 0);
    return supabase.from('sms_settings').update({ remaining_balance: next }).eq('id', settingsId).select('*').single();
  },

  // Roles ------------------------------------------------------------------------------
  updateRole(id, patch) {
    return supabase.from('roles').update(patch).eq('id', id).select('*').single();
  },

  // Branding (app_settings key/value) ----------------------------------------------------
  upsertAppSetting(key, value) {
    return supabase.from('app_settings').upsert({ key, value }, { onConflict: 'key' }).select('*').single();
  },

  // AI plans / progress -------------------------------------------------------------------
  insertDietPlan({ memberId, clientName, goal, record, preference }) {
    // calculateNutritionProfile() spreads metrics to top level (proteinGrams,
    // carbGrams, fatGrams, targetCalories) AND nests protein/carbs/fat as
    // {grams, percent} objects — Number(object) is NaN, so prefer the numbers.
    const calc = record.calculations || {};
    const num = (v) => {
      const n = Math.round(Number(v));
      return Number.isFinite(n) ? n : 0;
    };
    return supabase
      .from('ai_diet_plans')
      .insert({
        member_id: memberId || null,
        plan_title: clientName || 'Member',
        target_goal: goal || 'Balanced Wellness',
        daily_calories: num(calc.targetCalories ?? calc.tdee ?? calc.calories),
        protein_grams: num(calc.proteinGrams ?? calc.protein?.grams),
        carbs_grams: num(calc.carbGrams ?? calc.carbs?.grams),
        fats_grams: num(calc.fatGrams ?? calc.fat?.grams),
        meals_json: record,
        dietary_preference: normalizeDietPreference(preference),
      })
      .select('*')
      .single();
  },

  deleteDietPlan(id) {
    return supabase.from('ai_diet_plans').delete().eq('id', id);
  },

  insertWorkoutPlan({ memberId, clientName, goal, record, experience, daysPerWeek }) {
    return supabase
      .from('ai_workout_plans')
      .insert({
        member_id: memberId || null,
        plan_title: clientName || 'Member',
        fitness_goal: goal || 'General Fitness',
        experience_level: experience || 'Intermediate',
        days_per_week: Number(daysPerWeek) || 4,
        routine_json: record,
      })
      .select('*')
      .single();
  },

  deleteWorkoutPlan(id) {
    return supabase.from('ai_workout_plans').delete().eq('id', id);
  },

  insertProgressLog({ memberId, record }) {
    return supabase
      .from('progress_logs')
      .insert({ member_id: memberId || null, data: record })
      .select('*')
      .single();
  },

  // Shop products (Gym Shop inventory) --------------------------------------------
  insertShopProduct(product) {
    return supabase.from('shop_products').insert(shopProductToRow(product)).select('*').single();
  },

  updateShopProduct(id, product) {
    return supabase.from('shop_products').update(shopProductToRow(product)).eq('id', id).select('*').single();
  },

  deleteShopProduct(id) {
    return supabase.from('shop_products').delete().eq('id', id);
  },

  fetchShopOrders() {
    return supabase.from('shop_orders').select('*').order('created_at', { ascending: false });
  },

  updateShopOrderStatus(id, status) {
    return supabase.from('shop_orders').update({ status }).eq('id', id).select('*').single();
  },
};
