import { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  FileText,
  X,
  Users,
  Footprints,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import DataState from '../components/common/DataState';
import { useGymData } from '../context/GymDataContext';
import { todayStr } from '../lib/supabaseData';
import { formatDatePretty } from '../utils/financeCalculators';

// Must match the check constraints in database/migrations/017_visitors.sql.
const VISITOR_TYPES = [
  { value: 'Prospective Member', label: 'Prospective Member (Membership Inquiry / Tour)', short: 'Prospective' },
  { value: 'One-Day Trial', label: 'One-Day Trial (Guest Workout)', short: 'Trial' },
  { value: 'General Visit', label: 'General Visit (Member Guest / Inquiring for Friend)', short: 'General' },
];
const VISITOR_STATUSES = ['Inquiry', 'Checked In', 'Completed', 'Converted to Member'];

const typeBadge = (type) => (type === 'Prospective Member' ? 'badge-info' : type === 'One-Day Trial' ? 'badge-primary' : 'badge-secondary');
const statusBadge = (status) => (
  status === 'Converted to Member' ? 'badge-success'
    : status === 'Checked In' ? 'badge-primary'
    : status === 'Completed' ? 'badge-secondary'
    : 'badge-info'
);

const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const errorBoxStyle = {
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
};

export default function VisitorEntry() {
  const { visitors, addVisitor, updateVisitor, loading, loadErrors, refresh } = useGymData();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState(todayStr());

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // New Visitor Form State
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitDate, setVisitDate] = useState(todayStr());
  const [visitTime, setVisitTime] = useState(nowTime());
  const [visitorType, setVisitorType] = useState('Prospective Member');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState(null);
  const notify = (text) => {
    setNotification({ type: 'success', text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Open New Entry Modal: date and time start at today / now.
  const openNewEntryModal = () => {
    setVisitorName('');
    setPhone('');
    setVisitDate(todayStr());
    setVisitTime(nowTime());
    setVisitorType('Prospective Member');
    setNotes('');
    setFormError('');
    setIsEntryModalOpen(true);
  };

  // Submit New Visitor Entry (handled_by is set by the database)
  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (visitorName.trim().length < 2) {
      setFormError('Please enter the visitor\'s full name.');
      return;
    }
    if (phone.trim().length < 6) {
      setFormError('Please enter a valid contact phone number.');
      return;
    }

    setSaving(true);
    const { visitor, error } = await addVisitor({
      name: visitorName,
      phone,
      date: visitDate,
      time: visitTime,
      type: visitorType,
      // Trial guests start working out straight away.
      status: visitorType === 'One-Day Trial' ? 'Checked In' : 'Inquiry',
      notes,
    });
    setSaving(false);
    if (error) {
      setFormError(error.message || 'Could not save the visitor. Please try again.');
      return;
    }

    setIsEntryModalOpen(false);
    // Show the day the visitor was logged for, so the new row is visible.
    if (dateFilter && visitor.date !== dateFilter) setDateFilter(visitor.date);
    notify(`Visitor "${visitor.name}" registered (${visitor.code}).`);
  };

  // Edit Visitor Submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVisitor) return;
    setFormError('');

    if (selectedVisitor.name.trim().length < 2 || selectedVisitor.phone.trim().length < 6) {
      setFormError('Enter the visitor\'s name and a valid phone number.');
      return;
    }

    setSaving(true);
    const { error } = await updateVisitor(selectedVisitor.id, {
      name: selectedVisitor.name,
      phone: selectedVisitor.phone,
      date: selectedVisitor.date,
      time: selectedVisitor.time,
      type: selectedVisitor.type,
      status: selectedVisitor.status,
      notes: selectedVisitor.notes,
    });
    setSaving(false);
    if (error) {
      setFormError(error.message || 'Could not save the changes. Please try again.');
      return;
    }

    setIsEditModalOpen(false);
    notify(`Visitor record for ${selectedVisitor.name} updated.`);
  };

  // Metrics for the selected day (or all dates when the filter is cleared)
  const metrics = useMemo(() => {
    const dayVisitors = dateFilter ? visitors.filter((v) => v.date === dateFilter) : visitors;
    return {
      total: dayVisitors.length,
      prospective: dayVisitors.filter((v) => v.type === 'Prospective Member').length,
      trial: dayVisitors.filter((v) => v.type === 'One-Day Trial').length,
      general: dayVisitors.filter((v) => v.type === 'General Visit').length,
    };
  }, [visitors, dateFilter]);

  // Filtered visitors table
  const filteredVisitors = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return visitors.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(q) ||
        v.phone.includes(q) ||
        v.code.toLowerCase().includes(q);
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
            Log guest arrivals, track prospective member inquiries and one-day trial guests.
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
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
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
          <span className="stat-widget-title">Total Visitors</span>
          <div className="stat-widget-value primary-highlight">{metrics.total}</div>
          <div className="stat-widget-sub">{dateFilter ? formatDatePretty(dateFilter) : 'All dates'}</div>
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
          <div className="stat-widget-sub">Guest workouts</div>
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
      <DataState
        loading={loading}
        error={loadErrors.visitors}
        isEmpty={visitors.length === 0}
        noun="visitors"
        onRetry={refresh}
        onAdd={openNewEntryModal}
        addLabel="Log your first visitor"
      >
      <div className="activity-card">
        <div className="activity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Visitor Log & Inquiries</span>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Reception visitor records, kept separate from registered gym members
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
              {[{ value: 'All', short: 'All' }, ...VISITOR_TYPES].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`btn btn-sm ${typeFilter === t.value ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTypeFilter(t.value)}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  {t.short}
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
              {dateFilter ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDateFilter('')}
                  style={{ padding: '3px 6px', fontSize: '10px' }}
                  title="Show visitors from all dates"
                >
                  All Dates
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDateFilter(todayStr())}
                  style={{ padding: '3px 6px', fontSize: '10px' }}
                >
                  Today
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
                <th>Status</th>
                <th>Handled By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {dateFilter
                      ? `No visitors on ${formatDatePretty(dateFilter)} match these filters.`
                      : 'No visitors match these filters.'}
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
                        {v.code}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{v.name}</strong>
                    </td>
                    <td style={{ fontSize: '12px' }}>{v.phone}</td>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} color="var(--text-muted)" />
                        <span>{formatDatePretty(v.date)} · {v.timeDisplay}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${typeBadge(v.type)}`} style={{ fontSize: '11px' }}>
                        {v.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(v.status)}`} style={{ fontSize: '10px' }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{v.handledBy}</td>
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
                            setFormError('');
                            setIsEditModalOpen(true);
                          }}
                          style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          title="Edit Visitor Entry"
                        >
                          <Edit size={12} /> Edit
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
      </DataState>

      {/* NEW VISITOR ENTRY MODAL */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => !saving && setIsEntryModalOpen(false)}
        title="Reception Walk-In Visitor Entry"
        subtitle="Log a visitor's arrival and reception notes"
        icon={UserPlus}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEntryModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="visitor-entry-form"
              className="btn btn-primary"
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} />
              {saving ? 'Saving…' : 'Register Visitor'}
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
            <div style={errorBoxStyle}>
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

          {/* Date & Time: start at today / now */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                Visit Date <span style={{ color: 'var(--danger)' }}>*</span>
              </span>
              <input
                type="date"
                className="form-input"
                value={visitDate}
                max={todayStr()}
                onChange={(e) => setVisitDate(e.target.value)}
                required
              />
            </label>

            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                Visit Time
              </span>
              <input
                type="time"
                className="form-input"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
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
              {VISITOR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
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
              placeholder="e.g. Wants to start next Monday, interested in evening classes."
            />
          </label>
        </form>
      </Modal>

      {/* VIEW VISITOR DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Visitor Details"
        subtitle={selectedVisitor ? `${selectedVisitor.name} (${selectedVisitor.code})` : ''}
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
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>VISIT TYPE</span>
                <div>
                  <span className={`badge ${typeBadge(selectedVisitor.type)}`}>{selectedVisitor.type}</span>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>DATE & TIME</span>
                <div style={{ fontWeight: 700 }}>{formatDatePretty(selectedVisitor.date)} · {selectedVisitor.timeDisplay}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>STATUS</span>
                <div>
                  <span className={`badge ${statusBadge(selectedVisitor.status)}`}>{selectedVisitor.status}</span>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>HANDLED BY</span>
                <div style={{ fontWeight: 700 }}>{selectedVisitor.handledBy}</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
              <strong>Reception Notes:</strong> {selectedVisitor.notes || '—'}
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT VISITOR MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !saving && setIsEditModalOpen(false)}
        title="Edit Visitor Entry"
        subtitle={selectedVisitor ? `Updating ${selectedVisitor.name} (${selectedVisitor.code})` : ''}
        icon={Edit}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-visitor-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
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
            {formError && (
              <div style={errorBoxStyle}>
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

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
                <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Visit Date</span>
                <input
                  type="date"
                  className="form-input"
                  value={selectedVisitor.date}
                  max={todayStr()}
                  onChange={(e) => setSelectedVisitor({ ...selectedVisitor, date: e.target.value })}
                  required
                />
              </label>
              <label className="form-group">
                <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Visit Time</span>
                <input
                  type="time"
                  className="form-input"
                  value={selectedVisitor.time}
                  onChange={(e) => setSelectedVisitor({ ...selectedVisitor, time: e.target.value })}
                  required
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <label className="form-group">
                <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Visitor Type</span>
                <select
                  className="form-select"
                  value={selectedVisitor.type}
                  onChange={(e) => setSelectedVisitor({ ...selectedVisitor, type: e.target.value })}
                >
                  {VISITOR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.value}</option>
                  ))}
                </select>
              </label>

              <label className="form-group">
                <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>Status</span>
                <select
                  className="form-select"
                  value={selectedVisitor.status}
                  onChange={(e) => setSelectedVisitor({ ...selectedVisitor, status: e.target.value })}
                >
                  {VISITOR_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
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
    </div>
  );
}
