/**
 * FitLife Enterprise Gym - Finance State Management
 * Scope: FRONTEND DEMO ONLY
 * Centralized React Context providing synchronized financial state,
 * dynamic dues tracking, one-time due extensions, controllable demo date,
 * overdue reminder notifications, monthly account closing, and custom expense categories.
 */
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_REFUNDS,
  PAYMENT_METHODS,
  DEMO_PACKAGES,
  EXPENSE_CATEGORIES,
} from '../data/financeMockData';
import { MOCK_MEMBERS } from '../data/mockProfiles';
import {
  getDateRange,
  isDateInRange,
  calculateDaysOverdue,
  calculateRevenueRecognition,
} from '../utils/financeCalculators';

const FinanceContext = createContext(null);

// Default reference simulation date (Current demo date: 22 October 2026)
export const DEFAULT_DEMO_DATE = '2026-10-22';

export function FinanceProvider({ children }) {
  // Controllable Demo Simulation Date
  const [demoDate, setDemoDate] = useState(DEFAULT_DEMO_DATE);

  // Invoices (enriched with member photos from MOCK_MEMBERS)
  const [invoices, setInvoices] = useState(() => {
    const memberMap = new Map();
    MOCK_MEMBERS.forEach((m) => {
      memberMap.set(m.code, m);
      memberMap.set(m.name.toLowerCase(), m);
    });

    return INITIAL_INVOICES.map((inv) => {
      const match = memberMap.get(inv.memberCode) || memberMap.get(inv.memberName.toLowerCase());
      return {
        ...inv,
        memberAvatar: match?.avatar || inv.memberAvatar || null,
        isExtended: Boolean(inv.isExtended),
        extensionHistory: inv.extensionHistory || [],
      };
    });
  });

  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [refunds, setRefunds] = useState(INITIAL_REFUNDS);
  const [paymentMethods] = useState(PAYMENT_METHODS);
  const [packages] = useState(DEMO_PACKAGES);

  // Custom Expense Categories
  const [customCategories, setCustomCategories] = useState([
    'Sauna & Steam Maintenance',
    'Biometric & RFID Hardware',
  ]);

  // One-time Due Extensions Record: { [invoiceId]: { originalDueDate, extendedDueDate, reason, extendedAt, extendedBy } }
  const [oneTimeExtensions, setOneTimeExtensions] = useState({});

  // Monthly Account Closing Simulation State
  // { '2026-08': { isClosed: true, closedAt: 'Aug 31, 2026', closedBy: 'Tahmina Akhter (Finance Lead)', notes: 'Audited' } }
  const [closedMonths, setClosedMonths] = useState({
    '2026-08': {
      isClosed: true,
      closedAt: '2026-08-31 23:59',
      closedBy: 'Tahmina Akhter (Finance Lead)',
      notes: 'August 2026 monthly closing reconciled and audit sealed.',
      financialSummary: {
        totalInvoiced: 215000,
        totalCollected: 198000,
        outstandingDues: 17000,
        totalExpenses: 84000,
        netProfit: 114000,
      },
    },
  });

  // Demo audit adjustments for closed periods
  const [periodAdjustments, setPeriodAdjustments] = useState({});

  // Overdue Reminder Modal popup visibility
  const [showOverduePopup, setShowOverduePopup] = useState(false);

  // Global Date Filter State
  const [dateFilterKey, setDateFilterKey] = useState('this_month'); // default: October 2026
  const [customDateRange, setCustomDateRange] = useState({
    start: '2026-10-01',
    end: '2026-10-31',
  });

  // Revenue Recognition Policy: 'equal_monthly' | 'service_days'
  const [recognitionPolicy, setRecognitionPolicy] = useState('equal_monthly');

  // Compute Active Date Range
  const activeDateRange = useMemo(() => {
    return getDateRange(dateFilterKey, customDateRange, demoDate);
  }, [dateFilterKey, customDateRange, demoDate]);

  // All combined Expense Categories
  const allExpenseCategories = useMemo(() => {
    const set = new Set([...EXPENSE_CATEGORIES, ...customCategories]);
    return Array.from(set);
  }, [customCategories]);

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

  // Date-filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.date, activeDateRange));
  }, [expenses, activeDateRange]);

  // Date-filtered Refunds
  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => isDateInRange(r.date, activeDateRange));
  }, [refunds, activeDateRange]);

  // Member Dues Ledger (computes overdue days against controllable demoDate)
  const memberDues = useMemo(() => {
    return invoices.map((inv) => {
      const daysOverdue = calculateDaysOverdue(inv.dueDate, inv.dueAmount, demoDate);
      const isOverdue = daysOverdue > 0 && inv.dueAmount > 0;

      let effectiveStatus = inv.status;
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
  }, [invoices, demoDate]);

  // Categorized Dues Slices for Tabbed Due Reminder Dashboard
  const upcomingDues = useMemo(() => {
    return memberDues.filter(
      (d) => d.dueAmount > 0 && d.dueDate > demoDate && !d.isExtended
    );
  }, [memberDues, demoDate]);

  const todayDues = useMemo(() => {
    return memberDues.filter(
      (d) => d.dueAmount > 0 && d.dueDate === demoDate
    );
  }, [memberDues, demoDate]);

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
        asOfDate: demoDate,
        method: recognitionPolicy,
      });

      return {
        ...inv,
        recognition,
      };
    });
  }, [invoices, recognitionPolicy, demoDate]);

  // Financial Metrics (Accurate, strictly reconciled across all tabs)
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
      const methodPayments = filteredPayments.filter(
        (p) => p.methodId === method.id || p.method?.toLowerCase() === method.name.toLowerCase()
      );
      const totalAmount = methodPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const count = methodPayments.length;
      const methodRefunds = filteredRefunds.filter(
        (r) => r.methodId === method.id || r.method?.toLowerCase() === method.name.toLowerCase()
      );
      const refundAmount = methodRefunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const netCollection = Math.max(0, totalAmount - refundAmount);

      return {
        ...method,
        totalAmount,
        count,
        refundCount: methodRefunds.length,
        refundAmount,
        netCollection,
        transactions: methodPayments,
      };
    });
  }, [paymentMethods, filteredPayments, filteredRefunds]);

  // ===========================================================================
  // ACTION: Record Demo Payment (simulates partial or full settlement)
  // ===========================================================================
  const recordDemoPayment = useCallback(({
    invoiceId,
    amount,
    method = 'bKash',
    reference = '',
    notes = '',
    date = demoDate,
  }) => {
    const payNum = Math.max(0, Number(amount) || 0);
    if (!payNum) return { success: false, error: 'Invalid payment amount' };

    let updatedInvoice = null;
    let newPaymentObj = null;

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId && inv.number !== invoiceId) return inv;

        const effectivePay = Math.min(payNum, inv.dueAmount > 0 ? inv.dueAmount : inv.netPayable);
        const newPaid = inv.paidAmount + effectivePay;
        const newDue = Math.max(0, inv.netPayable - newPaid);
        const newStatus = newDue <= 0 ? 'Paid' : 'Partially Paid';

        const paymentMethodObj =
          paymentMethods.find((m) => m.name.toLowerCase() === method.toLowerCase()) || paymentMethods[1];

        newPaymentObj = {
          id: `pay-${Date.now()}`,
          receiptNumber: `REC-2026-0${Math.floor(100 + Math.random() * 900)}`,
          amount: effectivePay,
          method: paymentMethodObj.name,
          methodId: paymentMethodObj.id,
          reference: reference || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          date,
          notes: notes || 'Demo payment recorded',
          collectedBy: 'Reception Desk 1 (Demo)',
        };

        updatedInvoice = {
          ...inv,
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newStatus,
          payments: [...(inv.payments || []), newPaymentObj],
        };

        return updatedInvoice;
      })
    );

    return {
      success: true,
      updatedInvoice,
      newPayment: newPaymentObj,
    };
  }, [paymentMethods, demoDate]);

  // ===========================================================================
  // ACTION: One-Time Due-Date Extension
  // Enforces strict one-time policy: second attempt is rejected permanently.
  // ===========================================================================
  const extendDueDate = useCallback(({
    invoiceId,
    newDueDate,
    reason,
    adminName = 'Finance Director (Demo)',
  }) => {
    if (!newDueDate) {
      return { success: false, error: 'Please select a valid new due date.' };
    }
    if (!reason || !reason.trim()) {
      return { success: false, error: 'Extension reason is mandatory.' };
    }

    const target = invoices.find((i) => i.id === invoiceId || i.number === invoiceId);
    if (!target) {
      return { success: false, error: 'Invoice due record not found.' };
    }

    // Strict Enforcement of One-Time Extension Limit
    if (target.isExtended || oneTimeExtensions[target.id] || target.extensionHistory?.length > 0) {
      return {
        success: false,
        error: 'Extension Already Used: Only one due-date extension is permitted per mock record. Further extensions are permanently locked in this demo simulation.',
      };
    }

    if (newDueDate <= target.dueDate) {
      return {
        success: false,
        error: `New due date must be after the current deadline (${target.dueDate}).`,
      };
    }

    const extensionEntry = {
      id: `ext-${Date.now()}`,
      originalDueDate: target.dueDate,
      extendedDueDate: newDueDate,
      reason: reason.trim(),
      extendedAt: new Date().toISOString(),
      extendedBy: adminName,
    };

    let updatedInvoice = null;

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== target.id) return inv;
        updatedInvoice = {
          ...inv,
          dueDate: newDueDate,
          isExtended: true,
          extensionReason: reason.trim(),
          extendedAt: extensionEntry.extendedAt,
          extensionHistory: [...(inv.extensionHistory || []), extensionEntry],
        };
        return updatedInvoice;
      })
    );

    setOneTimeExtensions((prev) => ({
      ...prev,
      [target.id]: extensionEntry,
    }));

    return {
      success: true,
      updatedInvoice,
      extension: extensionEntry,
    };
  }, [invoices, oneTimeExtensions]);

  // ===========================================================================
  // ACTION: Admission Approval Invoice Integration
  // Automatically creates linked invoice, initial payment, & due record
  // ===========================================================================
  const addAdmissionInvoice = useCallback(({
    memberId,
    memberName,
    memberCode,
    memberPhone,
    memberAvatar,
    planId,
    planName,
    durationMonths = 3,
    baseAmount,
    discountAmount = 0,
    discountReason = '',
    netPayable,
    initialPayment,
    dueAmount,
    dueDate,
    paymentMethod = 'bKash',
    notes = '',
  }) => {
    const invNumber = `INV-2026-0${Math.floor(100 + Math.random() * 900)}`;
    const payNum = Math.max(0, Number(initialPayment) || 0);

    const initialPayObj = payNum > 0 ? {
      id: `pay-${Date.now()}`,
      receiptNumber: `REC-2026-0${Math.floor(100 + Math.random() * 900)}`,
      amount: payNum,
      method: paymentMethod,
      methodId: paymentMethod.toUpperCase(),
      reference: `ADM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      date: demoDate,
      notes: notes || 'Initial admission installment payment',
      collectedBy: 'Front Desk Admission Officer',
    } : null;

    const newInvoice = {
      id: `inv-${Date.now()}`,
      number: invNumber,
      memberId: String(memberId),
      memberName,
      memberCode,
      memberPhone,
      memberAvatar,
      planId,
      planName,
      durationMonths,
      startDate: demoDate,
      endDate: '2027-01-22',
      date: demoDate,
      dueDate: dueAmount > 0 ? (dueDate || '2026-10-25') : demoDate,
      baseAmount: Number(baseAmount),
      discountAmount: Number(discountAmount),
      discountReason,
      taxAmount: 0,
      netPayable: Number(netPayable),
      paidAmount: payNum,
      dueAmount: Math.max(0, Number(dueAmount)),
      status: dueAmount > 0 ? (payNum > 0 ? 'Partially Paid' : 'Unpaid') : 'Paid',
      isExtended: false,
      extensionHistory: [],
      payments: initialPayObj ? [initialPayObj] : [],
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    return {
      success: true,
      newInvoice,
    };
  }, [demoDate]);

  // ===========================================================================
  // ACTION: Custom Expense Categories
  // ===========================================================================
  const addCustomExpenseCategory = useCallback((categoryName) => {
    const trimmed = String(categoryName || '').trim();
    if (!trimmed) {
      return { success: false, error: 'Category name cannot be empty.' };
    }

    const allCats = [...EXPENSE_CATEGORIES, ...customCategories];
    const isDuplicate = allCats.some(
      (c) => c.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      return {
        success: false,
        error: `Category "${trimmed}" already exists (case-insensitive check).`,
      };
    }

    setCustomCategories((prev) => [...prev, trimmed]);
    return {
      success: true,
      category: trimmed,
    };
  }, [customCategories]);

  // ===========================================================================
  // ACTION: Monthly Account Closing
  // ===========================================================================
  const closeMonth = useCallback(({
    monthKey, // e.g. '2026-10'
    notes = '',
    closedBy = 'Imran Admin (Finance Director)',
  }) => {
    if (closedMonths[monthKey]?.isClosed) {
      return {
        success: false,
        error: `Month ${monthKey} is already finalized and closed in demo state.`,
      };
    }

    // Snapshot current metrics for the closing period
    const monthInvoices = invoices.filter((i) => (i.date || '').startsWith(monthKey));
    const monthPayments = allPayments.filter((p) => (p.date || '').startsWith(monthKey));
    const monthExpenses = expenses.filter((e) => (e.date || '').startsWith(monthKey));

    const totalInvoiced = monthInvoices.reduce((s, i) => s + (Number(i.netPayable) || 0), 0);
    const totalCollected = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const outstandingDues = monthInvoices.reduce((s, i) => s + (Number(i.dueAmount) || 0), 0);
    const totalExpenses = monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netProfit = totalCollected - totalExpenses;

    const closingRecord = {
      isClosed: true,
      closedAt: new Date().toISOString(),
      closedAtDisplay: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      closedBy,
      notes: notes || 'Monthly account closed after complete reconciliation review.',
      financialSummary: {
        totalInvoiced,
        totalCollected,
        outstandingDues,
        totalExpenses,
        netProfit,
      },
    };

    setClosedMonths((prev) => ({
      ...prev,
      [monthKey]: closingRecord,
    }));

    return {
      success: true,
      closingRecord,
    };
  }, [closedMonths, invoices, allPayments, expenses]);

  const isMonthClosed = useCallback((monthKey) => {
    return Boolean(closedMonths[monthKey]?.isClosed);
  }, [closedMonths]);

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

  // Demo Adjustment for a closed month
  const addPeriodAdjustment = useCallback(({
    monthKey,
    type,
    amount,
    reason,
    authorizedBy = 'Auditor Lead',
  }) => {
    const entry = {
      id: `adj-${Date.now()}`,
      monthKey,
      type, // 'credit' | 'debit' | 'reclassification'
      amount: Number(amount) || 0,
      reason,
      authorizedBy,
      date: demoDate,
      timestamp: new Date().toISOString(),
    };

    setPeriodAdjustments((prev) => ({
      ...prev,
      [monthKey]: [...(prev[monthKey] || []), entry],
    }));

    return { success: true, entry };
  }, [demoDate]);

  // ===========================================================================
  // Operating Expenses Operations
  // ===========================================================================
  const addDemoExpense = useCallback((expenseData) => {
    // Check if expense date falls in closed period
    const editCheck = checkPeriodEditable(expenseData.date || demoDate);
    if (!editCheck.editable) {
      return {
        success: false,
        error: editCheck.message,
        isPeriodClosed: true,
      };
    }

    const newExp = {
      id: `exp-${Date.now()}`,
      title: expenseData.title || 'Demo Expense',
      category: expenseData.category || 'Miscellaneous & Administration',
      amount: Math.max(0, Number(expenseData.amount) || 0),
      method: expenseData.method || 'Bank Transfer',
      methodId: expenseData.methodId || 'BANK',
      date: expenseData.date || demoDate,
      vendor: expenseData.vendor || 'Local Vendor',
      approvalStatus: expenseData.approvalStatus || 'Approved',
      approvedBy: expenseData.approvedBy || 'Accounts Lead',
      notes: expenseData.notes || '',
    };

    setExpenses((prev) => [newExp, ...prev]);
    return { success: true, newExpense: newExp };
  }, [checkPeriodEditable, demoDate]);

  const updateDemoExpense = useCallback((id, updatedFields) => {
    const existing = expenses.find((e) => e.id === id);
    if (existing) {
      const editCheck = checkPeriodEditable(existing.date);
      if (!editCheck.editable) {
        return { success: false, error: editCheck.message, isPeriodClosed: true };
      }
    }

    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updatedFields } : e))
    );
    return { success: true };
  }, [expenses, checkPeriodEditable]);

  const deleteDemoExpense = useCallback((id) => {
    const existing = expenses.find((e) => e.id === id);
    if (existing) {
      const editCheck = checkPeriodEditable(existing.date);
      if (!editCheck.editable) {
        return { success: false, error: editCheck.message, isPeriodClosed: true };
      }
    }

    setExpenses((prev) => prev.filter((e) => e.id !== id));
    return { success: true };
  }, [expenses, checkPeriodEditable]);

  // Reset to original mock state
  const resetToMockDefaults = useCallback(() => {
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
    setRefunds(INITIAL_REFUNDS);
    setDemoDate(DEFAULT_DEMO_DATE);
    setOneTimeExtensions({});
    setCustomCategories(['Sauna & Steam Maintenance', 'Biometric & RFID Hardware']);
  }, []);

  const value = {
    // Controllable Demo Date
    demoDate,
    setDemoDate,

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
    customCategories,
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

    // Revenue Policy
    recognitionPolicy,
    setRecognitionPolicy,

    // Persistent Overdue Reminder Notification
    showOverduePopup,
    setShowOverduePopup,

    // One-Time Due Date Extension
    oneTimeExtensions,
    extendDueDate,

    // Monthly Closing Simulation
    closedMonths,
    closeMonth,
    isMonthClosed,
    checkPeriodEditable,
    periodAdjustments,
    addPeriodAdjustment,

    // Financial Actions
    recordDemoPayment,
    addAdmissionInvoice,
    addDemoExpense,
    updateDemoExpense,
    deleteDemoExpense,
    resetToMockDefaults,
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
