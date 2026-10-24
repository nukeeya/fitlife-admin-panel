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
import {
  MOCK_MEMBERS,
  MOCK_SUBSCRIPTION_HISTORY,
  MOCK_ATTENDANCE_LOGS,
  MOCK_WORKOUT_ROUTINES,
  MOCK_DIET_PLANS,
} from '../data/mockProfiles';
import RecordPaymentModal from '../components/finance/modals/RecordPaymentModal';
import ExtendDueDateModal from '../components/finance/modals/ExtendDueDateModal';
import InvoiceViewModal from '../components/finance/modals/InvoiceViewModal';

export default function MemberDetails() {
  const { id } = useParams();
  const { members, checkInMember } = useGymData();
  const { invoices, today: demoDate } = useFinance();

  // Active Tab state
  const [activeTab, setActiveTab] = useState('profile');

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState(null);

  // Local optimistic state for profile updates
  const [localProfile, setLocalProfile] = useState(null);
  const [checkInNotice, setCheckInNotice] = useState('');
  const [localAttendance, setLocalAttendance] = useState(null);
  const [localSubscriptions, setLocalSubscriptions] = useState(null);

  // 1. Resolve Member Profile
  const member = useMemo(() => {
    // Try to match by numeric ID or member code (FLM-1008, etc.)
    const foundFromContext = (members || []).find(
      (m) =>
        String(m.id) === String(id) ||
        String(m.code || '').toLowerCase() === String(id || '').toLowerCase() ||
        String(m.memberCode || '').toLowerCase() === String(id || '').toLowerCase()
    );

    const foundFromMock = MOCK_MEMBERS.find(
      (m) =>
        String(m.id) === String(id) ||
        String(m.code || '').toLowerCase() === String(id || '').toLowerCase() ||
        String(m.memberCode || '').toLowerCase() === String(id || '').toLowerCase()
    );

    const base = foundFromContext || foundFromMock || MOCK_MEMBERS.find((m) => m.code === 'FLM-1008') || MOCK_MEMBERS[0];
    const mockEnriched = MOCK_MEMBERS.find((m) => m.code === base.code || m.id === base.id) || {};

    return {
      ...mockEnriched,
      ...base,
      ...(localProfile || {}),
    };
  }, [members, id, localProfile]);

  // 2. Resolve Member Invoices from FinanceContext (single source of truth for balances)
  const memberInvoices = useMemo(() => {
    if (!member) return [];
    const directMatches = (invoices || []).filter(
      (inv) =>
        (inv.memberCode && inv.memberCode === member.code) ||
        (inv.memberName && inv.memberName.toLowerCase() === member.name.toLowerCase()) ||
        inv.memberId === member.id
    );

    if (directMatches.length > 0) {
      return directMatches;
    }

    // Default fallback invoice if member has none in FinanceContext
    const net = member.plan === '1 Year' ? 50000 : member.plan === '6 Months' ? 28000 : member.plan === '3 Months' ? 15000 : 7000;
    const paid = net;
    return [
      {
        id: `inv-gen-${member.id}`,
        number: `INV-2026-00${member.id < 10 ? '0' + member.id : member.id}`,
        memberId: member.id,
        memberCode: member.code,
        memberName: member.name,
        memberPhone: member.phone,
        memberAvatar: member.avatar,
        packageName: member.plan || '3 Months Standard',
        packageDuration: '90 Days',
        startDate: member.joined || '2026-10-01',
        endDate: member.expiry || '2026-12-31',
        date: member.joined || '2026-10-01',
        dueDate: '2026-10-25',
        baseAmount: net,
        discountAmount: 0,
        discountReason: 'None',
        taxAmount: 0,
        netPayable: net,
        paidAmount: paid,
        dueAmount: 0,
        status: 'Paid',
        isExtended: false,
        extensionHistory: [],
        payments: [
          {
            id: `pay-gen-${member.id}`,
            receiptNumber: `REC-2026-00${member.id}`,
            amount: paid,
            method: 'bKash',
            reference: 'TRX-DEFAULT-REG',
            date: member.joined || '2026-10-01',
            notes: 'Membership admission fee',
            collectedBy: 'Receptionist Desk (Demo)',
          },
        ],
      },
    ];
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
            packageName: inv.packageName,
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [memberInvoices]);

  // Subscriptions data
  const subscriptions = useMemo(() => {
    if (localSubscriptions) return localSubscriptions;
    if (MOCK_SUBSCRIPTION_HISTORY[member.code]) {
      return MOCK_SUBSCRIPTION_HISTORY[member.code];
    }
    return [
      {
        id: `sub-${member.id}`,
        packageName: `${member.plan || 'Standard Membership'} Package`,
        category: 'General Fitness',
        duration: '90 Days',
        startDate: member.joined || '2026-10-01',
        expiryDate: member.expiry || '2026-12-31',
        price: totalInvoiced || 15000,
        paidAmount: totalPaid || 13000,
        dueAmount: totalDue,
        dueDate: activeDueInvoice?.dueDate || '2026-10-25',
        status: member.status || 'Active',
        includedFeatures: [
          'Full Gym Floor & Cardio Suite Access',
          'Free Dedicated Zone B Locker',
          'Bi-weekly Trainer Review',
          'Monthly InBody Body Composition Scan',
          'Steam & Sauna Privileges',
        ],
        installments: [
          { number: 1, amount: 10000, dueDate: member.joined || '2026-10-01', paidDate: member.joined || '2026-10-01', status: 'Paid', method: 'bKash' },
          { number: 2, amount: 3000, dueDate: '2026-10-10', paidDate: '2026-10-10', status: 'Paid', method: 'Cash' },
          { number: 3, amount: totalDue > 0 ? totalDue : 2000, dueDate: activeDueInvoice?.dueDate || '2026-10-25', paidDate: totalDue === 0 ? '2026-10-22' : null, status: totalDue === 0 ? 'Paid' : 'Due', method: totalDue === 0 ? 'bKash' : 'Pending' },
        ],
      },
    ];
  }, [localSubscriptions, member, totalInvoiced, totalPaid, totalDue, activeDueInvoice]);

  // Attendance data
  const attendanceLogs = useMemo(() => {
    if (localAttendance) return localAttendance;
    if (MOCK_ATTENDANCE_LOGS[member.code]) {
      return MOCK_ATTENDANCE_LOGS[member.code];
    }
    return [
      { date: demoDate, checkIn: '06:45 AM', checkOut: '08:10 AM', duration: '1h 25m', status: 'Completed', method: 'RFID Card' },
      { date: '2026-10-20', checkIn: '06:40 AM', checkOut: '08:05 AM', duration: '1h 25m', status: 'Completed', method: 'RFID Card' },
      { date: '2026-10-18', checkIn: '06:50 AM', checkOut: '08:15 AM', duration: '1h 25m', status: 'Completed', method: 'Face ID' },
      { date: '2026-10-15', checkIn: '07:05 AM', checkOut: '08:20 AM', duration: '1h 15m', status: 'Completed', method: 'RFID Card' },
      { date: '2026-10-12', checkIn: '06:30 AM', checkOut: '07:55 AM', duration: '1h 25m', status: 'Completed', method: 'Manual Check-in' },
    ];
  }, [localAttendance, member, demoDate]);

  // Workout Routine
  const workoutPlan = useMemo(() => {
    if (MOCK_WORKOUT_ROUTINES[member.code]) {
      return MOCK_WORKOUT_ROUTINES[member.code];
    }
    return {
      title: '4-Day Hypertrophy & Strength Split',
      trainer: member.trainer || 'Tanvir Rahman',
      goal: 'Muscle Mass & Functional Conditioning',
      experience: 'Intermediate',
      daysPerWeek: 4,
      notes: 'Focus on progressive overload on compound lifts. Rest 90-120s between heavy working sets.',
      schedule: [
        {
          day: 'Monday - Chest & Triceps',
          exercises: [
            { name: 'Barbell Flat Bench Press', sets: 4, reps: '8-10', weight: '75 kg' },
            { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: '26 kg' },
            { name: 'Cable Chest Flyes', sets: 3, reps: '12-15', weight: '15 kg' },
            { name: 'Dips / Weighted Dips', sets: 3, reps: '10-12', weight: 'Bodyweight' },
            { name: 'Overhead Rope Tricep Extension', sets: 3, reps: '12-15', weight: '22 kg' },
          ],
        },
        {
          day: 'Tuesday - Back & Biceps',
          exercises: [
            { name: 'Conventional Deadlift', sets: 4, reps: '6-8', weight: '120 kg' },
            { name: 'Lat Pulldown (Wide Grip)', sets: 3, reps: '10-12', weight: '65 kg' },
            { name: 'Seated Cable Row', sets: 3, reps: '10-12', weight: '60 kg' },
            { name: 'Barbell Bicep Curl', sets: 3, reps: '10-12', weight: '30 kg' },
            { name: 'Incline Dumbbell Hammer Curls', sets: 3, reps: '12-15', weight: '14 kg' },
          ],
        },
        {
          day: 'Thursday - Shoulders & Abs',
          exercises: [
            { name: 'Standing Overhead Barbell Press', sets: 4, reps: '8-10', weight: '45 kg' },
            { name: 'Dumbbell Lateral Raises', sets: 4, reps: '12-15', weight: '12 kg' },
            { name: 'Face Pulls (Rear Delts)', sets: 3, reps: '15', weight: '25 kg' },
            { name: 'Hanging Leg Raises', sets: 3, reps: '15-20', weight: 'Bodyweight' },
            { name: 'Cable Woodchoppers', sets: 3, reps: '12 each side', weight: '20 kg' },
          ],
        },
        {
          day: 'Friday - Legs & Calves',
          exercises: [
            { name: 'Barbell Back Squat', sets: 4, reps: '8-10', weight: '100 kg' },
            { name: 'Romanian Deadlift (RDL)', sets: 3, reps: '10-12', weight: '80 kg' },
            { name: 'Leg Press 45°', sets: 3, reps: '12-15', weight: '180 kg' },
            { name: 'Lying Leg Curls', sets: 3, reps: '12-15', weight: '45 kg' },
            { name: 'Standing Calf Raises', sets: 4, reps: '15-20', weight: '60 kg' },
          ],
        },
      ],
    };
  }, [member]);

  // Diet Plan
  const dietPlan = useMemo(() => {
    if (MOCK_DIET_PLANS[member.code]) {
      return MOCK_DIET_PLANS[member.code];
    }
    return {
      title: 'High Protein Lean Bulk (Bangladeshi Diet)',
      nutritionist: 'Fatima Khan (Lead Sports Dietitian)',
      dailyCalories: 2650,
      macros: {
        proteinGrams: 165,
        carbsGrams: 310,
        fatsGrams: 75,
      },
      preference: 'Non-Veg (Halal)',
      waterIntake: '3.5 Litres Daily',
      meals: [
        {
          mealName: 'Breakfast (7:30 AM)',
          items: [
            '3 Whole boiled eggs + 2 egg whites',
            '2 Brown atta rotis with light ghee',
            '1 bowl mixed vegetable sabzi (papaya, carrots, potol)',
            '1 glass low-fat milk with banana',
          ],
          calories: 620,
          protein: 38,
        },
        {
          mealName: 'Mid-Morning Snack (11:00 AM)',
          items: ['Handful of almonds & walnuts (30g)', '1 cup fresh green tea with lime', '1 seasonal apple or guava'],
          calories: 230,
          protein: 6,
        },
        {
          mealName: 'Lunch (1:30 PM)',
          items: [
            '1.5 cups steamed brown rice / Basmati',
            '180g Deshi Chicken breast curry or Rui fish jhol',
            '1 bowl thick Masoor dal',
            'Fresh green cucumber, tomato & onion salad',
          ],
          calories: 780,
          protein: 52,
        },
        {
          mealName: 'Pre-Workout Snack (4:45 PM)',
          items: ['2 slices whole wheat brown bread with 1 tbsp peanut butter', '1 banana + 1 cup black coffee (no sugar)'],
          calories: 310,
          protein: 10,
        },
        {
          mealName: 'Dinner (8:30 PM)',
          items: [
            '2 Multigrain rotis',
            '150g Grilled Bhetki fish or Chicken tikka',
            '1 small bowl Palak (spinach) or mixed stir-fry greens',
            'Cucumber raita with low-fat curd',
          ],
          calories: 710,
          protein: 48,
        },
      ],
    };
  }, [member]);

  // Check-In Handler
  const handleCheckInToday = () => {
    checkInMember?.(member.id);
    const newEntry = {
      date: demoDate,
      checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkOut: 'In Gym',
      duration: 'Ongoing',
      status: 'In Gym',
      method: 'Manual Check-in (Admin)',
    };
    setLocalAttendance([newEntry, ...attendanceLogs]);
    setCheckInNotice(`Success: ${member.name} checked in successfully for today (${demoDate}).`);
    setTimeout(() => setCheckInNotice(''), 4500);
  };

  // Profile Edit Form State
  const [editForm, setEditForm] = useState({
    name: member?.name || '',
    phone: member?.phone || '',
    email: member?.email || '',
    address: member?.address || '',
    height: member?.height || '',
    weight: member?.weight || '',
    rfidCard: member?.rfidCard || '',
    notes: member?.notes || '',
    emergencyName: member?.emergencyContact?.name || '',
    emergencyPhone: member?.emergencyContact?.phone || '',
    emergencyRelation: member?.emergencyContact?.relation || '',
  });

  const handleOpenEdit = () => {
    setEditForm({
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      address: member.address || '',
      height: member.height || '',
      weight: member.weight || '',
      rfidCard: member.rfidCard || '',
      notes: member.notes || '',
      emergencyName: member.emergencyContact?.name || '',
      emergencyPhone: member.emergencyContact?.phone || '',
      emergencyRelation: member.emergencyContact?.relation || '',
    });
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setLocalProfile({
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      address: editForm.address,
      height: editForm.height,
      weight: editForm.weight,
      rfidCard: editForm.rfidCard,
      notes: editForm.notes,
      emergencyContact: {
        name: editForm.emergencyName,
        phone: editForm.emergencyPhone,
        relation: editForm.emergencyRelation,
      },
    });
    setIsEditProfileOpen(false);
    setCheckInNotice('Member profile details updated successfully.');
    setTimeout(() => setCheckInNotice(''), 4000);
  };

  // Subscription Renewal Form State
  const [renewPlan, setRenewPlan] = useState('3 Months');
  const [renewPrice, setRenewPrice] = useState(15000);
  const [renewInitialPay, setRenewInitialPay] = useState(15000);
  const [renewDueDate, setRenewDueDate] = useState('2026-11-25');

  const handlePlanSelect = (e) => {
    const val = e.target.value;
    setRenewPlan(val);
    const p = val === '1 Year' ? 50000 : val === '6 Months' ? 28000 : val === '3 Months' ? 15000 : 7000;
    setRenewPrice(p);
    setRenewInitialPay(p);
  };

  const handleConfirmRenewal = (e) => {
    e.preventDefault();
    const calculatedDue = Math.max(0, renewPrice - renewInitialPay);
    // TODO: renewals need a server RPC (invoice + payment + expiry update);
    // until then this only updates the on-screen subscription list.

    const newSub = {
      id: `sub-renew-${Date.now()}`,
      packageName: `${renewPlan} Renewal Package`,
      category: 'General Fitness',
      duration: renewPlan === '1 Year' ? '365 Days' : renewPlan === '6 Months' ? '180 Days' : '90 Days',
      startDate: demoDate,
      expiryDate: '2027-01-22',
      price: renewPrice,
      paidAmount: renewInitialPay,
      dueAmount: calculatedDue,
      dueDate: renewDueDate,
      status: 'Active',
      includedFeatures: [
        'Full Gym Floor & Cardio Suite Access',
        'Locker Privileges',
        'Quarterly InBody Body Composition Scan',
      ],
      installments: [
        {
          number: 1,
          amount: renewInitialPay,
          dueDate: demoDate,
          paidDate: demoDate,
          status: 'Paid',
          method: 'bKash',
        },
        ...(calculatedDue > 0
          ? [
              {
                number: 2,
                amount: calculatedDue,
                dueDate: renewDueDate,
                paidDate: null,
                status: 'Due',
                method: 'Pending',
              },
            ]
          : []),
      ],
    };

    setLocalSubscriptions([newSub, ...subscriptions]);
    setIsRenewModalOpen(false);
    setCheckInNotice(`Renewal for ${renewPlan} shown on this screen only — it is not saved and no invoice was created.`);
    setTimeout(() => setCheckInNotice(''), 4500);
  };

  if (!member) {
    return (
      <div className="page">
        <Link to="/members" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Members
        </Link>
        <p style={{ marginTop: '20px' }}>Member profile not found.</p>
      </div>
    );
  }

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
                      {formatBDT(totalDue)} Due — Due Date: {formatDatePretty(activeDueInvoice?.dueDate || '2026-10-25')}
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
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              title="Log check-in for today"
            >
              <CheckCircle2 size={14} /> Check In Today
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
          { key: 'locker', label: 'Locker', icon: Lock },
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
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.customId || 'FIT-GLS-008'}</span>
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
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.email}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Gender</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.gender || 'Male'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Date of Birth</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{formatDatePretty(member.dob || '1990-09-18')} (Age: 36)</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Registration Date</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{formatDatePretty(member.joined)}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Height & Weight</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.height || '180 cm (5\'11")'} · {member.weight || '82 kg'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>RFID Access Card</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#10B981' }}>{member.rfidCard || 'RFID-100899'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Assigned Coach</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.trainer || 'Tanvir Rahman'}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Assigned Locker</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{member.lockerNumber || 'B-003'}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Residential Address</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{member.address || 'House 32, Road 18, Block J, Baridhara, Dhaka'}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Medical & Health Background</span>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {member.medical || member.notes || 'No pre-existing cardiovascular conditions. Cleared for high-intensity strength training.'}
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
                  {member.emergencyContact?.name || 'Nadia Ahmed'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Relationship</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  {member.emergencyContact?.relation || 'Spouse'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Emergency Phone</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
                  {member.emergencyContact?.phone || '+880 1711-224466'}
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
                    {subscriptions[0]?.packageName || 'Quarterly Transformation (3 Months)'}
                  </h3>
                  <span className="badge badge-success">Active Package</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Valid from <strong>{formatDatePretty(subscriptions[0]?.startDate)}</strong> to <strong>{formatDatePretty(subscriptions[0]?.expiryDate)}</strong> ({subscriptions[0]?.duration})
                </p>
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
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{formatBDT(subscriptions[0]?.price || 15000)}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Paid</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981' }}>{formatBDT(subscriptions[0]?.paidAmount || 13000)}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Outstanding Due</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: totalDue > 0 ? 'var(--danger)' : '#10B981' }}>
                  {formatBDT(subscriptions[0]?.dueAmount !== undefined ? subscriptions[0].dueAmount : totalDue)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due Clearance Deadline</span>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '3px' }}>
                  {formatDatePretty(subscriptions[0]?.dueDate || '2026-10-25')}
                </div>
              </div>
            </div>

            {/* Included Features */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Included Features & Perks:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {(subscriptions[0]?.includedFeatures || [
                  'Full Gym Floor & Cardio Suite Access',
                  'Dedicated Zone B Locker',
                  'Bi-weekly Trainer Review',
                  'Monthly InBody Body Composition Scan',
                  'Steam & Sauna Privileges',
                ]).map((feat, idx) => (
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
                {totalDue > 0 ? `Due: ${formatDatePretty(activeDueInvoice?.dueDate || '2026-10-25')}` : 'All accounts settled'}
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
                        <td style={{ fontSize: '13px' }}>{p.collectedBy}</td>
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
                      <td>{inv.packageName || inv.planName}</td>
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
                  Total Package: <strong>{formatBDT(totalInvoiced || 15000)}</strong> · Paid: <strong>{formatBDT(totalPaid || 13000)}</strong> · Remaining: <strong style={{ color: totalDue > 0 ? 'var(--danger)' : '#10B981' }}>{formatBDT(totalDue)}</strong>
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
                  <strong>{formatDatePretty(activeDueInvoice?.dueDate)}</strong>. Only 1 extension is permitted per mock record; further extensions are permanently locked.
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
            {/* Installment 1 */}
            <div
              className="activity-card"
              style={{
                padding: '20px',
                borderRadius: '12px',
                borderTop: '3px solid #10B981',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Installment 1 (Admission)</span>
                <span className="badge badge-success">Paid</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>
                ৳10,000
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <div>Due Date: <strong>{formatDatePretty(member.joined || '2026-10-01')}</strong></div>
                <div>Paid Date: <strong>{formatDatePretty(member.joined || '2026-10-01')}</strong></div>
                <div>Payment Method: <strong>bKash Digital Trx</strong></div>
              </div>
            </div>

            {/* Installment 2 */}
            <div
              className="activity-card"
              style={{
                padding: '20px',
                borderRadius: '12px',
                borderTop: '3px solid #10B981',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Installment 2</span>
                <span className="badge badge-success">Paid</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>
                ৳3,000
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <div>Due Date: <strong>10 Oct 2026</strong></div>
                <div>Paid Date: <strong>10 Oct 2026</strong></div>
                <div>Payment Method: <strong>Cash at Reception</strong></div>
              </div>
            </div>

            {/* Installment 3 (Final Outstanding Installment) */}
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
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Installment 3 (Final Due)</span>
                {totalDue > 0 ? (
                  <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-warning'}`}>
                    {isOverdue ? `${daysOverdue}d Overdue` : 'Due'}
                  </span>
                ) : (
                  <span className="badge badge-success">Paid</span>
                )}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: totalDue > 0 ? 'var(--danger)' : '#10B981',
                  marginBottom: '8px',
                }}
              >
                {formatBDT(totalDue > 0 ? totalDue : 2000)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <div>
                  Due Clearance Deadline:{' '}
                  <strong style={{ color: totalDue > 0 ? 'var(--text-main)' : undefined }}>
                    {formatDatePretty(activeDueInvoice?.dueDate || '2026-10-25')}
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
                    Pay ৳{totalDue.toLocaleString()} Now
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
              <div className="stat-widget-sub">Biometric verification telemetry</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Check-in Streak</span>
              <div className="stat-widget-value" style={{ color: 'var(--primary)' }}>
                4 Days 🔥
              </div>
              <div className="stat-widget-sub">Consistent morning routine</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Average Session Duration</span>
              <div className="stat-widget-value">1h 24m</div>
              <div className="stat-widget-sub">Cardio + Resistance split</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Latest Check-in</span>
              <div className="stat-widget-value" style={{ fontSize: '16px', marginTop: '6px' }}>
                {attendanceLogs[0]?.checkIn || '06:45 AM'}
              </div>
              <div className="stat-widget-sub">{formatDatePretty(attendanceLogs[0]?.date || demoDate)}</div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Biometric Attendance History</h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Detailed timestamped telemetry from turnstile scanner, RFID, and reception.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCheckInToday}
              >
                <CheckCircle2 size={14} /> Check In Today
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
                  {attendanceLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{formatDatePretty(log.date)}</td>
                      <td style={{ color: '#10B981', fontWeight: 700 }}>{log.checkIn}</td>
                      <td>{log.checkOut}</td>
                      <td style={{ fontWeight: 600 }}>{log.duration}</td>
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
                        <span className={`badge ${log.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                          {log.status}
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
                { title: 'Dedicated Executive Locker', desc: `Assigned locker ${member.lockerNumber || 'B-003'} in Zone B executive wing with RFID lock.`, badge: 'Active', icon: Lock },
                { title: 'Steam & Sauna Privileges', desc: 'Complimentary weekend hydrotherapy, infrared sauna, and eucalyptus steam room access.', badge: 'Included', icon: Droplets },
                { title: 'Trainer Review & Bi-weekly Check-in', desc: `Assigned coach: ${member.trainer || 'Tanvir Rahman'}. Includes form check and weight adjustments.`, badge: 'Bi-Weekly', icon: User },
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
      {/* TAB 8: LOCKER */}
      {/* ========================================================================= */}
      {activeTab === 'locker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={20} style={{ color: 'var(--primary)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Dedicated Locker Assignment</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Personal storage locker details, zone assignment, and RFID credentials.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => alert(`Locker ${member.lockerNumber || 'B-003'} released to available pool.`)}
                >
                  Release Locker
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => alert('Locker change modal: Select a new locker from the floor map.')}
                >
                  Change Locker
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--bg-subtle, rgba(255,255,255,0.03))',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assigned Locker Number</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                  {member.lockerNumber || 'B-003'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Locker Wing & Zone</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>Zone B · Executive Suite</div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Locker Type</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>Digital RFID Electronic Lock</div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>RFID Tag Assigned</span>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#10B981', marginTop: '6px' }}>
                  {member.rfidCard || 'RFID-100899'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly Locker Fee</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>৳0 (Included in Package)</div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assignment Expiry</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
                  {formatDatePretty(member.expiry)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: WORKOUT PLAN */}
      {/* ========================================================================= */}
      {activeTab === 'workout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Dumbbell size={20} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{workoutPlan.title}</h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Assigned Coach: <strong>{workoutPlan.trainer}</strong> · Goal: <strong>{workoutPlan.goal}</strong> · Experience: <strong>{workoutPlan.experience}</strong> · <strong>{workoutPlan.daysPerWeek} Days / Week</strong>
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => alert('Workout Routine editor opened.')}
              >
                <Pencil size={13} /> Edit Routine
              </button>
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
                <strong>Trainer Instruction:</strong> {workoutPlan.notes}
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
                            <td>{ex.sets} Sets</td>
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
      {activeTab === 'diet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="activity-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Utensils size={20} style={{ color: '#10B981' }} />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{dietPlan.title}</h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Dietitian: <strong>{dietPlan.nutritionist}</strong> · Water Intake: <strong>{dietPlan.waterIntake}</strong> · Preference: <strong>{dietPlan.preference}</strong>
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => alert('Diet plan adjustment dialog opened.')}
              >
                <Pencil size={13} /> Adjust Diet Plan
              </button>
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
            <button type="submit" form="edit-member-form" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        }
      >
        <form id="edit-member-form" onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <span className="form-label">RFID Access Card</span>
              <input
                className="form-input"
                value={editForm.rfidCard}
                onChange={(e) => setEditForm({ ...editForm, rfidCard: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Height</span>
              <input
                className="form-input"
                value={editForm.height}
                onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Weight</span>
              <input
                className="form-input"
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <label className="form-group">
                <span className="form-label">Contact Name</span>
                <input
                  className="form-input"
                  value={editForm.emergencyName}
                  onChange={(e) => setEditForm({ ...editForm, emergencyName: e.target.value })}
                />
              </label>
              <label className="form-group">
                <span className="form-label">Relationship</span>
                <input
                  className="form-input"
                  value={editForm.emergencyRelation}
                  onChange={(e) => setEditForm({ ...editForm, emergencyRelation: e.target.value })}
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

          <label className="form-group">
            <span className="form-label">Medical Notes & Health History</span>
            <textarea
              className="form-input"
              rows={2}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            />
          </label>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN / RENEW SUBSCRIPTION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title="Assign / Renew Membership Package"
        subtitle={`Member: ${member.name} (${member.code})`}
        icon={RefreshCw}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsRenewModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="renew-sub-form" className="btn btn-primary">
              Confirm Renewal
            </button>
          </div>
        }
      >
        <form id="renew-sub-form" onSubmit={handleConfirmRenewal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label className="form-group">
            <span className="form-label">Select Package Plan *</span>
            <select
              className="form-select"
              value={renewPlan}
              onChange={handlePlanSelect}
            >
              <option value="1 Month">1 Month Standard — ৳7,000</option>
              <option value="3 Months">3 Months Quarterly Transformation — ৳15,000</option>
              <option value="6 Months">6 Months Half-Yearly Pro — ৳28,000</option>
              <option value="1 Year">1 Year Annual VIP — ৳50,000</option>
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <label className="form-group">
              <span className="form-label">Total Package Price (BDT)</span>
              <input
                className="form-input"
                type="number"
                value={renewPrice}
                onChange={(e) => setRenewPrice(Number(e.target.value))}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Initial Paid Amount (BDT)</span>
              <input
                className="form-input"
                type="number"
                value={renewInitialPay}
                onChange={(e) => setRenewInitialPay(Number(e.target.value))}
              />
            </label>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--bg-subtle, rgba(255,255,255,0.04))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Resulting Due Balance:</span>
            <strong style={{ fontSize: '15px', color: renewPrice - renewInitialPay > 0 ? 'var(--danger)' : '#10B981' }}>
              {formatBDT(Math.max(0, renewPrice - renewInitialPay))}
            </strong>
          </div>

          {renewPrice - renewInitialPay > 0 && (
            <label className="form-group">
              <span className="form-label">Due Clearance Date *</span>
              <input
                className="form-input"
                type="date"
                required
                value={renewDueDate}
                onChange={(e) => setRenewDueDate(e.target.value)}
              />
            </label>
          )}
        </form>
      </Modal>

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
