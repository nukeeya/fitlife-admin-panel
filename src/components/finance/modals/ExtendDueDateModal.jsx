import { useState } from 'react';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Info,
} from 'lucide-react';
import Modal from '../../common/Modal';
import Avatar from '../../common/Avatar';
import { useFinance } from '../../../context/FinanceContext';
import { formatBDT, formatDatePretty } from '../../../utils/financeCalculators';

export default function ExtendDueDateModal({
  isOpen,
  onClose,
  dueRecord,
}) {
  const { extendDueDate, demoDate } = useFinance();

  const [newDueDate, setNewDueDate] = useState('');
  const [reason, setReason] = useState('');
  const [adminName, setAdminName] = useState('Front Desk Lead (Demo)');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!dueRecord) return null;

  const isAlreadyExtended = Boolean(
    dueRecord.isExtended ||
    (dueRecord.extensionHistory && dueRecord.extensionHistory.length > 0)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isAlreadyExtended) {
      setError('Extension Already Used: Only one extension is permitted per mock due record.');
      return;
    }

    if (!newDueDate) {
      setError('Please select a valid new due date.');
      return;
    }

    if (newDueDate <= dueRecord.dueDate) {
      setError(`New due date must be after current deadline (${dueRecord.dueDate}).`);
      return;
    }

    if (!reason.trim()) {
      setError('A mandatory extension reason must be provided.');
      return;
    }

    const res = extendDueDate({
      invoiceId: dueRecord.id,
      newDueDate,
      reason,
      adminName,
    });

    if (!res.success) {
      setError(res.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="One-Time Due-Date Extension"
      subtitle="Extend payment clearance deadline under single-use demo policy"
      icon={Clock}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {!isAlreadyExtended && (
            <button
              type="submit"
              form="extend-due-form"
              className="btn btn-primary"
            >
              Confirm One-Time Extension
            </button>
          )}
        </div>
      }
    >
      {success ? (
        <div style={{ padding: '30px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={44} color="#10B981" />
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Due Date Successfully Extended!</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            New due date set to <strong>{formatDatePretty(newDueDate)}</strong>. Record marked as Extended and permanently locked from future extensions.
          </p>
        </div>
      ) : (
        <form id="extend-due-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Member & Due Details Card */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar
                src={dueRecord.memberAvatar}
                name={dueRecord.memberName}
                size={44}
              />
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {dueRecord.memberName}
                </strong>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {dueRecord.memberCode} · {dueRecord.planName}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining Balance:</span>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--danger)' }}>
                {formatBDT(dueRecord.dueAmount)}
              </div>
            </div>
          </div>

          {/* Already Extended Banner or Policy Notice */}
          {isAlreadyExtended ? (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <Lock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Extension Already Used (Permanently Locked)</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  A one-time extension has already been consumed for this due record. Second extension attempts are strictly rejected by frontend business rules.
                </p>
                {dueRecord.extensionHistory && dueRecord.extensionHistory.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Previous extension: {formatDatePretty(dueRecord.extensionHistory[0].extendedDueDate)} — "{dueRecord.extensionHistory[0].reason}"
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldAlert size={16} color="#F59E0B" style={{ flexShrink: 0 }} />
              <span>
                <strong>Single-Use Policy:</strong> After confirming this extension, the due record will permanently display <em>"Extension Already Used"</em> and no further extensions will be granted.
              </span>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--danger)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {!isAlreadyExtended && (
            <>
              {/* Due Dates Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>Current Due Deadline</label>
                  <input
                    type="text"
                    className="form-control"
                    value={dueRecord.dueDate ? formatDatePretty(dueRecord.dueDate) : 'None'}
                    disabled
                    style={{ fontWeight: 700, color: 'var(--danger)' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>New Extended Due Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    min={dueRecord.dueDate || demoDate}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>
                  Mandatory Extension Reason *
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Member requested salary cycle alignment (committed to clear by end of month)."
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>Authorized Staff Member</label>
                <input
                  type="text"
                  className="form-control"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Info size={13} />
                <span>Frontend demo simulation: Policy enforced in memory until backend deployment.</span>
              </div>
            </>
          )}
        </form>
      )}
    </Modal>
  );
}
