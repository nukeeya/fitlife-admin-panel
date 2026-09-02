import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Award,
  CalendarCheck,
  MessageSquare,
  Briefcase,
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  AlertTriangle,
  UserPlus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
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
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Operational Overview Dashboard</h1>
          <p className="page-subtitle">
            Real-time analytics, dynamic discounted sales, attendance telemetry & member logs.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdmission}>
            <Sparkles size={16} />
            + New Admission & Discount
          </button>
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

        {/* 14. Membership Expiring (Today) */}
        <div className="stat-widget" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <div className="stat-widget-top">
            <span className="stat-widget-title">Expiring (Today)</span>
            <div className="stat-widget-icon" style={{ color: 'var(--warning)' }}><AlertTriangle size={18} /></div>
          </div>
          <div className="stat-widget-value warning-highlight">{analytics.expiringTodayCount} Members</div>
          <div className="stat-widget-sub">Renewal reminder needed</div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px' }}>
            Weekly Check-Ins & Revenue Trend
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" stroke={textColor} fontSize={12} />
              <YAxis stroke={textColor} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '8px',
                  color: theme === 'light' ? '#0F172A' : '#FFFFFF',
                }}
              />
              <Area type="monotone" dataKey="checkins" stroke={primaryColor} fillOpacity={1} fill="url(#colorCheckins)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px' }}>
            Peak Daily Hours
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { hour: '6 AM', count: 28 },
              { hour: '8 AM', count: 45 },
              { hour: '11 AM', count: 20 },
              { hour: '4 PM', count: 32 },
              { hour: '6 PM', count: 58 },
              { hour: '8 PM', count: 48 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="hour" stroke={textColor} fontSize={11} />
              <YAxis stroke={textColor} fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill={primaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
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
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Updated real-time</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Member</th>
                  <th>Time In</th>
                  <th>Package</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {membersIn.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No members currently on the gym floor.
                    </td>
                  </tr>
                ) : (
                  membersIn.map((rec, idx) => (
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
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{rec.checkIn}</td>
                      <td><span className="badge badge-primary">{rec.plan}</span></td>
                      <td style={{ fontSize: '12px' }}>{rec.expiry}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Members Out */}
        <div className="activity-card">
          <div className="activity-header">
            <div className="activity-title-group">
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Live Activity: Members Out</span>
              <span className="activity-pill-out">{membersOut.length} Departed</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Session completed</span>
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
