import { useState, useEffect } from 'react';
import { Search, Calendar, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { hourlyCheckins } from '../data/gymData';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

export default function Attendance() {
  const { theme } = useTheme();
  const lime = theme === 'light' ? '#0066ff' : '#C8FF00';
  const gridColor = theme === 'light' ? '#E0E0E0' : '#292929';
  const axisColor = theme === 'light' ? '#999999' : '#666666';
  const tooltipBg = theme === 'light' ? '#FFFFFF' : '#151515';
  const tooltipBorder = theme === 'light' ? '#E0E0E0' : '#292929';
  const tooltipText = theme === 'light' ? '#1A1A1A' : '#FFFFFF';

  const [search, setSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  useEffect(() => {
    fetchAttendance();
  }, []);

  async function fetchAttendance() {
    const todayStart = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        check_in,
        check_out,
        status,
        members(first_name, last_name)
      `)
      .gte('check_in', todayStart)
      .order('check_in', { ascending: false });

    if (!error && data) {
      setRecords(data.map(r => ({
        id: r.id,
        name: r.members ? `${r.members.first_name} ${r.members.last_name}` : 'Unknown',
        checkIn: r.check_in ? new Date(r.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—',
        checkOut: r.check_out ? new Date(r.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—',
        status: r.status || 'In',
      })));
    }
    setLoading(false);
  }

  const filtered = records.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--lime)' }} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">ATTENDANCE</h1>
          <p className="page-subtitle">
            TODAY'S CHECK-INS <span className="highlight-number">{records.length}</span>
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
            <span>DATE: {today}</span>
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
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>No check-ins today yet</td></tr>
            )}
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
