import { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Award,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useGymData } from '../context/GymDataContext';

export default function Reports() {
  const { theme, primaryColor } = useTheme();
  const { invoices, expenses, members } = useGymData();

  const gridColor = theme === 'light' ? '#E2E8F0' : '#26262B';
  const textColor = theme === 'light' ? '#64748B' : '#94A3B8';
  const tooltipBg = theme === 'light' ? '#FFFFFF' : '#141416';

  const monthlyRevenueData = [
    { month: 'Jan', revenue: 420000, expense: 180000, members: 1850 },
    { month: 'Feb', revenue: 510000, expense: 210000, members: 1920 },
    { month: 'Mar', revenue: 580000, expense: 240000, members: 2050 },
    { month: 'Apr', revenue: 620000, expense: 250000, members: 2150 },
    { month: 'May', revenue: 700000, expense: 280000, members: 2280 },
    { month: 'Jun', revenue: 750000, expense: 290000, members: 2350 },
    { month: 'Jul', revenue: 810000, expense: 310000, members: 2420 },
    { month: 'Aug', revenue: 842000, expense: 320000, members: 2481 },
  ];

  const planDistribution = [
    { name: 'Standard Fitness', value: 45, color: primaryColor },
    { name: 'Premium Pro', value: 35, color: '#06B6D4' },
    { name: 'Elite VIP Athlete', value: 12, color: '#A855F7' },
    { name: 'Basic Membership', value: 8, color: '#64748B' },
  ];

  const handleExportCSV = () => {
    alert('Exporting FitLife Full Analytical Report to CSV/Excel...');
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Executive Analytics & Intelligence Reports</h1>
          <p className="page-subtitle">
            Long-term financial projections, member retention cohort heatmaps, and churn diagnostics.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={16} />
          Export Analytical Dossier (CSV/PDF)
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="dashboard-metrics-grid">
        <div className="stat-widget">
          <span className="stat-widget-title">Annual Gross Revenue</span>
          <div className="stat-widget-value primary-highlight">৳52.32L</div>
          <div className="stat-widget-sub">↑ 24% YoY growth</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Member Retention Rate</span>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>89.4%</div>
          <div className="stat-widget-sub">Cohort renewal average</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Avg Revenue Per User (ARPU)</span>
          <div className="stat-widget-value">৳4,250</div>
          <div className="stat-widget-sub">Per active member/mo</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Discount ROI Efficiency</span>
          <div className="stat-widget-value" style={{ color: '#06B6D4' }}>+4.2x</div>
          <div className="stat-widget-sub">Admissions per discount ৳</div>
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>
          Monthly Revenue vs Operational Expenses (2026 Trend)
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="month" stroke={textColor} />
            <YAxis stroke={textColor} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: 'var(--border-base)',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="revenue" fill={primaryColor} name="Gross Revenue (৳)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#EF4444" name="Expenses (৳)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row: Member Growth & Plan Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>
            Cumulative Member Growth Cohort
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" stroke={textColor} />
              <YAxis stroke={textColor} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: 'var(--border-base)',
                  borderRadius: '8px',
                }}
              />
              <Area type="monotone" dataKey="members" stroke="#10B981" fill="rgba(16, 185, 129, 0.2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>
            Plan Subscription Share
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {planDistribution.map((p) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </div>
                <span style={{ fontWeight: 800 }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
