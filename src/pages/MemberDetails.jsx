import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  CreditCard,
  Receipt,
  Calendar,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Lock,
  Dumbbell,
  Utensils,
  Award,
  Droplets,
  Phone,
  Mail,
  Printer,
  Plus,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useFinance } from '../context/FinanceContext';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';
import { formatBDT, formatDatePretty, calculateDaysOverdue } from '../utils/financeCalculators';
import { addDays, toDbTime } from '../lib/supabaseData';
import RecordPaymentModal from '../components/finance/modals/RecordPaymentModal';
import ExtendDueDateModal from '../components/finance/modals/ExtendDueDateModal';
import InvoiceViewModal from '../components/finance/modals/InvoiceViewModal';
import RenewMembershipModal from '../components/RenewMembershipModal';

export default function MemberDetails() {
  const { id } = useParams();
  const { members, plans, attendance, workoutPlans, dietPlans, checkInMember, updateMemberProfile, loading } = useGymData();
  const { invoices, today: demoDate } = useFinance();

  // Active Tab state
  const [activeTab, setActiveTab] = useState('profile');

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState(null);

  const [checkInNotice, setCheckInNotice] = useState('');

  // 1. Resolve Member Profile (database members only; null = not found)
  const member = useMemo(() => {
    // Match by numeric ID or member code (FLM-000123, etc.)
    const key = String(id || '').toLowerCase();
    const found = (members || []).find(
      (m) => String(m.id) === String(id) || String(m.code || '').toLowerCase() === key
    );
    return found || null;
  }, [members, id]);

  // 2. Member Invoices from the database (newest first; payments are attached per invoice)
  const memberInvoices = useMemo(() => {
    if (!member) return [];
    return (invoices || []).filter((inv) => inv.memberId === member.id);
  }, [invoices, member]);

  // Aggregate Member Financial Stats
  const { totalInvoiced, totalPaid, totalDue, activeDueInvoice, isOverdue, daysOverdue } = useMemo(() => {
    let invoiced = 0;
    let paid = 0;
    let due = 0;
    let dueInv = null;

    memberInvoices.forEach((inv) => {
      invoiced += Number(inv.netPayable) || 0;
      paid += Number(inv.paidAmount) || 0;
      const currentDue = Number(inv.dueAmount) || 0;
      due += currentDue;
      if (currentDue > 0 && !dueInv) {
        dueInv = inv;
      }
    });

    const activeInv = dueInv || memberInvoices[0] || null;
    let overdueFlag = false;
    let days = 0;

    if (activeInv && activeInv.dueAmount > 0 && activeInv.dueDate) {
      days = calculateDaysOverdue(activeInv.dueDate, activeInv.dueAmount, demoDate);
      overdueFlag = days > 0;
    }

    return {
      totalInvoiced: invoiced,
      totalPaid: paid,
      totalDue: due,
      activeDueInvoice: activeInv,
      isOverdue: overdueFlag,
      daysOverdue: days,
    };
  }, [memberInvoices, demoDate]);

  // Aggregate All Payment Collections for this member
  const memberPayments = useMemo(() => {
    const list = [];
    memberInvoices.forEach((inv) => {
      if (Array.isArray(inv.payments)) {
        inv.payments.forEach((p) => {
          list.push({
            ...p,
            invoiceNumber: inv.number,
            packageName: inv.planName,
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [memberInvoices]);

  // Subscriptions data
  const subscriptions = useMemo(() => {
    if (!member) return [];
    // One subscription per invoice (admission or renewal), newest first.
    // The newest one uses the member's own expiry, which approval sets from the
    // chosen start date; older ones use the invoice's dates.
    return memberInvoices.map((inv, idx) => {
      const plan = (plans || []).find((p) => p.id === inv.planId);
      const days = Number(plan?.durationDays) || inv.durationMonths * 30;
      const isCurrent = idx === 0;
      return {
        id: inv.id,
        packageName: inv.planName,
        duration: `${days} Days`,
        startDate: isCurrent && member.expiry ? addDays(member.expiry, -days) : inv.startDate,
        expiryDate: isCurrent && member.expiry ? member.expiry : inv.endDate,
        price: inv.netPayable,
        paidAmount: inv.paidAmount,
        dueAmount: inv.dueAmount,
        dueDate: inv.dueDate,
        status: isCurrent ? member.status : 'Completed',
        includedFeatures: plan?.features || [],
      };
    });
  }, [member, memberInvoices, plans]);

  // Attendance from the database (newest first). Duration in minutes is
  // null while the member is still in the gym.
  const attendanceLogs = useMemo(() => {
    if (!member) return [];
    const toMinutes = (display) => {
      const t = toDbTime(display);
      return t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : null;
    };
    return (attendance || [])
      .filter((a) => a.memberId === member.id)
      .map((a) => {
        const inMin = toMinutes(a.checkIn);
        const outMin = toMinutes(a.checkOut);
        const minutes = inMin !== null && outMin !== null && outMin >= inMin ? outMin - inMin : null;
        return { ...a, minutes };
      })
      .sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1));
  }, [attendance, member]);

  const attendanceStats = useMemo(() => {
    // Streak: consecutive days with a visit, counting back from today
    // (or from yesterday if they haven't come in yet today).
    const days = new Set(attendanceLogs.map((a) => a.date));
    let cursor = days.has(demoDate) ? demoDate : addDays(demoDate, -1);
    let streak = 0;
    while (days.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    const timed = attendanceLogs.filter((a) => a.minutes !== null);
    const avgMinutes = timed.length
      ? Math.round(timed.reduce((s, a) => s + a.minutes, 0) / timed.length)
      : null;
    const inGymNow = attendanceLogs.some((a) => a.date === demoDate && a.status === 'In');
    return { streak, avgMinutes, inGymNow };
  }, [attendanceLogs, demoDate]);

  const formatMinutes = (m) => (m === null ? '—' : `${Math.floor(m / 60)}h ${m % 60}m`);

  // Workout Routine: the member's newest saved plan from the AI Workout page
  const workoutPlan = useMemo(() => {
    if (!member) return null;
    const saved = (workoutPlans || []).find((p) => p.memberId === member.id);
    if (!saved) return null;
    const program = saved.program || {};
    const splits = program.splits || [];
    const asSets = (v) => (typeof v === 'number' ? `${v} Sets` : v || '—');
    return {
      title: program.title || 'Workout Plan',
      goal: program.goal || '—',
      experience: program.experience || '—',
      daysPerWeek: program.trainingDaysPerWeek || splits.length,
      createdAt: saved.dateGenerated,
      notes: program.progressionRule || '',
      schedule: splits.map((s) => ({
        day: s.day,
        exercises: (s.exercises || []).map((ex) => ({
          name: ex.name,
          sets: asSets(ex.sets),
          reps: ex.reps || '—',
          weight: ex.targetWeight || '—',
        })),
      })),
    };
  }, [member, workoutPlans]);

  // Diet Plan: the member's newest saved plan from the Diet Plans page
  const dietPlan = useMemo(() => {
    if (!member) return null;
    const saved = (dietPlans || []).find((p) => p.memberId === member.id);
    if (!saved) return null;
    const calc = saved.calculations || {};
    const water = calc.waterTarget;
    const round = (v) => Math.round(Number(v) || 0);
    return {
      title: saved.goal ? `${saved.goal} Diet Plan` : 'Diet Plan',
      createdAt: saved.dateGenerated,
      preference: saved.profile?.dietPreference || '—',
      waterIntake: water ? `${water.litersMin} - ${water.litersMax} L daily` : '—',
      dailyCalories: round(calc.targetCalories ?? calc.tdee ?? calc.calories),
      macros: {
        proteinGrams: round(calc.proteinGrams ?? calc.protein?.grams),
        carbsGrams: round(calc.carbGrams ?? calc.carbs?.grams),
        fatsGrams: round(calc.fatGrams ?? calc.fat?.grams),
      },
      meals: (saved.meals || []).map((m) => {
        const items = m.items || [];
        return {
          mealName: m.time ? `${m.mealName} (${m.time})` : m.mealName,
          items: items.map((it) => (it.servingDesc ? `${it.name} (${it.servingDesc})` : it.name)),
          calories: round(items.reduce((s, it) => s + (Number(it.calories) || 0), 0)),
          protein: round(items.reduce((s, it) => s + (Number(it.protein) || 0), 0)),
        };
      }),
    };
  }, [member, dietPlans]);

  // Check-In Handler
  // Saves an attendance row; the list above updates from GymDataContext.
  const handleCheckInToday = async () => {
    if (attendanceStats.inGymNow) return;
    await checkInMember(member.id);
    setCheckInNotice(`${member.name} checked in for today (${formatDatePretty(demoDate)}).`);
    setTimeout(() => setCheckInNotice(''), 4500);
  };

  // Profile Edit Form State (only fields that have a column in `members`)
  const profileFormFrom = (m) => ({
    name: m?.name || '',
    phone: m?.phone || '',
    email: m?.email || '',
    address: m?.address || '',
    height: m?.height ?? '',
    weight: m?.weight ?? '',
    emergencyName: m?.emergencyContact?.name || '',
    emergencyPhone: m?.emergencyContact?.phone || '',
  });
  const [editForm, setEditForm] = useState(() => profileFormFrom(member));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const handleOpenEdit = () => {
    setEditForm(profileFormFrom(member));
    setProfileError('');
    setIsEditProfileOpen(true);
  };

  // Saves to the database; the page re-renders from GymDataContext after reload.
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError('');
    const result = await updateMemberProfile(member.id, editForm);
    setIsSavingProfile(false);
    if (result?.error) {
      setProfileError(result.error.message || 'Could not save the profile. Please try again.');
      return;
    }
    setIsEditProfileOpen(false);
    setCheckInNotice('Member profile saved.');
    setTimeout(() => setCheckInNotice(''), 4000);
  };

  if (!member) {
    return (
      <div className="page">
        <Link to="/members" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Members
        </Link>
        <p style={{ marginTop: '20px' }}>{loading ? 'Loading member…' : 'Member not found.'}</p>
      </div>
    );
  }

  const age = member.dob
    ? Math.floor((new Date(demoDate) - new Date(member.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Determine extension state for active invoice
  const isInvoiceExtended = Boolean(activeDueInvoice?.isExtended);

  return (
    <div className="page">
      {/* Toast / Notification Bar */}
      {checkInNotice && (
        <div
          role="status"
          style={{
            padding: '12px 18px',
            marginBottom: '16px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{checkInNotice}</span>
        </div>
      )}

      {/* TOP BREADCRUMB & BACK */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Link
          to="/members"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} /> Back to Members Directory
        </Link>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Reference Date: <strong style={{ color: 'var(--text-main)' }}>{formatDatePretty(demoDate)}</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HEADER: Member Summary Card with 80px Avatar, Badges & Quick Action Buttons */}
      {/* ========================================================================= */}
      <div
        className="activity-card"
        style={{
          padding: '24px',
          marginBottom: '20px',
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          {/* Avatar + Main Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 400px' }}>
            <Avatar
              src={member.avatar}
              name={member.name}
              size={80}
              shape="rounded"
              style={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '3px solid var(--bg-surface)',
                outline: isOverdue ? '2px solid var(--danger)' : '2px solid rgba(255,255,255,0.1)',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {member.name}
                </h1>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    background: 'rgba(255, 107, 0, 0.12)',
                    color: 'var(--primary)',
                  }}
                >
                  {member.code}
                </span>
                {member.customId && (
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    ID: {member.customId}
                  </span>
                )}
                <span
                  className={`badge ${
                    member.status === 'Active'
                      ? 'badge-success'
                      : member.status === 'Expiring'
                      ? 'badge-warning'
                      : 'badge-danger'
                  }`}
                >
                  {member.status}
                </span>
              </div>

              {/* Sub-line metadata */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '8px',
                  flexWrap: 'wrap',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} style={{ color: 'var(--primary)' }} />
                  {member.phone}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={13} />
                  {member.email}
                </span>
                <span>
                  Plan: <strong style={{ color: 'var(--text-main)' }}>{member.plan}</strong>
                </span>
                <span>
                  Expires: <strong style={{ color: 'var(--text-main)' }}>{formatDatePretty(member.expiry)}</strong>
                </span>
              </div>

              {/* Outstanding Due Badge */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {totalDue > 0 ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: isOverdue ? 'rgba(239, 68, 68, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                      border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                      color: isOverdue ? 'var(--danger)' : '#F59E0B',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    {isOverdue ? <ShieldAlert size={16} /> : <AlertCircle size={16} />}
                    <span>
                      {formatBDT(totalDue)} Due — Due Date: {formatDatePretty(activeDueInvoice?.dueDate)}
                      {isOverdue && ` (${daysOverdue} days overdue)`}
                    </span>
                    {isInvoiceExtended && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.1)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Lock size={10} /> Extended (Locked)
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10B981',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>No Outstanding Dues · Fully Paid</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Group */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleOpenEdit}
              title="Update member personal info"
            >
              <Pencil size={14} /> Edit Profile
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('subscriptions')}
              title="View all subscription packages"
            >
              <CreditCard size={14} /> View Subscriptions
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsRenewModalOpen(true)}
              title="Assign or renew membership package"
            >
              <RefreshCw size={14} /> Assign / Renew
            </button>

            {totalDue > 0 ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsPaymentModalOpen(true)}
                title="Record payment against outstanding dues"
              >
                <Plus size={14} /> Record Payment
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('invoices')}
                title="View invoice history"
              >
                <Receipt size={14} /> View Invoices
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCheckInToday}
              disabled={attendanceStats.inGymNow}
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              title="Log check-in for today"
            >
              <CheckCircle2 size={14} /> {attendanceStats.inGymNow ? 'In Gym Now' : 'Check In Today'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 10 RESPONSIVE TABS NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {[
          { key: 'profile', label: 'Profile', icon: User },
          { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
          { key: 'payments', label: 'Payment Collections', icon: Award, badge: memberPayments.length },
          { key: 'invoices', label: 'Invoices', icon: Receipt, badge: memberInvoices.length },
          { key: 'installments', label: 'Installment Schedule', icon: Calendar, badge: totalDue > 0 ? 'Due' : null, badgeColor: totalDue > 0 ? 'var(--danger)' : null },
          { key: 'attendance', label: 'Attendance', icon: Clock, badge: `${attendanceLogs.length} logs` },
          { key: 'features', label: 'Features & Perks', icon: Award },
          { key: 'workout', label: 'Workout Plan', icon: Dumbbell },
          { key: 'diet', label: 'Diet Plan', icon: Utensils },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                border: 'none',
                background: isActive ? 'var(--primary)' : 'var(--bg-surface)',
                color: isActive ? 'var(--primary-text)' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 8px var(--primary-glow)' : 'none',
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(0,0,0,0.25)' : tab.badgeColor ? 'rgba(239, 68, 68, 0.15)' : 'var(--border-color)',
                    color: isActive ? '#fff' : tab.badgeColor || 'var(--text-main)',
                    fontWeight: 700,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Personal Information Grid */}
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Personal Information</h3>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleOpenEdit}>
                <Pencil size={13} /> Edit Information
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '18px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Member Code</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>{member.code}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Custom / Branch ID</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.customId || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Full Name</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{member.name}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Phone Number</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.phone}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Email Address</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.email || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Gender</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.gender || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Date of Birth</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.dob ? `${formatDatePretty(member.dob)} (Age: ${age})` : '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Registration Date</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{formatDatePretty(member.joined)}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Height & Weight</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.height ? `${member.height} cm` : '—'} · {member.weight ? `${member.weight} kg` : '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>RFID Access Card</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#10B981' }}>{member.rfidCard || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Assigned Coach</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.trainer || 'None'}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Residential Address</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{member.address || '—'}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Medical & Health Background</span>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {member.medical || member.notes || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact Card */}
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldCheck size={18} style={{ color: '#10B981' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Emergency Contact</h3>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Contact Person</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>
                  {member.emergencyContact?.name || '—'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Relationship</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  {member.emergencyContact?.relation || '—'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Emergency Phone</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
                  {member.emergencyContact?.phone || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBSCRIPTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'subscriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Subscription Hero Card */}
          <div
            className="activity-card"
            style={{
              padding: '24px',
              borderRadius: '12px',
              borderLeft: '4px solid var(--primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                    {subscriptions[0]?.packageName || 'No subscription yet'}
                  </h3>
                  {subscriptions[0] && (
                    <span className={`badge ${subscriptions[0].status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{subscriptions[0].status}</span>
                  )}
                </div>
                {subscriptions[0] && (
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Valid from <strong>{formatDatePretty(subscriptions[0].startDate)}</strong> to <strong>{formatDatePretty(subscriptions[0].expiryDate)}</strong> ({subscriptions[0].duration})
                  </p>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsRenewModalOpen(true)}
              >
                <RefreshCw size={14} /> Assign / Renew Subscription
              </button>
            </div>

            {/* Financial Status Breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--bg-subtle, rgba(255,255,255,0.03))',
                marginBottom: '18px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Package Price</span>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{formatBDT(subscriptions[0]?.price || 0)}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Paid</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981' }}>{formatBDT(subscriptions[0]?.paidAmount || 0)}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Outstanding Due</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: subscriptions[0]?.dueAmount > 0 ? 'var(--danger)' : '#10B981' }}>
                  {formatBDT(subscriptions[0]?.dueAmount || 0)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due Clearance Deadline</span>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '3px' }}>
                  {formatDatePretty(subscriptions[0]?.dueDate)}
                </div>
              </div>
            </div>

            {/* Included Features */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Included Features & Perks:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {(subscriptions[0]?.includedFeatures || []).length === 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No features listed for this plan.</span>
                )}
                {(subscriptions[0]?.includedFeatures || []).map((feat, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      background: 'rgba(255, 107, 0, 0.1)',
                      color: 'var(--text-main)',
                      border: '1px solid rgba(255, 107, 0, 0.2)',
                    }}
                  >
                    ✓ {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Subscription History Ledger */}
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>Subscription History</h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Package Name</th>
                    <th>Duration</th>
                    <th>Start Date</th>
                    <th>Expiry Date</th>
                    <th>Price</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No subscriptions for this member yet.
                      </td>
                    </tr>
                  )}
                  {subscriptions.map((sub, idx) => (
                    <tr key={sub.id || idx}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{sub.packageName}</td>
                      <td>{sub.duration}</td>
                      <td>{formatDatePretty(sub.startDate)}</td>
                      <td>{formatDatePretty(sub.expiryDate)}</td>
                      <td style={{ fontWeight: 700 }}>{formatBDT(sub.price)}</td>
                      <td style={{ color: '#10B981', fontWeight: 600 }}>{formatBDT(sub.paidAmount)}</td>
                      <td style={{ color: sub.dueAmount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                        {formatBDT(sub.dueAmount)}
                      </td>
                      <td>
                        <span className={`badge ${sub.status === 'Active' ? 'badge-success' : 'badge-secondary'}`}>
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYMENT COLLECTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metrics summary */}
          <div className="dashboard-metrics-grid">
            <div className="stat-widget">
              <span className="stat-widget-title">Total Invoiced</span>
              <div className="stat-widget-value">{formatBDT(totalInvoiced)}</div>
              <div className="stat-widget-sub">Lifetime package value</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Total Collected</span>
              <div className="stat-widget-value" style={{ color: '#10B981' }}>{formatBDT(totalPaid)}</div>
              <div className="stat-widget-sub">Verified receipts ({memberPayments.length})</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Outstanding Balance</span>
              <div className="stat-widget-value" style={{ color: totalDue > 0 ? 'var(--danger)' : '#10B981' }}>
                {formatBDT(totalDue)}
              </div>
              <div className="stat-widget-sub">
                {totalDue > 0 ? `Due: ${formatDatePretty(activeDueInvoice?.dueDate)}` : 'All accounts settled'}
              </div>
            </div>
          </div>

          {/* Payment Receipts Ledger */}
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Payment Receipts & Collections</h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  All historical cash, bKash, and digital payments collected from this member.
                </p>
              </div>

              {totalDue > 0 && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <Plus size={14} /> Record New Payment
                </button>
              )}
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Amount (BDT)</th>
                    <th>Payment Channel</th>
                    <th>Reference / Trx ID</th>
                    <th>Collected By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {memberPayments.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No payment collection records found for this member.
                      </td>
                    </tr>
                  ) : (
                    memberPayments.map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.receiptNumber}</td>
                        <td>{formatDatePretty(p.date)}</td>
                        <td style={{ fontWeight: 800, color: '#10B981', fontSize: '14px' }}>
                          {formatBDT(p.amount)}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background:
                                p.method === 'bKash'
                                  ? 'rgba(236, 72, 153, 0.15)'
                                  : p.method === 'Nagad'
                                  ? 'rgba(249, 115, 22, 0.15)'
                                  : 'rgba(59, 130, 246, 0.15)',
                              color:
                                p.method === 'bKash'
                                  ? '#EC4899'
                                  : p.method === 'Nagad'
                                  ? '#F97316'
                                  : '#3B82F6',
                            }}
                          >
                            {p.method}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.reference}</td>
                        <td style={{ fontSize: '13px' }}>{p.collectedBy || '—'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INVOICES */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Billing Invoices & Invoicing Ledger</h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  View, audit, print, and download PDF tax invoices.
                </p>
              </div>

              {totalDue > 0 && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  <Plus size={14} /> Record Payment
                </button>
              )}
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Issue Date</th>
                    <th>Package Plan</th>
                    <th>Base Price</th>
                    <th>Discount</th>
                    <th>Net Payable</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memberInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.number}</td>
                      <td>{formatDatePretty(inv.date || inv.startDate)}</td>
                      <td>{inv.planName}</td>
                      <td>{formatBDT(inv.baseAmount)}</td>
                      <td>
                        {inv.discountAmount > 0 ? (
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                            - {formatBDT(inv.discountAmount)}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td style={{ fontWeight: 800 }}>{formatBDT(inv.netPayable)}</td>
                      <td style={{ color: '#10B981', fontWeight: 700 }}>{formatBDT(inv.paidAmount)}</td>
                      <td style={{ color: inv.dueAmount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 800 }}>
                        {formatBDT(inv.dueAmount)}
                      </td>
                      <td style={{ fontSize: '12px' }}>{formatDatePretty(inv.dueDate)}</td>
                      <td>
                        <span
                          className={`badge ${
                            inv.status === 'Paid'
                              ? 'badge-success'
                              : inv.status === 'Partially Paid'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedInvoiceForView(inv)}
                            title="View / Print Tax Invoice"
                          >
                            <Printer size={13} /> View
                          </button>
                          {inv.dueAmount > 0 && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => setIsPaymentModalOpen(true)}
                              title="Pay this invoice"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INSTALLMENT SCHEDULE & DUE CLEARANCE */}
      {/* ========================================================================= */}
      {activeTab === 'installments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Due Status & Extension Banner */}
          <div
            className="activity-card"
            style={{
              padding: '24px',
              borderRadius: '12px',
              borderLeft: `4px solid ${totalDue > 0 ? 'var(--danger)' : '#10B981'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                    Installment Milestone Schedule
                  </h3>
                  {totalDue > 0 ? (
                    <span className="badge badge-warning">Active Installment Plan</span>
                  ) : (
                    <span className="badge badge-success">Fully Cleared</span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Total Package: <strong>{formatBDT(totalInvoiced)}</strong> · Paid: <strong>{formatBDT(totalPaid)}</strong> · Remaining: <strong style={{ color: totalDue > 0 ? 'var(--danger)' : '#10B981' }}>{formatBDT(totalDue)}</strong>
                </p>
              </div>

              {totalDue > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={isInvoiceExtended}
                    onClick={() => setIsExtendModalOpen(true)}
                    title={isInvoiceExtended ? 'One-time extension limit reached' : 'Request one-time extension'}
                  >
                    {isInvoiceExtended ? <Lock size={14} /> : <Calendar size={14} />}
                    {isInvoiceExtended ? 'Extension Already Used' : 'Extend Due Date'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    <Plus size={14} /> Pay Due Now
                  </button>
                </div>
              )}
            </div>

            {/* Extension Audit Alert Box */}
            {isInvoiceExtended && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Lock size={16} style={{ color: '#3B82F6', flexShrink: 0 }} />
                <div>
                  <strong>One-Time Extension Policy Active:</strong> Due date was extended to{' '}
                  <strong>{formatDatePretty(activeDueInvoice?.dueDate)}</strong>. Only 1 extension is permitted per invoice; further extensions are locked.
                </div>
              </div>
            )}
          </div>

          {/* Installment Milestone Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Paid installments = real payments on the current invoice (oldest first) */}
            {(activeDueInvoice?.payments || []).map((p, idx) => (
              <div
                key={p.id}
                className="activity-card"
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  borderTop: '3px solid #10B981',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Installment {idx + 1}{idx === 0 ? ' (Admission)' : ''}</span>
                  <span className="badge badge-success">Paid</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>
                  {formatBDT(p.amount)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <div>Paid Date: <strong>{formatDatePretty(p.date)}</strong></div>
                  <div>Payment Method: <strong>{p.method}</strong></div>
                  <div>Receipt: <strong>{p.receiptNumber}</strong></div>
                </div>
              </div>
            ))}

            {!activeDueInvoice && (
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>No invoices for this member yet.</p>
            )}

            {/* Remaining due on the current invoice */}
            {totalDue > 0 && (
            <div
              className="activity-card"
              style={{
                padding: '20px',
                borderRadius: '12px',
                borderTop: `3px solid ${totalDue > 0 ? (isOverdue ? 'var(--danger)' : '#F59E0B') : '#10B981'}`,
                background: totalDue > 0 && isOverdue ? 'rgba(239, 68, 68, 0.04)' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Remaining Due</span>
                <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-warning'}`}>
                  {isOverdue ? `${daysOverdue}d Overdue` : 'Due'}
                </span>
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: totalDue > 0 ? 'var(--danger)' : '#10B981',
                  marginBottom: '8px',
                }}
              >
                {formatBDT(activeDueInvoice.dueAmount)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <div>
                  Due Clearance Deadline:{' '}
                  <strong style={{ color: totalDue > 0 ? 'var(--text-main)' : undefined }}>
                    {formatDatePretty(activeDueInvoice?.dueDate)}
                  </strong>
                </div>
                <div>Status: <strong>{totalDue > 0 ? (isOverdue ? 'Overdue - Notice Sent' : 'Upcoming Milestone') : 'Cleared & Settled'}</strong></div>
                <div>
                  Extension Status:{' '}
                  <strong>{isInvoiceExtended ? 'Used (1-time policy locked)' : 'Available (1 time)'}</strong>
                </div>
              </div>

              {totalDue > 0 && (
                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    Pay {formatBDT(activeDueInvoice.dueAmount)} Now
                  </button>
                  {!isInvoiceExtended && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsExtendModalOpen(true)}
                    >
                      Extend
                    </button>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ATTENDANCE */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Attendance telemetry summary */}
          <div className="dashboard-metrics-grid">
            <div className="stat-widget">
              <span className="stat-widget-title">Total Visits</span>
              <div className="stat-widget-value" style={{ color: '#10B981' }}>
                {attendanceLogs.length} Sessions
              </div>
              <div className="stat-widget-sub">All recorded check-ins</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Check-in Streak</span>
              <div className="stat-widget-value" style={{ color: 'var(--primary)' }}>
                {attendanceStats.streak} {attendanceStats.streak === 1 ? 'Day' : 'Days'}
              </div>
              <div className="stat-widget-sub">Consecutive days with a visit</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Average Session Duration</span>
              <div className="stat-widget-value">{formatMinutes(attendanceStats.avgMinutes)}</div>
              <div className="stat-widget-sub">Visits with a check-out time</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Latest Check-in</span>
              <div className="stat-widget-value" style={{ fontSize: '16px', marginTop: '6px' }}>
                {attendanceLogs[0]?.checkIn || '—'}
              </div>
              <div className="stat-widget-sub">{formatDatePretty(attendanceLogs[0]?.date)}</div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Attendance History</h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Every check-in and check-out recorded for this member.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCheckInToday}
                disabled={attendanceStats.inGymNow}
              >
                <CheckCircle2 size={14} /> {attendanceStats.inGymNow ? 'In Gym Now' : 'Check In Today'}
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In Time</th>
                    <th>Check Out Time</th>
                    <th>Duration</th>
                    <th>Verification Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No visits recorded yet.
                      </td>
                    </tr>
                  )}
                  {attendanceLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{formatDatePretty(log.date)}</td>
                      <td style={{ color: '#10B981', fontWeight: 700 }}>{log.checkIn}</td>
                      <td>{log.checkOut || (log.status === 'In' ? 'In gym' : '—')}</td>
                      <td style={{ fontWeight: 600 }}>{formatMinutes(log.minutes)}</td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {log.method}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${log.status === 'Out' ? 'badge-success' : 'badge-warning'}`}>
                          {log.status === 'Out' ? 'Completed' : 'In Gym'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: FEATURES & PERKS */}
      {/* ========================================================================= */}
      {activeTab === 'features' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                Membership Privileges & Active Perks
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Features entitled to this member under their {member.plan} package.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
              }}
            >
              {[
                { title: 'Gym Floor & Cardio Suite Access', desc: 'Unlimited peak and off-peak entry to all strength, barbell, and cardio zones.', badge: 'Unlimited', icon: Dumbbell },
                { title: 'Steam & Sauna Privileges', desc: 'Complimentary weekend hydrotherapy, infrared sauna, and eucalyptus steam room access.', badge: 'Included', icon: Droplets },
                { title: 'Trainer Review & Bi-weekly Check-in', desc: `Assigned coach: ${member.trainer || 'None'}. Includes form check and weight adjustments.`, badge: 'Bi-Weekly', icon: User },
                { title: 'InBody 770 Body Composition Scans', desc: 'Monthly medical-grade impedance body fat, visceral fat, and muscle mass report.', badge: '1x / Month', icon: Activity },
                { title: 'Combat & Functional Turf Zone', desc: 'Heavy bag suite, sled pushes, battle ropes, and kettlebell conditioning zone access.', badge: 'All Batches', icon: Flame },
                { title: 'Juice Bar & Supplement Discounts', desc: '10% discount on all pre-workouts, whey isolates, and fresh protein shakes at reception.', badge: '10% Off', icon: Utensils },
                { title: 'Complimentary Guest Day-Passes', desc: 'Invite friends or family members for free guest workout sessions.', badge: '2 Passes Left', icon: Award },
              ].map((perk, i) => {
                const Icon = perk.icon;
                return (
                  <div
                    key={i}
                    style={{
                      padding: '18px',
                      borderRadius: '10px',
                      background: 'var(--bg-subtle, rgba(255,255,255,0.03))',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon size={16} style={{ color: 'var(--primary)' }} />
                          <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{perk.title}</strong>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: 'rgba(255, 107, 0, 0.15)',
                            color: 'var(--primary)',
                          }}
                        >
                          {perk.badge}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {perk.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: WORKOUT PLAN */}
      {/* ========================================================================= */}
      {activeTab === 'workout' && !workoutPlan && (
          <div className="activity-card" style={{ padding: '40px 24px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 14px', color: 'var(--text-muted)' }}>No workout plan saved for this member yet.</p>
            <Link to="/ai-workouts" className="btn btn-primary btn-sm">Create Workout Plan</Link>
          </div>
      )}

      {activeTab === 'workout' && workoutPlan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Dumbbell size={20} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{workoutPlan.title}</h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Created: <strong>{formatDatePretty(workoutPlan.createdAt)}</strong> · Coach: <strong>{member.trainer || 'None'}</strong> · Goal: <strong>{workoutPlan.goal}</strong> · Experience: <strong>{workoutPlan.experience}</strong> · <strong>{workoutPlan.daysPerWeek} Days / Week</strong>
                </p>
              </div>

              <Link to="/ai-workouts" className="btn btn-secondary btn-sm">
                <Pencil size={13} /> New Routine
              </Link>
            </div>

            {workoutPlan.notes && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255, 107, 0, 0.08)',
                  border: '1px solid rgba(255, 107, 0, 0.2)',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                <strong>Progression Rule:</strong> {workoutPlan.notes}
              </div>
            )}

            {/* Split Schedule by Day */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {workoutPlan.schedule.map((split, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 18px',
                      background: 'var(--bg-subtle, rgba(255,255,255,0.04))',
                      fontWeight: 800,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <ChevronRight size={16} style={{ color: 'var(--primary)' }} />
                    <span>{split.day}</span>
                  </div>

                  <div className="table-responsive">
                    <table className="custom-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Exercise Name</th>
                          <th>Sets</th>
                          <th>Repetitions</th>
                          <th>Target Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {split.exercises.map((ex, exIdx) => (
                          <tr key={exIdx}>
                            <td style={{ color: 'var(--text-muted)', width: '40px' }}>{exIdx + 1}</td>
                            <td style={{ fontWeight: 700 }}>{ex.name}</td>
                            <td>{ex.sets}</td>
                            <td>{ex.reps}</td>
                            <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{ex.weight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: DIET PLAN */}
      {/* ========================================================================= */}
      {activeTab === 'diet' && !dietPlan && (
          <div className="activity-card" style={{ padding: '40px 24px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 14px', color: 'var(--text-muted)' }}>No diet plan saved for this member yet.</p>
            <Link to="/diet-plans" className="btn btn-primary btn-sm">Create Diet Plan</Link>
          </div>
      )}

      {activeTab === 'diet' && dietPlan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Utensils size={20} style={{ color: '#10B981' }} />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{dietPlan.title}</h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Created: <strong>{formatDatePretty(dietPlan.createdAt)}</strong> · Water Intake: <strong>{dietPlan.waterIntake}</strong> · Preference: <strong>{dietPlan.preference}</strong>
                </p>
              </div>

              <Link to="/diet-plans" className="btn btn-secondary btn-sm">
                <Pencil size={13} /> New Diet Plan
              </Link>
            </div>

            {/* Macro Targets Banner */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--bg-subtle, rgba(255,255,255,0.03))',
                marginBottom: '20px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Energy Target</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                  {dietPlan.dailyCalories} kcal
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Protein</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#10B981' }}>
                  {dietPlan.macros?.proteinGrams}g
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Carbohydrates</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#3B82F6' }}>
                  {dietPlan.macros?.carbsGrams}g
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Healthy Fats</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B' }}>
                  {dietPlan.macros?.fatsGrams}g
                </div>
              </div>
            </div>

            {/* Meal by Meal Schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {dietPlan.meals.map((meal, mIdx) => (
                <div
                  key={mIdx}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '10px',
                    background: 'var(--bg-subtle, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>{meal.mealName}</strong>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{meal.calories} kcal</span>
                      <span style={{ color: '#10B981', fontWeight: 700 }}>{meal.protein}g protein</span>
                    </div>
                  </div>

                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {meal.items.map((it, itIdx) => (
                      <li key={itIdx}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT PROFILE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Member Information"
        subtitle={`${member.name} (${member.code})`}
        icon={Pencil}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditProfileOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="edit-member-form" className="btn btn-primary" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form id="edit-member-form" onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {profileError && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '13px' }}>
              {profileError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <label className="form-group">
              <span className="form-label">Full Name *</span>
              <input
                className="form-input"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Phone Number *</span>
              <input
                className="form-input"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Email Address</span>
              <input
                className="form-input"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Height (cm)</span>
              <input
                className="form-input"
                type="number"
                min="50"
                max="250"
                step="0.1"
                value={editForm.height}
                onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Weight (kg)</span>
              <input
                className="form-input"
                type="number"
                min="20"
                max="300"
                step="0.1"
                value={editForm.weight}
                onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
              />
            </label>
          </div>

          <label className="form-group">
            <span className="form-label">Residential Address</span>
            <input
              className="form-input"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </label>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
              Emergency Contact Information
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <label className="form-group">
                <span className="form-label">Contact Name</span>
                <input
                  className="form-input"
                  value={editForm.emergencyName}
                  onChange={(e) => setEditForm({ ...editForm, emergencyName: e.target.value })}
                />
              </label>
              <label className="form-group">
                <span className="form-label">Emergency Phone</span>
                <input
                  className="form-input"
                  value={editForm.emergencyPhone}
                  onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })}
                />
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN / RENEW SUBSCRIPTION */}
      {/* ========================================================================= */}
      <RenewMembershipModal
        member={member}
        memberInvoices={memberInvoices}
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        onRenewed={(r) => {
          setCheckInNotice(
            `Renewed: ${r.planName} until ${formatDatePretty(r.expiry)} (${r.invoiceNumber}).` +
              (r.dueAmount > 0 ? ` ${formatBDT(r.dueAmount)} left to pay.` : '')
          );
          setTimeout(() => setCheckInNotice(''), 6000);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD PAYMENT MODAL (Integrated with FinanceContext) */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && activeDueInvoice && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoice={activeDueInvoice}
          onPaymentSuccess={(newPay, updatedInv) => {
            setCheckInNotice(`Payment of ${formatBDT(newPay.amount)} recorded successfully via ${newPay.method}.`);
            setTimeout(() => setCheckInNotice(''), 4500);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ONE-TIME EXTEND DUE DATE MODAL (Enforces strict 1-time policy) */}
      {/* ========================================================================= */}
      {isExtendModalOpen && activeDueInvoice && (
        <ExtendDueDateModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          dueRecord={activeDueInvoice}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: INVOICE VIEW / PRINT MODAL */}
      {/* ========================================================================= */}
      {selectedInvoiceForView && (
        <InvoiceViewModal
          isOpen={Boolean(selectedInvoiceForView)}
          onClose={() => setSelectedInvoiceForView(null)}
          invoice={selectedInvoiceForView}
        />
      )}
    </div>
  );
}
