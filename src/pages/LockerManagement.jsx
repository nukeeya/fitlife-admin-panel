import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Key,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function LockerManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'assigned'; // 'assigned' | 'edit-list'

  const { lockers, members, assignLocker, releaseLocker } = useGymData();
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Release Confirm Dialog state
  const [releaseConfirmLocker, setReleaseConfirmLocker] = useState(null);

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
      setSelectedLocker(null);
    }
  };

  const handleConfirmRelease = () => {
    if (releaseConfirmLocker) {
      releaseLocker(releaseConfirmLocker.id);
      setReleaseConfirmLocker(null);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Smart Locker Management</h1>
          <p className="page-subtitle">
            Assign digital RFID lockers, track occupancy zones, monthly rental periods and maintenance.
          </p>
        </div>

        <div className="subtabs-bar">
          <button
            type="button"
            className={`subtab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'assigned' })}
          >
            Assigned Locker List
          </button>
          <button
            type="button"
            className={`subtab-btn ${activeTab === 'edit-list' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'edit-list' })}
          >
            Locker Floor Grid & Zones
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="header-search" style={{ width: '300px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search locker no, member or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>ZONE:</span>
          {['All', 'Zone A', 'Zone B', 'Zone C', 'Executive'].map((z) => (
            <button
              key={z}
              type="button"
              className={`btn btn-sm ${zoneFilter === z ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoneFilter(z)}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Assigned Locker List Table */}
      {activeTab === 'assigned' ? (
        <div className="activity-card">
          <div className="activity-header">
            <span style={{ fontWeight: 800 }}>Active Locker Allocations</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {filtered.length} Occupied Lockers
            </span>
          </div>

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
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReleaseConfirmLocker(l)}
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
                  l.status === 'Available' ? 'badge-success' : l.status === 'Occupied' ? 'badge-danger' : 'badge-warning'
                }`}
                style={{ marginTop: '4px' }}
              >
                {l.status}
              </span>

              {l.status === 'Occupied' && (
                <div style={{ fontSize: '11px', marginTop: '4px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700 }}>{l.assignedTo}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Exp: {l.expiryDate}</div>
                </div>
              )}

              {l.status === 'Available' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={() => handleOpenAssign(l)}
                >
                  Assign
                </button>
              )}

              {l.status === 'Occupied' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={() => setReleaseConfirmLocker(l)}
                >
                  Release
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Standardized Assign Locker Modal */}
      <Modal
        isOpen={showAssignModal && !!selectedLocker}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedLocker(null);
        }}
        title={selectedLocker ? `Assign Locker ${selectedLocker.number} (${selectedLocker.zone})` : 'Assign Locker'}
        subtitle="Select an active gym member to allocate digital locker access"
        icon={Key}
        size="sm"
      >
        {selectedLocker && (
          <form onSubmit={handleConfirmAssign}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Select Active Member *</label>
                <select
                  className="form-select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code} - {m.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Rental Tariff</label>
                <input
                  type="text"
                  disabled
                  className="form-input"
                  value={`৳${selectedLocker.monthlyFee} / month`}
                  style={{ opacity: 0.8 }}
                />
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Lockers are billed monthly in sync with membership renewals. Digital lock code will be sent via SMS upon assignment.
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedLocker(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Locker Assignment
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Release Locker Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!releaseConfirmLocker}
        onClose={() => setReleaseConfirmLocker(null)}
        onConfirm={handleConfirmRelease}
        title="Release Assigned Locker"
        message={
          releaseConfirmLocker
            ? `Are you sure you want to release Locker ${releaseConfirmLocker.number} from member "${releaseConfirmLocker.assignedTo}"? This will revoke digital lock code access and mark the locker available for other members.`
            : ''
        }
        confirmText="Yes, Release Locker"
        cancelText="Keep Assigned"
        type="warning"
      />
    </div>
  );
}
