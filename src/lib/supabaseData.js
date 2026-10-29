/**
 * Supabase data layer for GymDataContext.
 *
 * Fetches business entities from Supabase and maps DB rows (snake_case) to the
 * camelCase shapes the UI already consumes. Also exposes write helpers used by
 * the context actions. See database/schema.sql for the source of truth.
 */

import { supabase } from './supabase';

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
    category: 'Cafe', // the coffee shop is the only shop (see migration 010)
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
 * invoice-derived financials) — done in the context
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
    dob: row.dob || null,
    address: row.address || '',
    bloodGroup: row.blood_group || '',
    height: row.height ?? null,
    weight: row.weight ?? null,
    emergencyContact: { name: row.emergency_name || '', phone: row.emergency_phone || '' },
    plan: row.plan || 'Basic',
    joined: row.joined,
    expiry: row.expiry,
    status: row.status,
    visits: row.visits ?? 0,
    avatar: row.avatar || initialsOf(`${row.first_name} ${row.last_name}`),
    trainerId: row.trainer_id || null,
  };
}

export function mapExpense(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.expense_title,
    category: row.category,
    amount: Number(row.amount ?? 0),
    method: row.payment_method || 'BANK',
    date: row.expense_date,
    vendor: row.vendor || '',
    approvalStatus: row.approval_status || 'Approved',
    approvedBy: row.approved_by_name || '',
    notes: row.notes || '',
  };
}

// UI expense fields -> expenses row. Only defined fields are written, so the
// same helper serves inserts and partial updates.
function expenseToRow({ title, category, amount, method, date, vendor, approvalStatus, approvedBy, notes }) {
  const row = {
    expense_title: title,
    category,
    amount: amount === undefined ? undefined : Number(amount) || 0,
    payment_method: method,
    expense_date: date,
    vendor: vendor === undefined ? undefined : vendor || null,
    approval_status: approvalStatus,
    approved_by_name: approvedBy === undefined ? undefined : approvedBy || null,
    notes: notes === undefined ? undefined : notes || null,
  };
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
}

export function mapMonthClosing(row) {
  if (!row) return null;
  return {
    isClosed: true,
    closedAt: row.closed_at,
    closedBy: row.closed_by_name || '',
    notes: row.notes || '',
    financialSummary: row.summary || {},
  };
}

export function mapPeriodAdjustment(row) {
  if (!row) return null;
  return {
    id: row.id,
    monthKey: row.month_key,
    type: row.adjustment_type,
    amount: Number(row.amount ?? 0),
    reason: row.reason,
    authorizedBy: row.authorized_by || '',
    date: String(row.created_at || '').slice(0, 10),
    timestamp: row.created_at,
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
    category: row.category, // 'Cafe' (older rows may still read 'Gym Wear' | 'Food' until migration 010)
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

const SMS_SETTINGS_COLUMNS = 'id, provider_name, sender_id, remaining_balance, updated_at';

/**
 * Staff profile for the signed-in auth user: public.users row + role.
 * Returns { data: null } when the account has no active role — the database
 * grants such accounts no access (migration 011).
 */
export async function fetchStaffProfile(authUid) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, status, role_id, roles(*)')
    .eq('auth_uid', authUid)
    .maybeSingle();
  if (error) return { data: null, error };
  if (!data || data.status !== 'Active' || !data.roles) return { data: null, error: null };
  return {
    data: { id: data.id, name: data.name, email: data.email, role: mapRole(data.roles) },
    error: null,
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
    payments: () => supabase.from('payments')
      .select('id, receipt_number, invoice_id, amount, method, transaction_reference, payment_date')
      .order('payment_date'),
    trainers: () => supabase.from('trainers').select('*').order('id'),
    employees: () => supabase.from('employees').select('*').order('id'),
    invoices: () => supabase.from('invoices').select('*').order('id', { ascending: false }),
    discounts: () => supabase.from('discounts').select('*').order('id', { ascending: false }),
    expenses: () => supabase.from('expenses').select('*').order('id', { ascending: false }),
    // Finance state tables (migration 012)
    expenseCategories: () => supabase.from('expense_categories').select('name').order('id'),
    monthClosings: () => supabase.from('finance_month_closings').select('*'),
    periodAdjustments: () => supabase.from('finance_period_adjustments').select('*').order('id'),
    attendance: () => supabase.from('attendance').select('*').order('id', { ascending: false }),
    roles: () => supabase.from('roles').select('*').order('id'),
    users: () => supabase.from('users').select('role_id'),
    smsCampaigns: () => supabase.from('sms_campaigns').select('*').order('id', { ascending: false }),
    // Explicit columns: api_key is not readable by the browser role (migration 011).
    smsSettings: () => supabase.from('sms_settings').select(SMS_SETTINGS_COLUMNS).limit(1),
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
        return [k, data, null];
      } catch (e) {
        console.warn(`[supabaseData] Failed to load '${k}':`, e.message);
        return [k, null, e.message || 'Unknown error'];
      }
    })
  );

  // errors: { tableKey: message } for each table that failed, e.g. { trainers: 'permission denied' }
  const data = Object.fromEntries(results.map(([k, v]) => [k, v]));
  const errors = Object.fromEntries(results.filter(([, , msg]) => msg).map(([k, , msg]) => [k, msg]));
  return { data, errors };
}

// -----------------------------------------------------------------------------
// Write helpers — thin wrappers so the context stays readable.
// Each returns { data, error } from supabase-js.
// -----------------------------------------------------------------------------

export const db = {
  // Members ------------------------------------------------------------------
  async insertMember({ name, email, phone, gender, planName, trainerId, avatar = null, status = 'Active', joined, expiry, visits = 0 }) {
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

  // Personal details from the Member Details "Edit profile" form.
  updateMemberProfile(id, { name, phone, email, address, height, weight, emergencyName, emergencyPhone }) {
    const parts = String(name || '').trim().split(/\s+/);
    const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
    return this.updateMember(id, {
      first_name: parts[0],
      last_name: parts.slice(1).join(' '), // '' for one-word names, so it isn't repeated
      phone: String(phone || '').trim(),
      email: String(email || '').trim() || null,
      address: String(address || '').trim() || null,
      height: num(height),
      weight: num(weight),
      emergency_name: String(emergencyName || '').trim() || null,
      emergency_phone: String(emergencyPhone || '').trim() || null,
    });
  },

  // Applications ---------------------------------------------------------------
  updateApplication(id, patch) {
    return supabase.from('admission_submissions').update(patch).eq('id', id).select('*').single();
  },

  // Admission / Payments (server-side RPCs, migration 011) ---------------------
  // Member + discount + invoice + payment in one transaction; prices
  // and discount limits are enforced by the database, not trusted from here.
  createMemberWithInvoice({
    planId, name, phone, email, gender, discountType, discountValue, discountReason,
    paidAmount, paymentMethod, trainerId, avatar, submissionId, dueDate, notes, startDate,
  }) {
    return supabase.rpc('create_member_with_invoice', {
      p_plan_id: Number(planId),
      p_name: name ?? null,
      p_phone: phone ?? null,
      p_email: email || null,
      p_gender: gender ?? null,
      p_discount_type: discountType || 'flat',
      p_discount_value: Number(discountValue) || 0,
      p_discount_reason: discountReason || null,
      p_paid_amount: paidAmount === null || paidAmount === undefined ? null : Number(paidAmount),
      p_payment_method: paymentMethod || 'CASH',
      p_trainer_id: trainerId || null,
      p_avatar: avatar || null,
      p_submission_id: submissionId || null,
      p_due_date: dueDate || null,
      p_notes: notes || null,
      // Only sent when chosen, so callers without it keep working on
      // databases that haven't run migration 013 yet.
      ...(startDate ? { p_start_date: startDate } : {}),
    });
  },

  // Migration 015. Leaving startDate empty lets the server continue from the
  // current expiry (or today if expired); leaving paidAmount empty means paid in full.
  renewMembership({
    memberId, planId, startDate, discountType, discountValue, discountReason,
    paidAmount, paymentMethod, dueDate, notes,
  }) {
    return supabase.rpc('renew_membership', {
      p_member_id: Number(memberId),
      p_plan_id: Number(planId),
      p_start_date: startDate || null,
      p_discount_type: discountType || 'flat',
      p_discount_value: Number(discountValue) || 0,
      p_discount_reason: discountReason || null,
      p_paid_amount: paidAmount === null || paidAmount === undefined ? null : Number(paidAmount),
      p_payment_method: paymentMethod || 'CASH',
      p_due_date: dueDate || null,
      p_notes: notes || null,
    });
  },

  collectPayment({ invoiceId, amount, method, reference }) {
    return supabase.rpc('collect_payment', {
      p_invoice_id: Number(invoiceId),
      p_amount: Number(amount),
      p_method: method || 'CASH',
      p_reference: reference || null,
    });
  },

  extendInvoiceDueDate({ invoiceId, newDueDate, reason, authorizedBy }) {
    return supabase.rpc('extend_invoice_due_date', {
      p_invoice_id: Number(invoiceId),
      p_new_due_date: newDueDate,
      p_reason: reason,
      p_authorized_by: authorizedBy || null,
    });
  },

  // Expenses -------------------------------------------------------------------
  insertExpense({ title, category, amount, method, date, vendor, approvalStatus, approvedBy, notes }) {
    return supabase
      .from('expenses')
      .insert(expenseToRow({ title, category, amount, method, date: date || todayStr(), vendor, approvalStatus, approvedBy, notes }))
      .select('*')
      .single();
  },

  updateExpense(id, fields) {
    return supabase.from('expenses').update(expenseToRow(fields)).eq('id', id).select('*').single();
  },

  deleteExpense(id) {
    return supabase.from('expenses').delete().eq('id', id);
  },

  insertExpenseCategory(name) {
    return supabase.from('expense_categories').insert({ name }).select('name').single();
  },

  // Monthly closing (migration 012) --------------------------------------------
  insertMonthClosing({ monthKey, closedByName, notes, summary }) {
    return supabase
      .from('finance_month_closings')
      .insert({ month_key: monthKey, closed_by_name: closedByName || null, notes: notes || null, summary })
      .select('*')
      .single();
  },

  insertPeriodAdjustment({ monthKey, type, amount, reason, authorizedBy }) {
    return supabase
      .from('finance_period_adjustments')
      .insert({
        month_key: monthKey,
        adjustment_type: type,
        amount: Number(amount) || 0,
        reason,
        authorized_by: authorizedBy || null,
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
    return supabase.from('sms_settings').update({ remaining_balance: next }).eq('id', settingsId).select(SMS_SETTINGS_COLUMNS).single();
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

  assignDietPlan(id, memberId, clientName) {
    return supabase
      .from('ai_diet_plans')
      .update({ member_id: memberId, plan_title: clientName })
      .eq('id', id)
      .is('member_id', null)
      .select('*')
      .single();
  },

  duplicateDietPlan(plan, memberId, clientName) {
    return supabase
      .from('ai_diet_plans')
      .insert({
        member_id: memberId,
        plan_title: clientName,
        target_goal: plan.target_goal,
        daily_calories: plan.daily_calories,
        protein_grams: plan.protein_grams,
        carbs_grams: plan.carbs_grams,
        fats_grams: plan.fats_grams,
        meals_json: plan.meals_json,
        dietary_preference: plan.dietary_preference,
      })
      .select('*')
      .single();
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

  assignWorkoutPlan(id, memberId, clientName) {
    return supabase
      .from('ai_workout_plans')
      .update({ member_id: memberId, plan_title: clientName })
      .eq('id', id)
      .is('member_id', null)
      .select('*')
      .single();
  },

  duplicateWorkoutPlan(plan, memberId, clientName) {
    return supabase
      .from('ai_workout_plans')
      .insert({
        member_id: memberId,
        plan_title: clientName,
        fitness_goal: plan.fitness_goal,
        experience_level: plan.experience_level,
        days_per_week: plan.days_per_week,
        routine_json: plan.routine_json,
        ai_generated_notes: plan.ai_generated_notes,
      })
      .select('*')
      .single();
  },

  insertProgressLog({ memberId, record }) {
    return supabase
      .from('progress_logs')
      .insert({ member_id: memberId || null, data: record })
      .select('*')
      .single();
  },

  // Shop products (Coffee Shop menu) ---------------------------------------------
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
