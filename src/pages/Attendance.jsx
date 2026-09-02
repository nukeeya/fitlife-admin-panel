import { useState } from 'react';
import { Search, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { attendanceRecords, hourlyCheckins, stats } from '../data/gymData';
import { useTheme } from '../context/ThemeContext';

export default function Attendance() {
  const { theme } = useTheme();
  const lime = theme === 'light' ? '#0066ff' : '#C8FF00';
  const gridColor = theme === 'light' ? '#E0E0E0' : '#292929';
  const axisColor = theme === 'light' ? '#999999' : '#666666';
  const tooltipBg = theme === 'light' ? '#FFFFFF' : '#151515';
  const tooltipBorder = theme === 'light' ? '#E0E0E0' : '#292929';
  const tooltipText = theme === 'light' ? '#1A1A1A' : '#FFFFFF';

  const [search, setSearch] = useState('');
  const [date] = useState('28 AUG 2026');

  const filtered = attendanceRecords.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Attendance Tracking System</h1>
          <p className="page-subtitle">
            TODAY'S CHECK-INS <span className="highlight-number">{stats.checkIns}</span>
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
          <div className="date-box">
            <Calendar size={16} />
            <span>DATE: {date}</span>
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

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>MEMBER</th>
              <th>CHECK-IN</th>
              <th>CHECK-OUT</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.checkIn}</td>
                <td>{r.checkOut}</td>
                <td>
                  <span className={`status-badge ${r.status === 'In' ? 'active' : 'expired'}`}>
                    ● {r.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
