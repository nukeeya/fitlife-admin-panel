import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  UserCheck,
  Users,
  Clock,
  Download,
  Filter,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'daily-present'; // 'daily-present' | 'daily-absent' | 'summary' | 'individual' | 'multiple'

  const { attendance, members, checkInMember, checkOutMember, bulkCheckIn } = useGymData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndividualMemberId, setSelectedIndividualMemberId] = useState(members[0]?.id || 1);
  const [selectedBulkIds, setSelectedBulkIds] = useState([]);

  // Filter present members
  const presentMembers = attendance.filter((a) => a.date === '2026-09-01' && a.status === 'In');
  const checkedOutMembers = attendance.filter((a) => a.date === '2026-09-01' && a.status === 'Out');
  const presentMemberIds = attendance.filter((a) => a.date === '2026-09-01').map((a) => a.memberId);

  // Absent members (Active members who have not checked in today)
  const absentMembers = members.filter(
    (m) => m.status === 'Active' && !presentMemberIds.includes(m.id)
  );

  // Individual member attendance log
  const individualLogs = attendance.filter((a) => a.memberId === Number(selectedIndividualMemberId));
  const selectedMemberObj = members.find((m) => m.id === Number(selectedIndividualMemberId));

  const handleToggleBulkSelect = (id) => {
    setSelectedBulkIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkCheckInSubmit = () => {
    if (selectedBulkIds.length === 0) {
      alert('Please select at least one member.');
      return;
    }
    bulkCheckIn(selectedBulkIds);
    setSelectedBulkIds([]);
    alert(`Successfully checked in ${selectedBulkIds.length} members!`);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Attendance Tracking System</h1>
          <p className="page-subtitle">
            Daily present/absent registers, member telemetry, individual audit logs, and multiple bulk entry.
          </p>
        </div>

        <div className="subtabs-bar">
          <button
            className={`subtab-btn ${activeTab === 'daily-present' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'daily-present' })}
          >
            Daily Present
          </button>
          <button
            className={`subtab-btn ${activeTab === 'daily-absent' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'daily-absent' })}
          >
            Daily Absent
          </button>
          <button
            className={`subtab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'summary' })}
          >
            Summary Attendance
          </button>
          <button
            className={`subtab-btn ${activeTab === 'individual' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'individual' })}
          >
            Individual Attendance
          </button>
          <button
            className={`subtab-btn ${activeTab === 'multiple' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'multiple' })}
          >
            Multiple Attendance (Bulk)
          </button>
        </div>
      </div>

      {/* 1. DAILY PRESENT SUBTAB */}
      {activeTab === 'daily-present' && (
        <div className="activity-card">
          <div className="activity-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800 }}>Present Members Today (01 SEP 2026)</span>
              <span className="badge badge-success">{presentMembers.length} on floor</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Total daily entries: {attendance.length}
            </span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Check In Time</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {presentMembers.map((rec, idx) => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 700 }}>{idx + 1}</td>
                    <td>
                      <div className="member-cell">
                        <div className="avatar-initials">{rec.avatar}</div>
                        <div className="member-cell-info">
                          <span className="member-cell-name">{rec.name}</span>
                          <span className="member-cell-code">{rec.memberCode}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{rec.plan}</span></td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{rec.checkIn}</td>
                    <td><span className="badge badge-info">{rec.method}</span></td>
                    <td><span className="badge badge-success">Present</span></td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => checkOutMember(rec.id)}
                      >
                        Check Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DAILY ABSENT SUBTAB */}
      {activeTab === 'daily-absent' && (
        <div className="activity-card">
          <div className="activity-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  <th>Member</th>
                  <th>Phone</th>
                  <th>Package</th>
                  <th>Trainer</th>
                  <th>Total Past Visits</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {absentMembers.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="member-cell">
                        <div className="avatar-initials">{m.avatar}</div>
                        <div className="member-cell-info">
                          <span className="member-cell-name">{m.name}</span>
                          <span className="member-cell-code">{m.code}</span>
                        </div>
                      </div>
                    </td>
                    <td>{m.phone}</td>
                    <td><span className="badge badge-primary">{m.plan}</span></td>
                    <td>{m.trainer || 'None'}</td>
                    <td style={{ fontWeight: 700 }}>{m.visits} visits</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => checkInMember(m.id)}
                      >
                        Check In Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SUMMARY ATTENDANCE SUBTAB */}
      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="dashboard-metrics-grid">
            <div className="stat-widget">
              <span className="stat-widget-title">Today's Total Check-Ins</span>
              <div className="stat-widget-value primary-highlight">{attendance.length}</div>
              <div className="stat-widget-sub">Daily flow</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Currently Present</span>
              <div className="stat-widget-value" style={{ color: '#10B981' }}>{presentMembers.length}</div>
              <div className="stat-widget-sub">On floor now</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Completed Workouts</span>
              <div className="stat-widget-value">{checkedOutMembers.length}</div>
              <div className="stat-widget-sub">Checked out</div>
            </div>
            <div className="stat-widget">
              <span className="stat-widget-title">Absent Rate Today</span>
              <div className="stat-widget-value warning-highlight">
                {Math.round((absentMembers.length / (absentMembers.length + attendance.length || 1)) * 100)}%
              </div>
              <div className="stat-widget-sub">Of active membership</div>
            </div>
          </div>

          <div className="activity-card">
            <div className="activity-header">
              <span style={{ fontWeight: 800 }}>Attendance Breakdown by Method & Time Slots</span>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
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
    </div>
  );
}
