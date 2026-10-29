import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  db,
  fetchAllData,
  todayStr,
  addDays,
  nowDisplayTime,
  toDisplayTime,
  initialsOf,
  mapPlan,
  mapRole,
  mapTrainer,
  mapEmployee,
  mapApplication,
  mapMemberBase,
  mapExpense,
  mapMonthClosing,
  mapPeriodAdjustment,
  mapSmsCampaign,
  mapJob,
  mapDietPlan,
  mapWorkoutPlan,
  mapProgressLog,
  mapShopProduct,
  shopProductToRow,
} from '../lib/supabaseData';
import { resolveProfilePhotoUrls } from '../lib/profilePhotos';

const GymDataContext = createContext();

export const DEFAULT_BRANDING = {
  gymName: 'FitLife',
  tagline: 'ENTERPRISE GYM',
  logoUrl: '/fitlife-logo.jpg',
  logoIcon: 'Flame',
  heroTagline: 'TRAIN HARD. LIVE STRONG.',
  heroSub: 'YOUR FITNESS. YOUR JOURNEY.',
  phone: '+880 1711-223344',
  email: 'contact@fitlife.com',
  address: 'Plot 42, Gulshan Avenue, Dhaka, Bangladesh',
};

// Every slice below is built only from database rows. While loading, or when
// a table is empty or failed to load, the slice is an empty list, never demo
// records: a fake plan, role or trainer could otherwise be picked and saved.

export function GymDataProvider({ children }) {
  const { user, staff } = useAuth();

  // --- Raw DB rows -----------------------------------------------------------
  const [raw, setRaw] = useState(null); // null = still loading
  // { tableKey: message } for tables that failed on the last load, e.g. { trainers: '…' }.
  const [loadErrors, setLoadErrors] = useState({});
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [smsBalanceOverride, setSmsBalanceOverride] = useState(null);
  const [profilePhotoUrls, setProfilePhotoUrls] = useState({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- Initial load + realtime refresh ----------------------------------------
  const loadAll = useCallback(async () => {
    const { data, errors } = await fetchAllData();
    if (!mountedRef.current) return;

    setLoadErrors(errors);

    // Branding from app_settings
    const brandingRow = (data.appSettings || []).find((r) => r.key === 'branding');
    if (brandingRow?.value) {
      // An empty saved logoUrl falls back to the bundled gym logo.
      setBranding((prev) => ({ ...prev, ...brandingRow.value, logoUrl: brandingRow.value.logoUrl || DEFAULT_BRANDING.logoUrl }));
    }

    // SMS balance from sms_settings
    const smsRow = (data.smsSettings || [])[0];
    if (smsRow) setSmsBalanceOverride(smsRow.remaining_balance ?? 0);

    // A table that fails on a reload keeps its last loaded rows (shown with
    // the error), so a short network blip doesn't empty the screen. On the
    // first load there is nothing to keep, so it stays null (an empty list).
    setRaw((prev) => {
      if (!prev) return data;
      const next = { ...data };
      for (const key of Object.keys(errors)) {
        if (prev[key] != null) next[key] = prev[key];
      }
      return next;
    });
  }, []);

  // Refetch whenever auth state changes: before login RLS returns empty
  // arrays for every table, so the post-sign-in reload is mandatory.
  useEffect(() => {
    loadAll();
  }, [loadAll, user?.id]);

  useEffect(() => {
    if (!raw) return undefined;

    let cancelled = false;
    const paths = [
      ...(raw.members || []).map((row) => row.avatar),
      ...(raw.trainers || []).map((row) => row.avatar),
      ...(raw.employees || []).map((row) => row.avatar),
      ...(raw.applications || []).map((row) => row.avatar),
    ];

    const refreshPhotoUrls = () => resolveProfilePhotoUrls(paths)
      .then((urls) => {
        if (!cancelled) setProfilePhotoUrls(urls);
      })
      .catch((err) => {
        console.error('[GymDataContext] profile photo URL resolution failed:', err);
        if (!cancelled) setProfilePhotoUrls({});
      });
    refreshPhotoUrls();
    const refreshTimer = window.setInterval(refreshPhotoUrls, 12 * 60 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [raw]);

  // --- Derived camelCase slices (with graceful fallback) ----------------------
  const plans = useMemo(() => {
    if (!raw?.plans) return [];
    const features = {};
    for (const f of raw.planFeatures || []) {
      (features[f.plan_id] = features[f.plan_id] || []).push(f.feature_name);
    }
    return raw.plans.map((r) => mapPlan(r, features));
  }, [raw]);
  const activePlans = useMemo(
    () => plans.filter((plan) => plan.status === 'Active'),
    [plans]
  );

  const roles = useMemo(() => {
    if (!raw?.roles) return [];
    const counts = {};
    for (const u of raw.users || []) {
      if (u.role_id) counts[u.role_id] = (counts[u.role_id] || 0) + 1;
    }
    return raw.roles.map((r) => mapRole(r, counts));
  }, [raw]);

  const trainers = useMemo(() => (raw?.trainers || []).map((row) => {
    const trainer = mapTrainer(row);
    return {
      ...trainer,
      avatar: profilePhotoUrls[row.avatar] || (row.avatar?.startsWith('http') ? row.avatar : initialsOf(row.name)),
    };
  }), [raw, profilePhotoUrls]);
  const employees = useMemo(() => (raw?.employees || []).map((row) => {
    const employee = mapEmployee(row);
    return {
      ...employee,
      avatar: profilePhotoUrls[row.avatar] || (row.avatar?.startsWith('http') ? row.avatar : initialsOf(row.name)),
    };
  }), [raw, profilePhotoUrls]);

  const members = useMemo(() => {
    if (!raw?.members) return [];

    const plansByName = {};
    for (const p of plans) plansByName[p.name.toLowerCase()] = p;
    const trainersById = {};
    for (const t of trainers) trainersById[t.id] = t;
    const discountsById = {};
    for (const d of raw.discounts || []) discountsById[d.id] = d;

    // Financials aggregate across ALL invoices (renewals), latest invoice
    // supplies the discount summary shown on member cards.
    const financeByMember = {};
    for (const inv of raw.invoices || []) {
      const f = (financeByMember[inv.member_id] ||= { paid: 0, due: 0, latest: null });
      f.paid += Number(inv.paid_amount) || 0;
      f.due += Number(inv.due_amount) || 0;
      if (!f.latest) f.latest = inv; // invoices load id-desc
    }

    return raw.members.map((row) => {
      const base = mapMemberBase(row);
      const plan = plansByName[String(row.plan || '').toLowerCase()];
      const trainer = row.trainer_id ? trainersById[row.trainer_id] : null;
      const fin = financeByMember[row.id];
      const latestDisc = fin?.latest?.discount_id ? discountsById[fin.latest.discount_id] : null;
      const discountApplied = latestDisc
        ? `${latestDisc.discount_type === 'percentage' ? `${latestDisc.discount_value}%` : `৳${latestDisc.discount_value}`} (${latestDisc.reason_note || 'Discount'})`
        : 'None';

      return {
        ...base,
        name: `${row.first_name} ${row.last_name}`.trim(),
        planId: plan?.id || null,
        avatar: profilePhotoUrls[row.avatar]
          || (row.avatar?.startsWith('http') ? row.avatar : initialsOf(`${row.first_name} ${row.last_name}`)),
        trainer: trainer?.name || 'None',
        balanceDue: fin?.due || 0,
        paidTotal: fin?.paid || 0,
        discountApplied,
      };
    });
  }, [raw, plans, trainers, profilePhotoUrls]);

  const invoices = useMemo(() => {
    if (!raw?.invoices || !raw?.members) return [];
    const membersById = {};
    for (const m of raw.members) membersById[m.id] = m;
    const plansById = {};
    for (const p of raw.plans || []) plansById[p.id] = p;
    const discountsById = {};
    for (const d of raw.discounts || []) discountsById[d.id] = d;
    const paymentsByInvoice = new Map();
    for (const payment of raw.payments || []) {
      if (payment.invoice_id == null) continue;
      const invoiceId = Number(payment.invoice_id);
      const payments = paymentsByInvoice.get(invoiceId) || [];
      payments.push({
        id: payment.id,
        receiptNumber: payment.receipt_number || `PAY-${payment.id}`,
        amount: Number(payment.amount) || 0,
        method: payment.method || '—',
        methodId: payment.method || null,
        reference: payment.transaction_reference || '',
        date: String(payment.payment_date || '').slice(0, 10),
      });
      paymentsByInvoice.set(invoiceId, payments);
    }

    return raw.invoices.map((row) => {
      const m = membersById[row.member_id] || {};
      const plan = row.plan_id ? plansById[row.plan_id] : null;
      const disc = row.discount_id ? discountsById[row.discount_id] : null;
      const durationDays = Number(plan?.duration_days) || 30;
      // Membership start (migration 014); older databases fall back to the invoice date.
      const serviceStart = row.service_start || row.invoice_date;
      return {
        id: row.id,
        number: row.invoice_number,
        memberId: row.member_id,
        memberName: `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Member',
        memberCode: m.member_code || `FLM-${String(row.member_id).padStart(4, '0')}`,
        memberPhone: m.phone || '',
        memberEmail: m.email || '',
        memberAvatar: profilePhotoUrls[m.avatar] || (m.avatar?.startsWith('http') ? m.avatar : null),
        planId: row.plan_id || null,
        planName: plan?.name || m.plan || 'Plan',
        durationMonths: Math.max(1, Math.round(durationDays / 30)),
        startDate: serviceStart,
        endDate: addDays(serviceStart, durationDays), // same rule as members.expiry (start + duration)
        isExtended: Boolean(row.due_extended_at),
        extensionHistory: row.due_extended_at
          ? [{
              originalDueDate: row.original_due_date,
              extendedDueDate: row.due_date,
              reason: row.due_extension_reason || '',
              extendedAt: row.due_extended_at,
              extendedBy: row.due_extended_by_name || '',
            }]
          : [],
        baseAmount: Number(row.base_amount),
        discountType: disc?.discount_type || null,
        discountValue: disc ? Number(disc.discount_value) : null,
        discountAmount: Number(row.discount_amount),
        discountReason: disc?.reason_note || null,
        taxAmount: Number(row.tax_amount),
        netPayable: Number(row.net_payable),
        paidAmount: Number(row.paid_amount),
        dueAmount: Number(row.due_amount),
        status: row.payment_status,
        method: row.payment_method || 'CASH',
        date: row.invoice_date,
        dueDate: row.due_date || null,
        notes: row.notes || '',
        payments: paymentsByInvoice.get(Number(row.id)) || [],
      };
    });
  }, [raw, profilePhotoUrls]);

  const expenses = useMemo(() => (raw?.expenses ? raw.expenses.map((r) => mapExpense(r)) : []), [raw]);

  // Finance state (migration 012). Missing tables load as empty.
  const expenseCategories = useMemo(() => (raw?.expenseCategories || []).map((r) => r.name), [raw]);
  const monthClosings = useMemo(
    () => Object.fromEntries((raw?.monthClosings || []).map((r) => [r.month_key, mapMonthClosing(r)])),
    [raw]
  );
  const periodAdjustments = useMemo(() => {
    const byMonth = {};
    for (const r of raw?.periodAdjustments || []) (byMonth[r.month_key] ||= []).push(mapPeriodAdjustment(r));
    return byMonth;
  }, [raw]);

  const attendance = useMemo(() => {
    if (!raw?.attendance || !raw?.members) return [];
    const membersById = {};
    for (const m of raw.members) membersById[m.id] = m;
    const plansById = {};
    for (const p of raw.plans || []) plansById[p.id] = p;

    return raw.attendance.map((row) => {
      const m = membersById[row.member_id] || {};
      const planName = m.plan || 'Basic';
      return {
        id: row.id,
        memberId: row.member_id,
        memberCode: m.member_code || `FLM-${String(row.member_id).padStart(4, '0')}`,
        name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Member',
        avatar: initialsOf(`${m.first_name} ${m.last_name}`),
        plan: planName,
        expiry: m.expiry ? m.expiry.split('-').slice(1).join('/') : '',
        checkIn: toDisplayTime(row.check_in_time),
        checkInTime: String(row.check_in_time || '').slice(0, 8), // 'HH:MM:SS', for time comparisons
        checkOut: toDisplayTime(row.check_out_time),
        status: row.status,
        date: row.attendance_date,
        method: row.method,
        gender: m.gender || null, // needed by Dashboard's male/female scan cards
      };
    });
  }, [raw]);

  const applications = useMemo(() => {
    if (!raw?.applications) return [];
    return raw.applications.map((r) => {
      const application = mapApplication(r, plans);
      return {
        ...application,
        photo: profilePhotoUrls[r.avatar] || application.photo,
        avatar: r.avatar || null,
      };
    });
  }, [raw, plans, profilePhotoUrls]);

  const smsCampaigns = useMemo(() => (raw?.smsCampaigns ? raw.smsCampaigns.map(mapSmsCampaign) : []), [raw]);

  const jobs = useMemo(() => {
    if (!raw?.jobs) return [];
    const counts = {};
    for (const a of raw.jobApplications || []) counts[a.job_id] = (counts[a.job_id] || 0) + 1;
    return raw.jobs.map((r) => mapJob(r, counts));
  }, [raw]);

  const dietPlans = useMemo(() => (raw?.dietPlans ? raw.dietPlans.map(mapDietPlan) : []), [raw]);
  const workoutPlans = useMemo(() => (raw?.workoutPlans ? raw.workoutPlans.map(mapWorkoutPlan) : []), [raw]);
  const progressLogs = useMemo(() => (raw?.progressLogs ? raw.progressLogs.map(mapProgressLog) : []), [raw]);
  const shopProducts = useMemo(
    () => (raw?.shopProducts ? raw.shopProducts.map(mapShopProduct) : []),
    [raw]
  );

  const smsBalance = smsBalanceOverride ?? 1420;

  // --- Refresh helper ----------------------------------------------------------
  const refresh = useCallback(() => loadAll(), [loadAll]);

  /**
   * Optimistic update pattern: mutate local state immediately (UI stays snappy),
   * fire the DB write, and reload the affected slice (or everything) on success.
   * On DB error (or a thrown/network error) we roll back by reloading from the
   * server and return { error } — a failed write is never reported as success.
   */
  const commit = useCallback(
    async ({ optimistic, persist, reloadAll = false }) => {
      if (optimistic) optimistic();
      let result;
      try {
        result = await persist();
      } catch (e) {
        result = { error: e instanceof Error ? e : new Error(String(e)) };
      }
      if (result?.error) {
        console.error('[GymDataContext] DB write failed, reloading:', result.error.message);
        await loadAll();
        return result;
      }
      if (reloadAll) await loadAll();
      return result;
    },
    [loadAll]
  );

  // --- Branding -----------------------------------------------------------------
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${branding.gymName || 'FitLife'} - Gym Management Admin Panel`;
    }
  }, [branding]);

  const updateBranding = (updates) => {
    const next = { ...branding, ...updates };
    setBranding(next);
    db.upsertAppSetting('branding', next).then(({ error }) => {
      if (error) console.error('[GymDataContext] branding save failed:', error.message);
    });
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
    db.upsertAppSetting('branding', DEFAULT_BRANDING).then(({ error }) => {
      if (error) console.error('[GymDataContext] branding reset failed:', error.message);
    });
  };

  // --- Discount engine (pure, unchanged) ---------------------------------------
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

  // --- Current role -----------------------------------------------------------
  // Comes from the signed-in user's public.users row. These values only drive
  // the UI; the database enforces the same rules (migration 011).
  const currentUserRole = staff?.role?.name || '';
  const canRoleApplyDiscount = () => Boolean(staff?.role?.canApplyDiscount);

  // --- addMember: member + discount + invoice + payment ----------------------
  // One database transaction (create_member_with_invoice RPC). The database
  // recalculates the price from the plan and enforces the role's discount
  // limit, so the amounts shown here are a preview, never the source of truth.
  // Returns { member } on success or { error }.
  const addMember = async ({
    name,
    email,
    phone,
    gender = 'Male',
    planId,
    trainerName = 'None',
    discountType = 'flat',
    discountValue = 0,
    discountReason = '',
    paymentMethod = 'CASH',
    paidAmount = null,
    avatar = null,
    submissionId = null,
    dueDate = null,
    notes = null,
    startDate = null,
  }) => {
    const selectedPlan = activePlans.find((p) => p.id === Number(planId)) || activePlans[0];
    if (!selectedPlan || !raw) return { error: new Error('Select an active membership plan.') };

    const trainer = trainerName && trainerName !== 'None' ? trainers.find((t) => t.name === trainerName) : null;

    const result = await commit({
      persist: () => db.createMemberWithInvoice({
        planId: selectedPlan.id,
        name,
        phone,
        email,
        gender,
        discountType,
        discountValue,
        discountReason: discountReason || 'Discount',
        paidAmount,
        paymentMethod,
        trainerId: trainer?.id,
        avatar,
        submissionId,
        dueDate,
        notes,
        startDate,
      }),
      reloadAll: true,
    });
    if (result?.error) return { error: result.error };

    const row = result.data;
    return {
      member: {
        id: row.member_id,
        code: row.member_code,
        name,
        email,
        phone,
        gender,
        plan: selectedPlan.name,
        planId: selectedPlan.id,
        status: 'Active',
        invoiceNumber: row.invoice_number,
        netPayable: Number(row.net_payable),
        balanceDue: Number(row.due_amount),
        paidTotal: Number(row.paid_amount),
      },
    };
  };

  // --- renewMembership: invoice + payment + new expiry -----------------------
  // One database transaction (renew_membership RPC, migration 015). The
  // database picks the start date when none is given, prices the plan and
  // enforces the discount limit, so nothing is changed locally first: the
  // screens update from the reload. Returns { renewal } on success or { error }.
  const renewMembership = async ({
    memberId,
    planId,
    startDate = null,
    discountType = 'flat',
    discountValue = 0,
    discountReason = '',
    paymentMethod = 'CASH',
    paidAmount = null,
    dueDate = null,
    notes = null,
  }) => {
    if (!raw) return { error: new Error('Data is still loading. Try again in a moment.') };
    if (!activePlans.some((p) => p.id === Number(planId))) {
      return { error: new Error('Select an active membership plan.') };
    }

    const result = await commit({
      persist: () => db.renewMembership({
        memberId,
        planId,
        startDate,
        discountType,
        discountValue,
        discountReason: discountReason || 'Discount',
        paidAmount,
        paymentMethod,
        dueDate,
        notes,
      }),
      reloadAll: true,
    });
    if (result?.error) return { error: result.error };

    const row = result.data;
    return {
      renewal: {
        invoiceId: row.invoice_id,
        invoiceNumber: row.invoice_number,
        startDate: row.start_date,
        expiry: row.expiry,
        netPayable: Number(row.net_payable),
        paidAmount: Number(row.paid_amount),
        dueAmount: Number(row.due_amount),
      },
    };
  };

  // --- Applications --------------------------------------------------------------
  // Approval = addMember with submissionId: the member is created from the
  // submission's details and the submission is marked Approved in the same
  // transaction, so a failed save never leaves an "Approved" application
  // without a member.
  const approveApplication = async ({
    appId,
    planId,
    discountType,
    discountValue,
    discountReason,
    paymentMethod,
    paidAmount,
    dueDate,
    notes,
    startDate,
  }) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return { ok: false, message: 'Application not found (it may already be reviewed).' };

    const { member, error } = await addMember({
      name: app.name,
      email: app.email,
      phone: app.phone,
      gender: app.gender || 'Male',
      planId: planId || app.desiredPlanId,
      discountType: discountType || 'flat',
      discountValue: discountValue || 0,
      discountReason: discountReason || 'Online Application Promo',
      paymentMethod: paymentMethod || 'bKASH',
      paidAmount,
      submissionId: appId,
      dueDate,
      notes,
      startDate,
    });

    if (error) return { ok: false, message: error.message };
    return { ok: true, member, application: app };
  };

  const rejectApplication = async (appId, reason = 'Did not meet criteria') => {
    try {
      const result = await commit({
        optimistic: () =>
          setRaw((prev) =>
            prev
              ? {
                  ...prev,
                  applications: prev.applications.map((a) =>
                    a.id === appId ? { ...a, status: 'Rejected', rejection_reason: reason } : a
                  ),
                }
              : prev
          ),
        persist: () =>
          db.updateApplication(appId, {
            status: 'Rejected',
            reviewed_at: new Date().toISOString(),
            rejection_reason: reason,
          }),
        reloadAll: true,
      });
      // commit() already reloaded (rolled back) on a DB error — report it so the
      // UI can tell the user instead of the application silently staying Pending.
      if (result?.error) return { ok: false, message: result.error.message };
      return { ok: true };
    } catch (err) {
      console.error('[GymDataContext] Reject failed:', err);
      await loadAll();
      return { ok: false, message: err?.message || 'Unexpected error' };
    }
  };

  // --- Attendance --------------------------------------------------------------------
  const checkInMember = async (memberId, method = 'Manual Admin') => {
    const member = members.find((m) => m.id === Number(memberId));
    if (!member || member.id < 0) return;

    const today = todayStr();
    const already = (raw?.attendance || []).some(
      (a) => a.member_id === member.id && a.attendance_date === today && a.status === 'In'
    );
    if (already) {
      alert(`${member.name} is already checked in!`);
      return;
    }

    const timeStr = nowDisplayTime();
    await commit({
      optimistic: () =>
        setRaw((prev) => {
          if (!prev) return prev;
          const tempRow = {
            id: -Date.now(),
            member_id: member.id,
            attendance_date: today,
            check_in_time: timeStr,
            check_out_time: null,
            status: 'In',
            method,
          };
          return { ...prev, attendance: [tempRow, ...(prev.attendance || [])] };
        }),
      persist: () => db.insertAttendance({ memberId: member.id, method, checkInDisplay: timeStr }),
      reloadAll: true,
    });
  };

  const checkOutMember = async (recordId) => {
    const timeStr = nowDisplayTime();
    await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                attendance: prev.attendance.map((a) =>
                  a.id === recordId ? { ...a, status: 'Out', check_out_time: timeStr } : a
                ),
              }
            : prev
        ),
      persist: () => db.updateAttendance(recordId, { checkOutDisplay: timeStr }),
      reloadAll: true,
    });
  };

  // Returns { error } on failure so the form can show the message.
  const updateMemberProfile = async (memberId, fields) => {
    const member = members.find((item) => item.id === Number(memberId));
    if (!member || member.id < 0 || !raw?.members) {
      return { error: new Error('Profile could not be saved because the member record is unavailable.') };
    }
    return commit({
      persist: () => db.updateMemberProfile(member.id, fields),
      reloadAll: true,
    });
  };

  const updateMemberAssignments = async (memberId, assignments) => {
    const member = members.find((item) => item.id === Number(memberId));
    if (!member || member.id < 0 || !raw?.members) {
      return { error: new Error('Assignments could not be saved because the member record is unavailable.') };
    }

    const selectedPlan = plans.find((plan) => plan.id === Number(assignments.planId));
    if (!selectedPlan || (selectedPlan.status !== 'Active' && selectedPlan.id !== member.planId)) {
      return { error: new Error('Select an active membership plan.') };
    }
    const expiryDate = new Date(`${assignments.expiry}T00:00:00`);
    const formattedExpiry = Number.isNaN(expiryDate.getTime())
      ? ''
      : `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}-${String(expiryDate.getDate()).padStart(2, '0')}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(assignments.expiry) || formattedExpiry !== assignments.expiry) {
      return { error: new Error('Enter a valid membership expiry date.') };
    }

    const trainerId = assignments.trainerId ? Number(assignments.trainerId) : null;
    const selectedTrainer = trainerId === null ? null : trainers.find((trainer) => trainer.id === trainerId);
    if (trainerId !== null && (!selectedTrainer || (!selectedTrainer.available && trainerId !== member.trainerId))) {
      return { error: new Error('Select an available trainer.') };
    }

    const nextStatus = member.status === 'Inactive'
      ? 'Inactive'
      : assignments.expiry < todayStr()
      ? 'Expired'
      : assignments.expiry <= addDays(todayStr(), 7)
      ? 'Expiring'
      : 'Active';
    const patch = {
      plan: selectedPlan.name,
      expiry: assignments.expiry,
      status: nextStatus,
      trainer_id: trainerId,
      ...(assignments.avatar ? { avatar: assignments.avatar } : {}),
    };

    return commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.map((row) =>
                  row.id === member.id ? { ...row, ...patch } : row
                ),
              }
            : prev
        ),
      persist: () => db.updateMember(member.id, patch),
      reloadAll: true,
    });
  };

  const bulkCheckIn = (memberIds) => {
    memberIds.forEach((id) => checkInMember(id, 'Bulk Admin Entry'));
  };

  // --- Payments ------------------------------------------------------------------------
  // collect_payment RPC locks the invoice and recalculates paid/due on the
  // server, so two staff collecting at once cannot overpay it. Throws on failure.
  const collectPayment = async ({ invoiceId, amount, method, trxId }) => {
    const amt = Number(amount) || 0;
    const inv = (raw?.invoices || []).find((i) => i.id === invoiceId);
    if (!inv || !raw) throw new Error('Invoice not found. Refresh and try again.');

    const newPaid = Number(inv.paid_amount) + amt;
    const newDue = Math.max(Number(inv.net_payable) - newPaid, 0);
    const status = newDue === 0 ? 'Paid' : 'Partial';

    const result = await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                invoices: prev.invoices.map((i) =>
                  i.id === invoiceId ? { ...i, paid_amount: newPaid, due_amount: newDue, payment_status: status } : i
                ),
              }
            : prev
        ),
      persist: () => db.collectPayment({ invoiceId, amount: amt, method, reference: trxId }),
      reloadAll: true,
    });
    if (result?.error) throw result.error;
    return result.data;
  };

  // One-time rule is enforced by the extend_invoice_due_date RPC (migration 012).
  const extendInvoiceDueDate = ({ invoiceId, newDueDate, reason, authorizedBy }) =>
    commit({
      persist: () => db.extendInvoiceDueDate({ invoiceId, newDueDate, reason, authorizedBy }),
      reloadAll: true,
    });

  // --- Expenses ---------------------------------------------------------------------------
  // Each returns { error } on failure. A closed accounting month is rejected
  // by a database trigger (migration 012).
  const addExpense = (expense) =>
    commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                expenses: [
                  {
                    id: -Date.now(),
                    expense_title: expense.title,
                    category: expense.category,
                    amount: Number(expense.amount) || 0,
                    payment_method: expense.method || 'CASH',
                    expense_date: expense.date || todayStr(),
                    vendor: expense.vendor || null,
                    approval_status: expense.approvalStatus || 'Approved',
                    approved_by_name: expense.approvedBy || null,
                    notes: expense.notes || null,
                  },
                  ...(prev.expenses || []),
                ],
              }
            : prev
        ),
      persist: () => db.insertExpense(expense),
      reloadAll: true,
    });

  const updateExpense = (id, fields) =>
    commit({ persist: () => db.updateExpense(id, fields), reloadAll: true });

  const deleteExpense = (id) =>
    commit({
      optimistic: () =>
        setRaw((prev) => (prev ? { ...prev, expenses: (prev.expenses || []).filter((e) => e.id !== id) } : prev)),
      persist: () => db.deleteExpense(id),
      reloadAll: true,
    });

  const addExpenseCategory = (name) =>
    commit({ persist: () => db.insertExpenseCategory(name), reloadAll: true });

  // --- Monthly closing ------------------------------------------------------------------
  const closeMonth = ({ monthKey, closedByName, notes, summary }) =>
    commit({ persist: () => db.insertMonthClosing({ monthKey, closedByName, notes, summary }), reloadAll: true });

  const addPeriodAdjustment = (adjustment) =>
    commit({ persist: () => db.insertPeriodAdjustment(adjustment), reloadAll: true });

  // --- SMS --------------------------------------------------------------------------------------
  const sendSMS = async ({ title, recipientType, message }) => {
    if (!raw) return false;
    const count =
      recipientType === 'All Members'
        ? members.length
        : recipientType === 'Active Only'
        ? members.filter((m) => m.status === 'Active').length
        : 12;

    if (smsBalance < count) {
      alert('Insufficient SMS balance!');
      return false;
    }

    const result = await commit({
      optimistic: () => {
        setSmsBalanceOverride((prev) => Math.max((prev ?? smsBalance) - count, 0));
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                smsCampaigns: [
                  {
                    id: -Date.now(),
                    title,
                    recipient_type: recipientType,
                    message,
                    recipient_count: count,
                    cost_credits: count,
                    status: 'Sent',
                    sent_at: new Date().toISOString(),
                  },
                  ...(prev.smsCampaigns || []),
                ],
              }
            : prev
        );
      },
      persist: async () => {
        const settingsRow = (raw.smsSettings || [])[0];
        const insert = await db.insertSmsCampaign({ title, recipientType, message, count });
        if (insert.error) return insert;
        if (settingsRow) {
          return db.decrementSmsBalance(settingsRow.id, count, smsBalance);
        }
        return insert;
      },
      reloadAll: true,
    });

    return !result?.error;
  };

  // --- Roles ---------------------------------------------------------------------------------------
  const updateRolePermission = async (roleId, field, value) => {
    const fieldMap = {
      canApplyDiscount: 'can_apply_discount',
      maxDiscountPercent: 'max_discount_percentage',
      canApproveMembers: 'can_approve_members',
      canManageLockers: 'can_manage_lockers',
      canManageFinances: 'can_manage_finances',
      description: 'description',
    };
    const dbField = fieldMap[field];
    if (!dbField) return;

    await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                roles: prev.roles.map((r) => (r.id === roleId ? { ...r, [dbField]: value } : r)),
              }
            : prev
        ),
      persist: () => db.updateRole(roleId, { [dbField]: value }),
      reloadAll: true,
    });
  };

  // --- AI plans / progress ---------------------------------------------------------------------------
  const saveDietPlan = async (newPlan) => {
    await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                dietPlans: [
                  { ...newPlan, meals_json: newPlan },
                  ...(prev.dietPlans || []),
                ],
              }
            : prev
        ),
      persist: () =>
        db.insertDietPlan({
          memberId: newPlan.memberId,
          clientName: newPlan.clientName,
          goal: newPlan.goal,
          record: newPlan,
          preference: newPlan.profile?.dietPreference,
        }),
      reloadAll: true,
    });
  };

  const deleteDietPlan = async (planId) => {
    await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev ? { ...prev, dietPlans: (prev.dietPlans || []).filter((p) => p.id !== planId) } : prev
        ),
      persist: () => db.deleteDietPlan(planId),
      reloadAll: true,
    });
  };

  const assignDietPlan = async (planId, memberId) => {
    const plan = (raw?.dietPlans || []).find((item) => item.id === Number(planId));
    const member = members.find((item) => item.id === Number(memberId));
    if (!plan || !member) return { error: new Error('Select a valid member and diet plan.') };
    if (Number(plan.member_id) === member.id) return { data: plan, error: null };
    if (plan.member_id != null) {
      return commit({
        persist: () => db.duplicateDietPlan(plan, member.id, member.name),
        reloadAll: true,
      });
    }

    return commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                dietPlans: (prev.dietPlans || []).map((item) =>
                  item.id === plan.id
                    ? { ...item, member_id: member.id, plan_title: member.name }
                    : item
                ),
              }
            : prev
        ),
      persist: () => db.assignDietPlan(plan.id, member.id, member.name),
      reloadAll: true,
    });
  };

  const saveWorkoutPlan = async (newProgram) => {
    const goal = newProgram?.program?.goal || newProgram?.program?.metadata?.goal || 'General Fitness';
    const experience =
      newProgram?.program?.experience || newProgram?.program?.metadata?.experience || 'Intermediate';
    const daysPerWeek =
      newProgram?.program?.trainingDaysPerWeek || newProgram?.program?.metadata?.daysPerWeek || 4;

    await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? { ...prev, workoutPlans: [{ ...newProgram, routine_json: newProgram }, ...(prev.workoutPlans || [])] }
            : prev
        ),
      persist: () =>
        db.insertWorkoutPlan({
          memberId: newProgram.memberId,
          clientName: newProgram.clientName,
          goal,
          record: newProgram,
          experience,
          daysPerWeek,
        }),
      reloadAll: true,
    });
  };

  const deleteWorkoutPlan = async (programId) => {
    await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev ? { ...prev, workoutPlans: (prev.workoutPlans || []).filter((p) => p.id !== programId) } : prev
        ),
      persist: () => db.deleteWorkoutPlan(programId),
      reloadAll: true,
    });
  };

  const assignWorkoutPlan = async (planId, memberId) => {
    const plan = (raw?.workoutPlans || []).find((item) => item.id === Number(planId));
    const member = members.find((item) => item.id === Number(memberId));
    if (!plan || !member) return { error: new Error('Select a valid member and workout plan.') };
    if (Number(plan.member_id) === member.id) return { data: plan, error: null };
    if (plan.member_id != null) {
      return commit({
        persist: () => db.duplicateWorkoutPlan(plan, member.id, member.name),
        reloadAll: true,
      });
    }

    return commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                workoutPlans: (prev.workoutPlans || []).map((item) =>
                  item.id === plan.id
                    ? { ...item, member_id: member.id, plan_title: member.name }
                    : item
                ),
              }
            : prev
        ),
      persist: () => db.assignWorkoutPlan(plan.id, member.id, member.name),
      reloadAll: true,
    });
  };

  const logMemberProgress = async (entry) => {
    const optimisticEntry = { ...entry, id: -Date.now(), timestamp: new Date().toISOString() };
    await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev ? { ...prev, progressLogs: [optimisticEntry, ...(prev.progressLogs || [])] } : prev
        ),
      persist: () => db.insertProgressLog({ memberId: entry.memberId, record: entry }),
      reloadAll: true,
    });
    return optimisticEntry;
  };

  // --- Coffee Shop menu / stock---------------------------------------------------------
  const saveShopProduct = async (product) => {
    const isEdit = Number(product?.id) > 0;
    const optimisticRow = shopProductToRow(product);
    if (isEdit) optimisticRow.id = product.id;
    else optimisticRow.id = -Date.now();

    return commit({
      optimistic: () =>
        setRaw((prev) => {
          if (!prev) return prev;
          const list = prev.shopProducts || [];
          return {
            ...prev,
            shopProducts: isEdit
              ? list.map((p) => (p.id === product.id ? { ...p, ...optimisticRow } : p))
              : [optimisticRow, ...list],
          };
        }),
      persist: () =>
        isEdit
          ? db.updateShopProduct(product.id, product)
          : db.insertShopProduct(product),
      reloadAll: true,
    });
  };

  const deleteShopProduct = async (productId) => {
    return commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? { ...prev, shopProducts: (prev.shopProducts || []).filter((p) => p.id !== productId) }
            : prev
        ),
      persist: () => db.deleteShopProduct(productId),
      reloadAll: true,
    });
  };

  const fetchShopOrders = useCallback(async () => {
    const { data, error } = await db.fetchShopOrders();
    if (error) throw error;
    return data || [];
  }, []);

  const updateShopOrderStatus = useCallback(async (id, status) => {
    const { data, error } = await db.updateShopOrderStatus(id, status);
    if (error) throw error;
    return data;
  }, []);

  // --- Analytics ---------------------------------------------------------------
  // Titles on Dashboard.jsx: "TOTAL ACTIVE" / "TODAY CHECK-INS" / "TODAY COLLECTED"
  // / "MONTHLY REVENUE" — computed against real dates, no mock inflation.
  const stats = useMemo(() => {
    const today = todayStr();
    const active = members.filter((m) => m.status === 'Active').length;
    const expired = members.filter((m) => m.status === 'Expired').length;
    const expiring = members.filter((m) => m.status === 'Expiring').length;
    return {
      activeMembers: active,
      expiredMembers: expired,
      checkIns: attendance.filter((a) => a.date === today).length,
      trainersCount: trainers.length,
      employeesCount: employees.length,
      expiringSoon: expiring,
    };
  }, [members, attendance, trainers, employees]);

  // Yesterday's check-ins up to the current clock time, so a day in progress is
  // compared fairly. Recalculated whenever the data reloads.
  const checkinsByNowYesterday = (list, today) => {
    const now = new Date();
    const nowTime = [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
    const yesterday = addDays(today, -1);
    return {
      yesterdayCheckinsByNow: list.filter((a) => a.date === yesterday && a.checkInTime && a.checkInTime <= nowTime).length,
      checkinsComparedAt: nowTime.slice(0, 5),
    };
  };

  const analytics = useMemo(() => {
    const today = todayStr();
    const month = today.slice(0, 7);
    const activeMale = members.filter((m) => m.status === 'Active' && m.gender === 'Male').length;
    const activeFemale = members.filter((m) => m.status === 'Active' && m.gender === 'Female').length;

    const todayAttendance = attendance.filter((a) => a.date === today);
    const monthInvoices = invoices.filter((inv) => String(inv.date).slice(0, 7) === month);
    const todayInvoices = invoices.filter((inv) => inv.date === today);
    const sum = (list, key) => list.reduce((s, x) => s + (x[key] || 0), 0);
    // Collected = money received on that day/month (payment date), whatever
    // the invoice date: a due paid today counts today.
    const payments = invoices.flatMap((inv) => inv.payments || []);

    // Same days of last month (1st up to today's day number, capped at the
    // month's length), so a month in progress is compared fairly.
    const [y, m, d] = today.split('-').map(Number);
    const lastMonthDays = new Date(y, m - 1, 0).getDate();
    const lastMonthKey = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`;
    const lastMonthUntil = `${lastMonthKey}-${String(Math.min(d, lastMonthDays)).padStart(2, '0')}`;
    const sameDayLastMonth = lastMonthUntil;

    // There is no history of members.status, so "active on a date" comes from
    // invoices: a member counts if one of their invoices covers that day
    // (service start up to and including the expiry day, as members.expiry).
    const activeOn = (date) => new Set(
      invoices
        .filter((inv) => inv.startDate && inv.startDate <= date && date <= inv.endDate)
        .map((inv) => inv.memberId)
    ).size;

    return {
      activeMale,
      activeFemale,
      todayMaleCheckins: todayAttendance.filter((a) => a.gender === 'Male').length,
      todayFemaleCheckins: todayAttendance.filter((a) => a.gender === 'Female').length,
      todayCollected: sum(payments.filter((p) => p.date === today), 'amount'),
      todayDue: sum(todayInvoices, 'dueAmount'),
      monthlyCollected: sum(payments.filter((p) => String(p.date).slice(0, 7) === month), 'amount'),
      lastMonthCollectedSameDays: sum(
        payments.filter((p) => p.date >= `${lastMonthKey}-01` && p.date <= lastMonthUntil),
        'amount'
      ),
      lastMonthUntil,
      ...checkinsByNowYesterday(attendance, today),
      activeByInvoicesToday: activeOn(today),
      activeByInvoicesLastMonth: activeOn(sameDayLastMonth),
      sameDayLastMonth,
      monthlyDue: sum(monthInvoices, 'dueAmount'),
      expiringTodayCount: members.filter((m) => m.expiry === today || m.status === 'Expiring').length,
    };
  }, [members, attendance, invoices]);

  const pendingApprovals = useMemo(() => applications.filter((a) => a.status === 'Pending'), [applications]);

  const getAnalytics = () => {
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === 'Active').length;
    const inactiveMembers = members.filter((m) => m.status === 'Inactive' || m.status === 'Expired').length;
    const pendingApps = applications.filter((a) => a.status === 'Pending').length;
    const month = todayStr().slice(0, 7);
    const monthlySalesTotal = invoices
      .filter((inv) => String(inv.date).slice(0, 7) === month)
      .reduce((sum, inv) => sum + inv.netPayable, 0);
    const monthlyExpenseTotal = expenses
      .filter((exp) => String(exp.date).slice(0, 7) === month)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const newAdmissionsMonth = members.filter((m) => {
      const ym = String(m.joined || '').slice(0, 7);
      const nowYm = todayStr().slice(0, 7);
      return ym === nowYm;
    }).length;
    const expiringTodayCount = members.filter((m) => m.expiry === todayStr() || m.status === 'Expiring').length;
    const todayAttendance = attendance.filter((a) => a.date === todayStr());
    const presentNow = todayAttendance.filter((a) => a.status === 'In').length;
    const checkedOutToday = todayAttendance.filter((a) => a.status === 'Out').length;

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      pendingApps,
      totalPlans: plans.length,
      totalEmployees: employees.length + trainers.length,
      remainingSms: smsBalance,
      monthlySalesTotal,
      todaySalesInvoice: invoices.filter((inv) => inv.date === todayStr()).reduce((s, inv) => s + inv.netPayable, 0),
      todaySalesPayment: invoices.filter((inv) => inv.date === todayStr()).reduce((s, inv) => s + inv.paidAmount, 0),
      monthlyExpenseTotal,
      newAdmissionsMonth,
      expiringTodayCount,
      presentNow,
      checkedOutToday,
      totalDailyCheckIns: todayAttendance.length,
    };
  };

  return (
    <GymDataContext.Provider
      value={{
        branding,
        updateBranding,
        resetBranding,
        members,
        applications,
        pendingApprovals,
        plans,
        activePlans,
        trainers,
        employees,
        invoices,
        expenses,
        attendance,
        roles,
        smsCampaigns,
        smsBalance,
        jobs,
        dietPlans,
        saveDietPlan,
        deleteDietPlan,
        assignDietPlan,
        workoutPlans,
        saveWorkoutPlan,
        deleteWorkoutPlan,
        assignWorkoutPlan,
        progressLogs,
        logMemberProgress,
        shopProducts,
        saveShopProduct,
        deleteShopProduct,
        fetchShopOrders,
        updateShopOrderStatus,
        stats,
        analytics,
        currentUserRole,
        calculatePricing,
        canRoleApplyDiscount,
        addMember,
        renewMembership,
        approveApplication,
        rejectApplication,
        checkInMember,
        checkOutMember,
        updateMemberProfile,
        updateMemberAssignments,
        bulkCheckIn,
        collectPayment,
        extendInvoiceDueDate,
        addExpense,
        updateExpense,
        deleteExpense,
        expenseCategories,
        addExpenseCategory,
        monthClosings,
        closeMonth,
        periodAdjustments,
        addPeriodAdjustment,
        sendSMS,
        updateRolePermission,
        getAnalytics,
        refresh,
        loading: raw === null,
        loadErrors,
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
