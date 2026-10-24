import { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Tag,
  CreditCard,
  Edit,
  Eye,
  Check,
  X,
  AlertCircle,
  FileText,
  UserCheck,
  Filter,
} from 'lucide-react';
import Modal from './common/Modal';

export const TRIAL_PACKAGES = [
  { id: 'trial_standard', name: 'One-Day Standard Gym Pass', price: 300, description: 'Full access to cardio & strength floors for 1 day' },
  { id: 'trial_sauna', name: 'One-Day Gym + Steam & Sauna Pass', price: 500, description: 'Full gym floor + steam room & sauna recovery suite' },
  { id: 'trial_trainer', name: 'One-Day Trial + 1-on-1 Trainer Session', price: 800, description: 'Full access + 45-min personal trainer evaluation' },
];

const INITIAL_TRIAL_VISITORS = [
  {
    id: 'TRL-2026-001',
    name: 'Zubair Hossain',
    phone: '+880 1711-987654',
    visitDate: '2026-10-24',
    packageId: 'trial_standard',
    packageName: 'One-Day Standard Gym Pass',
    price: 300,
    paymentStatus: 'Paid',
    status: 'Active',
    notes: 'Interested in annual membership after testing equipment.',
    registeredAt: '2026-10-24 09:15 AM',
  },
  {
    id: 'TRL-2026-002',
    name: 'Anika Tabassum',
    phone: '+880 1819-876543',
    visitDate: '2026-10-24',
    packageId: 'trial_sauna',
    packageName: 'One-Day Gym + Steam & Sauna Pass',
    price: 500,
    paymentStatus: 'Paid',
    status: 'Active',
    notes: 'Requested locker access for steam room visit.',
    registeredAt: '2026-10-24 10:30 AM',
  },
  {
    id: 'TRL-2026-003',
    name: 'Kazi Farhan',
    phone: '+880 1912-345678',
    visitDate: '2026-10-23',
    packageId: 'trial_trainer',
    packageName: 'One-Day Trial + 1-on-1 Trainer Session',
    price: 800,
    paymentStatus: 'Paid',
    status: 'Used',
    notes: 'Completed session with Coach Tariq. Likely to join Pro plan.',
    registeredAt: '2026-10-23 04:00 PM',
  },
  {
    id: 'TRL-2026-004',
    name: 'Shakil Mahmud',
    phone: '+880 1622-112233',
    visitDate: '2026-10-20',
    packageId: 'trial_standard',
    packageName: 'One-Day Standard Gym Pass',
    price: 300,
    paymentStatus: 'Paid',
    status: 'Expired',
    notes: 'Did not check in during validity window.',
    registeredAt: '2026-10-20 08:30 AM',
  },
  {
    id: 'TRL-2026-005',
    name: 'Nayeem Chowdhury',
    phone: '+880 1733-445566',
    visitDate: '2026-10-22',
    packageId: 'trial_sauna',
    packageName: 'One-Day Gym + Steam & Sauna Pass',
    price: 500,
    paymentStatus: 'Pending',
    status: 'Cancelled',
    notes: 'Cancelled due to travel schedule.',
    registeredAt: '2026-10-22 11:00 AM',
  },
];

export default function OneDayTrialManagement() {
  const [visitors, setVisitors] = useState(INITIAL_TRIAL_VISITORS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // Form State for New Trial Registration
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitDate, setVisitDate] = useState('2026-10-24');
  const [selectedPackageId, setSelectedPackageId] = useState('trial_standard');
  const [packagePrice, setPackagePrice] = useState('300');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Notification Toast
  const [notification, setNotification] = useState(null);

  // Calculate validity date string based on visitDate
  const calculateValidityString = (dateStr) => {
    if (!dateStr) return 'Valid on day of visit until 11:59 PM';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `Valid on ${parts[2]}/${parts[1]}/${parts[0]} until 11:59 PM`;
      }
      return `Valid until 11:59 PM on ${dateStr}`;
    } catch {
      return `Valid until 11:59 PM on ${dateStr}`;
    }
  };

  // Sync price when package changes in Add form
  const handlePackageChange = (pkgId) => {
    setSelectedPackageId(pkgId);
    const found = TRIAL_PACKAGES.find((p) => p.id === pkgId);
    if (found) {
      setPackagePrice(String(found.price));
    }
  };

  // Open Register Modal
  const openRegisterModal = () => {
    setFullName('');
    setPhone('');
    setVisitDate('2026-10-24');
    setSelectedPackageId('trial_standard');
    setPackagePrice('300');
    setPaymentStatus('Paid');
    setNotes('');
    setFormError('');
    setIsRegisterModalOpen(true);
  };

  // Submit New Trial Registration
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Please enter the visitor\'s full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setFormError('Please enter a valid phone number for verification.');
      return;
    }
    if (!visitDate) {
      setFormError('Please select a valid visit date.');
      return;
    }

    const pkg = TRIAL_PACKAGES.find((p) => p.id === selectedPackageId) || TRIAL_PACKAGES[0];
    const newRecord = {
      id: `TRL-2026-${String(visitors.length + 1).padStart(3, '0')}`,
      name: fullName.trim(),
      phone: phone.trim(),
      visitDate,
      packageId: selectedPackageId,
      packageName: pkg.name,
      price: Number(packagePrice) || pkg.price,
      paymentStatus,
      status: 'Active',
      notes: notes.trim(),
      registeredAt: 'Just now',
    };

    setVisitors((prev) => [newRecord, ...prev]);
    setIsRegisterModalOpen(false);
    setNotification({
      type: 'success',
      text: `One-Day Trial registered successfully for ${newRecord.name} (ID: ${newRecord.id})!`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Edit Submission
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedVisitor) return;

    setVisitors((prev) =>
      prev.map((v) => (v.id === selectedVisitor.id ? { ...selectedVisitor } : v))
    );
    setIsEditModalOpen(false);
    setNotification({
      type: 'success',
      text: `Trial record for ${selectedVisitor.name} updated successfully!`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Quick Action: Mark as Used
  const handleMarkAsUsed = (id) => {
    setVisitors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'Used' } : v))
    );
    setNotification({
      type: 'success',
      text: 'Trial pass marked as Used successfully.',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Quick Action: Cancel Pass
  const handleCancelPass = (id) => {
    setVisitors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'Cancelled' } : v))
    );
    setNotification({
      type: 'warning',
      text: 'Trial pass marked as Cancelled.',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered trial visitors
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        v.name.toLowerCase().includes(q) ||
        v.phone.includes(q) ||
        v.id.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'All' || v.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [visitors, searchTerm, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = visitors.length;
    const active = visitors.filter((v) => v.status === 'Active').length;
    const used = visitors.filter((v) => v.status === 'Used').length;
    const revenue = visitors
      .filter((v) => v.paymentStatus === 'Paid')
      .reduce((sum, v) => sum + (Number(v.price) || 0), 0);
    return { total, active, used, revenue };
  }, [visitors]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${notification.type === 'success' ? 'var(--success)' : 'var(--warning)'}`,
            color: notification.type === 'success' ? 'var(--success)' : 'var(--warning)',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Metrics Row & Register Button */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div className="stat-widget" style={{ padding: '16px 20px' }}>
          <span className="stat-widget-title">Active Passes Today</span>
          <div className="stat-widget-value primary-highlight">{metrics.active}</div>
          <div className="stat-widget-sub">Valid for gym floor access</div>
        </div>

        <div className="stat-widget" style={{ padding: '16px 20px' }}>
          <span className="stat-widget-title">Total Registrations</span>
          <div className="stat-widget-value">{metrics.total}</div>
          <div className="stat-widget-sub">{metrics.used} completed visits</div>
        </div>

        <div className="stat-widget" style={{ padding: '16px 20px' }}>
          <span className="stat-widget-title">Trial Pass Revenue</span>
          <div className="stat-widget-value" style={{ color: 'var(--success)' }}>
            ৳{metrics.revenue.toLocaleString()}
          </div>
          <div className="stat-widget-sub">Collected from trial fees</div>
        </div>

        {/* Quick Registration Card / Button */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(200, 255, 0, 0.12) 0%, rgba(200, 255, 0, 0.04) 100%)',
            border: '2px dashed var(--primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Walk-In Visitor Trial
          </span>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
            Register new guest for same-day evaluation pass
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openRegisterModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginTop: '4px' }}
          >
            <Plus size={14} /> Register Trial Visitor
          </button>
        </div>
      </div>

      {/* Available Trial Packages Quick Reference */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-base)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={16} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>Standard One-Day Trial Options</h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Configured frontend trial package pricing
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {TRIAL_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-base)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{pkg.name}</strong>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)' }}>
                  ৳{pkg.price}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                {pkg.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                <Clock size={12} /> Validity: Single Calendar Day (Expires 11:59 PM)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search, Filter Bar, and Trial Visitors Table */}
      <div className="activity-card">
        <div className="activity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Trial Visitor Registry</span>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Registered one-day guests, fee collection status, and pass validity
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openRegisterModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Plus size={14} /> New Trial Registration
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-base)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div className="header-search" style={{ flex: '1 1 240px', maxWidth: 360 }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by name, phone, trial ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS:</span>
            {['All', 'Active', 'Used', 'Expired', 'Cancelled'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(st)}
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Trial ID</th>
                <th>Visitor Name</th>
                <th>Phone Number</th>
                <th>Selected Package</th>
                <th>Visit Date & Validity</th>
                <th>Price & Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No trial visitor records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {v.id}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{v.name}</strong>
                    </td>
                    <td style={{ fontSize: '12px' }}>{v.phone}</td>
                    <td style={{ fontSize: '12px' }}>{v.packageName}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{v.visitDate}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Expires 11:59 PM
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '13px' }}>৳{v.price}</strong>
                        <span
                          className={`badge ${
                            v.paymentStatus === 'Paid'
                              ? 'badge-success'
                              : v.paymentStatus === 'Pending'
                              ? 'badge-warning'
                              : 'badge-secondary'
                          }`}
                          style={{ fontSize: '10px', padding: '1px 5px' }}
                        >
                          {v.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          v.status === 'Active'
                            ? 'badge-success'
                            : v.status === 'Used'
                            ? 'badge-primary'
                            : v.status === 'Expired'
                            ? 'badge-secondary'
                            : 'badge-danger'
                        }`}
                        style={{ fontSize: '11px' }}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedVisitor(v);
                            setIsViewModalOpen(true);
                          }}
                          style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          title="View Details"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedVisitor({ ...v });
                            setIsEditModalOpen(true);
                          }}
                          style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          title="Edit Record"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        {v.status === 'Active' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMarkAsUsed(v.id)}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            title="Mark trial pass as checked in and used"
                          >
                            Mark Used
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="One-Day Trial Package Registration"
        subtitle="Register walk-in guest with trial pass, calculate validity, and issue access ticket"
        icon={Calendar}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsRegisterModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="trial-registration-form"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} />
              Register Trial Pass (৳{packagePrice})
            </button>
          </div>
        }
      >
        <form
          id="trial-registration-form"
          onSubmit={handleRegisterSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {formError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          {/* Full Name */}
          <label className="form-group">
            <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
              Visitor Full Name <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
            <input
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Asif Arman"
              required
            />
          </label>

          {/* Phone Number */}
          <label className="form-group">
            <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
              Phone Number <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +880 1712-345678"
              required
            />
          </label>

          {/* Visit Date */}
          <label className="form-group">
            <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
              Visit Date <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
            <input
              type="date"
              className="form-input"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              required
            />
          </label>

          {/* Trial Package & Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                Trial Package
              </span>
              <select
                className="form-select"
                value={selectedPackageId}
                onChange={(e) => handlePackageChange(e.target.value)}
              >
                {TRIAL_PACKAGES.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — ৳{pkg.price}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                Price (BDT)
              </span>
              <input
                type="number"
                className="form-input"
                value={packagePrice}
                onChange={(e) => setPackagePrice(e.target.value)}
              />
            </label>
          </div>

          {/* Payment Status */}
          <label className="form-group">
            <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
              Payment Status
            </span>
            <select
              className="form-select"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="Paid">Paid (Cash / bKash / POS)</option>
              <option value="Pending">Pending (Pay upon floor entry)</option>
              <option value="Waived">Waived / Promotional Free Pass</option>
            </select>
          </label>

          {/* Calculated Validity Preview Box */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(200, 255, 0, 0.08)',
              border: '1px solid rgba(200, 255, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Clock size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              <strong>Calculated Validity:</strong> {calculateValidityString(visitDate)}
            </span>
          </div>

          {/* Notes */}
          <label className="form-group">
            <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
              Notes (Optional)
            </span>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Referred by Trainer, interested in strength floor"
            />
          </label>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Trial Pass Information"
        subtitle={selectedVisitor ? `${selectedVisitor.name} (${selectedVisitor.id})` : ''}
        icon={FileText}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsViewModalOpen(false)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedVisitor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                background: 'var(--bg-surface)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>VISITOR NAME</span>
                <div style={{ fontWeight: 700 }}>{selectedVisitor.name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>PHONE</span>
                <div style={{ fontWeight: 700 }}>{selectedVisitor.phone}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>PACKAGE</span>
                <div style={{ fontWeight: 700 }}>{selectedVisitor.packageName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>FEE & PAYMENT</span>
                <div style={{ fontWeight: 700 }}>
                  ৳{selectedVisitor.price} ({selectedVisitor.paymentStatus})
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>VISIT DATE</span>
                <div style={{ fontWeight: 700 }}>{selectedVisitor.visitDate}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>PASS STATUS</span>
                <div>
                  <span className={`badge ${selectedVisitor.status === 'Active' ? 'badge-success' : 'badge-secondary'}`}>
                    {selectedVisitor.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Calculated Validity:</strong> {calculateValidityString(selectedVisitor.visitDate)}
            </div>

            {selectedVisitor.notes && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>Staff Notes:</strong> {selectedVisitor.notes}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Trial Record"
        subtitle={selectedVisitor ? `Updating ${selectedVisitor.name} (${selectedVisitor.id})` : ''}
        icon={Edit}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-trial-form"
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        }
      >
        {selectedVisitor && (
          <form
            id="edit-trial-form"
            onSubmit={handleEditSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Full Name</span>
              <input
                type="text"
                className="form-input"
                value={selectedVisitor.name}
                onChange={(e) => setSelectedVisitor({ ...selectedVisitor, name: e.target.value })}
                required
              />
            </label>

            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Phone</span>
              <input
                type="tel"
                className="form-input"
                value={selectedVisitor.phone}
                onChange={(e) => setSelectedVisitor({ ...selectedVisitor, phone: e.target.value })}
                required
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <label className="form-group">
                <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Payment Status</span>
                <select
                  className="form-select"
                  value={selectedVisitor.paymentStatus}
                  onChange={(e) => setSelectedVisitor({ ...selectedVisitor, paymentStatus: e.target.value })}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Waived">Waived</option>
                </select>
              </label>

              <label className="form-group">
                <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Pass Status</span>
                <select
                  className="form-select"
                  value={selectedVisitor.status}
                  onChange={(e) => setSelectedVisitor({ ...selectedVisitor, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Used">Used</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Notes</span>
              <input
                type="text"
                className="form-input"
                value={selectedVisitor.notes || ''}
                onChange={(e) => setSelectedVisitor({ ...selectedVisitor, notes: e.target.value })}
              />
            </label>
          </form>
        )}
      </Modal>
    </div>
  );
}
