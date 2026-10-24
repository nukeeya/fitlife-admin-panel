import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT, formatDatePretty } from '../../utils/financeCalculators';
import { exportReportToExcel } from '../../utils/excelExporter';
import FinanceDateFilterBar from './FinanceDateFilterBar';
import ExpenseFormModal from './modals/ExpenseFormModal';

export default function ExpenseManagementTab() {
  const { filteredExpenses, deleteExpense, activeDateRange, allExpenseCategories } = useFinance();

  const handleDelete = async (exp) => {
    if (!window.confirm(`Delete expense "${exp.title}"? This cannot be undone.`)) return;
    const res = await deleteExpense(exp.id);
    if (!res.success) alert(res.error);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  // Filtered expenses
  const displayedExpenses = useMemo(() => {
    return filteredExpenses.filter((exp) => {
      const matchSearch =
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat =
        selectedCategory === 'ALL' || exp.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchStatus =
        selectedStatus === 'ALL' || exp.approvalStatus.toLowerCase() === selectedStatus.toLowerCase();

      return matchSearch && matchCat && matchStatus;
    });
  }, [filteredExpenses, searchTerm, selectedCategory, selectedStatus]);

  const totalExpenseAmount = displayedExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const approvedTotal = displayedExpenses
    .filter((e) => e.approvalStatus === 'Approved')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const pendingTotal = displayedExpenses
    .filter((e) => e.approvalStatus === 'Pending')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Excel Export
  const handleExportExcel = () => {
    const columns = [
      { key: 'title', label: 'Expense Title' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount (BDT)' },
      { key: 'method', label: 'Payment Channel' },
      { key: 'date', label: 'Date' },
      { key: 'vendor', label: 'Vendor / Payee' },
      { key: 'approvalStatus', label: 'Approval Status' },
      { key: 'approvedBy', label: 'Approved By' },
      { key: 'notes', label: 'Notes' },
    ];

    exportReportToExcel({
      filename: `gym-expenses-${activeDateRange.start}-to-${activeDateRange.end}.xlsx`,
      reportTitle: 'Operating Expenses Ledger',
      dateRangeLabel: activeDateRange.label,
      columns,
      rows: displayedExpenses,
      summaryTotals: {
        title: 'TOTAL EXPENSES',
        amount: formatBDT(totalExpenseAmount),
      },
      sheetName: 'Expenses',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <FinanceDateFilterBar showReset={false} />

      {/* Summary KPI Cards */}
      <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-widget">
          <span className="stat-widget-title">Total Operating Outflows</span>
          <div className="stat-widget-value danger-highlight">
            {formatBDT(totalExpenseAmount)}
          </div>
          <div className="stat-widget-sub">{displayedExpenses.length} expense items in view</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Approved & Disbursed</span>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>
            {formatBDT(approvedTotal)}
          </div>
          <div className="stat-widget-sub">Settled out of operational accounts</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Pending Approvals</span>
          <div className="stat-widget-value" style={{ color: '#F59E0B' }}>
            {formatBDT(pendingTotal)}
          </div>
          <div className="stat-widget-sub">Awaiting director authorization</div>
        </div>
      </div>

      {/* Action bar & Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search expense, vendor, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
          />
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: 'auto', fontSize: '12px', height: '36px', padding: '4px 8px' }}
          >
            <option value="ALL">All Categories</option>
            {allExpenseCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: 'auto', fontSize: '12px', height: '36px', padding: '4px 8px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }}
            title="Download filtered expenses in .xlsx format"
          >
            <FileSpreadsheet size={14} />
            Export Excel
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', fontWeight: 700 }}
          >
            <Plus size={15} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="activity-card">
        <div className="activity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800 }}>Operating Expense Ledger</span>
            <span className="badge badge-primary">{displayedExpenses.length} Records</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--danger)' }}>
            Total Incurred: {formatBDT(totalExpenseAmount)}
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Expense Title</th>
                <th>Category</th>
                <th>Amount (BDT)</th>
                <th>Payment Channel</th>
                <th>Date</th>
                <th>Vendor / Payee</th>
                <th>Approval Status</th>
                <th>Approved By</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No operating expenses found for the selected filter criteria.
                  </td>
                </tr>
              ) : (
                displayedExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ fontWeight: 700 }}>{exp.title}</td>
                    <td>
                      <span className="badge badge-info">{exp.category}</span>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '14px' }}>
                      {formatBDT(exp.amount)}
                    </td>
                    <td>
                      <span className="badge badge-primary">{exp.method}</span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{formatDatePretty(exp.date)}</td>
                    <td style={{ fontSize: '12px', fontWeight: 600 }}>{exp.vendor || '—'}</td>
                    <td>
                      <span className={`badge ${exp.approvalStatus === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                        {exp.approvalStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.approvedBy || '—'}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '160px' }}>
                      {exp.notes || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setExpenseToEdit(exp)}
                          title="Edit expense details"
                          style={{ padding: '3px 6px' }}
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDelete(exp)}
                          title="Delete expense"
                          style={{ padding: '3px 6px', color: 'var(--danger)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      <ExpenseFormModal
        isOpen={showAddModal || Boolean(expenseToEdit)}
        onClose={() => {
          setShowAddModal(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
}
