import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  Clock,
  UserX,
  FileSpreadsheet,
  Download,
  Check,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'daily-present'; // 'daily-present' | 'daily-absent' | 'summary' | 'individual' | 'multiple'

  const {
    attendance,
    members,
    checkInMember,
    checkOutMember,
    bulkCheckIn,
  } = useGymData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndividualMemberId, setSelectedIndividualMemberId] = useState(members[0]?.id || '1');
  const [selectedBulkIds, setSelectedBulkIds] = useState([]);

  // Filtered lists
  const presentRecords = attendance.filter((a) => a.status === 'In');
  const attendedTodayMemberIds = new Set(attendance.map((a) => a.memberId));
  const absentMembers = members.filter((m) => m.status === 'Active' && !attendedTodayMemberIds.has(m.id));

  // Individual member attendance records
  const selectedMemberObj = members.find((m) => m.id === selectedIndividualMemberId);
  const individualLogs = attendance.filter((a) => a.memberId === selectedIndividualMemberId);

  // Filter search
  const filteredPresent = presentRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.memberCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [successNotice, setSuccessNotice] = useState('');

  const handleToggleBulkSelect = (id) => {
    setSelectedBulkIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkCheckInSubmit = () => {
    if (selectedBulkIds.length === 0) return;
    const count = selectedBulkIds.length;
    bulkCheckIn(selectedBulkIds, 'Manual Admin');
    setSelectedBulkIds([]);
    setSuccessNotice(`Successfully checked in ${count} members.`);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">
            RFID, Biometric scans, individual audit logs & bulk manual entries.
          </p>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="customizer-tabs" style={{ marginBottom: '20px' }}>
        {[
          { id: 'daily-present', label: `Daily Present (${presentRecords.length})` },
          { id: 'daily-absent', label: `Daily Absent (${absentMembers.length})` },
          { id: 'summary', label: 'Summary' },
          { id: 'individual', label: 'Individual Audit' },
          { id: 'multiple', label: 'Bulk Check-In' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`customizer-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. DAILY PRESENT SUBTAB */}
      {activeTab === 'daily-present' && (
        <div className="activity-card">
          <div className="activity-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 800 }}>Live Floor Attendance</span>
              <span className="badge badge-success">{filteredPresent.length} Present</span>
            </div>

            <div className="header-search" style={{ width: '260px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search present..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Member Name</th>
                  <th>Code</th>
                  <th>Check In</th>
                  <th>Method</th>
                  <th>Plan</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPresent.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No members currently marked present.
                    </td>
                  </tr>
                ) : (
                  filteredPresent.map((r, i) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>{i + 1}</td>
                      <td>
                        <div className="member-cell">
                          <div className="avatar-initials">{r.avatar}</div>
                          <span style={{ fontWeight: 700 }}>{r.name}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{r.memberCode}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.checkIn}</td>
                      <td><span className="badge badge-info">{r.method}</span></td>
                      <td>{r.plan}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => checkOutMember(r.id)}
                        >
                          Check Out
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DAILY ABSENT SUBTAB */}
      {activeTab === 'daily-absent' && (
        <div className="activity-card">
          <div className="activity-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 800 }}>Daily Absent Active Members</span>
              <span className="badge badge-danger">{absentMembers.length} absent today</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Eligible for check-in
            </span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Member Name</th>
                  <th>Code</th>
                  <th>Phone</th>
                  <th>Plan</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {absentMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      All members have checked in today!
                    </td>
                  </tr>
                ) : (
                  absentMembers.map((m, i) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 700 }}>{i + 1}</td>
                      <td>
                        <div className="member-cell">
                          <div className="avatar-initials">{m.avatar}</div>
                          <span style={{ fontWeight: 700 }}>{m.name}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{m.code}</span></td>
                      <td>{m.phone}</td>
                      <td>{m.plan}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => checkInMember(m.id, 'Manual Admin')}
                        >
                          <Check size={14} /> Quick In
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SUMMARY SUBTAB */}
      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-card-title">TOTAL LOGS RECORDED</span>
              <div className="stat-card-value">{attendance.length}</div>
              <span className="stat-card-label">Overall historical records</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-title">TODAY ATTENDANCE RATE</span>
              <div className="stat-card-value">
                {members.length > 0 ? `${Math.round((attendance.length / members.length) * 100)}%` : '0%'}
              </div>
              <span className="stat-card-label">Active members present</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-title">PEAK SCAN TIME</span>
              <div className="stat-card-value" style={{ color: 'var(--primary)', fontSize: '20px' }}>
                7:00 PM - 9:00 PM
              </div>
              <span className="stat-card-label">Highest floor traffic</span>
            </div>
          </div>

          <div className="activity-card">
            <div className="activity-header">
              <span style={{ fontWeight: 800 }}>Scan Method Breakdown</span>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RFID Card Scans</span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                  {attendance.filter((a) => a.method === 'RFID Card').length}
                </h3>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Biometric Scans</span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                  {attendance.filter((a) => a.method === 'Biometric').length}
                </h3>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Manual Desk</span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#06B6D4', marginTop: '4px' }}>
                  {attendance.filter((a) => a.method === 'Manual Admin').length}
                </h3>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Peak Flow Slot</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--warning)', marginTop: '6px' }}>
                  6:00 PM - 8:30 PM
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. INDIVIDUAL ATTENDANCE SUBTAB */}
      {activeTab === 'individual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Select Member:</span>
            <select
              className="form-select"
              style={{ maxWidth: '340px' }}
              value={selectedIndividualMemberId}
              onChange={(e) => setSelectedIndividualMemberId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code} - {m.plan})
                </option>
              ))}
            </select>
          </div>

          {selectedMemberObj && (
            <div className="activity-card">
              <div className="activity-header">
                <div>
                  <span style={{ fontWeight: 800 }}>Attendance Audit: {selectedMemberObj.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                    Total Visits: {selectedMemberObj.visits} sessions
                  </span>
                </div>
                <span className="badge badge-primary">{selectedMemberObj.plan}</span>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In Time</th>
                      <th>Check Out Time</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No recent logs recorded today for this member.
                        </td>
                      </tr>
                    ) : (
                      individualLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600 }}>{log.date}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{log.checkIn}</td>
                          <td>{log.checkOut || '— (Present)'}</td>
                          <td><span className="badge badge-info">{log.method}</span></td>
                          <td>
                            <span className={`badge ${log.status === 'In' ? 'badge-success' : 'badge-danger'}`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MULTIPLE ATTENDANCE (BULK) SUBTAB */}
      {activeTab === 'multiple' && (
        <div className="activity-card">
          <div className="activity-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 800 }}>Bulk Attendance Entry</span>
              <span className="badge badge-primary">{selectedBulkIds.length} Selected</span>
            </div>

            <button
              className="btn btn-primary btn-sm"
              disabled={selectedBulkIds.length === 0}
              onClick={handleBulkCheckInSubmit}
            >
              <CheckCircle2 size={14} />
              Check In Selected Members ({selectedBulkIds.length})
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedBulkIds.length === absentMembers.length && absentMembers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBulkIds(absentMembers.map((m) => m.id));
                        } else {
                          setSelectedBulkIds([]);
                        }
                      }}
                    />
                  </th>
                  <th>Member Name</th>
                  <th>Code</th>
                  <th>Phone</th>
                  <th>Plan</th>
                  <th>Current Status</th>
                </tr>
              </thead>
              <tbody>
                {absentMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      All active members have already checked in today!
                    </td>
                  </tr>
                ) : (
                  absentMembers.map((m) => (
                    <tr key={m.id} onClick={() => handleToggleBulkSelect(m.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedBulkIds.includes(m.id)}
                          onChange={() => {}} // Handled by tr click
                        />
                      </td>
                      <td style={{ fontWeight: 700 }}>{m.name}</td>
                      <td><span className="badge badge-primary">{m.code}</span></td>
                      <td>{m.phone}</td>
                      <td>{m.plan}</td>
                      <td><span className="badge badge-warning">Absent Today</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Check-In Success Dialog */}
      <ConfirmDialog
        isOpen={!!successNotice}
        onClose={() => setSuccessNotice('')}
        onConfirm={() => setSuccessNotice('')}
        title="Attendance Confirmed"
        message={successNotice}
        confirmText="Done"
        cancelText="Close"
        type="success"
      />
    </div>
  );
}
