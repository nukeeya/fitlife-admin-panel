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
  stats,
  attendanceData,
  membershipOverview,
  members,
} from '../data/gymData';
import { useTheme } from '../context/ThemeContext';

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
          value={stats.activeMembers.toLocaleString()}
          change={`↑ ${stats.activeMembersChange}%`}
          changeLabel="vs last month"
          icon={Users}
        />
        <StatCard
          title="TODAY'S CHECK-INS"
          value={stats.checkIns}
          change={`↑ ${stats.checkInsChange}%`}
          changeLabel="vs yesterday"
          icon={CalendarCheck}
        />
        <StatCard
          title="MONTHLY REVENUE"
          value={stats.monthlyRevenue}
          change={`↑ ${stats.revenueChange}%`}
          changeLabel="vs last month"
          icon={DollarSign}
        />
        <StatCard
          title="EXPIRING SOON"
          value={stats.expiringSoon}
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
              <span className="donut-total">{stats.activeMembers.toLocaleString()}</span>
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
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="member-cell">
                    <div className="avatar">{m.avatar}</div>
                    {m.name}
                  </div>
                </td>
                <td>{m.plan}</td>
                <td>{m.joined}</td>
                <td>{m.expiry}</td>
                <td>
                  <span className={`status-badge ${m.status.toLowerCase()}`}>
                    ● {m.status.toUpperCase()}
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
