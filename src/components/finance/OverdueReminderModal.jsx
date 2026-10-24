import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CreditCard,
  User,
  ArrowRight,
  CheckCircle2,
  Lock,
  Calendar,
  X,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT, formatDatePretty } from '../../utils/financeCalculators';
import RecordPaymentModal from './modals/RecordPaymentModal';
import ExtendDueDateModal from './modals/ExtendDueDateModal';

export default function OverdueReminderModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const {
    overdueDues,
    overdueCount,
    today,
  } = useFinance();

  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState(null);
  const [extensionTargetInvoice, setExtensionTargetInvoice] = useState(null);

  const handleOpenMemberProfile = (memberId, memberCode) => {
    onClose();
    // Navigate to Member Details
    navigate(`/members/${memberId || memberCode}`);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Overdue Receivables & Action Center (${overdueCount} Alerts)`}
        subtitle={`Payment deadlines exceeded as of today (${formatDatePretty(today)})`}
        icon={AlertTriangle}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Closing this popup keeps badge count active until balances reach ৳0.
            </span>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Dismiss to Background
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Overdue Items List */}
          {overdueCount === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-base)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <CheckCircle2 size={44} color="#10B981" />
              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                All Overdue Receivables Resolved!
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '380px' }}>
                There are currently no overdue membership dues past their clearance date. Outstanding balances have reached ৳0 or deadlines have been extended.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {overdueDues.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  {/* Left: Member info with Photo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar
                      src={item.memberAvatar}
                      name={item.memberName}
                      size={46}
                    />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {item.memberName}
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                          {item.memberCode}
                        </span>
                        {item.isExtended && (
                          <span className="badge badge-warning" style={{ fontSize: '9px' }}>
                            Extension Used
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <span>{item.planName}</span>
                        <span>•</span>
                        <span>{item.memberPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Due details & Days Overdue */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '12px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--danger)' }}>
                      {formatBDT(item.dueAmount)} DUE
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '11px', fontWeight: 700 }}>
                      <AlertTriangle size={12} />
                      <span>{item.daysOverdue} Days Overdue (Due: {formatDatePretty(item.dueDate)})</span>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border-base)' }}>
                    {/* Extend Due Date Button */}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExtensionTargetInvoice(item)}
                      disabled={item.isExtended}
                      style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title={item.isExtended ? 'One-time extension already used' : 'Extend due date by up to 30 days'}
                    >
                      {item.isExtended ? <Lock size={12} /> : <Clock size={12} />}
                      {item.isExtended ? 'Extension Already Used' : 'Extend Due Date'}
                    </button>

                    {/* Record Payment Button */}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setPaymentTargetInvoice(item)}
                      style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <CreditCard size={12} />
                      Record Payment
                    </button>

                    {/* Open Member Profile */}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenMemberProfile(item.memberId, item.memberCode)}
                      style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <User size={12} />
                      Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Record Payment Modal */}
      {paymentTargetInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(paymentTargetInvoice)}
          onClose={() => setPaymentTargetInvoice(null)}
          invoice={paymentTargetInvoice}
          onPaymentSuccess={() => {
            setPaymentTargetInvoice(null);
          }}
        />
      )}

      {/* Extend Due Date Modal */}
      {extensionTargetInvoice && (
        <ExtendDueDateModal
          isOpen={Boolean(extensionTargetInvoice)}
          onClose={() => setExtensionTargetInvoice(null)}
          dueRecord={extensionTargetInvoice}
        />
      )}
    </>
  );
}
