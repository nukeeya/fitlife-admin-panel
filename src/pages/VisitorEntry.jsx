import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Plus,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  UserCheck,
  Phone,
  FileText,
  X,
  CreditCard,
  Users,
  ArrowRight,
  Footprints,
} from 'lucide-react';
import Modal from '../components/common/Modal';

const INITIAL_VISITORS = [
  {
    id: 'VIS-2026-101',
    name: 'Tamim Iqbal',
    phone: '+880 1712-445566',
    dateTime: '2026-10-24 09:30 AM',
    date: '2026-10-24',
    type: 'Prospective Member',
    package: 'None / Facility Tour Only',
    paymentStatus: 'Free Tour / N/A',
    fee: 0,
    status: 'Inquiry',
    notes: 'Touring free weights and cardio mezzanine. Looking for annual membership.',
    handledBy: 'Reception Desk 1',
  },
  {
    id: 'VIS-2026-102',
    name: 'Nazmul Shanto',
    phone: '+880 1819-556677',
    dateTime: '2026-10-24 10:15 AM',
    date: '2026-10-24',
    type: 'One-Day Trial',
    package: 'Single Day Pass - ৳300',
    paymentStatus: 'Paid',
    fee: 300,
    status: 'Checked In',
    notes: 'Paid cash at counter. Assigned temporary locker #14.',
    handledBy: 'Reception Desk 1',
  },
  {
    id: 'VIS-2026-103',
    name: 'Farzana Haque',
    phone: '+880 1911-223344',
    dateTime: '2026-10-24 11:00 AM',
    date: '2026-10-24',
    type: 'General Visit',
    package: 'None / Facility Tour Only',
    paymentStatus: 'Free Tour / N/A',
    fee: 0,
    status: 'Completed',
    notes: 'Visiting current member (Rahim Ahmed). Waited at nutrition lounge.',
    handledBy: 'Reception Desk 2',
  },
  {
    id: 'VIS-2026-104',
    name: 'Mustafizur Rahman',
    phone: '+880 1622-778899',
    dateTime: '2026-10-24 11:45 AM',
    date: '2026-10-24',
    type: 'Prospective Member',
    package: '3-Day Explorer - ৳800',
    paymentStatus: 'Paid',
    fee: 800,
    status: 'Inquiry',
    notes: 'Interested in evening crossfit & sauna. Follow-up call scheduled.',
    handledBy: 'Front Desk Lead',
  },
  {
    id: 'VIS-2026-105',
    name: 'Mehedi Hasan',
    phone: '+880 1733-990011',
    dateTime: '2026-10-23 04:30 PM',
    date: '2026-10-23',
    type: 'One-Day Trial',
    package: 'Single Day Pass - ৳300',
    paymentStatus: 'Paid',
    fee: 300,
    status: 'Completed',
    notes: 'Trial completed yesterday with Coach Tariq.',
    handledBy: 'Reception Desk 1',
  },
];

export default function VisitorEntry() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState(INITIAL_VISITORS);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('2026-10-24'); // defaults to today

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // New Visitor Form State
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitDate, setVisitDate] = useState('2026-10-24');
  const [visitTime, setVisitTime] = useState('11:30 AM');
  const [visitorType, setVisitorType] = useState('Prospective Member');
  const [selectedPackage, setSelectedPackage] = useState('None / Facility Tour Only');
  const [paymentStatus, setPaymentStatus] = useState('Free Tour / N/A');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Conversion Form State
  const [convertPlan, setConvertPlan] = useState('3-Month Standard');
  const [convertAdmissionFee, setConvertAdmissionFee] = useState('1000');
  const [convertNotes, setConvertNotes] = useState('');

  // Notification Toast
  const [notification, setNotification] = useState(null);

  // Auto-sync payment status based on package in New Visitor Form
  const handlePackageSelection = (pkg) => {
    setSelectedPackage(pkg);
    if (pkg.includes('Single Day Pass') || pkg.includes('3-Day Explorer')) {
      setPaymentStatus('Paid');
    } else {
      setPaymentStatus('Free Tour / N/A');
    }
  };

  // Open New Entry Modal
  const openNewEntryModal = () => {
    setVisitorName('');
    setPhone('');
    setVisitDate('2026-10-24');
    setVisitTime('11:30 AM');
    setVisitorType('Prospective Member');
    setSelectedPackage('None / Facility Tour Only');
    setPaymentStatus('Free Tour / N/A');
    setNotes('');
    setFormError('');
    setIsEntryModalOpen(true);
  };

  // Submit New Visitor Entry
  const handleEntrySubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!visitorName.trim()) {
      setFormError('Please enter the visitor\'s full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setFormError('Please enter a valid contact phone number.');
      return;
    }

    const fee = selectedPackage.includes('300') ? 300 : selectedPackage.includes('800') ? 800 : 0;
    const newVisitor = {
      id: `VIS-2026-${String(visitors.length + 101)}`,
      name: visitorName.trim(),
      phone: phone.trim(),
      dateTime: `${visitDate} ${visitTime}`,
      date: visitDate,
      type: visitorType,
      package: selectedPackage,
      paymentStatus,
      fee,
      status: visitorType === 'One-Day Trial' ? 'Checked In' : 'Inquiry',
      notes: notes.trim(),
      handledBy: 'Reception Desk 1',
    };

    setVisitors((prev) => [newVisitor, ...prev]);
    setIsEntryModalOpen(false);
    setNotification({
      type: 'success',
      text: `Visitor "${newVisitor.name}" registered successfully at reception!`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Edit Visitor Submission
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedVisitor) return;

    setVisitors((prev) =>
      prev.map((v) => (v.id === selectedVisitor.id ? { ...selectedVisitor } : v))
    );
    setIsEditModalOpen(false);
    setNotification({
      type: 'success',
      text: `Visitor record for ${selectedVisitor.name} updated successfully!`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Convert Visitor to Member
  const handleConvertSubmit = (e) => {
    e.preventDefault();
    if (!selectedVisitor) return;

    setVisitors((prev) =>
      prev.map((v) =>
        v.id === selectedVisitor.id
          ? {
              ...v,
              status: 'Converted to Member',
              notes: `${v.notes} [Converted to member with ${convertPlan}]`,
            }
          : v
      )
    );
    setIsConvertModalOpen(false);
    setNotification({
      type: 'success',
      text: `Success! ${selectedVisitor.name} converted to Member on "${convertPlan}". You can now proceed to Admissions & Approvals.`,
    });
    setTimeout(() => setNotification(null), 6000);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const todayVisitors = visitors.filter((v) => v.date === dateFilter);
    const totalToday = todayVisitors.length;
    const prospective = todayVisitors.filter((v) => v.type === 'Prospective Member').length;
    const trial = todayVisitors.filter((v) => v.type === 'One-Day Trial').length;
    const general = todayVisitors.filter((v) => v.type === 'General Visit').length;
    return { totalToday, prospective, trial, general };
  }, [visitors, dateFilter]);

  // Filtered visitors table
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        v.name.toLowerCase().includes(q) ||
        v.phone.includes(q) ||
        v.id.toLowerCase().includes(q);
      const matchesType = typeFilter === 'All' || v.type === typeFilter;
      const matchesDate = !dateFilter || v.date === dateFilter;
      return matchesSearch && matchesType && matchesDate;
    });
  }, [visitors, searchTerm, typeFilter, dateFilter]);

  return (
    <div className="page" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--primary)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              <Footprints size={13} />
              Reception Front Desk
            </span>
          </div>
          <h1 className="page-title">Walk-In Visitor Entry System</h1>
          <p className="page-subtitle">
            Log guest arrivals, track prospective member inquiries, manage day passes, and convert to memberships.
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openNewEntryModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <UserPlus size={16} /> New Visitor Entry
          </button>
        </div>
      </div>

      {/* Global Toast Notification */}
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
            marginBottom: '16px',
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

      {/* Daily Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div className="stat-widget">
          <span className="stat-widget-title">Total Visitors (Selected Day)</span>
          <div className="stat-widget-value primary-highlight">{metrics.totalToday}</div>
          <div className="stat-widget-sub">Date: {dateFilter || 'All Dates'}</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Prospective Members</span>
          <div className="stat-widget-value" style={{ color: '#3B82F6' }}>
            {metrics.prospective}
          </div>
          <div className="stat-widget-sub">Membership inquiries</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">One-Day Trial Guests</span>
          <div className="stat-widget-value" style={{ color: 'var(--success)' }}>
            {metrics.trial}
          </div>
          <div className="stat-widget-sub">Day pass users</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">General Facility Visits</span>
          <div className="stat-widget-value" style={{ color: 'var(--text-secondary)' }}>
            {metrics.general}
          </div>
          <div className="stat-widget-sub">Tours & member guests</div>
        </div>
      </div>

      {/* Visitors Table Section */}
      <div className="activity-card">
        <div className="activity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Visitor Log & Inquiries</span>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Reception visitor records kept visually separated from registered gym members
              </p>
            </div>
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filteredVisitors.length} of {visitors.length} visitors
          </span>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-base)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Search Box */}
          <div className="header-search" style={{ flex: '1 1 240px', maxWidth: 360 }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by visitor name, phone, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filters & Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>TYPE:</span>
              {['All', 'Prospective Member', 'One-Day Trial', 'General Visit'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTypeFilter(t)}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  {t === 'Prospective Member' ? 'Prospective' : t === 'One-Day Trial' ? 'Trial' : t === 'General Visit' ? 'General' : 'All'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>DATE:</span>
              <input
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ height: '32px', fontSize: '12px', padding: '2px 8px' }}
              />
              {dateFilter && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDateFilter('')}
                  style={{ padding: '3px 6px', fontSize: '10px' }}
                  title="Clear date filter to show all history"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Visitor ID</th>
                <th>Visitor Name</th>
                <th>Phone Number</th>
                <th>Visit Date & Time</th>
                <th>Visitor Type</th>
                <th>Package & Fee</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No visitor records found for the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-base)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {v.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                          {v.name}
                        </strong>
                        {v.status === 'Converted to Member' && (
                          <span className="badge badge-success" style={{ alignSelf: 'flex-start', fontSize: '9px', padding: '1px 4px', marginTop: '2px' }}>
                            Converted to Member
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{v.phone}</td>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} color="var(--text-muted)" />
                        <span>{v.dateTime}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          v.type === 'Prospective Member'
                            ? 'badge-info'
                            : v.type === 'One-Day Trial'
                            ? 'badge-primary'
                            : 'badge-secondary'
                        }`}
                        style={{ fontSize: '11px' }}
                      >
                        {v.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{v.package}</span>
                        {v.fee > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Fee: ৳{v.fee}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          v.paymentStatus === 'Paid'
                            ? 'badge-success'
                            : v.paymentStatus === 'Pending'
                            ? 'badge-warning'
                            : 'badge-secondary'
                        }`}
                        style={{ fontSize: '10px' }}
                      >
                        {v.paymentStatus}
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
                          title="View Visitor Details"
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
                          title="Edit Visitor Entry"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        {v.status !== 'Converted to Member' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedVisitor(v);
                              setConvertPlan('3-Month Standard');
                              setConvertAdmissionFee('1000');
                              setConvertNotes('');
                              setIsConvertModalOpen(true);
                            }}
                            style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}
                            title="Convert visitor to registered gym member"
                          >
                            <UserCheck size={12} /> Convert
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

      {/* NEW VISITOR ENTRY MODAL */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Reception Walk-In Visitor Entry"
        subtitle="Log visitor check-in, select interest or trial pass, and record reception notes"
        icon={UserPlus}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEntryModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="visitor-entry-form"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} />
              Register Visitor
            </button>
          </div>
        }
      >
        <form
          id="visitor-entry-form"
          onSubmit={handleEntrySubmit}
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

          {/* Visitor Name */}
          <label className="form-group">
            <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
              Visitor Full Name <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
            <input
              type="text"
              className="form-input"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g. Tanvir Hasan"
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
              placeholder="e.g. +880 1711-223344"
              required
            />
          </label>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
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

            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                Visit Time
              </span>
              <input
                type="text"
                className="form-input"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                placeholder="10:30 AM"
              />
            </label>
          </div>

          {/* Visitor Type */}
          <label className="form-group">
            <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
              Visitor Type <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
            <select
              className="form-select"
              value={visitorType}
              onChange={(e) => setVisitorType(e.target.value)}
            >
              <option value="Prospective Member">Prospective Member (Membership Inquiry / Tour)</option>
              <option value="One-Day Trial">One-Day Trial (Guest Workout)</option>
              <option value="General Visit">General Visit (Member Guest / Inquiring for Friend)</option>
            </select>
          </label>

          {/* Selected Package (Optional) */}
          <label className="form-group">
            <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
              Selected Package (Optional)
            </span>
            <select
              className="form-select"
              value={selectedPackage}
              onChange={(e) => handlePackageSelection(e.target.value)}
            >
              <option value="None / Facility Tour Only">None / Facility Tour Only (Free)</option>
              <option value="Single Day Pass - ৳300">Single Day Pass - ৳300</option>
              <option value="3-Day Explorer - ৳800">3-Day Explorer - ৳800</option>
              <option value="Personal Training Trial - ৳500">Personal Training Trial - ৳500</option>
            </select>
          </label>

          {/* Payment Status (if applicable) */}
          <label className="form-group">
            <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
              Payment Status
            </span>
            <select
              className="form-select"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="Free Tour / N/A">Free Tour / N/A</option>
              <option value="Paid">Paid (Cash / bKash)</option>
              <option value="Pending">Pending</option>
            </select>
          </label>

          {/* Notes */}
          <label className="form-group">
            <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
              Reception Notes (Optional)
            </span>
            <textarea
              className="form-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Wants to start next Monday, interested in student discount."
            />
          </label>
        </form>
      </Modal>

      {/* VIEW VISITOR DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Visitor Registration Details"
        subtitle={selectedVisitor ? `${selectedVisitor.name} (${selectedVisitor.id})` : ''}
        icon={FileText}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {selectedVisitor?.status !== 'Converted to Member' ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsConvertModalOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <UserCheck size={14} /> Convert to Member
              </button>
            ) : <span />}
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
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>VISIT TYPE</span>
                <div>
                  <span className="badge badge-info">{selectedVisitor.type}</span>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>DATE & TIME</span>
                <div style={{ fontWeight: 700 }}>{selectedVisitor.dateTime}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>PACKAGE</span>
                <div style={{ fontWeight: 700 }}>{selectedVisitor.package}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>PAYMENT STATUS</span>
                <div>
                  <span className={`badge ${selectedVisitor.paymentStatus === 'Paid' ? 'badge-success' : 'badge-secondary'}`}>
                    {selectedVisitor.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {selectedVisitor.notes && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>Receptionist Notes:</strong> {selectedVisitor.notes}
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Handled by: {selectedVisitor.handledBy}
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT VISITOR MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Visitor Entry"
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
              form="edit-visitor-form"
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        }
      >
        {selectedVisitor && (
          <form
            id="edit-visitor-form"
            onSubmit={handleEditSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Visitor Name</span>
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
                <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Visitor Type</span>
                <select
                  className="form-select"
                  value={selectedVisitor.type}
                  onChange={(e) => setSelectedVisitor({ ...selectedVisitor, type: e.target.value })}
                >
                  <option value="Prospective Member">Prospective Member</option>
                  <option value="One-Day Trial">One-Day Trial</option>
                  <option value="General Visit">General Visit</option>
                </select>
              </label>

              <label className="form-group">
                <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Payment Status</span>
                <select
                  className="form-select"
                  value={selectedVisitor.paymentStatus}
                  onChange={(e) => setSelectedVisitor({ ...selectedVisitor, paymentStatus: e.target.value })}
                >
                  <option value="Free Tour / N/A">Free Tour / N/A</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </label>
            </div>

            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Notes</span>
              <textarea
                className="form-input"
                rows={2}
                value={selectedVisitor.notes || ''}
                onChange={(e) => setSelectedVisitor({ ...selectedVisitor, notes: e.target.value })}
              />
            </label>
          </form>
        )}
      </Modal>

      {/* CONVERT TO MEMBER MODAL */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Visitor to Member"
        subtitle={selectedVisitor ? `Enrolling ${selectedVisitor.name} (${selectedVisitor.phone}) into Full Membership` : ''}
        icon={UserCheck}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsConvertModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="convert-visitor-form"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} />
              Confirm Conversion & Enroll
            </button>
          </div>
        }
      >
        {selectedVisitor && (
          <form
            id="convert-visitor-form"
            onSubmit={handleConvertSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(200, 255, 0, 0.08)',
                border: '1px solid rgba(200, 255, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <UserCheck size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Converting visitor <strong>{selectedVisitor.name}</strong> will create an active membership applicant record.
              </span>
            </div>

            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Name:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{selectedVisitor.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Phone:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{selectedVisitor.phone}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>First Visited:</span>{' '}
                <span>{selectedVisitor.date}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Original Inquiry:</span>{' '}
                <span>{selectedVisitor.type}</span>
              </div>
            </div>

            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                Select Target Membership Plan
              </span>
              <select
                className="form-select"
                value={convertPlan}
                onChange={(e) => setConvertPlan(e.target.value)}
              >
                <option value="1-Month Starter - ৳3,500">1-Month Starter (৳3,500)</option>
                <option value="3-Month Standard - ৳9,500">3-Month Standard (৳9,500)</option>
                <option value="6-Month Silver - ৳17,000">6-Month Silver (৳17,000)</option>
                <option value="12-Month Pro Annual - ৳30,000">12-Month Pro Annual (৳30,000)</option>
              </select>
            </label>

            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                Initial Admission Fee (BDT)
              </span>
              <input
                type="number"
                className="form-input"
                value={convertAdmissionFee}
                onChange={(e) => setConvertAdmissionFee(e.target.value)}
              />
            </label>

            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                Conversion Notes
              </span>
              <input
                type="text"
                className="form-input"
                value={convertNotes}
                onChange={(e) => setConvertNotes(e.target.value)}
                placeholder="e.g. Visitor decided to join after experiencing morning cardio facilities"
              />
            </label>
          </form>
        )}
      </Modal>
    </div>
  );
}
