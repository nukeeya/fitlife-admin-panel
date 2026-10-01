import { useState } from 'react';
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Heart,
  Target,
  Sparkles,
  LayoutGrid,
  List,
  Eye,
  Phone,
  Mail,
  MapPin,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import ApprovalModal from '../components/ApprovalModal';
import Modal from '../components/common/Modal';

export default function ApprovalManagement() {
  const { applications, rejectApplication } = useGymData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedAppForApproval, setSelectedAppForApproval] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [inspectedApp, setInspectedApp] = useState(null);

  const filtered = applications.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phone?.includes(searchTerm) ||
      (a.branch && a.branch.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = applications.filter((a) => a.status === 'Pending').length;
  const approvedCount = applications.filter((a) => a.status === 'Approved').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;

  const handleReject = async (app) => {
    const reason = prompt(`Enter rejection reason for ${app.name}:`, 'Incomplete documentation');
    if (!reason) return;

    try {
      const res = await rejectApplication(app.id, reason);
      if (!res?.ok) {
        alert(
          `Failed to reject ${app.name} — ${res?.message || 'unexpected error'}\n\nThe application was left as Pending. Please check the browser console for details.`
        );
      }
    } catch (err) {
      alert(
        `Failed to reject ${app.name} — ${err?.message || 'unexpected error'}\n\nThe application was left as Pending. Please check the browser console for details.`
      );
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Admissions & Approval Management</h1>
          <p className="page-subtitle">
            Review online applicant dossiers, inspect medical notes, authorize dynamic discounts, and issue invoices.
          </p>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span className="stat-card-title">TOTAL ADMISSION APPS</span>
          <div className="stat-card-value">{applications.length}</div>
          <span className="stat-card-label">All online submissions</span>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(234, 179, 8, 0.4)' }}>
          <span className="stat-card-title" style={{ color: '#EAB308' }}>PENDING REVIEW</span>
          <div className="stat-card-value" style={{ color: '#EAB308' }}>{pendingCount}</div>
          <span className="stat-card-label">Awaiting manager action</span>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <span className="stat-card-title" style={{ color: '#10B981' }}>APPROVED & ACTIVATED</span>
          <div className="stat-card-value" style={{ color: '#10B981' }}>{approvedCount}</div>
          <span className="stat-card-label">Members created & invoiced</span>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <span className="stat-card-title" style={{ color: '#EF4444' }}>REJECTED</span>
          <div className="stat-card-value" style={{ color: '#EF4444' }}>{rejectedCount}</div>
          <span className="stat-card-label">Declined applications</span>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
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
            placeholder="Search by name, phone, branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Pending', 'Approved', 'Rejected', 'All'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(s)}
              >
                {s} {s === 'Pending' && pendingCount > 0 && `(${pendingCount})`}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-base)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 10px' }}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 10px' }}
              onClick={() => setViewMode('table')}
              title="Data Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 1. GRID / CARD VIEW */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-base)' }}>
              No {statusFilter.toLowerCase()} applications found.
            </div>
          ) : (
            filtered.map((app) => (
              <div
                key={app.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-base)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar-initials" style={{ width: '40px', height: '40px', fontSize: '13px' }}>
                      {app.photo?.startsWith('http')
                        ? <img src={app.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                        : app.photo || app.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800 }}>{app.name}</h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {app.code} • {app.gender} • {app.submittedDate}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      app.status === 'Pending'
                        ? 'badge-warning'
                        : app.status === 'Approved'
                        ? 'badge-success'
                        : 'badge-danger'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                  <div><strong>Phone:</strong> {app.phone}</div>
                  <div><strong>Email:</strong> {app.email || 'N/A'}</div>
                  <div><strong>Branch:</strong> <span style={{ textTransform: 'capitalize' }}>{app.branch || 'Main Branch'}</span></div>
                  <div><strong>Desired Plan:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{app.desiredPlan}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Target size={12} color="var(--primary)" /> <strong>Goal:</strong> {app.goal || 'General Fitness'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: (!app.medical || app.medical === 'None') ? 'var(--text-muted)' : 'var(--warning)' }}>
                    <Heart size={12} /> <strong>Medical:</strong> {app.medical || 'None'}
                  </div>
                  {app.rejectionReason && (
                    <div style={{ color: 'var(--danger)', marginTop: '4px' }}>
                      <strong>Rejection Reason:</strong> {app.rejectionReason}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setInspectedApp(app)}
                  >
                    <Eye size={13} />
                    Dossier
                  </button>

                  {app.status === 'Pending' && (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 2, justifyContent: 'center' }}
                        onClick={() => setSelectedAppForApproval(app)}
                      >
                        <Sparkles size={14} />
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(app)}
                        title="Reject application"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="activity-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Contact</th>
                  <th>Branch & Plan</th>
                  <th>Health / Goal</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No {statusFilter.toLowerCase()} applications found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="member-cell">
                          <div className="avatar-initials">
                            {app.photo?.startsWith('http')
                              ? <img src={app.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                              : app.photo || app.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 700 }}>{app.name}</span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.code} • {app.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          <div>{app.phone}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{app.email || '—'}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className="badge badge-primary">{app.desiredPlan}</span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'capitalize' }}>
                            {app.branch || 'Main Branch'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          <div>{app.goal || 'General Fitness'}</div>
                          <div style={{ color: (!app.medical || app.medical === 'None') ? 'var(--text-muted)' : 'var(--warning)', fontSize: '11px' }}>
                            Medical: {app.medical || 'None'}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px' }}>{app.submittedDate}</td>
                      <td>
                        <span
                          className={`badge ${
                            app.status === 'Pending'
                              ? 'badge-warning'
                              : app.status === 'Approved'
                              ? 'badge-success'
                              : 'badge-danger'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setInspectedApp(app)}
                            title="Inspect applicant dossier"
                          >
                            <Eye size={13} />
                          </button>
                          {app.status === 'Pending' && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setSelectedAppForApproval(app)}
                                title="Approve with dynamic discount"
                              >
                                <Sparkles size={13} /> Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleReject(app)}
                                title="Reject application"
                              >
                                <XCircle size={13} />
                              </button>
                            </>
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
      )}

      {/* Applicant Full Dossier Modal */}
      <Modal
        isOpen={Boolean(inspectedApp)}
        onClose={() => setInspectedApp(null)}
        title={inspectedApp ? `Applicant Dossier: ${inspectedApp.name}` : 'Applicant Details'}
        subtitle={inspectedApp ? `${inspectedApp.code} • Submitted on ${inspectedApp.submittedDate}` : ''}
        icon={UserCheck}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setInspectedApp(null)}>
              Close
            </button>
            {inspectedApp?.status === 'Pending' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = inspectedApp;
                  setInspectedApp(null);
                  setSelectedAppForApproval(target);
                }}
              >
                <Sparkles size={14} /> Proceed to Approve & Discount
              </button>
            )}
          </div>
        }
      >
        {inspectedApp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Full Name</span>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{inspectedApp.name}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</span>
                <div style={{ marginTop: '2px' }}>
                  <span className={`badge ${inspectedApp.status === 'Pending' ? 'badge-warning' : inspectedApp.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>
                    {inspectedApp.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{inspectedApp.phone}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{inspectedApp.email || 'N/A'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Branch</span>
                <div style={{ fontWeight: 700, marginTop: '2px', textTransform: 'capitalize' }}>{inspectedApp.branch || 'Main Branch'}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Desired Plan</span>
                <div style={{ fontWeight: 700, marginTop: '2px', color: 'var(--primary)' }}>{inspectedApp.desiredPlan}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={15} color="var(--primary)" /> Biometrics & Health Profile
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '10px' }}>
                <div><strong>Blood Group:</strong> {inspectedApp.bloodGroup}</div>
                <div><strong>Height:</strong> {inspectedApp.height}</div>
                <div><strong>Weight:</strong> {inspectedApp.weight}</div>
              </div>
              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Medical Conditions:</strong> {inspectedApp.medical}</div>
                <div><strong>Allergies:</strong> {inspectedApp.allergies}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>Emergency Contact</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div><strong>Name:</strong> {inspectedApp.emergencyName} ({inspectedApp.emergencyRelation || 'Contact'})</div>
                <div><strong>Phone:</strong> {inspectedApp.emergencyPhone}</div>
              </div>
            </div>

            {inspectedApp.rejectionReason && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px', color: 'var(--danger)', fontSize: '12px' }}>
                <strong>Rejection Reason:</strong> {inspectedApp.rejectionReason}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <ApprovalModal
        application={selectedAppForApproval}
        isOpen={Boolean(selectedAppForApproval)}
        onClose={() => setSelectedAppForApproval(null)}
      />
    </div>
  );
}
