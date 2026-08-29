import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, UserPlus, DollarSign, CalendarCheck } from 'lucide-react';
import { reportStats, revenueData, memberGrowthData } from '../data/gymData';
import { useTheme } from '../context/ThemeContext';

export default function Reports() {
  const { theme } = useTheme();
  const lime = theme === 'light' ? '#0066ff' : '#C8FF00';
  const gridColor = theme === 'light' ? '#E0E0E0' : '#292929';
  const axisColor = theme === 'light' ? '#999999' : '#666666';
  const tooltipBg = theme === 'light' ? '#FFFFFF' : '#151515';
  const tooltipBorder = theme === 'light' ? '#E0E0E0' : '#292929';
  const tooltipText = theme === 'light' ? '#1A1A1A' : '#FFFFFF';

  const cards = [
    { title: 'TOTAL MEMBERS', value: reportStats.totalMembers.toLocaleString(), icon: Users },
    { title: 'NEW MEMBERS', value: reportStats.newMembers, icon: UserPlus },
    { title: 'REVENUE', value: reportStats.revenue, icon: DollarSign },
    { title: 'ATTENDANCE', value: reportStats.attendance.toLocaleString(), icon: CalendarCheck },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">REPORTS & ANALYTICS</h1>
          <p className="page-subtitle">MONTHLY PERFORMANCE</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.title} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-title">{c.title}</span>
              <c.icon size={18} className="stat-icon" />
            </div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="charts-row">
        <div className="chart-card large">
          <div className="chart-header">
            <h2 className="chart-title">REVENUE OVERVIEW</h2>
            <p className="chart-subtitle">Monthly revenue trend</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" stroke={axisColor} tick={{ fontSize: 12 }} />
                <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    color: tooltipText,
                  }}
                  formatter={(value) => [`৳${(value / 1000).toFixed(0)}K`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill={lime} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Growth Chart */}
        <div className="chart-card medium">
          <div className="chart-header">
            <h2 className="chart-title">MEMBER GROWTH</h2>
            <p className="chart-subtitle">Jan - Aug 2026</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={memberGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" stroke={axisColor} tick={{ fontSize: 12 }} />
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
                  dataKey="members"
                  stroke={lime}
                  strokeWidth={2}
                  dot={{ fill: lime, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
