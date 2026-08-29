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
      <div className="page-header">
        <div>
          <h1 className="page-title">ATTENDANCE</h1>
          <p className="page-subtitle">
            TODAY'S CHECK-INS <span className="highlight-number">{stats.checkIns}</span>
          </p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search member"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="date-box">
            <Calendar size={16} />
            <span>DATE: {date}</span>
          </div>
        </div>
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

      {/* Hourly Chart */}
      <div className="chart-card full-width" style={{ marginTop: '20px' }}>
        <div className="chart-header">
          <h2 className="chart-title">CHECK-INS TODAY</h2>
          <p className="chart-subtitle">Hourly check-in distribution</p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyCheckins}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="hour" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '8px',
                  color: tooltipText,
                }}
              />
              <Bar dataKey="count" fill={lime} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
