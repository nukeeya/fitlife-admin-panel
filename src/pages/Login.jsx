import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('admin@fitlife.com');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-overlay">
          <div className="login-hero-text">
            <h1 className="login-brand">FITLIFE</h1>
            <p className="login-tagline">
              TRAIN HARD.<br />
              LIVE STRONG.
            </p>
            <p className="login-sub">
              YOUR FITNESS.<br />
              YOUR JOURNEY.
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
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
            </div>

            <button type="submit" className="login-btn">
              LOGIN
            </button>

            <p className="forgot-link">Forgot password?</p>
          </form>
        </div>
      </div>
    </div>
  );
}
