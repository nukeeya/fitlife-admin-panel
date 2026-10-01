import { useMemo, useState } from 'react';
import { CheckCircle2, Download, Printer } from 'lucide-react';
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
import './Reports.css';

const formatMoney = (amount) => `৳${Number(amount || 0).toLocaleString()}`;
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function Reports() {
  const { theme, primaryColor } = useTheme();
  const { invoices, expenses, members, branding } = useGymData();
  const [downloadNotice, setDownloadNotice] = useState('');
  const reportYear = new Date().getFullYear();
  const generatedAt = new Date();
  const generatedDate = generatedAt.toLocaleString();
  const reportName = `${branding?.gymName || 'FitLife'} - Reports & Analytics`;

  const gridColor = theme === 'light' ? '#E2E8F0' : '#26262B';
  const textColor = theme === 'light' ? '#64748B' : '#94A3B8';
  const tooltipBg = theme === 'light' ? '#FFFFFF' : '#141416';

  const monthlyRevenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const data = months.slice(0, currentMonth + 1).map((month) => ({
      month,
      revenue: 0,
      expense: 0,
      members: 0,
    }));
    const monthlyKeys = new Set(data.map((_, index) => `${reportYear}-${String(index + 1).padStart(2, '0')}`));
    const byMonth = Object.fromEntries(
      data.map((monthData, index) => [
        `${reportYear}-${String(index + 1).padStart(2, '0')}`,
        monthData,
      ])
    );

    invoices.forEach((invoice) => {
      const key = String(invoice.date || '').slice(0, 7);
      if (monthlyKeys.has(key)) {
        byMonth[key].revenue += Number(invoice.netPayable) || 0;
      }
    });

    expenses.forEach((expense) => {
      const key = String(expense.date || '').slice(0, 7);
      if (monthlyKeys.has(key)) {
        byMonth[key].expense += Number(expense.amount) || 0;
      }
    });

    data.forEach((monthData, index) => {
      const key = `${reportYear}-${String(index + 1).padStart(2, '0')}`;
      monthData.members = members.filter((member) => {
        const joinedMonth = String(member.joined || '').slice(0, 7);
        return joinedMonth && joinedMonth <= key;
      }).length;
    });

    return data;
  }, [expenses, invoices, members, reportYear]);

  const planDistribution = useMemo(() => {
    const counts = members.reduce((result, member) => {
      const name = member.plan || 'Unassigned';
      result[name] = (result[name] || 0) + 1;
      return result;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        share: members.length ? (count / members.length) * 100 : 0,
      }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  }, [members]);

  const metrics = useMemo(() => ({
    billed: invoices
      .filter((invoice) => String(invoice.date || '').startsWith(String(reportYear)))
      .reduce((sum, invoice) => sum + (Number(invoice.netPayable) || 0), 0),
    collected: invoices
      .filter((invoice) => String(invoice.date || '').startsWith(String(reportYear)))
      .reduce((sum, invoice) => sum + (Number(invoice.paidAmount) || 0), 0),
    expenses: expenses
      .filter((expense) => String(expense.date || '').startsWith(String(reportYear)))
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
    activeMembers: members.filter((member) => member.status === 'Active').length,
    totalMembers: members.length,
  }), [expenses, invoices, members, reportYear]);

  const handleExportCSV = () => {
    const rows = [
      [reportName],
      ['Reporting period', `January ${reportYear} - ${generatedAt.toLocaleString('en', { month: 'long' })} ${reportYear}`],
      ['Generated', generatedDate],
      ['Branch', 'Dhanmondi'],
      [],
      ['Executive summary'],
      ['Metric', 'Value'],
      ['Billed revenue YTD (BDT)', metrics.billed],
      ['Payments received YTD (BDT)', metrics.collected],
      ['Operational expenses YTD (BDT)', metrics.expenses],
      ['Billed less expenses YTD (BDT)', metrics.billed - metrics.expenses],
      ['Active members', metrics.activeMembers],
      ['Total members', metrics.totalMembers],
      [],
      [`Monthly performance (${reportYear})`],
      ['Month', 'Billed revenue (BDT)', 'Operational expenses (BDT)', 'Billed less expenses (BDT)', 'Cumulative members'],
      ...monthlyRevenueData.map((month) => [
        month.month,
        month.revenue,
        month.expense,
        month.revenue - month.expense,
        month.members,
      ]),
      [],
      ['Membership distribution'],
      ['Plan', 'Members', 'Share (%)'],
      ...planDistribution.map((plan) => [plan.name, plan.count, plan.share.toFixed(1)]),
    ];

    const csvContent = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(branding?.gymName || 'FitLife').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_report_${reportYear}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setDownloadNotice('Report exported successfully.');
    setTimeout(() => setDownloadNotice(''), 3000);
  };

  return (
    <div className="page reports-page">
      <section className="reports-screen">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Reports & Analytics</h1>
            <p className="page-subtitle">
              A consistent overview of membership, billed revenue, collections, and operating expenses.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => window.print()}>
              <Printer size={16} /> Print Report
            </button>
            <button className="btn btn-primary" onClick={handleExportCSV}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {downloadNotice && (
          <div className="report-notice" role="status">
            <CheckCircle2 size={16} />
            <span>{downloadNotice}</span>
          </div>
        )}

        <div className="dashboard-metrics-grid report-metrics">
          <div className="stat-widget">
            <span className="stat-widget-title">Billed Revenue YTD</span>
            <div className="stat-widget-value primary-highlight">{formatMoney(metrics.billed)}</div>
            <div className="stat-widget-sub">Invoices dated this year</div>
          </div>
          <div className="stat-widget">
            <span className="stat-widget-title">Payments Received YTD</span>
            <div className="stat-widget-value">{formatMoney(metrics.collected)}</div>
            <div className="stat-widget-sub">Payments dated this year</div>
          </div>
          <div className="stat-widget">
            <span className="stat-widget-title">Operational Expenses YTD</span>
            <div className="stat-widget-value">{formatMoney(metrics.expenses)}</div>
            <div className="stat-widget-sub">Expenses dated this year</div>
          </div>
          <div className="stat-widget">
            <span className="stat-widget-title">Active Members</span>
            <div className="stat-widget-value">{metrics.activeMembers.toLocaleString()}</div>
            <div className="stat-widget-sub">{metrics.totalMembers.toLocaleString()} total members</div>
          </div>
        </div>

        <section className="report-panel">
          <div className="report-panel-heading">
            <div>
              <h2>Monthly Financial Performance</h2>
              <p>Billed revenue and recorded expenses for {reportYear}</p>
            </div>
          </div>
          {monthlyRevenueData.some((month) => month.revenue || month.expense) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" stroke={textColor} />
                <YAxis stroke={textColor} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: 'var(--border-base)', borderRadius: '8px' }} />
                <Bar dataKey="revenue" fill={primaryColor} name="Billed revenue (৳)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" name="Expenses (৳)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="report-empty">No invoice or expense activity recorded for {reportYear} yet.</p>
          )}
        </section>

        <div className="split-grid report-lower-grid">
          <section className="report-panel">
            <div className="report-panel-heading">
              <div>
                <h2>Cumulative Member Growth</h2>
                <p>Members joined up to each month in {reportYear}</p>
              </div>
            </div>
            {members.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={textColor} />
                  <YAxis stroke={textColor} />
                  <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: 'var(--border-base)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="members" name="Members" stroke="#10B981" fill="rgba(16, 185, 129, 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="report-empty">No member records available.</p>
            )}
          </section>

          <section className="report-panel">
            <div className="report-panel-heading">
              <div>
                <h2>Membership Distribution</h2>
                <p>Current member count by package</p>
              </div>
            </div>
            {planDistribution.length > 0 ? (
              <div className="report-distribution">
                {planDistribution.map((plan) => (
                  <div className="report-distribution-row" key={plan.name}>
                    <span>{plan.name}</span>
                    <strong>{plan.count} <small>({plan.share.toFixed(1)}%)</small></strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="report-empty">No membership distribution to display.</p>
            )}
          </section>
        </div>
      </section>

      <section className="reports-print-only" aria-hidden="true">
        <header className="print-report-header">
          <div>
            <p className="print-report-eyebrow">BUSINESS REPORT</p>
            <h1>{reportName}</h1>
            <p>Dhanmondi branch · {branding?.address || ''}</p>
          </div>
          <div className="print-report-meta">
            <strong>Reporting period</strong>
            <span>January {reportYear} - {generatedAt.toLocaleString('en', { month: 'long' })} {reportYear}</span>
            <strong>Generated</strong>
            <span>{generatedDate}</span>
          </div>
        </header>

        <section className="print-report-section">
          <h2>Executive Summary</h2>
          <table>
            <tbody>
              <tr><th>Billed revenue YTD</th><td>{formatMoney(metrics.billed)}</td><th>Payments received YTD</th><td>{formatMoney(metrics.collected)}</td></tr>
              <tr><th>Operational expenses YTD</th><td>{formatMoney(metrics.expenses)}</td><th>Billed less expenses YTD</th><td>{formatMoney(metrics.billed - metrics.expenses)}</td></tr>
              <tr><th>Active members</th><td>{metrics.activeMembers.toLocaleString()}</td><th>Total members</th><td>{metrics.totalMembers.toLocaleString()}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="print-report-section">
          <h2>Monthly Financial Performance</h2>
          <table>
            <thead>
              <tr><th>Month</th><th>Billed Revenue</th><th>Expenses</th><th>Billed Less Expenses</th><th>Cumulative Members</th></tr>
            </thead>
            <tbody>
              {monthlyRevenueData.map((month) => (
                <tr key={month.month}>
                  <td>{month.month} {reportYear}</td>
                  <td>{formatMoney(month.revenue)}</td>
                  <td>{formatMoney(month.expense)}</td>
                  <td>{formatMoney(month.revenue - month.expense)}</td>
                  <td>{month.members.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="print-report-section">
          <h2>Membership Distribution</h2>
          <table>
            <thead><tr><th>Package</th><th>Members</th><th>Share</th></tr></thead>
            <tbody>
              {planDistribution.length > 0 ? planDistribution.map((plan) => (
                <tr key={plan.name}>
                  <td>{plan.name}</td>
                  <td>{plan.count}</td>
                  <td>{plan.share.toFixed(1)}%</td>
                </tr>
              )) : <tr><td colSpan="3">No member records available.</td></tr>}
            </tbody>
          </table>
        </section>

        <footer className="print-report-footer">
          Revenue is based on invoice net payable amounts. Payments received and expenses are reported separately.
        </footer>
      </section>
    </div>
  );
}
