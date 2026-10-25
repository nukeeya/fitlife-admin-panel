import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGymData } from '../context/GymDataContext';
import { Flame, Dumbbell, Award, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const { signIn, resetPassword, user, loading: authLoading } = useAuth();
  const { branding } = useGymData();

  // Once the auth state settles after sign-in, redirect away from the login page
  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
    // On success: don't navigate manually — the user state update above handles it
  };

  const handleForgotPassword = async () => {
    setError('');
    setNotice('');

    if (!email.trim()) {
      setError('Enter your email address above, then click Forgot password.');
      return;
    }

    setSending(true);
    const { error: resetError } = await resetPassword(email.trim());
    setSending(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setNotice('Reset link sent. Check your inbox (and spam folder).');
    }
  };

  const renderBrandIcon = () => {
    if (branding?.logoUrl) {
      return (
        <img
          src={branding.logoUrl}
          alt={branding.gymName || 'Logo'}
          className="login-logo"
        />
      );
    }
    const iconName = branding?.logoIcon || 'Flame';
    switch (iconName) {
      case 'Dumbbell': return <Dumbbell size={40} color="var(--primary)" style={{ marginBottom: '8px' }} />;
      case 'Award': return <Award size={40} color="var(--primary)" style={{ marginBottom: '8px' }} />;
      case 'Shield': return <ShieldCheck size={40} color="var(--primary)" style={{ marginBottom: '8px' }} />;
      default: return <Flame size={40} color="var(--primary)" style={{ marginBottom: '8px' }} />;
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-overlay">
          <div className="login-hero-text">
            {renderBrandIcon()}
            <h1 className="login-brand">{branding?.gymName || 'FITLIFE'}</h1>
            <p className="login-tagline" style={{ whiteSpace: 'pre-line' }}>
              {branding?.heroTagline || 'TRAIN HARD.\nLIVE STRONG.'}
            </p>
            <p className="login-sub" style={{ whiteSpace: 'pre-line' }}>
              {branding?.heroSub || 'YOUR FITNESS.\nYOUR JOURNEY.'}
            </p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <h2 className="login-welcome">WELCOME BACK</h2>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fitlife.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
              />
            </div>

            <div className="form-check">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
            </div>

            {error && <p className="login-error">{error}</p>}
            {notice && <p className="login-notice">{notice}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>

            <p
              className={`forgot-link${sending ? ' is-disabled' : ''}`}
              onClick={sending ? undefined : handleForgotPassword}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !sending) handleForgotPassword();
              }}
            >
              {sending ? 'SENDING…' : 'Forgot password?'}
            </p>
            <p className="signup-link">
              Don't have an account? <span onClick={() => navigate('/signup')}>Sign up</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
