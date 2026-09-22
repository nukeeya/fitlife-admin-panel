import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Receipt,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Tag,
  Printer,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import Modal from '../components/common/Modal';

export default function Accounts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'invoices'; // 'invoices' | 'payments' | 'expenses' | 'balance-sheet'

  const { invoices, expenses, collectPayment, addExpense, members, branding } = useGymData();
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Collection Modal
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bKASH');
  const [trxId, setTrxId] = useState('');

  // Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Equipment Maintenance');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseMethod, setExpenseMethod] = useState('BANK');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Balance Sheet Export Preview Modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Calculations for Monthly Balance Sheet
  const totalRevenue = invoices.reduce((sum, i) => sum + i.netPayable, 0);
  const totalCollected = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalDue = invoices.reduce((sum, i) => sum + i.dueAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDiscountsGiven = invoices.reduce((sum, i) => sum + i.discountAmount, 0);
  const netProfit = totalCollected - totalExpenses;

  const handleOpenPayment = (invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentAmount(invoice.dueAmount > 0 ? invoice.dueAmount : invoice.netPayable);
    setPaymentMethod('bKASH');
    setTrxId('');
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (selectedInvoiceForPayment && paymentAmount) {
      collectPayment({
        invoiceId: selectedInvoiceForPayment.id,
        amount: paymentAmount,
        method: paymentMethod,
        trxId,
      });
      setSelectedInvoiceForPayment(null);
    }
  };

  const handleRecordExpense = (e) => {
    e.preventDefault();
    if (expenseTitle && expenseAmount) {
      addExpense({
        title: expenseTitle,
        category: expenseCategory,
        amount: expenseAmount,
        method: expenseMethod,
        notes: expenseNotes,
      });
      setShowExpenseModal(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseNotes('');
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Accounts & Financial Management</h1>
          <p className="page-subtitle">
            Dynamic discounted revenue ledger, invoice issuance, expense auditing, and profit & loss balance sheet.
          </p>
        </div>

        <div className="subtabs-bar">
          <button
            className={`subtab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'invoices' })}
          >
            Invoice List
          </button>
          <button
            className={`subtab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'payments' })}
          >
            Payment Collection
          </button>
          <button
            className={`subtab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'expenses' })}
          >
            Expense Management
          </button>
          <button
            className={`subtab-btn ${activeTab === 'balance-sheet' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'balance-sheet' })}
          >
            Monthly Balance Sheet
          </button>
        </div>
      </div>

      {/* 1. INVOICE LIST SUBTAB */}
      {activeTab === 'invoices' && (
        <div className="activity-card">
          <div className="activity-header">
            <span style={{ fontWeight: 800 }}>Invoices & Dynamic Discount Audit</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Total Billed: ৳{totalRevenue.toLocaleString()}
            </span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Base Price</th>
                  <th>Applied Discount</th>
                  <th>Tax</th>
                  <th>Net Payable</th>
                  <th>Paid / Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{inv.number}</td>
                    <td>
                      <div className="member-cell-info">
                        <span className="member-cell-name">{inv.memberName}</span>
                        <span className="member-cell-code">{inv.memberCode}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{inv.planName}</span></td>
                    <td>৳{inv.baseAmount.toLocaleString()}</td>
                    <td>
                      {inv.discountAmount > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                            - ৳{inv.discountAmount.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {inv.discountReason}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td>৳{inv.taxAmount}</td>
                    <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      ৳{inv.netPayable.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <span style={{ color: '#10B981', fontWeight: 600 }}>Paid: ৳{inv.paidAmount}</span>
                        {inv.dueAmount > 0 && (
                          <span style={{ color: 'var(--danger)', display: 'block', fontWeight: 700 }}>
                            Due: ৳{inv.dueAmount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      {inv.dueAmount > 0 ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenPayment(inv)}
                        >
                          Collect Due
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>
                          ✓ Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PAYMENT COLLECTION SUBTAB */}
      {activeTab === 'payments' && (
        <div className="activity-card">
          <div className="activity-header">
            <span style={{ fontWeight: 800 }}>Payment Collection Receipts</span>
            <span className="badge badge-success">৳{totalCollected.toLocaleString()} Collected</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Receipt Ref</th>
                  <th>Invoice No</th>
                  <th>Member Name</th>
                  <th>Amount Paid</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.filter((i) => i.paidAmount > 0).map((inv, idx) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700 }}>REC-2026-00{10 + idx}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{inv.number}</td>
                    <td style={{ fontWeight: 700 }}>{inv.memberName}</td>
                    <td style={{ fontWeight: 800, color: '#10B981' }}>৳{inv.paidAmount.toLocaleString()}</td>
                    <td><span className="badge badge-primary">{inv.method}</span></td>
                    <td style={{ fontSize: '12px' }}>{inv.date}</td>
                    <td><span className="badge badge-success">Confirmed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. EXPENSE MANAGEMENT SUBTAB */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>
              Total Expenses Logged: ৳{totalExpenses.toLocaleString()}
            </span>
            <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
              <Plus size={16} />
              + Add New Expense
            </button>
          </div>

          <div className="activity-card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Expense Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Date</th>
                    <th>Approved By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: 700 }}>{exp.title}</td>
                      <td><span className="badge badge-info">{exp.category}</span></td>
                      <td style={{ fontWeight: 800, color: 'var(--danger)' }}>
                        ৳{exp.amount.toLocaleString()}
                      </td>
                      <td><span className="badge badge-primary">{exp.method}</span></td>
                      <td style={{ fontSize: '12px' }}>{exp.date}</td>
                      <td style={{ fontSize: '12px', fontWeight: 600 }}>{exp.approvedBy}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. MONTHLY BALANCE SHEET SUBTAB */}
      {activeTab === 'balance-sheet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="dashboard-metrics-grid">
            <div className="stat-widget">
              <span className="stat-widget-title">Total Revenue Billed</span>
              <div className="stat-widget-value primary-highlight">৳{totalRevenue.toLocaleString()}</div>
              <div className="stat-widget-sub">From {invoices.length} invoices</div>
            </div>

            <div className="stat-widget">
              <span className="stat-widget-title">Cash & Online Collected</span>
              <div className="stat-widget-value" style={{ color: '#10B981' }}>৳{totalCollected.toLocaleString()}</div>
              <div className="stat-widget-sub">Net liquid received</div>
            </div>

            <div className="stat-widget">
              <span className="stat-widget-title">Total Operational Expenses</span>
              <div className="stat-widget-value danger-highlight">৳{totalExpenses.toLocaleString()}</div>
              <div className="stat-widget-sub">Rent, bills, repairs, stock</div>
            </div>

            <div className="stat-widget">
              <span className="stat-widget-title">Net Operating Profit</span>
              <div className="stat-widget-value" style={{ color: netProfit >= 0 ? '#10B981' : 'var(--danger)' }}>
                ৳{netProfit.toLocaleString()}
              </div>
              <div className="stat-widget-sub">Collected minus expenses</div>
            </div>
          </div>

          {/* Balance Sheet Breakdown Table */}
          <div className="activity-card">
            <div className="activity-header">
              <span style={{ fontWeight: 800 }}>August - September 2026 Profit & Loss Breakdown</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReportModal(true)}>
                <Download size={14} /> View / Export Report
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ledger Item</th>
                    <th>Category</th>
                    <th>Credit (+)</th>
                    <th>Debit (-)</th>
                    <th>Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Membership Admissions & Package Invoices</td>
                    <td><span className="badge badge-success">Income</span></td>
                    <td style={{ color: '#10B981', fontWeight: 700 }}>+ ৳{totalCollected.toLocaleString()}</td>
                    <td>—</td>
                    <td style={{ fontWeight: 700 }}>৳{totalCollected.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Promotional Dynamic Discounts Awarded</td>
                    <td><span className="badge badge-warning">Discount Cost</span></td>
                    <td>—</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 700 }}>- ৳{totalDiscountsGiven.toLocaleString()}</td>
                    <td style={{ color: 'var(--text-muted)' }}>Non-Cash</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Facility Utilities, Maintenance & Supplements</td>
                    <td><span className="badge badge-danger">Expense</span></td>
                    <td>—</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 700 }}>- ৳{totalExpenses.toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>- ৳{totalExpenses.toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: 'var(--bg-surface)', fontWeight: 800 }}>
                    <td colSpan="4" style={{ fontSize: '15px' }}>NET SURPLUS (PROFIT):</td>
                    <td style={{ fontSize: '18px', color: '#10B981' }}>৳{netProfit.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      <Modal
        isOpen={!!selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        title={selectedInvoiceForPayment ? `Collect Payment: ${selectedInvoiceForPayment.number}` : 'Collect Payment'}
        subtitle={selectedInvoiceForPayment ? `Member: ${selectedInvoiceForPayment.memberName}` : ''}
        icon={Receipt}
        size="sm"
      >
        {selectedInvoiceForPayment && (
          <form onSubmit={handleRecordPayment}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--border-base)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><strong>Member:</strong> {selectedInvoiceForPayment.memberName}</div>
                <div><strong>Code:</strong> {selectedInvoiceForPayment.memberCode}</div>
                <div><strong>Net Payable:</strong> ৳{selectedInvoiceForPayment.netPayable.toLocaleString()}</div>
                <div><strong>Current Due:</strong> <span style={{ color: 'var(--danger)', fontWeight: 700 }}>৳{selectedInvoiceForPayment.dueAmount.toLocaleString()}</span></div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Collection Amount (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoiceForPayment.dueAmount}
                  className="form-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Channel</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="bKASH">bKASH Merchant Payment</option>
                  <option value="CASH">Cash Over Counter</option>
                  <option value="CARD">Debit / Credit Card POS</option>
                  <option value="BANK">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TRX-904128"
                  className="form-input"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Payment Receipt
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Record Operating Expense"
        subtitle="Log operational expenditures, utility bills, maintenance or staff salaries"
        icon={CreditCard}
        size="md"
      >
        <form onSubmit={handleRecordExpense}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Expense Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Treadmill Belt Lubricant & Service"
                className="form-input"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                >
                  <option value="Equipment Maintenance">Equipment Maintenance</option>
                  <option value="Utilities">Utilities (Electricity/Water)</option>
                  <option value="Supplements">Supplements & Whey</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Maintenance">Cleaning & Towel Supplies</option>
                  <option value="Salaries">Staff Salaries / Payroll</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 15000"
                  className="form-input"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Channel</label>
              <select
                className="form-select"
                value={expenseMethod}
                onChange={(e) => setExpenseMethod(e.target.value)}
              >
                <option value="BANK">Bank Wire</option>
                <option value="CASH">Petty Cash</option>
                <option value="CARD">Corporate Card</option>
                <option value="bKASH">bKASH Merchant</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Expense Notes</label>
              <textarea
                rows="2"
                placeholder="Additional vendor receipt details or memo..."
                className="form-textarea"
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowExpenseModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save & Log Expense
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Balance Sheet Statement Export Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={`${branding?.gymName || 'FitLife'} Financial Statement & Dossier`}
        subtitle="Audited breakdown of revenues, member dynamic discounts, and operating net profits"
        icon={FileSpreadsheet}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                window.print();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Print / Export PDF
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-base)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>GROSS COLLECTED</span>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
                ৳{totalCollected.toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-base)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL EXPENSES</span>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--danger)', marginTop: '4px' }}>
                ৳{totalExpenses.toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-base)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>NET OPERATING SURPLUS</span>
              <div style={{ fontSize: '20px', fontWeight: 900, color: netProfit >= 0 ? 'var(--primary)' : 'var(--danger)', marginTop: '4px' }}>
                ৳{netProfit.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            This statement documents all settled invoices, dynamic discount vouchers authorized under RBAC guidelines, and operating expenditures for the current fiscal period.
          </div>

          <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-base)', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-base)' }}>
              <span>Total Member Invoices Issued:</span>
              <span style={{ fontWeight: 700 }}>{invoices.length} Invoices</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-base)' }}>
              <span>Outstanding Receivable Member Dues:</span>
              <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                ৳{invoices.reduce((sum, i) => sum + i.dueAmount, 0).toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>RBAC Promotional Discounts Granted:</span>
              <span style={{ fontWeight: 700, color: 'var(--warning)' }}>
                ৳{totalDiscountsGiven.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
