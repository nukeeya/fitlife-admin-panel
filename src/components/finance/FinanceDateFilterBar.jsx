import { useState } from 'react';
import { Calendar, Sparkles, RotateCcw, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { DATE_FILTER_PRESETS } from '../../utils/financeCalculators';

export default function FinanceDateFilterBar({ showReset = true }) {
  const {
    dateFilterKey,
    setDateFilterKey,
    customDateRange,
    setCustomDateRange,
    activeDateRange,
    resetToMockDefaults,
  } = useFinance();

  const [tempStart, setTempStart] = useState(customDateRange.start);
  const [tempEnd, setTempEnd] = useState(customDateRange.end);
  const [resetNotice, setResetNotice] = useState(false);

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (tempStart && tempEnd) {
      setCustomDateRange({ start: tempStart, end: tempEnd });
      setDateFilterKey('custom');
    }
  };

  const handleReset = () => {
    resetToMockDefaults();
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 2500);
  };

  return (
    <div className="finance-filter-container" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-base)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 18px',
      marginBottom: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Top row: Label, Active Scope Badge, Demo Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Reporting Scope:
          </span>
          <span className="badge badge-primary" style={{ fontSize: '12px', fontWeight: 700 }}>
            {activeDateRange.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--primary)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
            title="Frontend Simulation Mode: Realistic mock financial data"
          >
            <Sparkles size={13} />
            Frontend Demo Simulator
          </span>

          {showReset && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleReset}
              title="Reset all mock balances to initial demo seed"
              style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {resetNotice ? <Check size={13} style={{ color: '#10B981' }} /> : <RotateCcw size={13} />}
              {resetNotice ? 'Reset Done' : 'Reset Demo Seed'}
            </button>
          )}
        </div>
      </div>

      {/* Preset pills row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '4px',
        flexWrap: 'wrap',
      }}>
        {DATE_FILTER_PRESETS.map((preset) => {
          const isActive = dateFilterKey === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => setDateFilterKey(preset.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                border: '1px solid',
                borderColor: isActive ? 'var(--primary)' : 'var(--border-base)',
                background: isActive ? 'var(--primary)' : 'var(--bg-surface)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom range picker form (when 'custom' is active) */}
      {dateFilterKey === 'custom' && (
        <form
          onSubmit={handleApplyCustom}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            padding: '10px 14px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-base)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Custom Range:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From:</label>
            <input
              type="date"
              className="form-control"
              value={tempStart}
              onChange={(e) => setTempStart(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>To:</label>
            <input
              type="date"
              className="form-control"
              value={tempEnd}
              onChange={(e) => setTempEnd(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '5px 12px', fontSize: '12px' }}>
            Apply Filter
          </button>
        </form>
      )}
    </div>
  );
}
