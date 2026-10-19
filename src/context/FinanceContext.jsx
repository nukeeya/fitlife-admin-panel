/**
 * FitLife Enterprise Gym - Finance State Management
 * Scope: FRONTEND DEMO ONLY
 * Centralized React Context providing synchronized financial state,
 * date-filtered views, dues tracking, partial-payment simulation,
 * revenue recognition, and reconciled balance sheets.
 */
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_REFUNDS,
  PAYMENT_METHODS,
  DEMO_PACKAGES,
} from '../data/financeMockData';
import {
  REFERENCE_TODAY,
  getDateRange,
  isDateInRange,
  calculateDaysOverdue,
  calculateRevenueRecognition,
} from '../utils/financeCalculators';

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [refunds, setRefunds] = useState(INITIAL_REFUNDS);
  const [paymentMethods] = useState(PAYMENT_METHODS);
  const [packages] = useState(DEMO_PACKAGES);

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
    return getDateRange(dateFilterKey, customDateRange, REFERENCE_TODAY);
  }, [dateFilterKey, customDateRange]);

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

  // Member Dues Ledger (computes overdue days against REFERENCE_TODAY)
  const memberDues = useMemo(() => {
    return invoices.map((inv) => {
      const daysOverdue = calculateDaysOverdue(inv.dueDate, inv.dueAmount, REFERENCE_TODAY);
      const isOverdue = daysOverdue > 0;
      let effectiveStatus = inv.status;
      if (inv.dueAmount > 0 && isOverdue) {
        effectiveStatus = 'Overdue';
      }

      return {
        ...inv,
        daysOverdue,
        effectiveStatus,
      };
    });
  }, [invoices]);

  // Dynamic Revenue Recognition Schedules for all invoices
  const revenueRecognitionSchedules = useMemo(() => {
    return invoices.map((inv) => {
      const recognition = calculateRevenueRecognition({
        packagePrice: inv.baseAmount,
        discountAmount: inv.discountAmount,
        startDate: inv.startDate || inv.date,
        endDate: inv.endDate || inv.date,
        asOfDate: REFERENCE_TODAY,
        method: recognitionPolicy,
      });

      return {
        ...inv,
        recognition,
      };
    });
  }, [invoices, recognitionPolicy]);

  // Financial Metrics (Accurate, strictly reconciled across all tabs)
  const financialMetrics = useMemo(() => {
    // Invoicing & Dues
    const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + (Number(i.netPayable) || 0), 0);
    const totalBasePrice = filteredInvoices.reduce((sum, i) => sum + (Number(i.baseAmount) || 0), 0);
    const totalDiscounts = filteredInvoices.reduce((sum, i) => sum + (Number(i.discountAmount) || 0), 0);

    // Global Dues (all unpaid balances currently on the books)
    const outstandingDues = invoices.reduce((sum, i) => sum + (Number(i.dueAmount) || 0), 0);
    const overdueDues = memberDues
      .filter((d) => d.effectiveStatus === 'Overdue')
      .reduce((sum, d) => sum + (Number(d.dueAmount) || 0), 0);

    // Cash collections in selected period
    const totalCollected = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalRefunds = filteredRefunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const netCashCollected = Math.max(0, totalCollected - totalRefunds);

    // Expenses in selected period
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Accrual Revenue Recognition for the selected period
    // Sum the monthly allocation that falls within the activeDateRange for all active packages
    let recognizedRevenue = 0;
    let deferredRevenue = 0;

    revenueRecognitionSchedules.forEach(({ recognition }) => {
      deferredRevenue += recognition.deferredRevenue;
      // Find allocations that fall within activeDateRange
      recognition.monthlySchedule.forEach((m) => {
        // If month is in range, add to recognizedRevenue
        const monthStart = `${m.monthKey}-01`;
        if (monthStart >= activeDateRange.start.slice(0, 7) + '-01' && monthStart <= activeDateRange.end) {
          recognizedRevenue += m.allocatedRevenue;
        }
      });
    });

    recognizedRevenue = Math.round(recognizedRevenue * 100) / 100;
    deferredRevenue = Math.round(deferredRevenue * 100) / 100;

    // Operating Profit
    // Cash Net Result = Cash collected - Expenses
    const cashNetProfit = netCashCollected - totalExpenses;
    // Accrual Net Operating Profit = Recognized revenue - Expenses
    const accrualNetProfit = recognizedRevenue - totalExpenses;

    return {
      totalInvoiced,
      totalBasePrice,
      totalDiscounts,
      totalCollected,
      totalRefunds,
      netCashCollected,
      outstandingDues,
      overdueDues,
      recognizedRevenue,
      deferredRevenue,
      totalExpenses,
      cashNetProfit,
      accrualNetProfit,
    };
  }, [filteredInvoices, filteredPayments, filteredRefunds, filteredExpenses, invoices, memberDues, revenueRecognitionSchedules, activeDateRange]);

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

  // Record a partial or full demo payment
  const recordDemoPayment = useCallback(({
    invoiceId,
    amount,
    method = 'bKash',
    reference = '',
    notes = '',
    date = REFERENCE_TODAY,
  }) => {
    const payNum = Math.max(0, Number(amount) || 0);
    if (!payNum) return { success: false, error: 'Invalid payment amount' };

    let updatedInvoice = null;
    let newPaymentObj = null;

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;

        const effectivePay = Math.min(payNum, inv.dueAmount > 0 ? inv.dueAmount : inv.netPayable);
        const newPaid = inv.paidAmount + effectivePay;
        const newDue = Math.max(0, inv.netPayable - newPaid);
        const newStatus = newDue <= 0 ? 'Paid' : 'Partially Paid';

        const paymentMethodObj = paymentMethods.find((m) => m.name.toLowerCase() === method.toLowerCase()) || paymentMethods[1];

        newPaymentObj = {
          id: `pay-${Date.now()}`,
          receiptNumber: `REC-2026-0${Math.floor(100 + Math.random() * 900)}`,
          amount: effectivePay,
          method: paymentMethodObj.name,
          methodId: paymentMethodObj.id,
          reference: reference || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          date,
          notes: notes || 'Demo partial payment received',
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
  }, [paymentMethods]);

  // Add Demo Expense
  const addDemoExpense = useCallback((expenseData) => {
    const newExp = {
      id: `exp-${Date.now()}`,
      title: expenseData.title || 'Demo Expense',
      category: expenseData.category || 'Miscellaneous & Administration',
      amount: Math.max(0, Number(expenseData.amount) || 0),
      method: expenseData.method || 'Bank Transfer',
      methodId: expenseData.methodId || 'BANK',
      date: expenseData.date || REFERENCE_TODAY,
      vendor: expenseData.vendor || 'Local Vendor',
      approvalStatus: expenseData.approvalStatus || 'Approved',
      approvedBy: expenseData.approvedBy || 'Accounts Lead',
      notes: expenseData.notes || '',
    };

    setExpenses((prev) => [newExp, ...prev]);
    return { success: true, newExpense: newExp };
  }, []);

  // Edit Demo Expense
  const updateDemoExpense = useCallback((id, updatedFields) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updatedFields } : e))
    );
  }, []);

  // Delete Demo Expense
  const deleteDemoExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Reset to original mock state
  const resetToMockDefaults = useCallback(() => {
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
    setRefunds(INITIAL_REFUNDS);
  }, []);

  const value = {
    // Raw lists
    invoices,
    expenses,
    refunds,
    paymentMethods,
    packages,
    allPayments,

    // Filtered lists
    filteredInvoices,
    filteredPayments,
    filteredExpenses,
    filteredRefunds,
    memberDues,
    revenueRecognitionSchedules,

    // Metrics & Summaries
    financialMetrics,
    paymentMethodSummary,

    // Date Filter State
    dateFilterKey,
    setDateFilterKey,
    customDateRange,
    setCustomDateRange,
    activeDateRange,

    // Policy
    recognitionPolicy,
    setRecognitionPolicy,

    // Actions
    recordDemoPayment,
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
