import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Shows the page only when the signed-in role has `need` (a key of accessFor()).
 * Otherwise says so, instead of a page of empty lists and failing buttons.
 */
export default function RequireAccess({ need, children }) {
  const { access } = useAuth();
  if (access?.[need]) return children;

  return (
    <div className="page">
      <div className="table-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <ShieldOff size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
        <h2 style={{ margin: '0 0 8px' }}>No access</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 16px' }}>
          Your role doesn&apos;t have access to this page. Ask a Super Admin if you need it.
        </p>
        <Link to="/dashboard" className="btn btn-primary btn-sm">Back to Dashboard</Link>
      </div>
    </div>
  );
}
