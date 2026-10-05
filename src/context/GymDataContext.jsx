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
  generateInvoiceNumber,
  mapPlan,
  mapRole,
  mapTrainer,
  mapEmployee,
  mapLocker,
  mapApplication,
  mapMemberBase,
  mapExpense,
  mapSmsCampaign,
  mapAd,
  mapJob,
  mapDietPlan,
  mapWorkoutPlan,
  mapProgressLog,
  mapShopProduct,
  FALLBACK_DATA,
} from '../lib/supabaseData';
import { resolveProfilePhotoUrls } from '../lib/profilePhotos';

const GymDataContext = createContext();

export const DEFAULT_BRANDING = {
  gymName: 'FitLife',
  tagline: 'ENTERPRISE GYM',
  logoUrl: '',
  logoIcon: 'Flame',
  heroTagline: 'TRAIN HARD. LIVE STRONG.',
  heroSub: 'YOUR FITNESS. YOUR JOURNEY.',
  phone: '+880 1711-223344',
  email: 'contact@fitlife.com',
  address: 'Plot 42, Gulshan Avenue, Dhaka, Bangladesh',
};

/**
 * Fallback seeds shown while the DB loads and when a table is unreachable.
 * Plans/roles carry schema-matching seeds so admission & RBAC still work;
 * transactional slices start empty — the DB is the source of truth.
 */
const INITIAL_DATA = { ...FALLBACK_DATA };

export function GymDataProvider({ children }) {
  const { user } = useAuth();

  // --- Raw DB rows -----------------------------------------------------------
  const [raw, setRaw] = useState(null); // null = still loading
  const [loadError, setLoadError] = useState(null);
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

    if (Object.keys(errors).length > 0 && errors.plans && errors.members) {
      setLoadError('Could not reach Supabase. Showing cached sample data — check VITE_SUPABASE_URL / keys.');
    } else {
      setLoadError(null);
    }

    // Branding from app_settings
    const brandingRow = (data.appSettings || []).find((r) => r.key === 'branding');
    if (brandingRow?.value) {
      setBranding((prev) => ({ ...prev, ...brandingRow.value }));
    }

    // SMS balance from sms_settings
    const smsRow = (data.smsSettings || [])[0];
    if (smsRow) setSmsBalanceOverride(smsRow.remaining_balance ?? 0);

    setRaw(data);
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
    if (!raw?.plans) return INITIAL_DATA.plans;
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
    if (!raw?.roles) return INITIAL_DATA.roles;
    const counts = {};
    for (const u of raw.users || []) {
      if (u.role_id) counts[u.role_id] = (counts[u.role_id] || 0) + 1;
    }
    return raw.roles.map((r) => mapRole(r, counts));
  }, [raw]);

  const trainers = useMemo(() => (raw?.trainers
    ? raw.trainers.map((row) => {
      const trainer = mapTrainer(row);
      return {
        ...trainer,
        avatar: profilePhotoUrls[row.avatar] || (row.avatar?.startsWith('http') ? row.avatar : initialsOf(row.name)),
      };
    })
    : INITIAL_DATA.trainers), [raw, profilePhotoUrls]);
  const employees = useMemo(() => (raw?.employees
    ? raw.employees.map((row) => {
      const employee = mapEmployee(row);
      return {
        ...employee,
        avatar: profilePhotoUrls[row.avatar] || (row.avatar?.startsWith('http') ? row.avatar : initialsOf(row.name)),
      };
    })
    : INITIAL_DATA.employees), [raw, profilePhotoUrls]);

  const lockers = useMemo(() => {
    if (!raw?.lockers) return INITIAL_DATA.lockers;
    // Active assignments give locker -> member display values
    const active = (raw.lockerAssignments || []).filter((a) => a.status === 'Active');
    const byLocker = {};
    for (const a of active) byLocker[a.locker_id] = a;
    const membersById = {};
    for (const m of raw.members || []) membersById[m.id] = m;

    return raw.lockers.map((row) => {
      const mapped = mapLocker(row);
      const assignment = byLocker[row.id];
      if (assignment && row.status === 'Occupied') {
        const m = membersById[assignment.member_id];
        mapped.assignedTo = m ? `${m.first_name} ${m.last_name}`.trim() : `Member #${assignment.member_id}`;
        mapped.memberCode = m?.member_code || null;
        mapped.expiryDate = assignment.expiry_date;
      }
      return mapped;
    });
  }, [raw]);

  const members = useMemo(() => {
    if (!raw?.members) return INITIAL_DATA.members;

    const plansByName = {};
    for (const p of plans) plansByName[p.name.toLowerCase()] = p;
    const trainersById = {};
    for (const t of trainers) trainersById[t.id] = t;
    const lockersById = {};
    for (const l of lockers) lockersById[l.id] = l;
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
      const locker = row.locker_id ? lockersById[row.locker_id] : null;
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
        lockerNumber: locker?.number || 'None',
        balanceDue: fin?.due || 0,
        paidTotal: fin?.paid || 0,
        discountApplied,
      };
    });
  }, [raw, plans, trainers, lockers, profilePhotoUrls]);

  const invoices = useMemo(() => {
    if (!raw?.invoices || !raw?.members) return INITIAL_DATA.invoices;
    const membersById = {};
    for (const m of raw.members) membersById[m.id] = m;
    const plansById = {};
    for (const p of raw.plans || []) plansById[p.id] = p;
    const discountsById = {};
    for (const d of raw.discounts || []) discountsById[d.id] = d;

    return raw.invoices.map((row) => {
      const m = membersById[row.member_id] || {};
      const plan = row.plan_id ? plansById[row.plan_id] : null;
      const disc = row.discount_id ? discountsById[row.discount_id] : null;
      return {
        id: row.id,
        number: row.invoice_number,
        memberId: row.member_id,
        memberName: `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Member',
        memberCode: m.member_code || `FLM-${String(row.member_id).padStart(4, '0')}`,
        planName: plan?.name || m.plan || 'Plan',
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
      };
    });
  }, [raw]);

  const expenses = useMemo(() => (raw?.expenses ? raw.expenses.map((r) => mapExpense(r)) : INITIAL_DATA.expenses), [raw]);

  const attendance = useMemo(() => {
    if (!raw?.attendance || !raw?.members) return INITIAL_DATA.attendance;
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
        checkOut: toDisplayTime(row.check_out_time),
        status: row.status,
        date: row.attendance_date,
        method: row.method,
        gender: m.gender || null, // needed by Dashboard's male/female scan cards
      };
    });
  }, [raw]);

  const applications = useMemo(() => {
    if (!raw?.applications) return INITIAL_DATA.applications;
    return raw.applications.map((r) => {
      const application = mapApplication(r, plans);
      return {
        ...application,
        photo: profilePhotoUrls[r.avatar] || application.photo,
        avatar: r.avatar || null,
      };
    });
  }, [raw, plans, profilePhotoUrls]);

  const smsCampaigns = useMemo(() => (raw?.smsCampaigns ? raw.smsCampaigns.map(mapSmsCampaign) : INITIAL_DATA.smsCampaigns), [raw]);
  const ads = useMemo(() => (raw?.ads ? raw.ads.map(mapAd) : INITIAL_DATA.ads), [raw]);

  const jobs = useMemo(() => {
    if (!raw?.jobs) return INITIAL_DATA.jobs;
    const counts = {};
    for (const a of raw.jobApplications || []) counts[a.job_id] = (counts[a.job_id] || 0) + 1;
    return raw.jobs.map((r) => mapJob(r, counts));
  }, [raw]);

  const dietPlans = useMemo(() => (raw?.dietPlans ? raw.dietPlans.map(mapDietPlan) : []), [raw]);
  const workoutPlans = useMemo(() => (raw?.workoutPlans ? raw.workoutPlans.map(mapWorkoutPlan) : []), [raw]);
  const progressLogs = useMemo(() => (raw?.progressLogs ? raw.progressLogs.map(mapProgressLog) : []), [raw]);
  const shopProducts = useMemo(
    () => (raw?.shopProducts ? raw.shopProducts.map(mapShopProduct) : INITIAL_DATA.shopProducts),
    [raw]
  );

  const smsBalance = smsBalanceOverride ?? 1420;

  // --- Refresh helper ----------------------------------------------------------
  const refresh = useCallback(() => loadAll(), [loadAll]);

  /**
   * Optimistic update pattern: mutate local state immediately (UI stays snappy),
   * fire the DB write, and reload the affected slice (or everything) on success.
   * On DB error we roll back by reloading from the server.
   */
  const commit = useCallback(
    async ({ optimistic, persist, reloadAll = false }) => {
      if (optimistic) optimistic();
      const result = await persist();
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
  const ADMIN_ROLE_NAME = 'Super Admin';
  const [currentUserRole, setCurrentRole] = useState(ADMIN_ROLE_NAME);

  const setCurrentUserRole = (role) => {
    if (role === ADMIN_ROLE_NAME) {
      setCurrentRole(role);
    }
  };

  const canRoleApplyDiscount = () => currentUserRole === ADMIN_ROLE_NAME;

  // --- addMember: creates member + discount + invoice (+ optional locker) ------
  const addMember = async ({
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
    avatar = null,
  }) => {
    const selectedPlan = activePlans.find((p) => p.id === Number(planId)) || activePlans[0];
    if (!selectedPlan || !raw) return null;

    const pricing = calculatePricing({
      basePrice: selectedPlan.price,
      discountType,
      discountValue,
      vatPercent: 0,
    });

    const actualPaid = paidAmount !== null && paidAmount !== undefined ? Number(paidAmount) : pricing.netPayable;
    const due = Math.max(pricing.netPayable - actualPaid, 0);
    const joined = todayStr();
    const expiry = addDays(joined, selectedPlan.durationDays || 30);

    const trainer = trainerName && trainerName !== 'None' ? trainers.find((t) => t.name === trainerName) : null;
    const locker = lockerNumber && lockerNumber !== 'None' ? lockers.find((l) => l.number === lockerNumber) : null;

    const tempId = -Date.now();
    const optimisticMember = {
      id: tempId,
      code: 'FLM-…',
      name,
      email,
      phone,
      gender,
      plan: selectedPlan.name,
      planId: selectedPlan.id,
      joined,
      expiry,
      status: 'Active',
      visits: 0,
      avatar: avatar || initialsOf(name),
      trainer: trainerName,
      lockerNumber: lockerNumber || 'None',
      balanceDue: due,
      paidTotal: actualPaid,
      discountApplied: 'None',
    };

    const result = await commit({
      optimistic: () => {
        setRaw((prev) => (prev ? {
          ...prev,
          members: [{
            id: tempId,
            first_name: name,
            last_name: '',
            avatar,
            member_code: 'FLM-…',
          }, ...prev.members],
        } : prev));
      },
      persist: async () => {
        // 1. member
        const { data: memberRow, error: memberErr } = await db.insertMember({
          name,
          email,
          phone,
          gender,
          planName: selectedPlan.name,
          avatar,
          trainerId: trainer?.id,
          lockerId: locker?.id,
          joined,
          expiry,
        });
        if (memberErr) return { error: memberErr };

        // 2. discount (only when one was applied)
        let discountId = null;
        if (pricing.discountAmount > 0) {
          const { data: disc, error: discErr } = await db.insertDiscount({
            discountType,
            discountValue,
            discountAmount: pricing.discountAmount,
            reason: discountReason || 'Discount',
          });
          if (discErr) return { error: discErr };
          discountId = disc.id;
        }

        // 3. invoice
        const { error: invErr } = await db.insertInvoice({
          invoice_number: generateInvoiceNumber(),
          member_id: memberRow.id,
          plan_id: selectedPlan.id,
          discount_id: discountId,
          base_amount: pricing.basePrice,
          discount_amount: pricing.discountAmount,
          tax_amount: pricing.taxAmount,
          net_payable: pricing.netPayable,
          paid_amount: actualPaid,
          due_amount: due,
          payment_status: due === 0 ? 'Paid' : actualPaid > 0 ? 'Partial' : 'Due',
          payment_method: paymentMethod,
          invoice_date: joined,
        });
        if (invErr) return { error: invErr };

        // 4. locker occupancy
        if (locker) {
          await db.updateLocker(locker.id, { status: 'Occupied' });
          await db.insertLockerAssignment({ lockerId: locker.id, memberId: memberRow.id, expiryDate: expiry });
        }

        return { data: memberRow };
      },
      reloadAll: true,
    });

    return result?.error ? null : optimisticMember;
  };

  // --- Applications --------------------------------------------------------------
  const approveApplication = async ({ appId, planId, discountType, discountValue, discountReason, paymentMethod }) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return { ok: false, message: 'Application not found (it may already be reviewed).' };

    const created = await addMember({
      name: app.name,
      email: app.email,
      phone: app.phone,
      gender: app.gender,
      avatar: app.avatar,
      planId: planId || app.desiredPlanId || 1,
      discountType: discountType || 'flat',
      discountValue: discountValue || 0,
      discountReason: discountReason || 'Online Application Promo',
      paymentMethod: paymentMethod || 'bKASH',
    });

    // Don't mark Approved unless the member + invoice actually persisted —
    // otherwise the application would show approved with no member record.
    if (!created) return { ok: false, message: 'Member/invoice records could not be saved — see the browser console.' };

    const { error: approveErr } = await db.updateApplication(appId, {
      status: 'Approved',
      reviewed_at: new Date().toISOString(),
    });
    if (approveErr) {
      // Surface the failure instead of silently leaving the row Pending.
      console.error('[GymDataContext] Could not mark application Approved:', approveErr.message);
      await loadAll();
      return { ok: false, message: approveErr.message };
    }
    await loadAll();
    return { ok: true };
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

  const bulkCheckIn = (memberIds) => {
    memberIds.forEach((id) => checkInMember(id, 'Bulk Admin Entry'));
  };

  // --- Payments ------------------------------------------------------------------------
  const collectPayment = async ({ invoiceId, amount, method, trxId }) => {
    const amt = Number(amount) || 0;
    const inv = (raw?.invoices || []).find((i) => i.id === invoiceId);
    if (!inv || !raw) return;

    const newPaid = Number(inv.paid_amount) + amt;
    const newDue = Math.max(Number(inv.net_payable) - newPaid, 0);
    const status = newDue === 0 ? 'Paid' : 'Partial';

    await commit({
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
      persist: async () => {
        const upd = await db.updateInvoice(invoiceId, {
          paid_amount: newPaid,
          due_amount: newDue,
          payment_status: status,
        });
        if (upd.error) return upd;
        return db.insertPayment({
          invoice_id: invoiceId,
          member_id: inv.member_id,
          plan: 'Membership',
          amount: amt,
          method: method || 'CASH',
          status: 'Paid',
          transaction_reference: trxId || null,
        });
      },
      reloadAll: true,
    });
  };

  // --- Expenses ---------------------------------------------------------------------------
  const addExpense = async ({ title, category, amount, method, notes }) => {
    await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                expenses: [
                  {
                    id: -Date.now(),
                    expense_title: title,
                    category,
                    amount: Number(amount) || 0,
                    payment_method: method || 'CASH',
                    expense_date: todayStr(),
                    notes: notes || null,
                  },
                  ...(prev.expenses || []),
                ],
              }
            : prev
        ),
      persist: () => db.insertExpense({ title, category, amount, method, notes }),
      reloadAll: true,
    });
  };

  // --- Lockers -------------------------------------------------------------------------------
  const assignLocker = async ({ lockerId, memberId, expiryDate }) => {
    const member = members.find((m) => m.id === Number(memberId));
    if (!member || member.id < 0 || !raw) return;

    const expiry = expiryDate || addDays(todayStr(), 30);

    await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                lockers: prev.lockers.map((l) =>
                  l.id === Number(lockerId) ? { ...l, status: 'Occupied' } : l
                ),
                members: prev.members.map((m) =>
                  m.id === member.id ? { ...m, locker_id: Number(lockerId) } : m
                ),
                lockerAssignments: [
                  ...(prev.lockerAssignments || []),
                  { locker_id: Number(lockerId), member_id: member.id, expiry_date: expiry, status: 'Active' },
                ],
              }
            : prev
        ),
      persist: async () => {
        const upd = await db.updateLocker(Number(lockerId), { status: 'Occupied' });
        if (upd.error) return upd;
        const memberUpd = await db.updateMember(member.id, { locker_id: Number(lockerId) });
        if (memberUpd.error) return memberUpd;
        return db.insertLockerAssignment({ lockerId: Number(lockerId), memberId: member.id, expiryDate: expiry });
      },
      reloadAll: true,
    });
  };

  const releaseLocker = async (lockerId) => {
    await commit({
      optimistic: () =>
        setRaw((prev) =>
          prev
            ? {
                ...prev,
                lockers: prev.lockers.map((l) =>
                  l.id === Number(lockerId) ? { ...l, status: 'Available' } : l
                ),
                lockerAssignments: (prev.lockerAssignments || []).map((a) =>
                  a.locker_id === Number(lockerId) && a.status === 'Active'
                    ? { ...a, status: 'Released' }
                    : a
                ),
              }
            : prev
        ),
      persist: async () => {
        const upd = await db.updateLocker(Number(lockerId), { status: 'Available' });
        if (upd.error) return upd;
        return db.updateLockerAssignment(Number(lockerId), { status: 'Released' });
      },
      reloadAll: true,
    });
  };

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

  // --- Gym Shop inventory ------------------------------------------------------------
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

  const analytics = useMemo(() => {
    const today = todayStr();
    const month = today.slice(0, 7);
    const activeMale = members.filter((m) => m.status === 'Active' && m.gender === 'Male').length;
    const activeFemale = members.filter((m) => m.status === 'Active' && m.gender === 'Female').length;

    const todayAttendance = attendance.filter((a) => a.date === today);
    const monthInvoices = invoices.filter((inv) => String(inv.date).slice(0, 7) === month);
    const todayInvoices = invoices.filter((inv) => inv.date === today);
    const sum = (list, key) => list.reduce((s, x) => s + (x[key] || 0), 0);

    return {
      activeMale,
      activeFemale,
      todayMaleCheckins: todayAttendance.filter((a) => a.gender === 'Male').length,
      todayFemaleCheckins: todayAttendance.filter((a) => a.gender === 'Female').length,
      todayCollected: sum(todayInvoices, 'paidAmount'),
      todayDue: sum(todayInvoices, 'dueAmount'),
      monthlyCollected: sum(monthInvoices, 'paidAmount'),
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
        dietPlans,
        saveDietPlan,
        deleteDietPlan,
        workoutPlans,
        saveWorkoutPlan,
        deleteWorkoutPlan,
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
        refresh,
        loading: raw === null,
        loadError,
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
