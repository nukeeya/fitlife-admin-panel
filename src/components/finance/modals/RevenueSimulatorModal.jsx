import { useState, useMemo } from 'react';
import { Calculator, CheckCircle2, RotateCcw } from 'lucide-react';
import Modal from '../../common/Modal';
import {
  formatBDT,
  calculateRevenueRecognition,
  todayIso,
} from '../../../utils/financeCalculators';

const firstOfThisMonth = () => `${todayIso().slice(0, 7)}-01`;

export default function RevenueSimulatorModal({
  isOpen,
  onClose,
}) {
  const [packagePrice, setPackagePrice] = useState('15000');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [startDate, setStartDate] = useState(firstOfThisMonth);
  const [durationMonths, setDurationMonths] = useState(3);
  const [method, setMethod] = useState('equal_monthly');

  // Compute calculated end date based on duration
  const calculatedEndDate = useMemo(() => {
    try {
      const [y, m, d] = startDate.split('-').map(Number);
      const date = new Date(y, m - 1 + Number(durationMonths), d - 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch {
      return startDate;
    }
  }, [startDate, durationMonths]);

  // Run dynamic calculation
  const simulation = useMemo(() => {
    return calculateRevenueRecognition({
      packagePrice: Number(packagePrice) || 0,
      discountAmount: Number(discountAmount) || 0,
      startDate,
      endDate: calculatedEndDate,
      asOfDate: todayIso(),
      method,
    });
  }, [packagePrice, discountAmount, startDate, calculatedEndDate, method]);

  // Preset quick load buttons
  const loadPreset = (price, months, disc = 0) => {
    setPackagePrice(String(price));
    setDiscountAmount(String(disc));
    setDurationMonths(months);
    setStartDate(firstOfThisMonth());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dynamic Revenue Recognition Calculator"
      subtitle="Interactive multi-duration modeling engine with penny-rounding reconciliation"
      icon={Calculator}
      size="xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Sum of allocations: <strong>{formatBDT(simulation.monthlySchedule.reduce((s, m) => s + m.allocatedRevenue, 0))}</strong> (Strictly equals Net Consideration {formatBDT(simulation.netConsideration)})
          </span>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Calculator
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Preset quick pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Load Standard Test Case:</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadPreset(5000, 1)}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            1-Month (৳5,000)
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => loadPreset(15000, 3)}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            3-Month Transformation (৳15,000)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadPreset(30000, 6)}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            6-Month VIP (৳30,000)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadPreset(50000, 12)}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            12-Month Annual Elite (৳50,000)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadPreset(25000, 5, 2500)}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            Custom 5-Mo (৳25k - ৳2.5k disc)
          </button>
        </div>

        {/* Inputs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '16px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-base)',
        }}>
          <div>
            <label className="form-label">Package Price (BDT)</label>
            <input
              type="number"
              className="form-control"
              value={packagePrice}
              onChange={(e) => setPackagePrice(e.target.value)}
              min="0"
              required
            />
          </div>

          <div>
            <label className="form-label">Discount (BDT)</label>
            <input
              type="number"
              className="form-control"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              min="0"
            />
          </div>

          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Duration (Months)</label>
            <input
              type="number"
              className="form-control"
              value={durationMonths}
              onChange={(e) => setDurationMonths(Math.max(1, Number(e.target.value)))}
              min="1"
              max="36"
              required
            />
          </div>

          <div>
            <label className="form-label">Allocation Policy</label>
            <select
              className="form-control"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="equal_monthly">Equal Monthly Allocation</option>
              <option value="service_days">Daily Pro-Rata Allocation</option>
            </select>
          </div>
        </div>

        {/* Dynamic Simulation Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
        }}>
          <div className="stat-widget" style={{ padding: '12px' }}>
            <span className="stat-widget-title">Net Consideration</span>
            <div className="stat-widget-value primary-highlight" style={{ fontSize: '18px' }}>
              {formatBDT(simulation.netConsideration)}
            </div>
            <div className="stat-widget-sub">Total earned consideration</div>
          </div>

          <div className="stat-widget" style={{ padding: '12px' }}>
            <span className="stat-widget-title">Monthly Run Rate</span>
            <div className="stat-widget-value" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
              {simulation.numMonths > 0 ? formatBDT(simulation.netConsideration / simulation.numMonths) : '৳0'}
            </div>
            <div className="stat-widget-sub">Average per calendar month</div>
          </div>

          <div className="stat-widget" style={{ padding: '12px' }}>
            <span className="stat-widget-title">Recognized to Date</span>
            <div className="stat-widget-value" style={{ fontSize: '18px', color: '#10B981' }}>
              {formatBDT(simulation.recognizedToDate)}
            </div>
            <div className="stat-widget-sub">Through October 2026</div>
          </div>

          <div className="stat-widget" style={{ padding: '12px' }}>
            <span className="stat-widget-title">Remaining Deferred</span>
            <div className="stat-widget-value" style={{ fontSize: '18px', color: 'var(--primary)' }}>
              {formatBDT(simulation.deferredRevenue)}
            </div>
            <div className="stat-widget-sub">Held on balance sheet</div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Period Month</th>
                <th>Service Days</th>
                <th>Monthly Allocation (BDT)</th>
                <th>Share %</th>
                <th>Accounting Status</th>
                <th>Balance Reconciled</th>
              </tr>
            </thead>
            <tbody>
              {simulation.monthlySchedule.map((m, index) => (
                <tr key={m.monthKey}>
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{m.monthLabel}</td>
                  <td>{m.daysInService} Days</td>
                  <td style={{ fontWeight: 800, fontSize: '14px' }}>
                    {formatBDT(m.allocatedRevenue)}
                  </td>
                  <td>{m.recognitionPercentage.toFixed(2)}%</td>
                  <td>
                    {m.status === 'recognized' ? (
                      <span className="badge badge-success">✓ Earned (Past)</span>
                    ) : m.status === 'current' ? (
                      <span className="badge badge-primary">● Active (Current Mo)</span>
                    ) : (
                      <span className="badge badge-warning">⏳ Deferred (Future)</span>
                    )}
                  </td>
                  <td style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                    {index === simulation.monthlySchedule.length - 1 ? '✓ Balanced (Penny Adjusted)' : '✓ Scheduled'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
