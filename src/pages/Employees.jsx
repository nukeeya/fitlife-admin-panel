import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  CheckCircle2,
  Printer,
  Briefcase,
  Receipt,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { supabase } from '../lib/supabase';
import { uploadProfilePhoto } from '../lib/profilePhotos';
import Modal from '../components/common/Modal';
import ProfilePhotoField from '../components/ProfilePhotoField';

export default function Employees() {
  const { employees: liveEmployees, branding, refresh } = useGymData();
  const allEmployees = liveEmployees || [];

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'payroll'
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Employee Add / Edit Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  // Form State
  const initialForm = {
    name: '',
    role: '',
    department: 'Reception',
    phone: '',
    email: '',
    joined_date: new Date().toISOString().slice(0, 10),
    monthly_salary: '',
    status: 'Active',
    profilePhoto: null,
  };
  const [formData, setFormData] = useState(initialForm);

  // Payroll State
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [payrolls, setPayrolls] = useState([]);
  const [loadingPayrolls, setLoadingPayrolls] = useState(false);
  const [payrollAdjustments, setPayrollAdjustments] = useState({}); // { [employeeId]: { bonus: 0, deductions: 0 } }
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);

  // Fetch Payroll records for selected month
  const fetchMonthlyPayrolls = async (month) => {
    setLoadingPayrolls(true);
    try {
      const { data, error } = await supabase
        .from('employee_payrolls')
        .select('*')
        .eq('month_year', month);
      if (!error && data) {
        setPayrolls(data);
      }
    } catch (err) {
      console.warn('Could not load payrolls:', err);
    } finally {
      setLoadingPayrolls(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payroll') {
      fetchMonthlyPayrolls(selectedMonth);
    }
  }, [activeTab, selectedMonth]);

  const totalPayrollBudget = useMemo(() => {
    return allEmployees
      .filter((e) => e.status !== 'Terminated')
      .reduce((sum, e) => {
        const val = typeof e.salary === 'number' ? e.salary : Number(String(e.salary).replace(/[^0-9]/g, '')) || 0;
        return sum + val;
      }, 0);
  }, [allEmployees]);

  const filtered = allEmployees.filter((e) => {
    const matchesSearch =
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone?.includes(searchTerm);
    const matchesDept = deptFilter === 'All' || e.department?.toLowerCase() === deptFilter.toLowerCase();
    return matchesSearch && matchesDept;
  });

  // Handlers for Add/Edit Employee
  const handleOpenAdd = () => {
    setFormData(initialForm);
    setEditingEmployee(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || '',
      role: emp.role || '',
      department: emp.department || 'Reception',
      phone: emp.phone || '',
      email: emp.email || '',
      joined_date: emp.joined || new Date().toISOString().slice(0, 10),
      monthly_salary: emp.salary || '',
      status: emp.status || 'Active',
      profilePhoto: null,
    });
    setShowAddModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const uploadedPhoto = await uploadProfilePhoto(formData.profilePhoto, 'employees');
      if (editingEmployee) {
        // Update existing
        const { error } = await supabase
          .from('employees')
          .update({
            name: formData.name.trim(),
            role: formData.role.trim(),
            department: formData.department,
            phone: formData.phone.trim(),
            email: formData.email.trim() || null,
            joined_date: formData.joined_date,
            monthly_salary: Number(formData.monthly_salary) || 0,
            status: formData.status,
            ...(uploadedPhoto ? { avatar: uploadedPhoto } : {}),
          })
          .eq('id', editingEmployee.id);
        if (error) throw error;
        setNotice(`Staff member "${formData.name}" updated successfully.`);
      } else {
        // Create new
        const codeSuffix = String(Date.now()).slice(-4);
        const avatar = uploadedPhoto || formData.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() || 'EM';

        const { error } = await supabase.from('employees').insert({
          name: formData.name.trim(),
          employee_code: `EMP-${codeSuffix}`,
          role: formData.role.trim(),
          department: formData.department,
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          joined_date: formData.joined_date,
          monthly_salary: Number(formData.monthly_salary) || 0,
          status: formData.status || 'Active',
          avatar,
        });
        if (error) throw error;
        setNotice(`New staff member "${formData.name}" added successfully.`);
      }

      await refresh();
      setShowAddModal(false);
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      console.error('Save employee failed:', err);
      alert(err.message || 'Failed to save staff profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (emp) => {
    if (window.confirm(`Are you sure you want to remove "${emp.name}" from active records?`)) {
      try {
        const { error } = await supabase.from('employees').delete().eq('id', emp.id);
        if (error) throw error;
        await refresh();
        setNotice(`Staff record for "${emp.name}" was removed.`);
        setTimeout(() => setNotice(''), 3000);
      } catch (err) {
        console.error('Delete employee failed:', err);
        alert('Could not remove employee. Check console.');
      }
    }
  };

  // Payroll handlers
  const handleAdjustmentChange = (empId, field, val) => {
    const num = Math.max(Number(val) || 0, 0);
    setPayrollAdjustments((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: num,
      },
    }));
  };

  const handleDisbursePayroll = async (emp) => {
    const adj = payrollAdjustments[emp.id] || { bonus: 0, deductions: 0 };
    const base = Number(emp.salary) || 0;
    const bonus = Number(adj.bonus) || 0;
    const deductions = Number(adj.deductions) || 0;
    const net = Math.max(base + bonus - deductions, 0);

    try {
      const { error } = await supabase.from('employee_payrolls').upsert(
        {
          employee_id: emp.id,
          month_year: selectedMonth,
          base_salary: base,
          bonus,
          deductions,
          net_paid: net,
          payment_date: new Date().toISOString().slice(0, 10),
          status: 'Paid',
        },
        { onConflict: 'employee_id,month_year' }
      );

      if (error) throw error;
      await fetchMonthlyPayrolls(selectedMonth);
      setNotice(`Payroll of ৳${net.toLocaleString()} disbursed to ${emp.name} for ${selectedMonth}!`);
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      console.error('Payroll disburse error:', err);
      alert('Failed to disburse salary. Check console.');
    }
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Employee & Payroll Management</h1>
          <p className="page-subtitle">
            Staff roster, department allocations, attendance remuneration, and monthly salary disbursement.
          </p>
        </div>

        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Staff Member
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {notice && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10B981',
            color: '#10B981',
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="customizer-tabs" style={{ marginBottom: '20px' }}>
        <button
          className={`customizer-tab ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          Staff Directory ({allEmployees.length})
        </button>
        <button
          className={`customizer-tab ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          Monthly Payroll Ledger
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <>
          {/* Filter & Search Bar */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-base)',
              marginBottom: '20px',
            }}
          >
            <div className="header-search" style={{ flex: '1 1 240px', maxWidth: 360 }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search staff by name, role, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['All', 'Reception', 'Operations', 'Finance', 'Maintenance', 'Marketing'].map((d) => (
                <button
                  key={d}
                  className={`btn btn-sm ${deptFilter === d ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDeptFilter(d)}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="badge badge-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
              Monthly Payroll Budget: ৳{totalPayrollBudget.toLocaleString()} / mo
            </div>
          </div>

          {/* Employee Table */}
          <div className="activity-card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Staff Profile</th>
                    <th>Role & Department</th>
                    <th>Contact</th>
                    <th>Joined Date</th>
                    <th>Monthly Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No employees found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <div className="member-cell">
                            <div className="avatar-initials" style={{ overflow: 'hidden' }}>
                              {e.avatar?.startsWith('http') ? (
                                <img src={e.avatar} alt={`${e.name} profile`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : e.avatar || e.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="member-cell-info">
                              <span className="member-cell-name" style={{ fontWeight: 700 }}>{e.name}</span>
                              <span className="member-cell-code">{e.code}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700 }}>{e.role}</span>
                            <span style={{ fontSize: '11px', color: 'var(--primary)' }}>{e.department}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                            <span>{e.phone}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{e.email || '—'}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px' }}>{e.joined}</td>
                        <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          ৳{Number(e.salary || 0).toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              e.status === 'Active'
                                ? 'badge-success'
                                : e.status === 'On Leave'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEdit(e)}
                              title="Edit Staff Member"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteEmployee(e)}
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
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
        </>
      )}

      {/* TAB 2: MONTHLY PAYROLL MANAGEMENT */}
      {activeTab === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Month selector & summary header */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-base)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px' }}>Payroll Period:</span>
              <input
                type="month"
                className="form-input"
                style={{ width: '180px', padding: '6px 12px' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="badge badge-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                Disbursed: ৳{payrolls.reduce((s, p) => s + (Number(p.net_paid) || 0), 0).toLocaleString()}
              </div>
              <div className="badge badge-info" style={{ padding: '8px 14px', fontSize: '13px' }}>
                Staff Paid: {payrolls.filter((p) => p.status === 'Paid').length} / {allEmployees.length}
              </div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="activity-card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Base Salary</th>
                    <th>Bonus (+)</th>
                    <th>Deductions (−)</th>
                    <th>Net Payable</th>
                    <th>Payment Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No staff members found in roster.
                      </td>
                    </tr>
                  ) : (
                    allEmployees.map((emp) => {
                      const payrollRecord = payrolls.find((p) => p.employee_id === emp.id);
                      const isPaid = payrollRecord?.status === 'Paid';
                      const adj = payrollAdjustments[emp.id] || { bonus: 0, deductions: 0 };
                      const base = Number(emp.salary) || 0;
                      const bonus = isPaid ? Number(payrollRecord.bonus) : adj.bonus;
                      const deductions = isPaid ? Number(payrollRecord.deductions) : adj.deductions;
                      const net = isPaid ? Number(payrollRecord.net_paid) : Math.max(base + bonus - deductions, 0);

                      return (
                        <tr key={emp.id}>
                          <td>
                            <div className="member-cell">
                              <div className="avatar-initials">{emp.avatar || emp.name.slice(0, 2).toUpperCase()}</div>
                              <div>
                                <span style={{ fontWeight: 700 }}>{emp.name}</span>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.code}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-secondary">{emp.department}</span></td>
                          <td style={{ fontWeight: 700 }}>৳{base.toLocaleString()}</td>
                          <td>
                            {isPaid ? (
                              <span style={{ color: '#10B981', fontWeight: 600 }}>+৳{bonus.toLocaleString()}</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                className="form-input"
                                style={{ width: '90px', padding: '4px 8px', fontSize: '12px' }}
                                placeholder="0"
                                value={adj.bonus || ''}
                                onChange={(e) => handleAdjustmentChange(emp.id, 'bonus', e.target.value)}
                              />
                            )}
                          </td>
                          <td>
                            {isPaid ? (
                              <span style={{ color: '#EF4444', fontWeight: 600 }}>−৳{deductions.toLocaleString()}</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                className="form-input"
                                style={{ width: '90px', padding: '4px 8px', fontSize: '12px' }}
                                placeholder="0"
                                value={adj.deductions || ''}
                                onChange={(e) => handleAdjustmentChange(emp.id, 'deductions', e.target.value)}
                              />
                            )}
                          </td>
                          <td style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)' }}>
                            ৳{net.toLocaleString()}
                          </td>
                          <td>
                            <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                              {isPaid ? `Paid (${payrollRecord.payment_date})` : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {!isPaid ? (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleDisbursePayroll(emp)}
                                >
                                  <DollarSign size={13} /> Disburse
                                </button>
                              ) : (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setSelectedPaySlip({ emp, payroll: payrollRecord })}
                                  title="Print Official Salary Pay Slip"
                                >
                                  <Receipt size={13} /> Slip
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingEmployee ? `Edit Staff: ${editingEmployee.name}` : 'Add New Staff Member'}
        subtitle="Manage employment details, role, department, and compensation"
        icon={Briefcase}
        size="md"
      >
        <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <ProfilePhotoField
            file={formData.profilePhoto}
            currentPhotoUrl={editingEmployee?.avatar}
            onFileChange={(profilePhoto) => setFormData((current) => ({ ...current, profilePhoto }))}
          />
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Mahbubur Rahman"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Role Title</label>
              <input
                type="text"
                className="form-input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Front Desk Officer"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Reception">Reception</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance & Accounts</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Marketing">Marketing & Sales</option>
                <option value="Coaching">Fitness Coaching</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+880 1711-..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@fitlife.com"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Monthly Salary (৳)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.monthly_salary}
                onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                placeholder="e.g. 25000"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Joined Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.joined_date}
              onChange={(e) => setFormData({ ...formData, joined_date: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingEmployee ? 'Update Profile' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Salary Slip Modal */}
      <Modal
        isOpen={Boolean(selectedPaySlip)}
        onClose={() => setSelectedPaySlip(null)}
        title="Official Staff Salary Voucher"
        subtitle={`Voucher for period: ${selectedPaySlip?.payroll?.month_year || selectedMonth}`}
        icon={Receipt}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setSelectedPaySlip(null)}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={15} /> Print Voucher (PDF)
            </button>
          </div>
        }
      >
        {selectedPaySlip && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-base)', paddingBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{branding?.gymName || 'FITLIFE GYM'}</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{branding?.address || 'Dhaka, Bangladesh'}</p>
              <div style={{ display: 'inline-block', background: 'var(--bg-surface)', padding: '4px 12px', borderRadius: '4px', marginTop: '8px', fontSize: '12px', fontWeight: 700 }}>
                SALARY DISBURSEMENT SLIP — {selectedPaySlip.payroll.month_year}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div><strong>Employee Name:</strong> {selectedPaySlip.emp.name}</div>
              <div><strong>Employee Code:</strong> {selectedPaySlip.emp.code}</div>
              <div><strong>Department:</strong> {selectedPaySlip.emp.department}</div>
              <div><strong>Role:</strong> {selectedPaySlip.emp.role}</div>
              <div><strong>Disbursement Date:</strong> {selectedPaySlip.payroll.payment_date}</div>
              <div><strong>Payment Status:</strong> <span className="badge badge-success">PAID</span></div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-base)', fontSize: '13px' }}>
                <span>Monthly Base Salary</span>
                <span style={{ fontWeight: 700 }}>৳{Number(selectedPaySlip.payroll.base_salary).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-base)', fontSize: '13px', color: '#10B981' }}>
                <span>Performance Bonus / Incentive</span>
                <span>+৳{Number(selectedPaySlip.payroll.bonus || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-base)', fontSize: '13px', color: '#EF4444' }}>
                <span>Deductions / Penalties / Leave</span>
                <span>−৳{Number(selectedPaySlip.payroll.deductions || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px 0', fontSize: '16px', fontWeight: 800 }}>
                <span>Net Salary Remuneration</span>
                <span style={{ color: 'var(--primary)' }}>৳{Number(selectedPaySlip.payroll.net_paid).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed var(--border-base)', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div>
                <div>_________________________</div>
                <div style={{ marginTop: '4px' }}>Authorized Accountant / Manager</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>_________________________</div>
                <div style={{ marginTop: '4px' }}>Employee Signature</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
