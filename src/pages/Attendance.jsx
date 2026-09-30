import { useState } from 'react';
<<<<<<< Updated upstream
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
=======
import { Search } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { hourlyCheckins, stats } from '../data/gymData';
import { useGymData } from '../context/GymDataContext';
import { useTheme } from '../context/ThemeContext';

export default function Attendance() {
  const { theme } = useTheme();
  const { members, attendance, checkInMember, checkOutMember, bulkCheckIn } = useGymData();

  const gridColor = theme === 'light' ? '#E0E0E0' : '#292929';
  const textColor = theme === 'light' ? '#999999' : '#666666';
  const tooltipBg = theme === 'light' ? '#FFFFFF' : '#151515';
  const tooltipBorder = theme === 'light' ? '#E0E0E0' : '#292929';

  const [activeTab, setActiveTab] = useState('daily-present');
  const [search, setSearch] = useState('');
  const [selectedBulkIds, setSelectedBulkIds] = useState([]);

  const todayAttendance = attendance.filter((a) => a.status === 'In');
  const checkedOutToday = attendance.filter((a) => a.status === 'Out');
  const checkedInIds = todayAttendance.map((a) => a.memberId);
  const absentMembers = members.filter((m) => m.status === 'Active' && !checkedInIds.includes(m.id));

  const filtered = attendance.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleBulkSelect = (id) => {
    setSelectedBulkIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
>>>>>>> Stashed changes
    );
  };

  const handleBulkCheckInSubmit = () => {
<<<<<<< Updated upstream
    if (selectedBulkIds.length === 0) return;
    const count = selectedBulkIds.length;
    bulkCheckIn(selectedBulkIds, 'Manual Admin');
    setSelectedBulkIds([]);
    setSuccessNotice(`Successfully checked in ${count} members.`);
  };

=======
    bulkCheckIn(selectedBulkIds);
    setSelectedBulkIds([]);
  };

  const tabs = [
    { id: 'daily-present', label: 'Daily Present' },
    { id: 'daily-absent', label: 'Daily Absent' },
    { id: 'summary', label: 'Summary' },
    { id: 'individual', label: 'Individual' },
    { id: 'multiple', label: 'Bulk Check-In' },
  ];

>>>>>>> Stashed changes
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">
<<<<<<< Updated upstream
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

=======
            TODAY'S CHECK-INS <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{stats.checkIns}</span>
          </p>
        </div>

        <div className="subtabs-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`subtab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Present */}
      {activeTab === 'daily-present' && (
        <div className="activity-card">
          <div className="activity-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800 }}>Present Members Today</span>
              <span className="badge badge-success">{todayAttendance.length} on floor</span>
            </div>
          </div>
>>>>>>> Stashed changes
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
<<<<<<< Updated upstream
                  <th>SL</th>
                  <th>Member Name</th>
                  <th>Code</th>
                  <th>Check In</th>
                  <th>Method</th>
                  <th>Plan</th>
=======
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Check-In Time</th>
                  <th>Method</th>
>>>>>>> Stashed changes
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
<<<<<<< Updated upstream
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
=======
                {todayAttendance.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No members checked in yet today.</td></tr>
                ) : (
                  todayAttendance.map((rec) => (
                    <tr key={rec.id}>
                      <td><div className="member-cell"><div className="avatar-initials">{rec.avatar}</div><div className="member-cell-info"><span className="member-cell-name">{rec.name}</span><span className="member-cell-code">{rec.memberCode}</span></div></div></td>
                      <td><span className="badge badge-primary">{rec.plan}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{rec.checkIn}</td>
                      <td>{rec.method}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => checkOutMember(rec.id)}>Check Out</button></td>
>>>>>>> Stashed changes
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Absent */}
      {activeTab === 'daily-absent' && (
        <div className="activity-card">
          <div className="activity-header">
<<<<<<< Updated upstream
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 800 }}>Daily Absent Active Members</span>
=======
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800 }}>Absent Active Members</span>
>>>>>>> Stashed changes
              <span className="badge badge-danger">{absentMembers.length} absent today</span>
            </div>
          </div>
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
<<<<<<< Updated upstream
                  <th>SL</th>
                  <th>Member Name</th>
                  <th>Code</th>
                  <th>Phone</th>
                  <th>Plan</th>
=======
                  <th>Member</th>
                  <th>Phone</th>
                  <th>Plan</th>
                  <th>Status</th>
>>>>>>> Stashed changes
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {absentMembers.length === 0 ? (
<<<<<<< Updated upstream
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
=======
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>All active members checked in!</td></tr>
                ) : (
                  absentMembers.map((m) => (
                    <tr key={m.id}>
                      <td><div className="member-cell"><div className="avatar-initials">{m.avatar}</div><span>{m.name}</span></div></td>
                      <td>{m.phone}</td>
                      <td>{m.plan}</td>
                      <td><span className="badge badge-warning">Absent</span></td>
                      <td><button className="btn btn-primary btn-sm" onClick={() => checkInMember(m.id)}>Check In</button></td>
>>>>>>> Stashed changes
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="activity-card" style={{ padding: '20px' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '16px' }}>Hourly Check-In Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyCheckins}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="hour" stroke={textColor} fontSize={11} />
                <YAxis stroke={textColor} fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="activity-card" style={{ padding: '20px' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '16px' }}>Today's Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <span>Total Check-Ins</span><span style={{ fontWeight: 800, color: 'var(--primary)' }}>{attendance.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <span>Currently In Gym</span><span style={{ fontWeight: 800, color: '#10B981' }}>{todayAttendance.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <span>Checked Out</span><span style={{ fontWeight: 800, color: '#F59E0B' }}>{checkedOutToday.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <span>Absent (Active)</span><span style={{ fontWeight: 800, color: '#EF4444' }}>{absentMembers.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual */}
      {activeTab === 'individual' && (
        <div className="activity-card">
          <div className="activity-header">
            <span style={{ fontWeight: 800 }}>Individual Attendance Logs</span>
          </div>
          <div style={{ padding: '16px' }}>
            <div className="header-search" style={{ width: '100%' }}>
              <Search size={16} color="var(--text-muted)" />
              <input type="text" placeholder="Search member name..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td><div className="member-cell"><div className="avatar-initials">{log.avatar}</div><span>{log.name}</span></div></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{log.checkIn}</td>
                    <td>{log.checkOut || '—'}</td>
                    <td><span className="badge badge-info">{log.method}</span></td>
                    <td><span className={`badge ${log.status === 'In' ? 'badge-success' : 'badge-danger'}`}>{log.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Check-In */}
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
              Check In Selected ({selectedBulkIds.length})
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
                        if (e.target.checked) setSelectedBulkIds(absentMembers.map((m) => m.id));
                        else setSelectedBulkIds([]);
                      }}
                    />
                  </th>
                  <th>Member Name</th>
                  <th>Code</th>
                  <th>Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {absentMembers.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>All active members have checked in today!</td></tr>
                ) : (
                  absentMembers.map((m) => (
                    <tr key={m.id} onClick={() => handleToggleBulkSelect(m.id)} style={{ cursor: 'pointer' }}>
                      <td><input type="checkbox" checked={selectedBulkIds.includes(m.id)} onChange={() => {}} /></td>
                      <td style={{ fontWeight: 700 }}>{m.name}</td>
                      <td><span className="badge badge-primary">{m.code}</span></td>
                      <td>{m.plan}</td>
                      <td><span className="badge badge-warning">Absent</span></td>
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
