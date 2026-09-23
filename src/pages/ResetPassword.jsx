import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGymData } from '../context/GymDataContext';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, updatePassword } = useAuth();
  const { branding } = useGymData();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice('Password updated. Taking you to the dashboard…');
    setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
  };

  return (
    <div className="login-page">
      <div className="login-right">
        <div className="login-form-container">
          <h2 className="login-welcome">SET NEW PASSWORD</h2>

          {authLoading ? (
            <p className="forgot-link">Checking your reset link…</p>
          ) : !user ? (
            <>
              <p className="login-error">
                This reset link is invalid or has expired. Go back to the login page
                and click &quot;Forgot password?&quot; to request a new one.
              </p>
              <p className="signup-link">
                <span onClick={() => navigate('/login')}>Back to sign in</span>
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <p className="forgot-link" style={{ textAlign: 'left', cursor: 'default' }}>
                Setting a new password for {(branding?.gymName || 'FitLife')} —{' '}
                {user.email}
              </p>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••••"
                />
              </div>

              {error && <p className="login-error">{error}</p>}
              {notice && <p className="login-notice">{notice}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'SAVING…' : 'UPDATE PASSWORD'}
              </button>

              <p className="signup-link">
                <span onClick={() => navigate('/login')}>Back to sign in</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
