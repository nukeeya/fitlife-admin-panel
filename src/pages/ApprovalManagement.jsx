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
  AlertCircle,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import ApprovalModal from '../components/ApprovalModal';

export default function ApprovalManagement() {
  const { applications, rejectApplication } = useGymData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedAppForApproval, setSelectedAppForApproval] = useState(null);

  const filtered = applications.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReject = (app) => {
    const reason = prompt(`Enter rejection reason for ${app.name}:`, 'Incomplete documentation');
    if (reason) {
      rejectApplication(app.id, reason);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Approval Management</h1>
          <p className="page-subtitle">
            Review, approve with dynamic discounted packages, or reject online member registration applications.
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
        <div className="header-search" style={{ width: '320px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['Pending', 'Approved', 'Rejected', 'All'].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
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
                    {app.photo || app.name.slice(0, 2).toUpperCase()}
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
                <div><strong>Email:</strong> {app.email}</div>
                <div><strong>Desired Plan:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{app.desiredPlan}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Target size={12} color="var(--primary)" /> <strong>Goal:</strong> {app.goal}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: app.medical === 'None' ? 'var(--text-muted)' : 'var(--warning)' }}>
                  <Heart size={12} /> <strong>Medical:</strong> {app.medical || 'None'}
                </div>
                {app.rejectionReason && (
                  <div style={{ color: 'var(--danger)', marginTop: '4px' }}>
                    <strong>Rejection Reason:</strong> {app.rejectionReason}
                  </div>
                )}
              </div>

              {app.status === 'Pending' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedAppForApproval(app)}
                  >
                    <Sparkles size={14} />
                    Approve & Discount
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(app)}
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        application={selectedAppForApproval}
        isOpen={Boolean(selectedAppForApproval)}
        onClose={() => setSelectedAppForApproval(null)}
      />
    </div>
  );
}
