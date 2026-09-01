import { useOutletContext } from 'react-router-dom';
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
import { useGymData } from '../context/GymDataContext';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const { openAdmission } = useOutletContext();
  const {
    getAnalytics,
    attendance,
    checkOutMember,
    checkInMember,
    members,
    expenses,
    invoices,
  } = useGymData();
  const { theme, primaryColor } = useTheme();

  const analytics = getAnalytics();

  // Split live attendance into Members In and Members Out
  const membersIn = attendance.filter((a) => a.status === 'In');
  const membersOut = attendance.filter((a) => a.status === 'Out');

  // Chart Theme variables
  const gridColor = theme === 'light' ? '#E2E8F0' : '#26262B';
  const textColor = theme === 'light' ? '#64748B' : '#94A3B8';
  const tooltipBg = theme === 'light' ? '#FFFFFF' : '#141416';
  const tooltipBorder = theme === 'light' ? '#E2E8F0' : '#33333A';

  // Sample trend data for revenue & attendance
  const chartData = [
    { day: 'Mon', checkins: 180, revenue: 35000 },
    { day: 'Tue', checkins: 220, revenue: 48000 },
    { day: 'Wed', checkins: 205, revenue: 42000 },
    { day: 'Thu', checkins: 260, revenue: 58000 },
    { day: 'Fri', checkins: 310, revenue: 75000 },
    { day: 'Sat', checkins: 290, revenue: 68000 },
    { day: 'Sun', checkins: 240, revenue: 52000 },
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

      {/* =========================================================================
          3. DASHBOARD ANALYTICS & SUMMARY WIDGETS (14 TOP METRIC CARDS)
          ========================================================================= */}
      <div className="dashboard-metrics-grid">
        {/* 1. Total Members */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Total Members</span>
            <div className="stat-widget-icon"><Users size={18} /></div>
          </div>
          <div className="stat-widget-value">{analytics.totalMembers.toLocaleString()}</div>
          <div className="stat-widget-sub">
            <span style={{ color: '#10B981', fontWeight: 700 }}>↑ 12.4%</span> vs last quarter
          </div>
        </div>

        {/* 2. Active Members */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Active Members</span>
            <div className="stat-widget-icon" style={{ color: '#10B981' }}><UserCheck size={18} /></div>
          </div>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>{analytics.activeMembers.toLocaleString()}</div>
          <div className="stat-widget-sub">Full gym access privileges</div>
        </div>

        {/* 3. Inactive Members */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Inactive / Expired</span>
            <div className="stat-widget-icon" style={{ color: 'var(--danger)' }}><UserX size={18} /></div>
          </div>
          <div className="stat-widget-value" style={{ color: 'var(--danger)' }}>{analytics.inactiveMembers}</div>
          <div className="stat-widget-sub">Eligible for SMS campaign</div>
        </div>

        {/* 4. Pending Online Reg */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Pending Online Reg.</span>
            <div className="stat-widget-icon" style={{ color: 'var(--warning)' }}><Clock size={18} /></div>
          </div>
          <div className="stat-widget-value warning-highlight">{analytics.pendingApps}</div>
          <div className="stat-widget-sub">Awaiting admin review</div>
        </div>

        {/* 5. Membership Plans */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Membership Plans</span>
            <div className="stat-widget-icon"><Award size={18} /></div>
          </div>
          <div className="stat-widget-value">{analytics.totalPlans} Active</div>
          <div className="stat-widget-sub">Basic, Standard, VIP & Elite</div>
        </div>

        {/* 6. Check In / Present / Check Out */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Live Check In / Present</span>
            <div className="stat-widget-icon"><CalendarCheck size={18} /></div>
          </div>
          <div className="stat-widget-value primary-highlight">
            {analytics.presentNow} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ {analytics.totalDailyCheckIns} Today</span>
          </div>
          <div className="stat-widget-sub">
            {analytics.checkedOutToday} Checked Out
          </div>
        </div>

        {/* 7. Remaining SMS Balance */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Remaining SMS Balance</span>
            <div className="stat-widget-icon" style={{ color: '#06B6D4' }}><MessageSquare size={18} /></div>
          </div>
          <div className="stat-widget-value" style={{ color: '#06B6D4' }}>{analytics.remainingSms.toLocaleString()}</div>
          <div className="stat-widget-sub">Credits active via Greenweb</div>
        </div>

        {/* 8. Employee Count */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Total Staff & Trainers</span>
            <div className="stat-widget-icon"><Briefcase size={18} /></div>
          </div>
          <div className="stat-widget-value">{analytics.totalEmployees} Staff</div>
          <div className="stat-widget-sub">Trainers, Operations, Desk</div>
        </div>

        {/* 9. Total Sales (This Month) */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Total Sales (This Month)</span>
            <div className="stat-widget-icon" style={{ color: 'var(--primary)' }}><DollarSign size={18} /></div>
          </div>
          <div className="stat-widget-value primary-highlight">৳{(analytics.monthlySalesTotal / 1000).toFixed(1)}k</div>
          <div className="stat-widget-sub">Real discounted revenue</div>
        </div>

        {/* 10. Today Sales (Invoice) */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Today Sales (Invoice)</span>
            <div className="stat-widget-icon"><Receipt size={18} /></div>
          </div>
          <div className="stat-widget-value">৳{analytics.todaySalesInvoice.toLocaleString()}</div>
          <div className="stat-widget-sub">Billed today</div>
        </div>

        {/* 11. Today Sales (Payment) */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Today Sales (Payment)</span>
            <div className="stat-widget-icon" style={{ color: '#10B981' }}><CreditCard size={18} /></div>
          </div>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>৳{analytics.todaySalesPayment.toLocaleString()}</div>
          <div className="stat-widget-sub">Collected in cash/bank</div>
        </div>

        {/* 12. Total Expense (This Month) */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">Total Expense (This Month)</span>
            <div className="stat-widget-icon" style={{ color: 'var(--danger)' }}><TrendingUp size={18} /></div>
          </div>
          <div className="stat-widget-value danger-highlight">৳{(analytics.monthlyExpenseTotal / 1000).toFixed(1)}k</div>
          <div className="stat-widget-sub">Maintenance, Bills, Supplies</div>
        </div>

        {/* 13. New Admissions (This Month) */}
        <div className="stat-widget">
          <div className="stat-widget-top">
            <span className="stat-widget-title">New Admissions (Month)</span>
            <div className="stat-widget-icon"><UserPlus size={18} /></div>
          </div>
          <div className="stat-widget-value">{analytics.newAdmissionsMonth}</div>
          <div className="stat-widget-sub">Member onboardings</div>
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

      {/* =========================================================================
          LIVE ACTIVITY LOGS (Members In & Members Out Tables)
          ========================================================================= */}
      <div className="activity-logs-container">
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
        <div className="activity-card">
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
