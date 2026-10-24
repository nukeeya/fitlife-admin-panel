import { useState, useEffect } from 'react';
import { DollarSign, Plus, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import Modal from '../../common/Modal';
import { useFinance } from '../../../context/FinanceContext';

export default function ExpenseFormModal({
  isOpen,
  onClose,
  expenseToEdit = null,
}) {
  const {
    paymentMethods,
    allExpenseCategories,
    addCustomExpenseCategory,
    addDemoExpense,
    updateDemoExpense,
    checkPeriodEditable,
    demoDate,
  } = useFinance();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(allExpenseCategories[0] || 'Rent & Facility Lease');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(demoDate);
  const [approvalStatus, setApprovalStatus] = useState('Approved');
  const [approvedBy, setApprovedBy] = useState('Accounts Lead');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Inline Custom Category Creation
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCatError, setCustomCatError] = useState('');

  const isEditing = Boolean(expenseToEdit);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title || '');
      setCategory(expenseToEdit.category || allExpenseCategories[0]);
      setAmount(String(expenseToEdit.amount || ''));
      setMethod(expenseToEdit.method || 'Bank Transfer');
      setVendor(expenseToEdit.vendor || '');
      setDate(expenseToEdit.date || demoDate);
      setApprovalStatus(expenseToEdit.approvalStatus || 'Approved');
      setApprovedBy(expenseToEdit.approvedBy || 'Accounts Lead');
      setNotes(expenseToEdit.notes || '');
      setError('');
    } else {
      setTitle('');
      setCategory(allExpenseCategories[0] || 'Rent & Facility Lease');
      setAmount('');
      setMethod('Bank Transfer');
      setVendor('');
      setDate(demoDate);
      setApprovalStatus('Approved');
      setApprovedBy('Accounts Lead');
      setNotes('');
      setError('');
    }
    setIsAddingCustomCategory(false);
    setNewCategoryName('');
    setCustomCatError('');
  }, [expenseToEdit, isOpen, demoDate, allExpenseCategories]);

  // Handle Category select change
  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      setIsAddingCustomCategory(true);
      setNewCategoryName('');
      setCustomCatError('');
    } else {
      setCategory(val);
    }
  };

  // Save new custom category
  const handleSaveCustomCategory = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomCatError('');

    const res = addCustomExpenseCategory(newCategoryName);
    if (!res.success) {
      setCustomCatError(res.error);
      return;
    }

    setCategory(res.category);
    setIsAddingCustomCategory(false);
    setNewCategoryName('');
  };

  const handleCancelCustomCategory = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingCustomCategory(false);
    setNewCategoryName('');
    setCustomCatError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!title.trim()) {
      setError('Please provide an expense title.');
      return;
    }
    if (!num || num <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    // Check if accounting month is locked / finalized
    const periodCheck = checkPeriodEditable(date);
    if (!periodCheck.editable) {
      setError(`Cannot record expense: ${periodCheck.message}`);
      return;
    }

    const payload = {
      title: title.trim(),
      category,
      amount: num,
      method,
      vendor: vendor.trim() || 'General Supplier',
      date,
      approvalStatus,
      approvedBy: approvedBy.trim() || 'Internal Admin',
      notes: notes.trim(),
    };

    let result;
    if (isEditing) {
      result = updateDemoExpense(expenseToEdit.id, payload);
    } else {
      result = addDemoExpense(payload);
    }

    if (result && !result.success) {
      setError(result.error);
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense Record' : 'Log New Operating Expense'}
      subtitle="Track gym facility rent, salaries, utilities, equipment repair and supplies"
      icon={DollarSign}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="expense-form" className="btn btn-primary">
            <CheckCircle2 size={16} />
            {isEditing ? 'Save Changes' : 'Record Expense'}
          </button>
        </div>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="form-label">Expense Title / Description *</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Monthly Electricity Bill (DESCO)"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>Category *</label>
              {!isAddingCustomCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCategory(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  + Add Custom
                </button>
              )}
            </div>

            {isAddingCustomCategory ? (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '32px', fontSize: '12px' }}
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                />

                {customCatError && (
                  <span style={{ fontSize: '10px', color: 'var(--danger)' }}>
                    {customCatError}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
                    onClick={handleCancelCustomCategory}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
                    onClick={handleSaveCustomCategory}
                  >
                    Save Category
                  </button>
                </div>
              </div>
            ) : (
              <select
                className="form-control"
                value={category}
                onChange={handleCategoryChange}
                required
              >
                {allExpenseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__ADD_NEW__" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                  + Add Custom Category
                </option>
              </select>
            )}
          </div>

          <div>
            <label className="form-label">Amount (BDT) *</label>
            <input
              type="number"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 15000"
              min="1"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label">Payment Channel *</label>
            <select
              className="form-control"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Expense Date *</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label">Vendor / Supplier</label>
            <input
              type="text"
              className="form-control"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. TechnoGym Service BD"
            />
          </div>

          <div>
            <label className="form-label">Approved By</label>
            <input
              type="text"
              className="form-control"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              placeholder="e.g. Operations Director"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label">Approval Status</label>
            <select
              className="form-control"
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value)}
            >
              <option value="Approved">Approved</option>
              <option value="Pending">Pending Review</option>
            </select>
          </div>

          <div>
            <label className="form-label">Notes & Ref</label>
            <input
              type="text"
              className="form-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Voucher #EXP-992"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
