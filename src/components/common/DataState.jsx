import { useState } from 'react';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';

/**
 * Loading / failed / empty states for a list that comes from one database
 * table (see loadErrors in GymDataContext). Renders `children` once there is
 * data. If a reload fails while older rows are still on screen, the rows stay
 * and an error bar with Retry is shown above them.
 *
 *   <DataState loading={loading} error={loadErrors.trainers} isEmpty={trainers.length === 0}
 *     noun="trainers" onRetry={refresh} onAdd={openAdd} addLabel="Add your first trainer">
 *     ...list...
 *   </DataState>
 */
export default function DataState({ loading, error, isEmpty, noun, onRetry, onAdd, addLabel, children }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setRetrying(false);
    }
  };

  const retryButton = onRetry && (
    <button type="button" className="btn btn-secondary btn-sm" onClick={handleRetry} disabled={retrying}>
      <RefreshCw size={14} /> {retrying ? 'Retrying…' : 'Retry'}
    </button>
  );

  const boxStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '48px 20px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg, 12px)',
    border: '1px solid var(--border-base)',
  };

  if (isEmpty && loading) {
    return <div style={boxStyle}>Loading {noun}…</div>;
  }

  if (isEmpty && error) {
    return (
      <div style={{ ...boxStyle, color: 'var(--danger)' }} role="alert">
        <AlertCircle size={28} />
        <strong>Couldn&apos;t load {noun}.</strong>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{error}</span>
        {retryButton}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div style={boxStyle}>
        <span>No {noun} yet.</span>
        {onAdd && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onAdd}>
            <Plus size={14} /> {addLabel || `Add your first ${noun}`}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '10px 14px',
            marginBottom: '12px',
            borderRadius: '8px',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            fontSize: '13px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> Couldn&apos;t refresh {noun}; showing the last loaded list. ({error})
          </span>
          {retryButton}
        </div>
      )}
      {children}
    </>
  );
}
