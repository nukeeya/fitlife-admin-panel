import { useState, useEffect } from 'react';
import { DollarSign, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../../common/Modal';
import { EXPENSE_CATEGORIES } from '../../../data/financeMockData';
import { useFinance } from '../../../context/FinanceContext';
import { REFERENCE_TODAY } from '../../../utils/financeCalculators';

export default function ExpenseFormModal({
  isOpen,
  onClose,
  expenseToEdit = null,
}) {
  const { paymentMethods, addDemoExpense, updateDemoExpense } = useFinance();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(REFERENCE_TODAY);
  const [approvalStatus, setApprovalStatus] = useState('Approved');
  const [approvedBy, setApprovedBy] = useState('Accounts Lead');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const isEditing = Boolean(expenseToEdit);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title || '');
      setCategory(expenseToEdit.category || EXPENSE_CATEGORIES[0]);
      setAmount(String(expenseToEdit.amount || ''));
      setMethod(expenseToEdit.method || 'Bank Transfer');
      setVendor(expenseToEdit.vendor || '');
      setDate(expenseToEdit.date || REFERENCE_TODAY);
      setApprovalStatus(expenseToEdit.approvalStatus || 'Approved');
      setApprovedBy(expenseToEdit.approvedBy || 'Accounts Lead');
      setNotes(expenseToEdit.notes || '');
      setError('');
    } else {
      setTitle('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setAmount('');
      setMethod('Bank Transfer');
      setVendor('');
      setDate(REFERENCE_TODAY);
      setApprovalStatus('Approved');
      setApprovedBy('Accounts Lead');
      setNotes('');
      setError('');
    }
  }, [expenseToEdit, isOpen]);

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

    if (isEditing) {
      updateDemoExpense(expenseToEdit.id, payload);
    } else {
      addDemoExpense(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense Record (Demo)' : 'Log New Operating Expense (Demo)'}
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
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={15} />
            {error}
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
            <label className="form-label">Category *</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
