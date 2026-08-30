import { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  attendanceData,
  membershipOverview,
} from '../data/gymData';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

function StatCard({ title, value, change, changeLabel, icon: Icon, isLime }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        <Icon size={18} className="stat-icon" />
      </div>
      <div className={`stat-value ${isLime ? 'lime' : ''}`}>{value}</div>
      {change && (
        <div className="stat-change">
          <span className="change-positive">
            <TrendingUp size={12} /> {change}
          </span>
          <span className="change-label">{changeLabel}</span>
        </div>
      )}
      {changeLabel === 'NEXT 7 DAYS' && (
        <div className="stat-change">
          <span className="change-label">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { theme } = useTheme();
  const lime = theme === 'light' ? '#0066ff' : '#C8FF00';
  const gridColor = theme === 'light' ? '#E0E0E0' : '#292929';
  const axisColor = theme === 'light' ? '#999999' : '#666666';
  const tooltipBg = theme === 'light' ? '#FFFFFF' : '#151515';
  const tooltipBorder = theme === 'light' ? '#E0E0E0' : '#292929';
  const tooltipText = theme === 'light' ? '#1A1A1A' : '#FFFFFF';

  const [stats, setStats] = useState({ active_members: 0, today_checkins: 0, pending_submissions: 0 });
  const [recentMembers, setRecentMembers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    // Fetch stats from view
    const { data: statsData } = await supabase
      .rpc ? supabase.from('dashboard_stats').select('*').limit(1) : { data: null };

    // Fallback: fetch counts manually
    const [membersRes, checkinsRes, pendingRes] = await Promise.all([
      supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
      supabase.from('attendance').select('id', { count: 'exact', head: true }).gte('check_in', new Date().toISOString().split('T')[0]),
      supabase.from('admission_submissions').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
    ]);

    setStats({
      active_members: membersRes.count || 0,
      today_checkins: checkinsRes.count || 0,
      pending_submissions: pendingRes.count || 0,
    });

    // Fetch recent members
    const { data: members } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentMembers(members || []);
  }

  const donutColors = [
    theme === 'light' ? '#0066ff' : '#C8FF00',
    theme === 'light' ? '#999999' : '#666666',
    theme === 'light' ? '#CCCCCC' : '#444444',
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">GOOD MORNING, ADMIN</h1>
          <p className="page-subtitle">Here's what's happening at FitLife today.</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <StatCard
          title="ACTIVE MEMBERS"
          value={stats.active_members.toLocaleString()}
          change="↑ 8.4%"
          changeLabel="vs last month"
          icon={Users}
        />
        <StatCard
          title="TODAY'S CHECK-INS"
          value={stats.today_checkins}
          change="↑ 12.6%"
          changeLabel="vs yesterday"
          icon={CalendarCheck}
        />
        <StatCard
          title="PENDING ADMISSIONS"
          value={stats.pending_submissions}
          changeLabel="Awaiting review"
          icon={DollarSign}
        />
        <StatCard
          title="EXPIRING SOON"
          value="—"
          icon={AlertTriangle}
          isLime
          changeLabel="NEXT 7 DAYS"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Attendance Chart */}
        <div className="chart-card large">
          <div className="chart-header">
            <h2 className="chart-title">ATTENDANCE OVERVIEW</h2>
            <p className="chart-subtitle">Member check-ins over the last 7 days</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" stroke={axisColor} tick={{ fontSize: 12 }} />
                <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    color: tooltipText,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="checkins"
                  stroke={lime}
                  strokeWidth={2}
                  dot={{ fill: lime, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Membership Donut */}
        <div className="chart-card medium">
          <div className="chart-header">
            <h2 className="chart-title">MEMBERSHIP OVERVIEW</h2>
          </div>
          <div className="chart-body donut-container">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={membershipOverview}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {membershipOverview.map((entry, index) => (
                    <Cell key={index} fill={donutColors[index] || entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="donut-total">{stats.active_members.toLocaleString()}</span>
              <span className="donut-label">TOTAL MEMBERS</span>
            </div>
            <div className="donut-legend">
              {membershipOverview.map((item, index) => (
                <div key={item.name} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: donutColors[index] || item.color }} />
                  <span className="legend-name">{item.name.toUpperCase()}</span>
                  <span className="legend-value">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Members Table */}
      <div className="table-card">
        <div className="table-header">
          <h2 className="chart-title">RECENT MEMBERS</h2>
          <button className="view-all-btn">
            VIEW ALL <ArrowRight size={14} />
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>MEMBER</th>
              <th>PLAN</th>
              <th>JOINED</th>
              <th>EXPIRY</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {recentMembers.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="member-cell">
                    <div className="avatar">
                      {m.first_name?.[0]}{m.last_name?.[0]}
                    </div>
                    {m.first_name} {m.last_name}
                  </div>
                </td>
                <td>{m.plan}</td>
                <td>{m.joined ? new Date(m.joined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase() : '—'}</td>
                <td>{m.expiry ? new Date(m.expiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase() : '—'}</td>
                <td>
                  <span className={`status-badge ${m.status?.toLowerCase()}`}>
                    ● {m.status?.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
