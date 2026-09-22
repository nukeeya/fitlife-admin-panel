import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Standard Reusable Modal Component
 * 
 * Features:
 * - Renders via React Portal directly into document.body to prevent stacking context & clipping issues
 * - ESC key to close with proper cleanup
 * - Outside backdrop click handling with stopPropagation on content
 * - Background scroll lock with scrollbar shift compensation
 * - ARIA accessibility (role="dialog", aria-modal="true")
 * - Size options: 'sm' (420px), 'md' (560px), 'lg' (720px), 'xl' (920px), 'full'
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = 'md',
  children,
  footer,
  showCloseBtn = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className = '',
  zIndex = 10000,
}) {
  const contentRef = useRef(null);

  // Keyboard navigation & ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEsc) {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEsc]);

  // Body scroll locking with scrollbar width compensation to prevent layout jump
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Max width mapping based on size prop
  const sizeMaxWidthMap = {
    sm: '440px',
    md: '580px',
    lg: '760px',
    xl: '960px',
    full: '96vw',
  };

  const maxWidth = sizeMaxWidthMap[size] || sizeMaxWidthMap.md;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="modal-portal-wrapper"
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
        onClick={handleBackdropClick}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex,
        }}
      >
        {/* Modal Dialog Card */}
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-dialog-title' : undefined}
          className={`modal-content ${className}`}
          style={{
            width: '100%',
            maxWidth,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: zIndex + 1,
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          {(title || showCloseBtn) && (
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                {Icon && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--primary)',
                    }}
                  >
                    <Icon size={20} />
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  {title && (
                    <h2
                      id="modal-dialog-title"
                      style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        margin: 0,
                        color: 'var(--text-primary)',
                        lineHeight: 1.25,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        margin: '4px 0 0 0',
                        lineHeight: 1.3,
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {showCloseBtn && (
                <button
                  type="button"
                  className="header-icon-btn modal-close-btn"
                  onClick={onClose}
                  aria-label="Close dialog"
                  title="Close (Esc)"
                  style={{
                    marginLeft: 'auto',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}

          {/* Modal Scrollable Body */}
          <div
            className="modal-body"
            style={{
              overflowY: 'auto',
              flex: '1 1 auto',
            }}
          >
            {children}
          </div>

          {/* Optional Modal Footer */}
          {footer && (
            <div className="modal-footer" style={{ flexShrink: 0 }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
