import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Key,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function LockerManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'assigned'; // 'assigned' | 'edit-list'

  const { lockers, members, assignLocker, releaseLocker } = useGymData();
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const filtered = lockers.filter((l) => {
    const matchesSearch =
      l.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.assignedTo && l.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.memberCode && l.memberCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesZone = zoneFilter === 'All' || l.zone.includes(zoneFilter);

    if (activeTab === 'assigned') {
      return matchesSearch && matchesZone && l.status === 'Occupied';
    }
    return matchesSearch && matchesZone;
  });

  const handleOpenAssign = (locker) => {
    setSelectedLocker(locker);
    setSelectedMemberId(members[0]?.id || '');
    setShowAssignModal(true);
  };

  const handleConfirmAssign = (e) => {
    e.preventDefault();
    if (selectedLocker && selectedMemberId) {
      assignLocker({
        lockerId: selectedLocker.id,
        memberId: selectedMemberId,
      });
      setShowAssignModal(false);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Locker Management</h1>
          <p className="page-subtitle">
            Manage assigned member lockers, biometric/PIN access zones, maintenance and rental slots.
          </p>
        </div>

        <div className="subtabs-bar">
          <button
            className={`subtab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'assigned' })}
          >
            Assigned Locker View
          </button>
          <button
            className={`subtab-btn ${activeTab === 'edit-list' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'edit-list' })}
          >
            Locker Edit List & Zones
          </button>
        </div>
      </div>

      {/* Filter & Stats Row */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
        <div className="header-search" style={{ width: '300px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search locker number or member..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Zone A', 'Zone B', 'Zone VIP', 'VIP Suite'].map((z) => (
            <button
              key={z}
              className={`btn btn-sm ${zoneFilter === z ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoneFilter(z)}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Grid or Table Display */}
      {activeTab === 'assigned' ? (
        <div className="activity-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Locker No</th>
                  <th>Zone & Type</th>
                  <th>Assigned Member</th>
                  <th>Member Code</th>
                  <th>Expiry Date</th>
                  <th>Monthly Fee</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No occupied lockers match your filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 800, fontSize: '15px', color: 'var(--primary)' }}>
                        {l.number}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{l.zone}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.type}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{l.assignedTo}</td>
                      <td><span className="badge badge-primary">{l.memberCode}</span></td>
                      <td style={{ fontSize: '12px' }}>{l.expiryDate}</td>
                      <td style={{ fontWeight: 700 }}>৳{l.monthlyFee} / mo</td>
                      <td><span className="badge badge-danger">Occupied</span></td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (confirm(`Release locker ${l.number} from ${l.assignedTo}?`)) {
                              releaseLocker(l.id);
                            }
                          }}
                        >
                          Release Locker
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Locker Edit List Grid */
        <div className="lockers-grid">
          {filtered.map((l) => (
            <div key={l.id} className={`locker-card ${l.status.toLowerCase()}`}>
              <Key size={24} color={l.status === 'Available' ? '#10B981' : l.status === 'Occupied' ? '#EF4444' : '#F59E0B'} />
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>{l.number}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.zone}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{l.type}</span>

              <span
                className={`badge ${
                  l.status === 'Available'
                    ? 'badge-success'
                    : l.status === 'Occupied'
                    ? 'badge-danger'
                    : 'badge-warning'
                }`}
              >
                {l.status}
              </span>

              {l.assignedTo ? (
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {l.assignedTo} ({l.memberCode})
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: '6px' }}
                  onClick={() => handleOpenAssign(l)}
                >
                  Assign Member
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assign Locker Modal */}
      {showAssignModal && selectedLocker && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '16px', fontWeight: 800 }}>
                Assign Locker {selectedLocker.number} ({selectedLocker.zone})
              </h2>
            </div>
            <form onSubmit={handleConfirmAssign}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Member</label>
                  <select
                    className="form-select"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.code} - {m.plan})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Rental Fee</label>
                  <input
                    type="text"
                    disabled
                    className="form-input"
                    value={`৳${selectedLocker.monthlyFee} / month`}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Locker Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
