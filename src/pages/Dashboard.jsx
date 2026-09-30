import {
  Users,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Activity,
  UserX,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useGymData } from '../context/GymDataContext';

function StatCard({ title, value, change, changeLabel, icon: Icon, isLime, color }) {
  return (
    <div className={`stat-card ${isLime ? 'stat-card-lime' : ''}`}>
      <div className="stat-card-top">
        <span className="stat-card-title">{title}</span>
        <div className="stat-icon-wrapper" style={{ color: color || 'inherit' }}>
          <Icon size={20} />
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {(change || changeLabel) && (
        <div className="stat-card-bottom">
          {change && <span className="stat-card-change">{change}</span>}
          {changeLabel && <span className="stat-card-label">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { theme } = useTheme();
  const {
    stats,
    analytics,
    attendance,
    members,
    checkInMember,
    checkOutMember,
  } = useGymData();

  const textColor = theme === 'light' ? '#666666' : '#8E8E93';
  const gridColor = theme === 'light' ? '#E5E5EA' : '#222222';
  const tooltipBg = theme === 'light' ? '#FFFFFF' : '#141414';
  const tooltipBorder = theme === 'light' ? '#E0E0E0' : '#292929';
  const primaryColor = theme === 'light' ? '#2563EB' : '#C8FF00';

  // Live Activity Logs (Present on floor vs Departed today)
  const membersIn = attendance.filter((a) => a.status === 'In');
  const membersOut = attendance.filter((a) => a.status === 'Out');

  const chartData = [
    { day: 'Mon', checkins: 124, revenue: 12000 },
    { day: 'Tue', checkins: 145, revenue: 18500 },
    { day: 'Wed', checkins: 132, revenue: 9000 },
    { day: 'Thu', checkins: 168, revenue: 24000 },
    { day: 'Fri', checkins: 189, revenue: 31000 },
    { day: 'Sat', checkins: 210, revenue: 42000 },
    { day: 'Sun', checkins: 154, revenue: 15000 },
  ];

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Executive Command Center</h1>
          <p className="page-subtitle">
            Enterprise analytics, multi-branch tracking & real-time gym floor activity.
          </p>
        </div>
      </div>

      {/* =========================================================================
          14 CORE DASHBOARD KPI CARDS
          ========================================================================= */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* 1. Total Active Members */}
        <StatCard
          title="TOTAL ACTIVE"
          value={stats.activeMembers.toLocaleString()}
          change="↑ 8.4%"
          changeLabel="vs last month"
          icon={Users}
        />

        {/* 2. Active Male Members */}
        <StatCard
          title="ACTIVE MALE"
          value={analytics.activeMale.toLocaleString()}
          changeLabel="72% of total"
          icon={Users}
        />

        {/* 3. Active Female Members */}
        <StatCard
          title="ACTIVE FEMALE"
          value={analytics.activeFemale.toLocaleString()}
          changeLabel="28% of total"
          icon={Users}
        />

        {/* 4. Expired Members */}
        <StatCard
          title="TOTAL EXPIRED"
          value={stats.expiredMembers.toLocaleString()}
          changeLabel="Require renewal"
          icon={UserX}
          color="var(--danger)"
        />

        {/* 5. Today's Check-ins */}
        <StatCard
          title="TODAY CHECK-INS"
          value={stats.checkIns}
          change="↑ 12.6%"
          changeLabel="Active attendance"
          icon={CalendarCheck}
        />

        {/* 6. Today Male Check-ins */}
        <StatCard
          title="TODAY MALE SCANS"
          value={analytics.todayMaleCheckins}
          changeLabel="Floor presence"
          icon={CalendarCheck}
        />

        {/* 7. Today Female Check-ins */}
        <StatCard
          title="TODAY FEMALE SCANS"
          value={analytics.todayFemaleCheckins}
          changeLabel="Floor presence"
          icon={CalendarCheck}
        />

        {/* 8. Today Total Collected */}
        <StatCard
          title="TODAY COLLECTED"
          value={`৳${analytics.todayCollected.toLocaleString()}`}
          changeLabel="Cash, bKASH, POS"
          icon={CreditCard}
        />

        {/* 9. Today Total Due */}
        <StatCard
          title="TODAY DUE"
          value={`৳${analytics.todayDue.toLocaleString()}`}
          changeLabel="Pending invoices"
          icon={AlertTriangle}
          color="var(--warning)"
        />

        {/* 10. Monthly Collected */}
        <StatCard
          title="MONTHLY REVENUE"
          value={`৳${analytics.monthlyCollected.toLocaleString()}`}
          change="↑ 18.2%"
          changeLabel="Current billing cycle"
          icon={DollarSign}
        />

        {/* 11. Monthly Due Balance */}
        <StatCard
          title="MONTHLY TOTAL DUE"
          value={`৳${analytics.monthlyDue.toLocaleString()}`}
          changeLabel="Receivable from members"
          icon={Clock}
          color="var(--warning)"
        />

        {/* 12. Active Trainers */}
        <StatCard
          title="ACTIVE TRAINERS"
          value={stats.trainersCount}
          changeLabel="On roster duty"
          icon={ShieldCheck}
        />

        {/* 13. Active Employees */}
        <StatCard
          title="ACTIVE EMPLOYEES"
          value={stats.employeesCount}
          changeLabel="Admin & Front desk"
          icon={Activity}
        />

        {/* 14. Membership Expiring Soon */}
        <StatCard
          title="EXPIRING (7 DAYS)"
          value={stats.expiringSoon}
          icon={AlertTriangle}
          isLime
          changeLabel="Urgent follow-up"
        />
      </div>

      {/* Analytics Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
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

      {/* =========================================================================
          LIVE ACTIVITY LOGS (Members In & Members Out Tables)
          ========================================================================= */}
      <div className="activity-logs-container" style={{ marginTop: '20px' }}>
        {/* Members In */}
        <div className="activity-card">
          <div className="activity-header">
            <div className="activity-title-group">
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Live Activity: Members In</span>
              <span className="activity-pill-in">{membersIn.length} Present</span>
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
        <div className="activity-card" style={{ marginTop: '20px' }}>
          <div className="activity-header">
            <div className="activity-title-group">
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Live Activity: Members Out</span>
              <span className="activity-pill-out">{membersOut.length} Departed</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Session completed</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Member</th>
                  <th>Time Out</th>
                  <th>Package</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {membersOut.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No check-outs recorded today yet.
                    </td>
                  </tr>
                ) : (
                  membersOut.map((rec, idx) => (
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
                      <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{rec.checkOut}</td>
                      <td><span className="badge badge-primary">{rec.plan}</span></td>
                      <td style={{ fontSize: '12px' }}>{rec.expiry}</td>
                      <td><span className="badge badge-danger">Out</span></td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => checkInMember(rec.memberId)}
                        >
                          Re-Entry
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}