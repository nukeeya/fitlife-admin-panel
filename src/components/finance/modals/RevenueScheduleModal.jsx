import { TrendingUp } from 'lucide-react';
import Modal from '../../common/Modal';
import { formatBDT } from '../../../utils/financeCalculators';

export default function RevenueScheduleModal({
  isOpen,
  onClose,
  scheduleItem, // contains invoice details + recognition object
}) {
  if (!scheduleItem) return null;

  const { recognition } = scheduleItem;
  if (!recognition) return null;

  const percentRecognized = recognition.netConsideration > 0
    ? Math.round((recognition.recognizedToDate / recognition.netConsideration) * 100)
    : 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dynamic Revenue Recognition Schedule"
      subtitle={`Member: ${scheduleItem.memberName} (${scheduleItem.memberCode}) | Package: ${scheduleItem.planName}`}
      icon={TrendingUp}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Rule: <strong>Equal part per membership month (paid amounts only)</strong>
          </span>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* KPI Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '14px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-base)',
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Paid (excl. VAT)</span>
            <span style={{ fontSize: '14px', fontWeight: 800 }}>{formatBDT(recognition.netConsideration)}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Service Duration</span>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              {recognition.numMonths} Month(s)
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Recognized to Date</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>
              {formatBDT(recognition.recognizedToDate)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Remaining Deferred</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
              {formatBDT(recognition.deferredRevenue)}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-base)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
            <span>Recognition Progress ({percentRecognized}%)</span>
            <span>{formatBDT(recognition.recognizedToDate)} of {formatBDT(recognition.netConsideration)}</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'var(--border-base)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${percentRecognized}%`, background: '#10B981', transition: 'width 0.3s ease' }} />
            <div style={{ width: `${100 - percentRecognized}%`, background: 'var(--primary)', opacity: 0.6 }} />
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              Recognized Revenue ({percentRecognized}%)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
              Unearned / Deferred Revenue ({100 - percentRecognized}%)
            </span>
          </div>
        </div>

        {/* Monthly Breakdown Schedule Table */}
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
            Monthly Revenue Ledger Allocation
          </span>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Service Month</th>
                  <th>Membership Month</th>
                  <th>Monthly Allocation</th>
                  <th>% Share</th>
                  <th>Recognition Status</th>
                  <th>Accounting Treatment</th>
                </tr>
              </thead>
              <tbody>
                {recognition.monthlySchedule.map((m, idx) => (
                  <tr key={m.monthKey}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{m.monthLabel}</td>
                    <td>{m.membershipMonth ? `${m.membershipMonth} of ${recognition.numMonths}` : 'Paid after plan ended'}</td>
                    <td style={{ fontWeight: 800, fontSize: '14px' }}>{formatBDT(m.allocatedRevenue)}</td>
                    <td>{m.recognitionPercentage.toFixed(1)}%</td>
                    <td>
                      {m.status === 'recognized' ? (
                        <span className="badge badge-success">✓ Recognized</span>
                      ) : m.status === 'current' ? (
                        <span className="badge badge-primary">● Current Month</span>
                      ) : (
                        <span className="badge badge-warning">⏳ Deferred (Future)</span>
                      )}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {m.status === 'recognized' || m.status === 'current'
                        ? 'Dr Deferred Rev / Cr Recognized Rev'
                        : 'Held in Unearned Revenue Liability'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upfront Cash vs Accrual Explanation */}
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
        }}>
          <strong>Cash vs. earned revenue:</strong> Money is in the bank the day it is paid, but it is earned one equal part per membership month. A due paid later is split over the months that haven't passed yet. The monthly parts above add up exactly to {formatBDT(recognition.netConsideration)} paid (excluding VAT).
        </div>
      </div>
    </Modal>
  );
}
