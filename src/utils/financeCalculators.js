/**
 * FitLife Enterprise Gym - Financial Calculation Engine
 * Scope: FRONTEND DEMO ONLY
 * Deterministic helpers for date filtering, revenue recognition, dues & balance sheet
 */

export const REFERENCE_TODAY = '2026-10-19';

export const DATE_FILTER_PRESETS = [
  { key: 'today', label: 'Today (19 Oct 2026)' },
  { key: 'yesterday', label: 'Yesterday (18 Oct 2026)' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month (Oct 2026)' },
  { key: 'last_month', label: 'Last Month (Sep 2026)' },
  { key: 'this_quarter', label: 'This Quarter (Q4 2026)' },
  { key: 'this_year', label: 'This Year (2026)' },
  { key: 'last_year', label: 'Last Year (2025)' },
  { key: 'custom', label: 'Custom Date Range' },
];

/**
 * Returns { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', label: string }
 */
export function getDateRange(presetKey = 'this_month', customRange = null, referenceDate = REFERENCE_TODAY) {
  if (presetKey === 'custom' && customRange?.start && customRange?.end) {
    return {
      start: customRange.start,
      end: customRange.end,
      label: `Custom: ${customRange.start} to ${customRange.end}`,
    };
  }

  const [refY, refM, refD] = referenceDate.split('-').map(Number);
  const refDateObj = new Date(refY, refM - 1, refD);

  switch (presetKey) {
    case 'today':
      return { start: referenceDate, end: referenceDate, label: 'Today (19 Oct 2026)' };

    case 'yesterday': {
      const y = new Date(refDateObj);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      return { start: yStr, end: yStr, label: 'Yesterday (18 Oct 2026)' };
    }

    case 'this_week': {
      // Mon to Sun of current week
      const day = refDateObj.getDay();
      const diffToMon = refDateObj.getDate() - (day === 0 ? 6 : day - 1);
      const mon = new Date(refDateObj.setDate(diffToMon));
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      return {
        start: mon.toISOString().slice(0, 10),
        end: sun.toISOString().slice(0, 10),
        label: 'This Week (19 Oct - 25 Oct 2026)',
      };
    }

    case 'last_week': {
      const mon = new Date(2026, 9, 12);
      const sun = new Date(2026, 9, 18);
      return {
        start: mon.toISOString().slice(0, 10),
        end: sun.toISOString().slice(0, 10),
        label: 'Last Week (12 Oct - 18 Oct 2026)',
      };
    }

    case 'this_month':
      return {
        start: '2026-10-01',
        end: '2026-10-31',
        label: 'This Month (October 2026)',
      };

    case 'last_month':
      return {
        start: '2026-09-01',
        end: '2026-09-30',
        label: 'Last Month (September 2026)',
      };

    case 'this_quarter':
      return {
        start: '2026-10-01',
        end: '2026-12-31',
        label: 'This Quarter (Q4 Oct-Dec 2026)',
      };

    case 'this_year':
      return {
        start: '2026-01-01',
        end: '2026-12-31',
        label: 'This Year (2026 Full Year)',
      };

    case 'last_year':
      return {
        start: '2025-01-01',
        end: '2025-12-31',
        label: 'Last Year (2025)',
      };

    default:
      return {
        start: '2026-10-01',
        end: '2026-10-31',
        label: 'This Month (October 2026)',
      };
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
export function calculateDaysOverdue(dueDate, dueAmount, referenceDate = REFERENCE_TODAY) {
  if (!dueDate || Number(dueAmount || 0) <= 0) return 0;
  const due = new Date(dueDate);
  const ref = new Date(referenceDate);
  const diffTime = ref - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
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
  startDate = '2026-10-01',
  endDate = '2026-12-31',
  asOfDate = REFERENCE_TODAY,
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
      monthStartStr: effStart.toISOString().slice(0, 10),
      monthEndStr: effEnd.toISOString().slice(0, 10),
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
