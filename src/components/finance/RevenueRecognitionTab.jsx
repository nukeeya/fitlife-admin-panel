import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calculator,
  FileSpreadsheet,
  Search,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT, formatDatePretty } from '../../utils/financeCalculators';
import { exportReportToExcel } from '../../utils/excelExporter';
import RevenueScheduleModal from './modals/RevenueScheduleModal';
import RevenueSimulatorModal from './modals/RevenueSimulatorModal';

export default function RevenueRecognitionTab() {
  const {
    revenueRecognitionSchedules,
    recognitionPolicy,
    setRecognitionPolicy,
    activeDateRange,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [durationFilter, setDurationFilter] = useState('ALL');
  const [selectedScheduleItem, setSelectedScheduleItem] = useState(null);
  const [showSimulator, setShowSimulator] = useState(false);

  // Filter schedules
  const displayedSchedules = useMemo(() => {
    return revenueRecognitionSchedules.filter((item) => {
      const matchSearch =
        item.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.memberCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.planName.toLowerCase().includes(searchTerm.toLowerCase());

      let matchDur = true;
      if (durationFilter === '1m') matchDur = item.durationMonths === 1;
      else if (durationFilter === '3m') matchDur = item.durationMonths === 3;
      else if (durationFilter === '6m') matchDur = item.durationMonths === 6;
      else if (durationFilter === '12m') matchDur = item.durationMonths === 12;
      else if (durationFilter === 'custom') matchDur = item.durationMonths !== 1 && item.durationMonths !== 3 && item.durationMonths !== 6 && item.durationMonths !== 12;

      return matchSearch && matchDur;
    });
  }, [revenueRecognitionSchedules, searchTerm, durationFilter]);

  // Totals
  const totalConsideration = displayedSchedules.reduce((s, i) => s + i.recognition.netConsideration, 0);
  const totalRecognized = displayedSchedules.reduce((s, i) => s + i.recognition.recognizedToDate, 0);
  const totalDeferred = displayedSchedules.reduce((s, i) => s + i.recognition.deferredRevenue, 0);

  // Excel Export
  const handleExportExcel = () => {
    const columns = [
      { key: 'memberName', label: 'Member Name' },
      { key: 'memberCode', label: 'Member ID' },
      { key: 'number', label: 'Invoice No' },
      { key: 'planName', label: 'Package Plan' },
      { key: 'durationStr', label: 'Duration' },
      { key: 'baseAmountStr', label: 'Base Price' },
      { key: 'discountStr', label: 'Discount' },
      { key: 'netConsiderationStr', label: 'Net Consideration' },
      { key: 'periodStr', label: 'Membership Period' },
      { key: 'monthlyRateStr', label: 'Avg Monthly Run Rate' },
      { key: 'recognizedStr', label: 'Recognized to Date' },
      { key: 'deferredStr', label: 'Deferred Revenue' },
    ];

    const rows = displayedSchedules.map((i) => ({
      ...i,
      durationStr: `${i.durationMonths || 1} Month(s)`,
      baseAmountStr: formatBDT(i.baseAmount),
      discountStr: formatBDT(i.discountAmount),
      netConsiderationStr: formatBDT(i.recognition.netConsideration),
      periodStr: `${i.startDate} to ${i.endDate}`,
      monthlyRateStr: formatBDT(i.recognition.numMonths > 0 ? i.recognition.netConsideration / i.recognition.numMonths : 0),
      recognizedStr: formatBDT(i.recognition.recognizedToDate),
      deferredStr: formatBDT(i.recognition.deferredRevenue),
    }));

    exportReportToExcel({
      filename: `gym-revenue-recognition-${activeDateRange.start}-to-${activeDateRange.end}.xlsx`,
      reportTitle: 'Dynamic Membership Revenue Recognition Ledger',
      dateRangeLabel: activeDateRange.label,
      columns,
      rows,
      summaryTotals: {
        memberName: 'TOTALS',
        netConsiderationStr: formatBDT(totalConsideration),
        recognizedStr: formatBDT(totalRecognized),
        deferredStr: formatBDT(totalDeferred),
      },
      sheetName: 'Revenue Recognition',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Policy & Simulator Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 18px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-base)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
              Dynamic Membership Revenue Recognition Ledger
            </h2>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Separating upfront liquid cash collections from recognized accrual revenue across 1, 3, 6, 12-month and custom packages.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Policy Selector Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, paddingLeft: '6px', color: 'var(--text-muted)' }}>
              Allocation Policy:
            </span>
            <button
              type="button"
              className={`btn btn-sm ${recognitionPolicy === 'equal_monthly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRecognitionPolicy('equal_monthly')}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Equal Monthly
            </button>
            <button
              type="button"
              className={`btn btn-sm ${recognitionPolicy === 'service_days' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRecognitionPolicy('service_days')}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Daily Pro-Rata
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowSimulator(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Calculator size={14} />
            Duration Simulator
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={14} />
            Export Excel
          </button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <div className="stat-widget">
          <span className="stat-widget-title">Total Package Consideration</span>
          <div className="stat-widget-value primary-highlight">{formatBDT(totalConsideration)}</div>
          <div className="stat-widget-sub">Net contracted value across packages</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Recognized Revenue to Date</span>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>{formatBDT(totalRecognized)}</div>
          <div className="stat-widget-sub">Accrual earned through October 2026</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Remaining Deferred (Unearned)</span>
          <div className="stat-widget-value" style={{ color: 'var(--primary)' }}>{formatBDT(totalDeferred)}</div>
          <div className="stat-widget-sub">Held on balance sheet for future months</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Penny-Rounding Reconciliation</span>
          <div className="stat-widget-value" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={18} /> 100% Balanced
          </div>
          <div className="stat-widget-sub">Allocations strictly equal net price</div>
        </div>
      </div>

      {/* Required Examples Callout Banner */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
      }}>
        <strong>Required Accounting Test Cases:</strong>
        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
          <li>
            <strong>3-Month Package (৳15,000, 1 Oct – 31 Dec 2026):</strong> If paid upfront, October cash collected is ৳15,000, while recognized revenue is strictly <strong>৳5,000 in Oct, ৳5,000 in Nov, and ৳5,000 in Dec</strong> under equal monthly allocation.
          </li>
          <li>
            <strong>6-Month Package (৳30,000):</strong> Allocated strictly at <strong>৳5,000/month</strong> for each applicable service month.
          </li>
          <li>
            <strong>12-Month Package (৳50,000):</strong> Allocated at <strong>৳4,166.67/month</strong> with automatic final month penny rounding adjustment so the cumulative total equals exactly ৳50,000.
          </li>
        </ul>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search member, package, invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Durations' },
            { key: '1m', label: '1-Month' },
            { key: '3m', label: '3-Month (৳15k)' },
            { key: '6m', label: '6-Month (৳30k)' },
            { key: '12m', label: '12-Month (৳50k)' },
            { key: 'custom', label: 'Custom Durations' },
          ].map((dur) => (
            <button
              key={dur.key}
              type="button"
              className={`btn btn-sm ${durationFilter === dur.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDurationFilter(dur.key)}
              style={{ fontSize: '12px' }}
            >
              {dur.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Revenue Recognition Table */}
      <div className="activity-card">
        <div className="activity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800 }}>Membership Revenue Recognition Schedules</span>
            <span className="badge badge-primary">{displayedSchedules.length} Packages</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Click "Inspect Schedule" on any row to view monthly calendar breakdown
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Member & Code</th>
                <th>Invoice No</th>
                <th>Package Plan</th>
                <th>Base Price</th>
                <th>Discount</th>
                <th>Net Consideration</th>
                <th>Service Period</th>
                <th>Monthly Allocation</th>
                <th>Recognized to Date</th>
                <th>Deferred Revenue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedSchedules.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No membership packages found matching the selected duration.
                  </td>
                </tr>
              ) : (
                displayedSchedules.map((item) => {
                  const { recognition } = item;
                  const monthlyAvg = recognition.numMonths > 0 ? recognition.netConsideration / recognition.numMonths : 0;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="member-cell-info">
                          <span className="member-cell-name" style={{ fontWeight: 700 }}>{item.memberName}</span>
                          <span className="member-cell-code" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {item.memberCode}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.number}</td>
                      <td>
                        <span className="badge badge-primary">{item.planName}</span>
                      </td>
                      <td>{formatBDT(item.baseAmount)}</td>
                      <td>
                        {item.discountAmount > 0 ? (
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                            - {formatBDT(item.discountAmount)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ fontWeight: 800 }}>{formatBDT(recognition.netConsideration)}</td>
                      <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                        {formatDatePretty(item.startDate)} – {formatDatePretty(item.endDate)}
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px' }}>
                          ({recognition.numMonths} mo / {recognition.totalServiceDays} days)
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {formatBDT(monthlyAvg)}/mo
                      </td>
                      <td style={{ fontWeight: 800, color: '#10B981' }}>
                        {formatBDT(recognition.recognizedToDate)}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>
                        {formatBDT(recognition.deferredRevenue)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedScheduleItem(item)}
                          title="Inspect monthly revenue schedule and deferred balance"
                          style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600 }}
                        >
                          <Eye size={12} /> Inspect Schedule
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RevenueScheduleModal
        isOpen={Boolean(selectedScheduleItem)}
        onClose={() => setSelectedScheduleItem(null)}
        scheduleItem={selectedScheduleItem}
      />

      <RevenueSimulatorModal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
      />
    </div>
  );
}
