import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--bg-base, #080808)',
          color: 'var(--text-primary, #ffffff)',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: 'var(--bg-card, #141416)',
            border: '1px solid var(--border-base, #26262b)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--danger, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', marginBottom: '20px', lineHeight: 1.5 }}>
              An unexpected error occurred while rendering this page. The system caught it to protect your session.
            </p>

            {this.state.error && (
              <div style={{
                background: 'var(--bg-surface, #1b1b1f)',
                border: '1px solid var(--border-base, #26262b)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'var(--danger, #ef4444)',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '20px',
                maxHeight: '100px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface, #1b1b1f)',
                  border: '1px solid var(--border-base, #26262b)',
                  color: 'var(--text-primary, #ffffff)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <RefreshCw size={14} /> Reload Page
              </button>
              <button
                className="btn btn-primary"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: 'var(--primary, #c8ff00)',
                  border: 'none',
                  color: '#000000',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                <Home size={14} /> Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
