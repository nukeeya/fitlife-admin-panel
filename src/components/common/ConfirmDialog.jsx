import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, CheckCircle2, XCircle, X } from 'lucide-react';

/**
 * Reusable Confirmation Dialog
 * 
 * Supports:
 * - Types: 'danger' (red/delete), 'warning' (amber), 'success' (green), 'info' (cyan/primary)
 * - Elevated zIndex (10100) so it can overlay standard modals
 * - Body scroll lock and ESC key handling
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Please Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'danger' | 'warning' | 'success' | 'info'
  isLoading = false,
  zIndex = 10100,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: XCircle,
      iconColor: 'var(--danger)',
      btnClass: 'btn btn-danger',
      iconBg: 'rgba(239, 68, 68, 0.12)',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'var(--warning)',
      btnClass: 'btn btn-warning',
      iconBg: 'rgba(245, 158, 11, 0.12)',
    },
    success: {
      icon: CheckCircle2,
      iconColor: '#10B981',
      btnClass: 'btn btn-primary',
      iconBg: 'rgba(16, 185, 129, 0.12)',
    },
    info: {
      icon: Info,
      iconColor: 'var(--primary)',
      btnClass: 'btn btn-primary',
      iconBg: 'var(--primary-light)',
    },
  };

  const config = typeConfig[type] || typeConfig.warning;
  const TypeIcon = config.icon;

  return createPortal(
    <div
      className="confirm-dialog-wrapper"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        className="modal-overlay"
        onClick={() => !isLoading && onClose()}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex,
        }}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          className="modal-content"
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-base)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
            padding: '24px',
            position: 'relative',
            zIndex: zIndex + 1,
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: config.iconBg,
                color: config.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TypeIcon size={24} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                {!isLoading && (
                  <button
                    type="button"
                    className="header-icon-btn"
                    onClick={onClose}
                    style={{ cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {message}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  className={`${config.btnClass} btn-sm`}
                  onClick={onConfirm}
                  disabled={isLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isLoading ? 'Processing...' : confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
