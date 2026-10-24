/**
 * FitLife Enterprise Gym - Finance State Management
 * Derives finance views (dues, collections, revenue recognition, closings)
 * from the invoices, payments and expenses loaded by GymDataContext, and
 * routes every write through it to Supabase. Must render inside GymDataProvider.
 */
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useGymData } from './GymDataContext';
import { useAuth } from './AuthContext';
import { PAYMENT_METHODS, EXPENSE_CATEGORIES } from '../data/financeConfig';
import { todayStr } from '../lib/supabaseData';
import {
  getDateRange,
  isDateInRange,
  calculateDaysOverdue,
  calculateRevenueRecognition,
} from '../utils/financeCalculators';

const FinanceContext = createContext(null);

const sameMethod = (a, b) => String(a || '').toUpperCase() === String(b || '').toUpperCase();

const currentMonthRange = () => {
  const today = todayStr();
  const [y, m] = today.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { start: `${today.slice(0, 7)}-01`, end: `${today.slice(0, 7)}-${String(lastDay).padStart(2, '0')}` };
};

// supabase-js / RPC errors -> { success: false, error } for the UI.
const failure = (err, fallback) => ({ success: false, error: err?.message || fallback });

export function FinanceProvider({ children }) {
  const gym = useGymData();
  const { staff } = useAuth();
  const { invoices, expenses, plans, monthClosings: closedMonths, periodAdjustments, expenseCategories } = gym;

  // Overdue and aging are always evaluated against the real calendar date.
  const today = todayStr();

  // No refunds table exists yet; refund views render empty.
  const refunds = useMemo(() => [], []);
  const paymentMethods = PAYMENT_METHODS;

  const packages = useMemo(
    () => plans.map((p) => ({
      id: p.id,
      name: p.name,
      durationDays: p.durationDays,
      durationMonths: Math.max(1, Math.round((p.durationDays || 30) / 30)),
      price: p.price,
    })),
    [plans]
  );

  // Overdue Reminder Modal popup visibility
  const [showOverduePopup, setShowOverduePopup] = useState(false);

  // Global Date Filter State
  const [dateFilterKey, setDateFilterKey] = useState('this_month');
  const [customDateRange, setCustomDateRange] = useState(currentMonthRange);

  // Revenue Recognition Policy: 'equal_monthly' | 'service_days'
  const [recognitionPolicy, setRecognitionPolicy] = useState('equal_monthly');

  const activeDateRange = useMemo(() => {
    return getDateRange(dateFilterKey, customDateRange, today);
  }, [dateFilterKey, customDateRange, today]);

  const resetFilters = useCallback(() => {
    setDateFilterKey('this_month');
    setCustomDateRange(currentMonthRange());
  }, []);

  const allExpenseCategories = useMemo(() => {
    const seen = new Map();
    for (const c of [...EXPENSE_CATEGORIES, ...expenseCategories]) {
      const key = c.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, c);
    }
    return Array.from(seen.values());
  }, [expenseCategories]);

  // Flatten all individual payment transactions across invoices
  const allPayments = useMemo(() => {
    const list = [];
    invoices.forEach((inv) => {
      if (Array.isArray(inv.payments)) {
        inv.payments.forEach((p) => {
          list.push({
            ...p,
            invoiceId: inv.id,
            invoiceNumber: inv.number,
            memberId: inv.memberId,
            memberName: inv.memberName,
            memberCode: inv.memberCode,
            memberPhone: inv.memberPhone,
            memberAvatar: inv.memberAvatar,
            planName: inv.planName,
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [invoices]);

  // Date-filtered Collections (Cash / Digital receipts received in this period)
  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => isDateInRange(p.date, activeDateRange));
  }, [allPayments, activeDateRange]);

  // Date-filtered Invoices (Invoices issued in this period)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => isDateInRange(inv.date, activeDateRange));
  }, [invoices, activeDateRange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.date, activeDateRange));
  }, [expenses, activeDateRange]);

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => isDateInRange(r.date, activeDateRange));
  }, [refunds, activeDateRange]);

  // Member Dues Ledger (computes overdue days against today)
  const memberDues = useMemo(() => {
    return invoices.map((inv) => {
      const daysOverdue = calculateDaysOverdue(inv.dueDate, inv.dueAmount, today);
      const isOverdue = daysOverdue > 0 && inv.dueAmount > 0;

      let effectiveStatus;
      if (inv.dueAmount <= 0) {
        effectiveStatus = 'Paid';
      } else if (isOverdue) {
        effectiveStatus = 'Overdue';
      } else if (inv.isExtended) {
        effectiveStatus = 'Extended';
      } else if (inv.paidAmount > 0) {
        effectiveStatus = 'Partially Paid';
      } else {
        effectiveStatus = 'Unpaid';
      }

      return {
        ...inv,
        daysOverdue,
        effectiveStatus,
        isOverdue,
      };
    });
  }, [invoices, today]);

  // Categorized Dues Slices for Tabbed Due Reminder Dashboard
  const upcomingDues = useMemo(() => {
    return memberDues.filter(
      (d) => d.dueAmount > 0 && d.dueDate > today && !d.isExtended
    );
  }, [memberDues, today]);

  const todayDues = useMemo(() => {
    return memberDues.filter(
      (d) => d.dueAmount > 0 && d.dueDate === today
    );
  }, [memberDues, today]);

  const overdueDues = useMemo(() => {
    return memberDues.filter((d) => d.effectiveStatus === 'Overdue');
  }, [memberDues]);

  const extendedDues = useMemo(() => {
    return memberDues.filter((d) => d.isExtended);
  }, [memberDues]);

  const clearedDues = useMemo(() => {
    return memberDues.filter((d) => d.dueAmount === 0 && d.paidAmount > 0);
  }, [memberDues]);

  const overdueCount = overdueDues.length;

  // Dynamic Revenue Recognition Schedules for all invoices
  const revenueRecognitionSchedules = useMemo(() => {
    return invoices.map((inv) => {
      const recognition = calculateRevenueRecognition({
        packagePrice: inv.baseAmount,
        discountAmount: inv.discountAmount,
        startDate: inv.startDate || inv.date,
        endDate: inv.endDate || inv.date,
        asOfDate: today,
        method: recognitionPolicy,
      });

      return {
        ...inv,
        recognition,
      };
    });
  }, [invoices, recognitionPolicy, today]);

  // Financial Metrics (reconciled across all tabs)
  const financialMetrics = useMemo(() => {
    const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + (Number(i.netPayable) || 0), 0);
    const totalBasePrice = filteredInvoices.reduce((sum, i) => sum + (Number(i.baseAmount) || 0), 0);
    const totalDiscounts = filteredInvoices.reduce((sum, i) => sum + (Number(i.discountAmount) || 0), 0);

    const outstandingDues = invoices.reduce((sum, i) => sum + (Number(i.dueAmount) || 0), 0);
    const overdueDuesTotal = overdueDues.reduce((sum, d) => sum + (Number(d.dueAmount) || 0), 0);

    const totalCollected = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalRefunds = filteredRefunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const netCashCollected = Math.max(0, totalCollected - totalRefunds);

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    let recognizedRevenue = 0;
    let deferredRevenue = 0;

    revenueRecognitionSchedules.forEach(({ recognition }) => {
      deferredRevenue += recognition.deferredRevenue;
      recognition.monthlySchedule.forEach((m) => {
        const monthStart = `${m.monthKey}-01`;
        if (monthStart >= activeDateRange.start.slice(0, 7) + '-01' && monthStart <= activeDateRange.end) {
          recognizedRevenue += m.allocatedRevenue;
        }
      });
    });

    recognizedRevenue = Math.round(recognizedRevenue * 100) / 100;
    deferredRevenue = Math.round(deferredRevenue * 100) / 100;

    const cashNetProfit = netCashCollected - totalExpenses;
    const accrualNetProfit = recognizedRevenue - totalExpenses;

    return {
      totalInvoiced,
      totalBasePrice,
      totalDiscounts,
      totalCollected,
      totalRefunds,
      netCashCollected,
      outstandingDues,
      overdueDues: overdueDuesTotal,
      recognizedRevenue,
      deferredRevenue,
      totalExpenses,
      cashNetProfit,
      accrualNetProfit,
    };
  }, [
    filteredInvoices,
    filteredPayments,
    filteredRefunds,
    filteredExpenses,
    invoices,
    overdueDues,
    revenueRecognitionSchedules,
    activeDateRange,
  ]);

  // Method Breakdown Summary
  const paymentMethodSummary = useMemo(() => {
    return paymentMethods.map((method) => {
      const methodPayments = filteredPayments.filter((p) => sameMethod(p.methodId || p.method, method.id));
      const totalAmount = methodPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const methodRefunds = filteredRefunds.filter((r) => sameMethod(r.methodId || r.method, method.id));
      const refundAmount = methodRefunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      return {
        ...method,
        totalAmount,
        count: methodPayments.length,
        refundCount: methodRefunds.length,
        refundAmount,
        netCollection: Math.max(0, totalAmount - refundAmount),
        transactions: methodPayments,
      };
    });
  }, [paymentMethods, filteredPayments, filteredRefunds]);

  // ===========================================================================
  // ACTION: Record Payment — collect_payment RPC recalculates paid/due server-side
  // ===========================================================================
  const recordPayment = useCallback(async ({ invoiceId, amount, method = 'CASH', reference = '' }) => {
    const payNum = Math.max(0, Number(amount) || 0);
    if (!payNum) return { success: false, error: 'Invalid payment amount' };
    try {
      await gym.collectPayment({ invoiceId, amount: payNum, method, trxId: reference });
      return { success: true };
    } catch (err) {
      return failure(err, 'Failed to record payment');
    }
  }, [gym]);

  // ===========================================================================
  // ACTION: One-Time Due-Date Extension (rule enforced by the database)
  // ===========================================================================
  const extendDueDate = useCallback(async ({ invoiceId, newDueDate, reason, adminName }) => {
    if (!newDueDate) return { success: false, error: 'Please select a valid new due date.' };
    if (!reason || !reason.trim()) return { success: false, error: 'Extension reason is mandatory.' };

    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return { success: false, error: 'Invoice due record not found.' };
    if (target.isExtended) {
      return { success: false, error: 'Extension Already Used: only one due-date extension is permitted per invoice.' };
    }
    if (target.dueDate && newDueDate <= target.dueDate) {
      return { success: false, error: `New due date must be after the current deadline (${target.dueDate}).` };
    }

    const { error } = await gym.extendInvoiceDueDate({
      invoiceId,
      newDueDate,
      reason: reason.trim(),
      authorizedBy: adminName || staff?.name,
    });
    return error ? failure(error, 'Failed to extend the due date.') : { success: true };
  }, [gym, invoices, staff]);

  // ===========================================================================
  // ACTION: Custom Expense Categories
  // ===========================================================================
  const addCustomExpenseCategory = useCallback(async (categoryName) => {
    const trimmed = String(categoryName || '').trim();
    if (!trimmed) return { success: false, error: 'Category name cannot be empty.' };

    const isDuplicate = allExpenseCategories.some((c) => c.trim().toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) return { success: false, error: `Category "${trimmed}" already exists.` };

    const { error } = await gym.addExpenseCategory(trimmed);
    return error ? failure(error, 'Failed to save the category.') : { success: true, category: trimmed };
  }, [gym, allExpenseCategories]);

  // ===========================================================================
  // ACTION: Monthly Account Closing
  // ===========================================================================
  const isMonthClosed = useCallback((monthKey) => {
    return Boolean(closedMonths[monthKey]?.isClosed);
  }, [closedMonths]);

  const closeMonth = useCallback(async ({ monthKey, notes = '', closedBy }) => {
    if (closedMonths[monthKey]?.isClosed) {
      return { success: false, error: `Month ${monthKey} is already finalized and closed.` };
    }

    // Snapshot current metrics for the closing period
    const monthInvoices = invoices.filter((i) => (i.date || '').startsWith(monthKey));
    const monthPayments = allPayments.filter((p) => (p.date || '').startsWith(monthKey));
    const monthExpenses = expenses.filter((e) => (e.date || '').startsWith(monthKey));

    const totalInvoiced = monthInvoices.reduce((s, i) => s + (Number(i.netPayable) || 0), 0);
    const totalCollected = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const outstandingDues = monthInvoices.reduce((s, i) => s + (Number(i.dueAmount) || 0), 0);
    const totalExpenses = monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const { error } = await gym.closeMonth({
      monthKey,
      closedByName: closedBy || staff?.name,
      notes: notes || 'Monthly account closed after complete reconciliation review.',
      summary: {
        totalInvoiced,
        totalCollected,
        outstandingDues,
        totalExpenses,
        netProfit: totalCollected - totalExpenses,
      },
    });
    return error ? failure(error, 'Failed to close the month.') : { success: true };
  }, [gym, staff, closedMonths, invoices, allPayments, expenses]);

  // Check if a transaction date belongs to a finalized closed period
  const checkPeriodEditable = useCallback((dateStr) => {
    if (!dateStr) return { editable: true };
    const monthKey = dateStr.slice(0, 7);
    if (closedMonths[monthKey]?.isClosed) {
      return {
        editable: false,
        monthKey,
        closedRecord: closedMonths[monthKey],
        message: `This record belongs to a finalized closed accounting period (${monthKey}). Direct modifications are locked to preserve audit integrity.`,
      };
    }
    return { editable: true };
  }, [closedMonths]);

  const addPeriodAdjustment = useCallback(async ({ monthKey, type, amount, reason, authorizedBy }) => {
    const { error } = await gym.addPeriodAdjustment({
      monthKey,
      type,
      amount: Number(amount) || 0,
      reason,
      authorizedBy: authorizedBy || staff?.name,
    });
    return error ? failure(error, 'Failed to save the adjustment.') : { success: true };
  }, [gym, staff]);

  // ===========================================================================
  // Operating Expenses Operations
  // ===========================================================================
  // Returns a failure result when any of the dates is in a closed month.
  const lockedResult = useCallback((...dates) => {
    for (const d of dates) {
      const check = checkPeriodEditable(d);
      if (!check.editable) return { success: false, error: check.message, isPeriodClosed: true };
    }
    return null;
  }, [checkPeriodEditable]);

  const addExpense = useCallback(async (expenseData) => {
    const date = expenseData.date || today;
    const locked = lockedResult(date);
    if (locked) return locked;

    const { error } = await gym.addExpense({
      ...expenseData,
      amount: Math.max(0, Number(expenseData.amount) || 0),
      category: expenseData.category || 'Miscellaneous & Administration',
      method: expenseData.method || 'BANK',
      date,
    });
    return error ? failure(error, 'Failed to save the expense.') : { success: true };
  }, [gym, lockedResult, today]);

  const updateExpense = useCallback(async (id, updatedFields) => {
    const existing = expenses.find((e) => e.id === id);
    const locked = lockedResult(existing?.date, updatedFields.date);
    if (locked) return locked;

    const { error } = await gym.updateExpense(id, updatedFields);
    return error ? failure(error, 'Failed to update the expense.') : { success: true };
  }, [gym, expenses, lockedResult]);

  const deleteExpense = useCallback(async (id) => {
    const existing = expenses.find((e) => e.id === id);
    const locked = lockedResult(existing?.date);
    if (locked) return locked;

    const { error } = await gym.deleteExpense(id);
    return error ? failure(error, 'Failed to delete the expense.') : { success: true };
  }, [gym, expenses, lockedResult]);

  const value = {
    today,

    // Raw Lists
    invoices,
    expenses,
    refunds,
    paymentMethods,
    packages,
    allPayments,

    // Filtered Lists & Categories
    filteredInvoices,
    filteredPayments,
    filteredExpenses,
    filteredRefunds,
    memberDues,
    upcomingDues,
    todayDues,
    overdueDues,
    extendedDues,
    clearedDues,
    overdueCount,
    revenueRecognitionSchedules,

    // Categories
    allExpenseCategories,
    addCustomExpenseCategory,

    // Metrics & Summaries
    financialMetrics,
    paymentMethodSummary,

    // Global Date Filter State
    dateFilterKey,
    setDateFilterKey,
    customDateRange,
    setCustomDateRange,
    activeDateRange,
    resetFilters,

    // Revenue Policy
    recognitionPolicy,
    setRecognitionPolicy,

    // Persistent Overdue Reminder Notification
    showOverduePopup,
    setShowOverduePopup,

    extendDueDate,

    // Monthly Closing
    closedMonths,
    closeMonth,
    isMonthClosed,
    checkPeriodEditable,
    periodAdjustments,
    addPeriodAdjustment,

    // Financial Actions
    recordPayment,
    addExpense,
    updateExpense,
    deleteExpense,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
