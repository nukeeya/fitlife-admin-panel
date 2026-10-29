/**
 * FitLife Enterprise Gym - Financial Calculation Engine
 * Deterministic helpers for date filtering, revenue recognition, dues & balance sheet
 */

// Local-time YYYY-MM-DD. toISOString() would shift the date in UTC+ zones.
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayIso = () => ymd(new Date());

export const DATE_FILTER_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'this_year', label: 'This Year' },
  { key: 'last_year', label: 'Last Year' },
  { key: 'custom', label: 'Custom Date Range' },
];

const monthLabel = (d) => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

/**
 * Returns { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', label: string }
 */
export function getDateRange(presetKey = 'this_month', customRange = null, referenceDate = todayIso()) {
  if (presetKey === 'custom' && customRange?.start && customRange?.end) {
    return {
      start: customRange.start,
      end: customRange.end,
      label: `Custom: ${customRange.start} to ${customRange.end}`,
    };
  }

  const [y, m, d] = referenceDate.split('-').map(Number);
  const ref = new Date(y, m - 1, d);
  const range = (start, end, label) => ({ start: ymd(start), end: ymd(end), label });
  const pretty = (date) => formatDatePretty(ymd(date));

  switch (presetKey) {
    case 'today':
      return range(ref, ref, `Today (${pretty(ref)})`);

    case 'yesterday': {
      const yd = new Date(y, m - 1, d - 1);
      return range(yd, yd, `Yesterday (${pretty(yd)})`);
    }

    case 'this_week':
    case 'last_week': {
      // Monday to Sunday
      const offset = (ref.getDay() + 6) % 7 + (presetKey === 'last_week' ? 7 : 0);
      const mon = new Date(y, m - 1, d - offset);
      const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
      const name = presetKey === 'last_week' ? 'Last Week' : 'This Week';
      return range(mon, sun, `${name} (${pretty(mon)} - ${pretty(sun)})`);
    }

    case 'last_month': {
      const start = new Date(y, m - 2, 1);
      return range(start, new Date(y, m - 1, 0), `Last Month (${monthLabel(start)})`);
    }

    case 'this_quarter': {
      const q = Math.floor((m - 1) / 3);
      return range(new Date(y, q * 3, 1), new Date(y, q * 3 + 3, 0), `This Quarter (Q${q + 1} ${y})`);
    }

    case 'this_year':
      return range(new Date(y, 0, 1), new Date(y, 11, 31), `This Year (${y})`);

    case 'last_year':
      return range(new Date(y - 1, 0, 1), new Date(y - 1, 11, 31), `Last Year (${y - 1})`);

    case 'this_month':
    default:
      return range(new Date(y, m - 1, 1), new Date(y, m, 0), `This Month (${monthLabel(ref)})`);
  }
}

export function isDateInRange(dateStr, range) {
  if (!dateStr || !range?.start || !range?.end) return false;
  const d = dateStr.slice(0, 10);
  return d >= range.start && d <= range.end;
}

export function formatBDT(amount, showDecimals = false) {
  const num = Number(amount || 0);
  if (isNaN(num)) return '৳0';
  return `৳${num.toLocaleString('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDatePretty(dateStr) {
  if (!dateStr) return '—';
  try {
    const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculates days overdue for unpaid/partial dues
 */
export function calculateDaysOverdue(dueDate, dueAmount, referenceDate = todayIso()) {
  if (!dueDate || Number(dueAmount || 0) <= 0) return 0;
  const due = new Date(dueDate);
  const ref = new Date(referenceDate);
  const diffTime = ref - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Monthly revenue split for one membership invoice (the rule agreed with the client).
 *
 * - A plan of N months is split into N equal parts. Part k counts in the
 *   calendar month that membership month k starts in: a 3-month plan starting
 *   15 Oct earns in Oct, Nov and Dec (none in Jan).
 * - Only money actually paid is split. Each payment is spread over the
 *   membership months from the payment's own month onwards, so months that
 *   have already passed (and may be closed) never change. A payment before
 *   the start covers all months; one made after the last month counts in the
 *   month it was paid.
 * - VAT is not revenue: each payment is scaled by (base - discount) / net payable.
 * - Amounts are worked in paisa; any leftover paisa go to the earliest months,
 *   so the parts always add up exactly to what was paid.
 *
 * Returns the same shape as calculateRevenueRecognition() below, so the
 * finance screens can use either.
 */
export function calculateMembershipRevenue({
  payments = [],
  netPayable = 0,
  baseAmount = 0,
  discountAmount = 0,
  startDate,
  months = 1,
  asOfDate = todayIso(),
}) {
  const numMonths = Math.max(1, Math.round(Number(months) || 1));
  const planValue = Math.max(0, (Number(baseAmount) || 0) - (Number(discountAmount) || 0));
  const net = Number(netPayable) || 0;
  const revenueShare = net > 0 ? Math.min(1, planValue / net) : 1;

  const keyOf = (y, m) => `${y}-${String(m + 1).padStart(2, '0')}`;
  const [sy, sm] = String(startDate || asOfDate).slice(0, 7).split('-').map(Number);
  const membershipKeys = Array.from({ length: numMonths }, (_, k) => {
    const d = new Date(sy, sm - 1 + k, 1);
    return keyOf(d.getFullYear(), d.getMonth());
  });

  const paisaByMonth = new Map(membershipKeys.map((key) => [key, 0]));
  let totalPaisa = 0;

  for (const p of payments) {
    const paisa = Math.round((Number(p.amount) || 0) * revenueShare * 100);
    if (paisa <= 0) continue;
    totalPaisa += paisa;
    const payKey = String(p.date || asOfDate).slice(0, 7);
    const eligible = membershipKeys.filter((key) => key >= payKey);
    const targets = eligible.length > 0 ? eligible : [payKey];
    const each = Math.floor(paisa / targets.length);
    let leftover = paisa - each * targets.length;
    for (const key of targets) {
      const extra = leftover > 0 ? 1 : 0;
      leftover -= extra;
      paisaByMonth.set(key, (paisaByMonth.get(key) || 0) + each + extra);
    }
  }

  const currentMonthKey = String(asOfDate).slice(0, 7);
  const monthlySchedule = [...paisaByMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([monthKey, paisa]) => {
      const [y, m] = monthKey.split('-').map(Number);
      const index = membershipKeys.indexOf(monthKey);
      return {
        monthKey,
        monthLabel: new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        membershipMonth: index >= 0 ? index + 1 : null, // null = paid after the plan ended
        allocatedRevenue: paisa / 100,
        recognitionPercentage: totalPaisa > 0 ? (paisa / totalPaisa) * 100 : 0,
        status: monthKey < currentMonthKey ? 'recognized' : monthKey === currentMonthKey ? 'current' : 'deferred',
      };
    });

  const recognizedPaisa = [...paisaByMonth.entries()]
    .filter(([key]) => key <= currentMonthKey)
    .reduce((sum, [, paisa]) => sum + paisa, 0);

  return {
    netConsideration: totalPaisa / 100, // paid, excluding VAT
    planValue, // full plan price excluding VAT, paid or not
    numMonths,
    method: 'membership_months',
    monthlySchedule,
    recognizedToDate: recognizedPaisa / 100,
    deferredRevenue: (totalPaisa - recognizedPaisa) / 100,
    isFullyRecognized: totalPaisa === recognizedPaisa,
  };
}

/**
 * Dynamic Membership Revenue Recognition Engine
 *
 * Supports:
 * - 1-month, 3-month, 6-month, 12-month and any custom duration
 * - Configurable allocation methods:
 *   1. 'equal_monthly': Equal monthly allocation with penny-rounding adjustment on final month
 *   2. 'service_days': Service-day pro-rata allocation
 * - Separates Cash Collected from Recognized Revenue
 * - Sum of monthly allocations strictly equals net package consideration
 */
export function calculateRevenueRecognition({
  packagePrice = 0,
  discountAmount = 0,
  startDate = todayIso(),
  endDate = todayIso(),
  asOfDate = todayIso(),
  method = 'equal_monthly', // 'equal_monthly' | 'service_days'
}) {
  const price = Math.max(0, Number(packagePrice) || 0);
  const discount = Math.max(0, Number(discountAmount) || 0);
  const netConsideration = Math.max(0, price - discount);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const asOf = new Date(asOfDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return {
      netConsideration,
      monthlySchedule: [],
      recognizedToDate: 0,
      deferredRevenue: netConsideration,
      method,
    };
  }

  // Generate list of calendar months between start and end
  const months = [];
  const curr = new Date(start.getFullYear(), start.getMonth(), 1);
  const endLimit = new Date(end.getFullYear(), end.getMonth(), 1);

  while (curr <= endLimit) {
    const year = curr.getFullYear();
    const month = curr.getMonth(); // 0-indexed
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthLabel = curr.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    // Calculate days of service within this specific month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0); // last day of month

    const effStart = start > monthStart ? start : monthStart;
    const effEnd = end < monthEnd ? end : monthEnd;

    const daysInService = Math.max(0, Math.floor((effEnd - effStart) / (1000 * 60 * 60 * 24)) + 1);

    months.push({
      monthKey,
      monthLabel,
      year,
      month,
      daysInService,
      monthStartStr: ymd(effStart),
      monthEndStr: ymd(effEnd),
    });

    curr.setMonth(curr.getMonth() + 1);
  }

  const numMonths = months.length;
  const totalServiceDays = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);

  let monthlySchedule = [];

  if (method === 'equal_monthly') {
    // Equal monthly allocation:
    // e.g., ৳15,000 / 3 = ৳5,000 each.
    // e.g., ৳50,000 / 12 = ৳4,166.67 for first 11 months, ৳4,166.63 for final month.
    // Sum is guaranteed to equal netConsideration exactly.
    const basePerMonth = numMonths > 0 ? Math.floor((netConsideration / numMonths) * 100) / 100 : 0;
    let accumulated = 0;

    monthlySchedule = months.map((m, index) => {
      let allocated = 0;
      if (index === numMonths - 1) {
        // Last month absorbs remainder so sum strictly matches
        allocated = Math.round((netConsideration - accumulated) * 100) / 100;
      } else {
        allocated = basePerMonth;
        accumulated += allocated;
      }

      // Status: Recognized if month is before or is current asOf month
      const currentMonthKey = asOfDate.slice(0, 7);
      let status = 'deferred';
      if (m.monthKey < currentMonthKey) {
        status = 'recognized';
      } else if (m.monthKey === currentMonthKey) {
        status = 'current'; // Currently recognizing
      } else {
        status = 'deferred';
      }

      return {
        ...m,
        allocatedRevenue: allocated,
        recognitionPercentage: netConsideration > 0 ? (allocated / netConsideration) * 100 : 0,
        status,
      };
    });
  } else {
    // Service-day-based pro-rata allocation
    let accumulated = 0;
    monthlySchedule = months.map((m, index) => {
      let allocated = 0;
      if (index === numMonths - 1) {
        allocated = Math.round((netConsideration - accumulated) * 100) / 100;
      } else {
        allocated = Math.round(((m.daysInService / totalServiceDays) * netConsideration) * 100) / 100;
        accumulated += allocated;
      }

      const currentMonthKey = asOfDate.slice(0, 7);
      let status = 'deferred';
      if (m.monthKey < currentMonthKey) {
        status = 'recognized';
      } else if (m.monthKey === currentMonthKey) {
        status = 'current';
      } else {
        status = 'deferred';
      }

      return {
        ...m,
        allocatedRevenue: allocated,
        recognitionPercentage: netConsideration > 0 ? (allocated / netConsideration) * 100 : 0,
        status,
      };
    });
  }

  // Calculate recognized to date (all past months + current month recognized)
  const currentMonthKey = asOfDate.slice(0, 7);
  const recognizedToDate = monthlySchedule
    .filter((m) => m.monthKey <= currentMonthKey)
    .reduce((sum, m) => sum + m.allocatedRevenue, 0);

  const deferredRevenue = Math.max(0, Math.round((netConsideration - recognizedToDate) * 100) / 100);

  return {
    netConsideration,
    totalServiceDays,
    numMonths,
    method,
    monthlySchedule,
    recognizedToDate: Math.round(recognizedToDate * 100) / 100,
    deferredRevenue,
    isFullyRecognized: deferredRevenue <= 0,
  };
}
